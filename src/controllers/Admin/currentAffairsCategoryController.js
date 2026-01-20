const CurrentAffairsCategory = require('../../models/CurrentAffairs/CurrentAffairsCategory');
const cloudinary = require('../../config/cloudinary');

const uploadToCloudinary = (fileBuffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(fileBuffer);
  });
};

// Create a new Current Affairs Category
exports.createCategory = async (req, res) => {
  try {
    const { categoryType, description, isActive } = req.body;

    if (!categoryType || typeof categoryType !== 'string') {
      return res.status(400).json({
        message: 'categoryType is required and must be a string'
      });
    }

    // Normalize categoryType (recommended)
    const normalizedCategoryType = categoryType.trim().toLowerCase();

    // Prevent duplicates (admin-defined uniqueness)
    const existing = await CurrentAffairsCategory.findOne({
      categoryType: normalizedCategoryType
    });

    if (existing) {
      return res.status(400).json({
        message: `Category '${categoryType}' already exists`
      });
    }

    let thumbnailUrl;
    if (req.file?.buffer) {
      const uploadResult = await uploadToCloudinary(
        req.file.buffer,
        'brainbuzz/current-affairs/categories/thumbnails'
      );
      thumbnailUrl = uploadResult.secure_url;
    }

    const category = await CurrentAffairsCategory.create({
      categoryType: normalizedCategoryType,
      description,
      isActive: typeof isActive !== 'undefined' ? isActive : true,
      thumbnailUrl,
    });

    return res.status(201).json({
      message: 'Current Affairs Category created successfully',
      data: category,
    });
  } catch (error) {
    console.error('Error creating Current Affairs category:', error);
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};


// Get all Current Affairs Categories
exports.getCategories = async (req, res) => {
  try {
    const { isActive } = req.query;

    const filter = {};
    if (typeof isActive !== 'undefined') {
      filter.isActive = isActive === 'true';
    }

    const categories = await CurrentAffairsCategory
      .find(filter)
      .sort({ order: 1, createdAt: -1 });

    return res.status(200).json({ data: categories });
  } catch (error) {
    console.error('Error fetching Current Affairs categories:', error);
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

// Get Current Affairs Category by ID
exports.getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await CurrentAffairsCategory.findById(id);
    if (!category) {
      return res.status(404).json({
        message: 'Current Affairs Category not found'
      });
    }

    return res.status(200).json({ data: category });
  } catch (error) {
    console.error('Error fetching Current Affairs category:', error);
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

// Update Current Affairs Category
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { categoryType, description, order, isActive } = req.body;

    const updates = {};

    if (typeof categoryType !== 'undefined') {
      const normalizedCategoryType = categoryType.trim().toLowerCase();
      
      // Check if categoryType already exists (excluding current category)
      const existing = await CurrentAffairsCategory.findOne({
        categoryType: normalizedCategoryType,
        _id: { $ne: id }
      });

      if (existing) {
        return res.status(400).json({
          message: `Category '${categoryType}' already exists`
        });
      }

      updates.categoryType = normalizedCategoryType;
    }
    if (typeof description !== 'undefined') updates.description = description;
    if (typeof order !== 'undefined') updates.order = order;
    if (typeof isActive !== 'undefined') updates.isActive = isActive;

    if (req.file?.buffer) {
      const uploadResult = await uploadToCloudinary(
        req.file.buffer,
        'brainbuzz/current-affairs/categories/thumbnails'
      );
      updates.thumbnailUrl = uploadResult.secure_url;
    }

    const category = await CurrentAffairsCategory.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({
        message: 'Current Affairs Category not found'
      });
    }

    return res.status(200).json({
      message: 'Current Affairs Category updated successfully',
      data: category,
    });
  } catch (error) {
    console.error('Error updating Current Affairs category:', error);
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

// Delete Current Affairs Category (soft delete)
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await CurrentAffairsCategory.findByIdAndDelete(
      id,
      { isActive: false },
      { new: true }
    );

    if (!category) {
      return res.status(404).json({
        message: 'Current Affairs Category not found'
      });
    }

    return res.status(200).json({
      message: 'Current Affairs Category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting Current Affair deleted category:', error);
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

// Toggle Current Affairs Category status
exports.toggleCategoryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const category = await CurrentAffairsCategory.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    );

    if (!category) {
      return res.status(404).json({
        message: 'Current Affairs Category not found'
      });
    }

    return res.status(200).json({
      message: `Current Affairs Category ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: category,
    });
  } catch (error) {
    console.error('Error toggling Current Affairs category status:', error);
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};
