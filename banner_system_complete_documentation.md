# Banner System Complete Documentation

## Overview

The Banner System is a feature-rich component of the Brain Buzz platform that manages image banners for different pages (HOME and ABOUT). It provides both admin and user APIs for managing and retrieving banner content.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Models](#models)
3. [Controllers](#controllers)
4. [Routes](#routes)
5. [API Endpoints](#api-endpoints)
6. [Features](#features)
7. [Implementation Details](#implementation-details)

## Architecture Overview

The banner system follows a modular architecture with separate controllers for admin and user access:

- **Admin Access**: Full CRUD operations for managing banners
- **User Access**: Read-only public endpoints for displaying banners
- **Database**: MongoDB with Mongoose ODM
- **File Storage**: Cloudinary for image hosting
- **Upload Middleware**: Custom file upload handling

## Models

### Banner Model (`src/models/Banner.js`)

```javascript
const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema(
  {
    pageType: {
      type: String,
      enum: ["HOME", "ABOUT"],
      required: true,
      unique: true   // 🔥 VERY IMPORTANT → only one doc per page
    },

    images: [
      {
        _id: {
          type: String,
          required: true
        },
        id: {
          type: String,
          required: true
        },
        url: {
          type: String,
          required: true
        }
      }
    ],

    // Only for ABOUT page
    heading: {
      type: String,
      trim: true
    },

    description: {
      type: String,
      trim: true
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Banner", bannerSchema);
```

### Key Features of the Model:
- **Unique Constraint**: Only one banner per page type (HOME/ABOUT)
- **Flexible Images**: Supports multiple images per banner
- **Conditional Fields**: Heading and description only for ABOUT pages
- **Active Status**: Ability to deactivate banners without deletion
- **Timestamps**: Automatic creation and update tracking

## Controllers

### Admin Banner Controller (`src/controllers/Admin/bannerController.js`)

#### Core Functions:

1. **`upsertBanner`** - Create or update banner (upsert operation)
2. **`getBanner`** - Retrieve banner by page type
3. **`deleteBanner`** - Delete banner by page type
4. **`updateBannerImage`** - Update specific image in banner

#### Code Implementation:

```javascript
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
```

### User Banner Controller (`src/controllers/User/bannerController.js`)

#### Core Functions:

1. **`getHomeBanner`** - Retrieve home banner images (public)
2. **`getAboutBanner`** - Retrieve about banner with heading, description, and images (public)

#### Code Implementation:

```javascript
const Banner = require('../../models/Banner');

// Get home banner (public)
exports.getHomeBanner = async (req, res) => {
  try {
    const banner = await Banner.findOne({ pageType: 'HOME', isActive: true });
    
    if (!banner) {
      return res.status(404).json({ 
        success: false, 
        message: 'Home banner not found' 
      });
    }

    // Return only image URLs for home banner
    const imageUrls = banner.images.map(image => image.url);
    res.json({
      success: true,
      images: imageUrls
    });
  } catch (error) {
    console.error('Error fetching home banner:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch home banner',
      error: error.message 
    });
  }
};

// Get about banner (public)
exports.getAboutBanner = async (req, res) => {
  try {
    const banner = await Banner.findOne({ pageType: 'ABOUT', isActive: true });
    
    if (!banner) {
      return res.status(404).json({ 
        success: false, 
        message: 'About banner not found' 
      });
    }

    // Return heading, description, and image URLs for about banner
    const imageUrls = banner.images.map(image => image.url);
    res.json({
      success: true,
      heading: banner.heading,
      description: banner.description,
      images: imageUrls
    });
  } catch (error) {
    console.error('Error fetching about banner:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch about banner',
      error: error.message 
    });
  }
};
```

## Routes

### Admin Banner Routes (`src/routes/Admin/bannerRoutes.js`)

```javascript
const express = require('express');
const router = express.Router();
const bannerController = require('../../controllers/Admin/bannerController');
const uploadMiddleware = require('../../middlewares/uploadMiddleware');

// Route for creating/updating banner (upsert)
router.post('/', uploadMiddleware.fields([{ name: 'images', maxCount: 10 }]), bannerController.upsertBanner);

// Route for getting banner by page type
router.get('/:pageType', bannerController.getBanner);

// Route for deleting banner by page type
router.delete('/:pageType', bannerController.deleteBanner);

// Route for updating specific image in banner (using _id)
router.put('/:pageType/images/:imageId', uploadMiddleware.single('image'), bannerController.updateBannerImage);

module.exports = router;
```

### User Banner Routes (`src/routes/User/bannerRoutes.js`)

```javascript
const express = require('express');
const router = express.Router();
const bannerController = require('../../controllers/User/bannerController');

// Route for getting home banner
router.get('/home-banner', bannerController.getHomeBanner);

// Route for getting about banner
router.get('/about-banner', bannerController.getAboutBanner);

module.exports = router;
```

## API Endpoints

### Admin Endpoints (Authenticated)

| Method | Endpoint | Description | Headers |
|--------|----------|-------------|---------|
| POST | `/api/admin/banners` | Create or update banner (upsert) | `Authorization: Bearer <admin_token>`, `Content-Type: multipart/form-data` |
| GET | `/api/admin/banners/:pageType` | Get banner by page type | `Authorization: Bearer <admin_token>` |
| DELETE | `/api/admin/banners/:pageType` | Delete banner by page type | `Authorization: Bearer <admin_token>` |
| PUT | `/api/admin/banners/:pageType/images/:imageId` | Update specific image in banner | `Authorization: Bearer <admin_token>`, `Content-Type: multipart/form-data` |

### User Endpoints (Public)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/public/home-banner` | Get home banner images |
| GET | `/api/public/about-banner` | Get about banner with heading, description, and images |

## Features

### 1. **Upsert Operations**
- Single endpoint handles both create and update operations
- Uses MongoDB's `findOneAndUpdate` with `upsert: true`
- Ensures only one banner per page type exists

### 2. **Cloudinary Integration**
- Automatic image upload to Cloudinary
- Secure URL generation
- Organized folder structure by page type

### 3. **Validation**
- Page type validation (HOME/ABOUT only)
- Conditional field validation for ABOUT pages
- Image requirement validation
- Unique constraint enforcement

### 4. **Multiple Image Support**
- Support for multiple images per banner
- Individual image update capability
- Unique ID generation for each image

### 5. **Public/Private Access Control**
- Admin endpoints require authentication
- User endpoints are public
- Active status filtering for public endpoints

### 6. **Flexible Data Structure**
- Different fields for different page types
- Optional heading and description for ABOUT pages
- Consistent image object structure

## Implementation Details

### Request Format (Admin Endpoints)

All admin banner operations use `multipart/form-data`:

#### HOME Banner Creation:
```
pageType: HOME
images[]: banner1.jpg
images[]: banner2.jpg
```

#### ABOUT Banner Creation:
```
pageType: ABOUT
heading: Everything you need to know
description: Long about us text here...
images[]: about1.jpg
images[]: about2.jpg
```

### Response Format

#### Success Response:
```json
{
  "success": true,
  "message": "Banner saved successfully",
  "data": {
    "_id": "banner_id",
    "pageType": "HOME",
    "images": [
      {
        "_id": "image_unique_id",
        "id": "timestamp-index",
        "url": "https://cloudinary-url..."
      }
    ],
    "heading": "Optional heading for ABOUT",
    "description": "Optional description for ABOUT",
    "isActive": true,
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
}
```

#### Public Home Banner Response:
```json
{
  "success": true,
  "images": [
    "https://cloudinary-url-1...",
    "https://cloudinary-url-2..."
  ]
}
```

#### Public About Banner Response:
```json
{
  "success": true,
  "heading": "About heading",
  "description": "About description",
  "images": [
    "https://cloudinary-url-1...",
    "https://cloudinary-url-2..."
  ]
}
```

### Error Handling

The system provides comprehensive error handling with:

- **400 Bad Request**: Validation errors
- **404 Not Found**: Banner not found
- **500 Internal Server Error**: Server errors with detailed messages
- **Proper error messages** for different failure scenarios

### Security Features

- **Authentication**: Admin endpoints require valid JWT tokens
- **Validation**: Input validation for all fields
- **Unique Constraints**: Prevents duplicate banners per page type
- **Active Status**: Allows soft deactivation without deletion

## Testing

The banner system includes comprehensive testing guidelines covering:

- Banner creation and update functionality
- Image upload and Cloudinary integration
- Validation rules for different page types
- Public access endpoints
- Error handling scenarios
- Edge cases and troubleshooting

## Maintenance

The system is designed for easy maintenance with:

- Clear separation of admin and user concerns
- Comprehensive documentation
- Proper error logging
- Modular architecture
- Consistent data structures