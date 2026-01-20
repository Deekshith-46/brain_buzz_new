const Banner = require('../../models/Banner');
const cloudinary = require('../../config/cloudinary');

const uploadToCloudinary = (fileBuffer, folder, resourceType = 'image') => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      }
    );

    stream.end(fileBuffer);
  });
};

// Create or update banner (upsert)
exports.upsertBanner = async (req, res) => {
  try {
    const { pageType, heading, description } = req.body;
    
    // Validate required fields
    if (!pageType) {
      return res.status(400).json({ 
        success: false, 
        message: 'Page type is required' 
      });
    }

    // Validate pageType is one of allowed values
    if (!['HOME', 'ABOUT'].includes(pageType)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid page type. Must be HOME or ABOUT' 
      });
    }

    // Validate required fields for ABOUT page
    if (pageType === 'ABOUT') {
      if (!heading) {
        return res.status(400).json({ 
          success: false, 
          message: 'Heading is required for ABOUT page' 
        });
      }
      
      if (!description) {
        return res.status(400).json({ 
          success: false, 
          message: 'Description is required for ABOUT page' 
        });
      }
    }

    // Handle image uploads
    let images = [];
    if (req.files && req.files.images && Array.isArray(req.files.images) && req.files.images.length > 0) {
      try {
        // Upload all images
        const uploadPromises = req.files.images.map(image => 
          uploadToCloudinary(image.buffer, `brainbuzz/banners/${pageType.toLowerCase()}`, 'image')
        );
        
        const uploadResults = await Promise.all(uploadPromises);
        // Generate unique IDs for each image and store as objects
        images = uploadResults.map((result, index) => ({
          _id: `${Date.now()}${Math.random().toString(36).substr(2, 9)}-${index}`,
          id: `${Date.now()}-${index}`,
          url: result.secure_url
        }));
      } catch (error) {
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to upload images', 
          error: error.message 
        });
      }
    } else {
      return res.status(400).json({ 
        success: false, 
        message: 'At least one image is required' 
      });
    }

    // Prepare update data
    const updateData = {
      pageType,
      images,
      isActive: true
    };

    // Add heading and description only for ABOUT page
    if (pageType === 'ABOUT') {
      updateData.heading = heading;
      updateData.description = description;
    }

    // Upsert banner (create or update)
    const banner = await Banner.findOneAndUpdate(
      { pageType },
      updateData,
      { upsert: true, new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: `${pageType} banner saved successfully`,
      data: banner
    });
  } catch (error) {
    console.error('Error saving banner:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to save banner',
      error: error.message 
    });
  }
};

// Get banner by page type (Admin)
exports.getBanner = async (req, res) => {
  try {
    const { pageType } = req.params;
    
    // Validate pageType
    if (!['HOME', 'ABOUT'].includes(pageType)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid page type. Must be HOME or ABOUT' 
      });
    }

    const banner = await Banner.findOne({ pageType });
    
    if (!banner) {
      return res.status(404).json({ 
        success: false, 
        message: `${pageType} banner not found` 
      });
    }

    res.json({
      success: true,
      data: banner
    });
  } catch (error) {
    console.error('Error fetching banner:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch banner',
      error: error.message 
    });
  }
};

// Delete banner by page type (Optional)
exports.deleteBanner = async (req, res) => {
  try {
    const { pageType } = req.params;
    
    // Validate pageType
    if (!['HOME', 'ABOUT'].includes(pageType)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid page type. Must be HOME or ABOUT' 
      });
    }

    const banner = await Banner.findOneAndDelete({ pageType });
    
    if (!banner) {
      return res.status(404).json({ 
        success: false, 
        message: `${pageType} banner not found` 
      });
    }

    res.json({
      success: true,
      message: `${pageType} banner deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting banner:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete banner',
      error: error.message 
    });
  }
};

// Update specific image in banner
exports.updateBannerImage = async (req, res) => {
  try {
    const { pageType, imageId } = req.params;
    
    // Validate pageType
    if (!['HOME', 'ABOUT'].includes(pageType)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid page type. Must be HOME or ABOUT' 
      });
    }

    // Validate that we have a new image file
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'New image file is required' 
      });
    }

    // Find the banner
    const banner = await Banner.findOne({ pageType });
    
    if (!banner) {
      return res.status(404).json({ 
        success: false, 
        message: `${pageType} banner not found` 
      });
    }

    // Find and update the specific image
    const imageIndex = banner.images.findIndex(img => img._id === imageId);
    
    if (imageIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        message: `Image with _id ${imageId} not found` 
      });
    }

    // Upload new image to Cloudinary
    try {
      const uploadResult = await uploadToCloudinary(
        req.file.buffer, 
        `brainbuzz/banners/${pageType.toLowerCase()}`, 
        'image'
      );
      
      // Update the specific image
      banner.images[imageIndex].url = uploadResult.secure_url;
      
      // Save the updated banner
      await banner.save();
      
      res.json({
        success: true,
        message: 'Image updated successfully',
        data: banner
      });
    } catch (error) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to upload new image', 
        error: error.message 
      });
    }
  } catch (error) {
    console.error('Error updating banner image:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update banner image',
      error: error.message 
    });
  }
};