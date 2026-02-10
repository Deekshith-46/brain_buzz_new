const Banner = require('../../models/Banner');
const cloudinary = require('../../config/cloudinary');
const { SITE_TYPES, PAGE_TYPES } = require('../../constants/bannerConstants');

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
    const { pageType, siteType } = req.body;
    
    // Validate required fields
    if (!pageType) {
      return res.status(400).json({ 
        success: false, 
        message: 'Page type is required' 
      });
    }

    if (!siteType) {
      return res.status(400).json({ 
        success: false, 
        message: 'Site type is required' 
      });
    }

    // Validate pageType is one of allowed values
    if (!PAGE_TYPES.includes(pageType)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid page type. Must be HOME or ABOUT' 
      });
    }

    // Validate siteType is one of allowed values
    if (!SITE_TYPES.includes(siteType)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid site type. Must be FREE or PAID' 
      });
    }

    // Validate required fields for ABOUT page
    if (pageType === 'ABOUT') {
      const {
        primaryTitle,
        primaryDescription,
        secondaryTitle,
        cards
      } = req.body;
      
      if (!primaryTitle || !primaryDescription) {
        return res.status(400).json({ 
          success: false, 
          message: 'Primary title and description are required' 
        });
      }
      
      if (!secondaryTitle) {
        return res.status(400).json({ 
          success: false, 
          message: 'Secondary title is required' 
        });
      }
      
      if (!Array.isArray(cards) || cards.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'At least one card is required' 
        });
      }
      
      cards.forEach((card, i) => {
        if (!card.heading || !card.description) {
          return res.status(400).json({ 
            success: false, 
            message: `Card ${i + 1} is invalid` 
          });
        }
      });
    }

    // Handle image uploads
    let images = [];
    let aboutImages = [];
    
    if (pageType === 'HOME') {
      // HOME page uses top-level images
      if (req.files && req.files.images && Array.isArray(req.files.images) && req.files.images.length > 0) {
        try {
          // Upload all images with siteType in folder path
          const uploadPromises = req.files.images.map(image => 
            uploadToCloudinary(image.buffer, `brainbuzz/banners/${siteType.toLowerCase()}/${pageType.toLowerCase()}`, 'image')
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
          message: 'At least one image is required for HOME page' 
        });
      }
    } else if (pageType === 'ABOUT') {
      // ABOUT page uses aboutImages
      if (req.files && req.files.aboutImages && Array.isArray(req.files.aboutImages) && req.files.aboutImages.length >= 2) {
        try {
          // Upload about images with siteType in folder path
          const uploadPromises = req.files.aboutImages.map(image => 
            uploadToCloudinary(image.buffer, `brainbuzz/banners/${siteType.toLowerCase()}/about`, 'image')
          );
          
          const uploadResults = await Promise.all(uploadPromises);
          aboutImages = uploadResults.map((result, index) => ({
            _id: result.public_id.split('/').pop(),
            id: `${Date.now()}-${index}`,
            url: result.secure_url
          }));
        } catch (error) {
          return res.status(500).json({ 
            success: false, 
            message: 'Failed to upload about images', 
            error: error.message 
          });
        }
      } else {
        return res.status(400).json({ 
          success: false, 
          message: 'At least 2 images are required for ABOUT page' 
        });
      }
    }

    // Prepare update data
    const updateData = {
      pageType,
      siteType,
      isActive: true
    };

    if (pageType === 'HOME') {
      updateData.images = images;
    } else if (pageType === 'ABOUT') {
      updateData.about = {
        images: aboutImages,
        primaryTitle: req.body.primaryTitle,
        primaryDescription: req.body.primaryDescription,
        secondaryTitle: req.body.secondaryTitle,
        cards: req.body.cards
      };
    }

    // Upsert banner (create or update)
    const banner = await Banner.findOneAndUpdate(
      { pageType, siteType },
      updateData,
      { upsert: true, new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: `${pageType} ${siteType} banner saved successfully`,
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

// Get banner by page type and site type (Admin)
exports.getBanner = async (req, res) => {
  try {
    const { pageType, siteType } = req.params;
    
    // Validate pageType
    if (!['HOME', 'ABOUT'].includes(pageType)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid page type. Must be HOME or ABOUT' 
      });
    }

    // Validate siteType
    if (!['FREE', 'PAID'].includes(siteType)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid site type. Must be FREE or PAID' 
      });
    }

    const banner = await Banner.findOne({ pageType, siteType });
    
    if (!banner) {
      return res.status(404).json({ 
        success: false, 
        message: `${pageType} ${siteType} banner not found` 
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

// Delete banner by page type and site type (Optional)
exports.deleteBanner = async (req, res) => {
  try {
    const { pageType, siteType } = req.params;
    
    // Validate pageType
    if (!['HOME', 'ABOUT'].includes(pageType)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid page type. Must be HOME or ABOUT' 
      });
    }

    // Validate siteType
    if (!['FREE', 'PAID'].includes(siteType)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid site type. Must be FREE or PAID' 
      });
    }

    const banner = await Banner.findOneAndUpdate({ pageType, siteType }, { isActive: false }, { new: true });
    
    if (!banner) {
      return res.status(404).json({ 
        success: false, 
        message: `${pageType} ${siteType} banner not found` 
      });
    }

    res.json({
      success: true,
      message: `${pageType} ${siteType} banner deactivated successfully`
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
    const { pageType, siteType, imageId } = req.params;
    
    // Validate pageType
    if (!['HOME', 'ABOUT'].includes(pageType)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid page type. Must be HOME or ABOUT' 
      });
    }

    // Validate siteType
    if (!['FREE', 'PAID'].includes(siteType)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid site type. Must be FREE or PAID' 
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
    const banner = await Banner.findOne({ pageType, siteType });
    
    if (!banner) {
      return res.status(404).json({ 
        success: false, 
        message: `${pageType} ${siteType} banner not found` 
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
        `brainbuzz/banners/${siteType.toLowerCase()}/${pageType.toLowerCase()}`, 
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

// Update About section (single endpoint for all partial updates)
exports.updateAboutSection = async (req, res) => {
  try {
    const { siteType } = req.params;
    
    // Validate siteType
    if (!['FREE', 'PAID'].includes(siteType)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid site type. Must be FREE or PAID' 
      });
    }
    
    // Find the ABOUT banner
    const banner = await Banner.findOne({ pageType: 'ABOUT', siteType });
    
    if (!banner) {
      return res.status(404).json({ 
        success: false, 
        message: `ABOUT ${siteType} banner not found` 
      });
    }
    
    // Validate that about section exists
    if (!banner.about) {
      return res.status(400).json({ 
        success: false, 
        message: `ABOUT ${siteType} section does not exist. Use POST to create it first.` 
      });
    }
    
    // Build update object
    const updateData = {};
    
    // Handle text fields (optional)
    if (req.body.primaryTitle) {
      if (typeof req.body.primaryTitle !== 'string' || req.body.primaryTitle.trim() === '') {
        return res.status(400).json({ 
          success: false, 
          message: 'Primary title must be a non-empty string' 
        });
      }
      updateData['about.primaryTitle'] = req.body.primaryTitle.trim();
    }
    
    if (req.body.primaryDescription) {
      if (typeof req.body.primaryDescription !== 'string' || req.body.primaryDescription.trim() === '') {
        return res.status(400).json({ 
          success: false, 
          message: 'Primary description must be a non-empty string' 
        });
      }
      updateData['about.primaryDescription'] = req.body.primaryDescription.trim();
    }
    
    if (req.body.secondaryTitle) {
      if (typeof req.body.secondaryTitle !== 'string' || req.body.secondaryTitle.trim() === '') {
        return res.status(400).json({ 
          success: false, 
          message: 'Secondary title must be a non-empty string' 
        });
      }
      updateData['about.secondaryTitle'] = req.body.secondaryTitle.trim();
    }
    
    // Handle cards (optional, indexed)
    console.log('Checking for cards in request body...');
    console.log('Body keys:', Object.keys(req.body));
    
    const cards = [];
    
    // Check if form-data uses indexed format: cards[0][heading], cards[0][description], etc.
    let i = 0;
    while (
      req.body[`cards[${i}][heading]`] &&
      req.body[`cards[${i}][description]`]
    ) {
      const heading = req.body[`cards[${i}][heading]`];
      const description = req.body[`cards[${i}][description]`];
      
      if (typeof heading !== 'string' || heading.trim() === '') {
        return res.status(400).json({ 
          success: false, 
          message: `Card ${i + 1} heading must be a non-empty string` 
        });
      }
      
      if (typeof description !== 'string' || description.trim() === '') {
        return res.status(400).json({ 
          success: false, 
          message: `Card ${i + 1} description must be a non-empty string` 
        });
      }
      
      cards.push({
        heading: heading.trim(),
        description: description.trim()
      });
      i++;
    }
    
    // Alternative: Check if cards are provided as a single 'cards' field (could be JSON string)
    if (cards.length === 0 && req.body.cards) {
      try {
        // If it's a JSON string, parse it
        let parsedCards = req.body.cards;
        if (typeof req.body.cards === 'string') {
          parsedCards = JSON.parse(req.body.cards);
        }
        
        if (Array.isArray(parsedCards)) {
          for (let j = 0; j < parsedCards.length; j++) {
            const card = parsedCards[j];
            if (!card || typeof card !== 'object') {
              return res.status(400).json({ 
                success: false, 
                message: `Card ${j + 1} must be an object` 
              });
            }
            
            const heading = card.heading;
            const description = card.description;
            
            if (typeof heading !== 'string' || heading.trim() === '') {
              return res.status(400).json({ 
                success: false, 
                message: `Card ${j + 1} heading must be a non-empty string` 
              });
            }
            
            if (typeof description !== 'string' || description.trim() === '') {
              return res.status(400).json({ 
                success: false, 
                message: `Card ${j + 1} description must be a non-empty string` 
              });
            }
            
            cards.push({
              heading: heading.trim(),
              description: description.trim()
            });
          }
        }
      } catch (parseError) {
        // If parsing fails, it might be a different format or invalid data
        console.log('Failed to parse cards field:', parseError.message);
      }
    }
    
    console.log('Total cards found:', cards.length);
    
    if (cards.length > 0) {
      updateData['about.cards'] = cards;
    }
    
    // Handle images (optional)
    if (req.files?.aboutImages?.length) {
      // Validate file count
      if (req.files.aboutImages.length > 10) {
        return res.status(400).json({ 
          success: false, 
          message: 'Maximum 10 images allowed per request' 
        });
      }
      
      // Validate file types
      for (const file of req.files.aboutImages) {
        if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.mimetype)) {
          return res.status(400).json({ 
            success: false, 
            message: `Invalid file type: ${file.originalname}. Only JPEG, PNG, WEBP, and GIF are allowed.` 
          });
        }
      }
      
      // Upload images to Cloudinary
      const uploadedImages = [];
      for (const file of req.files.aboutImages) {
        try {
          const result = await uploadToCloudinary(file.buffer, `brainbuzz/banners/${siteType.toLowerCase()}/about`);
          // Create image object with ID and URL
          uploadedImages.push({
            _id: result.public_id.split('/').pop(), // Extract ID from Cloudinary public_id
            id: `${Date.now()}-${uploadedImages.length}`, // Generate timestamp-based ID
            url: result.secure_url
          });
        } catch (uploadError) {
          console.error('Error uploading image to Cloudinary:', uploadError);
          return res.status(500).json({ 
            success: false, 
            message: `Error uploading image: ${file.originalname}` 
          });
        }
      }
      
      updateData['about.images'] = uploadedImages;
    }
    
    // If no fields to update
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No fields provided for update' 
      });
    }
    
    // Update the banner
    const updatedBanner = await Banner.findOneAndUpdate(
      { pageType: 'ABOUT', siteType },
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      message: `ABOUT ${siteType} section updated successfully`,
      data: updatedBanner
    });
  } catch (error) {
    console.error('Error updating about section:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};