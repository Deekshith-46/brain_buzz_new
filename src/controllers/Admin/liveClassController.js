const LiveClass = require('../../models/LiveClass');
const Category = require('../../models/Course/Category');
const SubCategory = require('../../models/Course/SubCategory');
const Language = require('../../models/Course/Language');
const cloudinary = require('../../config/cloudinary');
const upload = require('../../middlewares/uploadMiddleware');

// Helper function to upload to Cloudinary
const uploadToCloudinary = (fileBuffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder }, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
    stream.end(fileBuffer);
  });
};

// Middleware to handle file upload
exports.uploadThumbnail = upload.single('thumbnail');

// Create a new Live Class
exports.createLiveClass = async (req, res) => {
  try {
    const {
      name,
      description,
      videoLink,
      dateTime,
      categoryId,
      subCategoryId,
      languageId,
      isActive,
    } = req.body;

    // Validate required fields
    if (!name || !videoLink || !dateTime || !categoryId || !subCategoryId || !languageId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    // Validate that the category, subcategory, and language exist
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    // Check if category is for LIVE_CLASS
    if (category.contentType !== 'LIVE_CLASS') {
      return res.status(400).json({
        success: false,
        message: 'Invalid category for Live Classes',
      });
    }

    const subCategory = await SubCategory.findById(subCategoryId);
    if (!subCategory) {
      return res.status(404).json({
        success: false,
        message: 'SubCategory not found',
      });
    }

    // Check if subcategory is for LIVE_CLASS
    if (subCategory.contentType !== 'LIVE_CLASS') {
      return res.status(400).json({
        success: false,
        message: 'Invalid subcategory for Live Classes',
      });
    }

    const language = await Language.findById(languageId);
    if (!language) {
      return res.status(404).json({
        success: false,
        message: 'Language not found',
      });
    }

    // Handle thumbnail upload if provided
    let thumbnailUrl = null;
    if (req.file) {
      const uploadResult = await uploadToCloudinary(
        req.file.buffer,
        'live_classes/thumbnails'
      );
      thumbnailUrl = uploadResult.secure_url;
    }

    // Create new live class
    const liveClass = new LiveClass({
      name,
      description,
      thumbnail: thumbnailUrl,
      videoLink,
      dateTime,
      categoryId,
      subCategoryId,
      languageId,
      isActive: isActive !== undefined ? isActive === 'true' || isActive === true : true,
    });

    await liveClass.save();

    return res.status(201).json({
      success: true,
      message: 'Live class created successfully',
      data: liveClass,
    });
  } catch (error) {
    console.error('Error creating live class:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// Get all Live Classes (Admin)
exports.getAllLiveClasses = async (req, res) => {
  try {
    const { categoryId, subCategoryId, languageId, isActive } = req.query;

    // Build filter object
    const filter = {};
    if (categoryId) {
      // Validate category exists and is for LIVE_CLASS
      const category = await Category.findById(categoryId);
      if (!category || category.contentType !== 'LIVE_CLASS') {
        return res.status(400).json({
          success: false,
          message: 'Invalid category for Live Classes',
        });
      }
      filter.categoryId = categoryId;
    }
    if (subCategoryId) {
      // Validate subcategory exists and is for LIVE_CLASS
      const subCategory = await SubCategory.findById(subCategoryId);
      if (!subCategory || subCategory.contentType !== 'LIVE_CLASS') {
        return res.status(400).json({
          success: false,
          message: 'Invalid subcategory for Live Classes',
        });
      }
      filter.subCategoryId = subCategoryId;
    }
    if (languageId) filter.languageId = languageId;
    if (isActive !== undefined) filter.isActive = isActive === 'true' || isActive === true;

    const liveClasses = await LiveClass.find(filter)
      .populate('categoryId', 'name slug')
      .populate('subCategoryId', 'name slug')
      .populate('languageId', 'name code')
      .sort({ dateTime: 1 });

    return res.status(200).json({
      success: true,
      message: 'Live classes fetched successfully',
      data: liveClasses,
    });
  } catch (error) {
    console.error('Error fetching live classes:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// Get a single Live Class by ID (Admin)
exports.getLiveClassById = async (req, res) => {
  try {
    const { id } = req.params;

    const liveClass = await LiveClass.findById(id)
      .populate('categoryId', 'name slug')
      .populate('subCategoryId', 'name slug')
      .populate('languageId', 'name code');

    if (!liveClass) {
      return res.status(404).json({
        success: false,
        message: 'Live class not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Live class fetched successfully',
      data: liveClass,
    });
  } catch (error) {
    console.error('Error fetching live class:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// Update a Live Class
exports.updateLiveClass = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      videoLink,
      dateTime,
      categoryId,
      subCategoryId,
      languageId,
      isActive,
    } = req.body;

    // Validate that the live class exists
    const liveClass = await LiveClass.findById(id);
    if (!liveClass) {
      return res.status(404).json({
        success: false,
        message: 'Live class not found',
      });
    }

    // Validate foreign keys if provided
    if (categoryId) {
      const category = await Category.findById(categoryId);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found',
        });
      }
      
      // Check if category is for LIVE_CLASS
      if (category.contentType !== 'LIVE_CLASS') {
        return res.status(400).json({
          success: false,
          message: 'Invalid category for Live Classes',
        });
      }
    }

    if (subCategoryId) {
      const subCategory = await SubCategory.findById(subCategoryId);
      if (!subCategory) {
        return res.status(404).json({
          success: false,
          message: 'SubCategory not found',
        });
      }
      
      // Check if subcategory is for LIVE_CLASS
      if (subCategory.contentType !== 'LIVE_CLASS') {
        return res.status(400).json({
          success: false,
          message: 'Invalid subcategory for Live Classes',
        });
      }
    }

    if (languageId) {
      const language = await Language.findById(languageId);
      if (!language) {
        return res.status(404).json({
          success: false,
          message: 'Language not found',
        });
      }
    }

    // Build update object
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (videoLink !== undefined) updates.videoLink = videoLink;
    if (dateTime !== undefined) updates.dateTime = dateTime;
    if (categoryId !== undefined) updates.categoryId = categoryId;
    if (subCategoryId !== undefined) updates.subCategoryId = subCategoryId;
    if (languageId !== undefined) updates.languageId = languageId;
    if (isActive !== undefined) updates.isActive = isActive === 'true' || isActive === true;

    // Handle thumbnail upload if provided
    if (req.file) {
      const uploadResult = await uploadToCloudinary(
        req.file.buffer,
        'live_classes/thumbnails'
      );
      updates.thumbnail = uploadResult.secure_url;
    }

    // Update the live class
    Object.assign(liveClass, updates);
    await liveClass.save();

    // Populate references
    await liveClass.populate('categoryId', 'name slug');
    await liveClass.populate('subCategoryId', 'name slug');
    await liveClass.populate('languageId', 'name code');

    return res.status(200).json({
      success: true,
      message: 'Live class updated successfully',
      data: liveClass,
    });
  } catch (error) {
    console.error('Error updating live class:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// Delete a Live Class
exports.deleteLiveClass = async (req, res) => {
  try {
    const { id } = req.params;

    const liveClass = await LiveClass.findByIdAndDelete(id);

    if (!liveClass) {
      return res.status(404).json({
        success: false,
        message: 'Live class not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Live class deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting live class:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// Activate/Deactivate a Live Class
exports.toggleLiveClassStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if req.body exists
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: 'Request body is required',
      });
    }
    
    // Handle both JSON body and form body
    let isActive;
    if (req.body.isActive !== undefined) {
      isActive = req.body.isActive === 'true' || req.body.isActive === true;
    } else {
      return res.status(400).json({
        success: false,
        message: 'isActive field is required',
      });
    }

    const liveClass = await LiveClass.findById(id);
    if (!liveClass) {
      return res.status(404).json({
        success: false,
        message: 'Live class not found',
      });
    }

    liveClass.isActive = isActive;
    await liveClass.save();

    return res.status(200).json({
      success: true,
      message: `Live class ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: liveClass,
    });
  } catch (error) {
    console.error('Error toggling live class status:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};