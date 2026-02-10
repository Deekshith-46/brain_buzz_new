# Multi-Site Banner System - API Testing Guide

## Overview

This guide provides step-by-step instructions for testing all multi-site banner APIs, including required form-data payloads, endpoints, and expected responses.

## Important Notes on Request Format

All banner creation and update requests must use **form-data** format:
1. Metadata (pageType, siteType, about data) must be sent as individual form fields
2. Images must be sent as files in the `images[]` field for HOME pages or `aboutImages[]` for ABOUT pages
3. Content-Type must be `multipart/form-data`

## Base URL
```
https://your-domain.com/
```

## Authentication
Admin endpoints require authentication. Ensure you have a valid admin JWT token before making requests.

---

## ADMIN APIs

### 1. Create / Replace Banner (UPSERT)

**Endpoint:** `POST /api/admin/banners`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`
- `Content-Type: multipart/form-data`

#### Form-Data for HOME Banner (Free Site)
```
pageType: HOME
siteType: FREE
images[]: home_free_img1.jpg
images[]: home_free_img2.jpg
images[]: home_free_img3.jpg
```

#### Form-Data for HOME Banner (Paid Site)
```
pageType: HOME
siteType: PAID
images[]: home_paid_img1.jpg
images[]: home_paid_img2.jpg
images[]: home_paid_img3.jpg
```

#### Form-Data for ABOUT Banner (Free Site) - FLAT FIELD FORMAT
```
pageType: ABOUT
siteType: FREE
primaryTitle: Welcome to Brain Buzz Academy
primaryDescription: Long description text here about our free platform...
secondaryTitle: Everything you need to know
cards[0][heading]: 50 Online Courses
cards[0][description]: We have approximately 50 online courses
cards[1][heading]: 50 Test Series
cards[1][description]: We have approximately 50 test series
aboutImages[]: about_free_img1.jpg
aboutImages[]: about_free_img2.jpg
aboutImages[]: about_free_img3.jpg
```

#### Form-Data for ABOUT Banner (Paid Site) - FLAT FIELD FORMAT
```
pageType: ABOUT
siteType: PAID
primaryTitle: Welcome to Premium Brain Buzz Academy
primaryDescription: Long description text here about our premium platform...
secondaryTitle: Premium Features & Benefits
cards[0][heading]: Premium Courses
cards[0][description]: Exclusive premium course content
cards[1][heading]: Advanced Test Series
cards[1][description]: Premium test series with detailed analytics
aboutImages[]: about_paid_img1.jpg
aboutImages[]: about_paid_img2.jpg
aboutImages[]: about_paid_img3.jpg
```

#### Expected Response (Success):
```json
{
  "success": true,
  "message": "HOME FREE banner saved successfully",
  "data": {
    "_id": "banner_id",
    "pageType": "HOME",
    "siteType": "FREE",
    "images": [
      {
        "_id": "6943e167c83aae32628d4457",
        "id": "1702904408562-0",
        "url": "https://res.cloudinary.com/.../free/home/home_free_img1.jpg"
      },
      {
        "_id": "6943e167c83aae32628d4458",
        "id": "1702904408562-1",
        "url": "https://res.cloudinary.com/.../free/home/home_free_img2.jpg"
      }
    ],
    "isActive": true,
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
}
```

#### Expected Response (ABOUT Success):
```json
{
  "success": true,
  "message": "ABOUT PAID banner saved successfully",
  "data": {
    "_id": "banner_id",
    "pageType": "ABOUT",
    "siteType": "PAID",
    "about": {
      "images": [
        "https://res.cloudinary.com/.../paid/about/about_paid_img1.jpg",
        "https://res.cloudinary.com/.../paid/about/about_paid_img2.jpg",
        "https://res.cloudinary.com/.../paid/about/about_paid_img3.jpg"
      ],
      "primaryTitle": "Welcome to Premium Brain Buzz Academy",
      "primaryDescription": "Long description text here about our premium platform...",
      "secondaryTitle": "Premium Features & Benefits",
      "cards": [
        {
          "heading": "Premium Courses",
          "description": "Exclusive premium course content"
        },
        {
          "heading": "Advanced Test Series", 
          "description": "Premium test series with detailed analytics"
        }
      ]
    },
    "isActive": true,
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
}
```

### 2. Get Banner (Admin)

**Endpoint:** `GET /api/admin/banners/:pageType/:siteType`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`

#### Examples:
```
GET /api/admin/banners/HOME/FREE
GET /api/admin/banners/HOME/PAID
GET /api/admin/banners/ABOUT/FREE
GET /api/admin/banners/ABOUT/PAID
```

#### Expected Response:
```json
{
  "success": true,
  "data": {
    "_id": "banner_id",
    "pageType": "HOME",
    "siteType": "FREE",
    "images": [
      {
        "_id": "6943e167c83aae32628d4457",
        "id": "1702904408562-0",
        "url": "https://res.cloudinary.com/.../free/home/img1.jpg"
      }
    ],
    "isActive": true,
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
}
```

### 3. Delete Banner (Soft Delete)

**Endpoint:** `DELETE /api/admin/banners/:pageType/:siteType`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`

#### Examples:
```
DELETE /api/admin/banners/HOME/FREE
DELETE /api/admin/banners/ABOUT/PAID
```

#### Expected Response:
```json
{
  "success": true,
  "message": "HOME FREE banner deactivated successfully"
}
```

### 4. Update Specific Image in Banner

**Endpoint:** `PUT /api/admin/banners/:pageType/:siteType/images/:imageId`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`
- `Content-Type: multipart/form-data`

#### Form Fields:
- `image`: (select your new image file)

#### Examples:
```
PUT /api/admin/banners/HOME/FREE/images/6943e167c83aae32628d4457
PUT /api/admin/banners/ABOUT/PAID/images/6943e167c83aae32628d4458
```

#### Expected Response:
```json
{
  "success": true,
  "message": "Image updated successfully",
  "data": {
    "_id": "banner_id",
    "pageType": "HOME",
    "siteType": "FREE",
    "images": [
      {
        "_id": "6943e167c83aae32628d4457",
        "id": "1702904408562-0",
        "url": "https://res.cloudinary.com/.../free/home/new_image.jpg"
      }
    ],
    "isActive": true,
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
}
```

### 5. Update About Section (Single Endpoint) - PATCH Method

**Endpoint:** `PATCH /api/admin/banners/about/:siteType`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`
- `Content-Type: multipart/form-data`

Partially updates the About section - can update text content, cards, and/or images in a single request.

#### Form-Data Format (Update all fields):
```
primaryTitle: New Primary Title
primaryDescription: Updated primary description text here...
secondaryTitle: New Secondary Title
cards[0][heading]: Updated Card 1 Heading
cards[0][description]: Updated card 1 description text here...
cards[1][heading]: Updated Card 2 Heading
cards[1][description]: Updated card 2 description text here...
images[]: new_image1.jpg
images[]: new_image2.jpg
```

#### Form-Data Format (Update only text content):
```
primaryTitle: Updated Primary Title Only
primaryDescription: Updated description only
```

#### Form-Data Format (Update only cards):
```
cards[0][heading]: New Card Heading
cards[0][description]: New card description
cards[1][heading]: Another Card Heading
cards[1][description]: Another card description
```

#### Form-Data Format (Update only images):
```
aboutImages[]: new_image1.jpg
aboutImages[]: new_image2.jpg
```

#### Form-Data Format (Update text and images):
```
primaryTitle: New Title Only
cards[0][heading]: New Card Heading
cards[0][description]: New card description
aboutImages[]: new_image1.jpg
aboutImages[]: new_image2.jpg
```

#### Examples:
```
PATCH /api/admin/banners/about/FREE
PATCH /api/admin/banners/about/PAID
```



#### Expected Response:
```json
{
  "success": true,
  "message": "ABOUT FREE content updated successfully",
  "data": {
    "_id": "banner_id",
    "pageType": "ABOUT",
    "siteType": "FREE",
    "about": {
      "images": [
        "https://res.cloudinary.com/.../free/about/img1.jpg",
        "https://res.cloudinary.com/.../free/about/img2.jpg"
      ],
      "primaryTitle": "New Primary Title",
      "primaryDescription": "Updated primary description text here...",
      "secondaryTitle": "New Secondary Title",
      "cards": [
        {
          "heading": "Updated Card 1 Heading",
          "description": "Updated card 1 description text here..."
        },
        {
          "heading": "Updated Card 2 Heading",
          "description": "Updated card 2 description text here..."
        }
      ]
    },
    "isActive": true,
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
}
```



---

## CONTACT CONFIGURATION APIs

### 1. Create / Update Contact Config (UPSERT)

**Endpoint:** `POST /api/admin/contact`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`
- `Content-Type: application/json` (no images to upload)

#### JSON Body for Free Site:
```json
{
  "siteType": "FREE",
  "phone": "+1-800-FREE-EDU",
  "email": "contact@free-site.com",
  "address": "123 Free Education St, Free City"
}
```

#### JSON Body for Paid Site:
```json
{
  "siteType": "PAID", 
  "phone": "+1-800-PREMIUM",
  "email": "premium@paid-site.com",
  "address": "456 Premium Ave, Premium City"
}
```

#### Expected Response:
```json
{
  "success": true,
  "message": "PAID contact config saved successfully",
  "data": {
    "_id": "contact_id",
    "siteType": "PAID",
    "phone": "+1-800-PREMIUM",
    "email": "premium@paid-site.com", 
    "address": "456 Premium Ave, Premium City",
    "isActive": true,
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
}
```

### 2. Get Contact Config (Admin)

**Endpoint:** `GET /api/admin/contact/:siteType`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`

#### Examples:
```
GET /api/admin/contact/FREE
GET /api/admin/contact/PAID
```

### 3. Delete Contact Config (Soft Delete)

**Endpoint:** `DELETE /api/admin/contact/:siteType`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`

#### Expected Response:
```json
{
  "success": true,
  "message": "PAID contact config deactivated successfully"
}
```

---

## USER APIs (PUBLIC)

### 1. Home Banner - Free Site
**Endpoint:** `GET /api/public/home-banner?siteType=FREE`

#### Expected Response:
```json
{
  "success": true,
  "siteType": "FREE",
  "pageType": "HOME", 
  "images": [
    "https://res.cloudinary.com/.../free/home/img1.jpg",
    "https://res.cloudinary.com/.../free/home/img2.jpg"
  ]
}
```

### 2. Home Banner - Paid Site
**Endpoint:** `GET /api/public/home-banner?siteType=PAID`

#### Expected Response:
```json
{
  "success": true,
  "siteType": "PAID",
  "pageType": "HOME",
  "images": [
    "https://res.cloudinary.com/.../paid/home/img1.jpg", 
    "https://res.cloudinary.com/.../paid/home/img2.jpg"
  ]
}
```

### 3. About Banner - Free Site
**Endpoint:** `GET /api/public/about-banner?siteType=FREE`

#### Expected Response:
```json
{
  "success": true,
  "siteType": "FREE",
  "pageType": "ABOUT",
  "about": {
    "images": [
      "https://res.cloudinary.com/.../free/about/img1.jpg",
      "https://res.cloudinary.com/.../free/about/img2.jpg",
      "https://res.cloudinary.com/.../free/about/img3.jpg"
    ],
    "primaryTitle": "Welcome to Brain Buzz Academy",
    "primaryDescription": "Long description text here about our free platform...",
    "secondaryTitle": "Everything you need to know",
    "cards": [
      {
        "heading": "50 Online Courses",
        "description": "We have approximately 50 online courses"
      },
      {
        "heading": "50 Test Series", 
        "description": "We have approximately 50 test series"
      }
    ]
  }
}
```

### 4. About Banner - Paid Site
**Endpoint:** `GET /api/public/about-banner?siteType=PAID`

#### Expected Response:
```json
{
  "success": true,
  "siteType": "PAID", 
  "pageType": "ABOUT",
  "about": {
    "images": [
      "https://res.cloudinary.com/.../paid/about/img1.jpg",
      "https://res.cloudinary.com/.../paid/about/img2.jpg",
      "https://res.cloudinary.com/.../paid/about/img3.jpg"
    ],
    "primaryTitle": "Welcome to Premium Brain Buzz Academy",
    "primaryDescription": "Long description text here about our premium platform...",
    "secondaryTitle": "Premium Features & Benefits",
    "cards": [
      {
        "heading": "Premium Courses",
        "description": "Exclusive premium course content"
      },
      {
        "heading": "Advanced Test Series", 
        "description": "Premium test series with detailed analytics"
      }
    ]
  }
}
```

### 5. Contact Info - Free Site
**Endpoint:** `GET /api/public/contact?siteType=FREE`

#### Expected Response:
```json
{
  "success": true,
  "data": {
    "phone": "+1-800-FREE-EDU",
    "email": "contact@free-site.com",
    "address": "123 Free Education St, Free City"
  }
}
```

### 6. Contact Info - Paid Site
**Endpoint:** `GET /api/public/contact?siteType=PAID`

#### Expected Response:
```json
{
  "success": true,
  "data": {
    "phone": "+1-800-PREMIUM",
    "email": "premium@paid-site.com", 
    "address": "456 Premium Ave, Premium City"
  }
}
```

---

## Validation Rules

### HOME Page Validation
* ❌ about data not allowed for HOME
* ✅ images[] required for HOME
* ✅ pageType required (HOME/ABOUT)
* ✅ siteType required (FREE/PAID)

### ABOUT Page Validation (FLAT FIELD FORMAT)
* ✅ primaryTitle required
* ✅ primaryDescription required
* ✅ secondaryTitle required
* ✅ cards required (array of objects with heading and description)
* ✅ aboutImages[] required (minimum 2 images)
* ❌ nested about[...] format not accepted

### About Section Update Validation (Form-Data Only)
* ✅ Supports only `multipart/form-data` content type
* ✅ Partial updates supported (only provide fields to change)
* ✅ Card parsing from form-data format: `cards[0][heading]`, `cards[0][description]`
* ✅ Image upload support: `aboutImages[]` field
* ✅ Automatic field validation for form-data

### Contact Validation
* ✅ siteType required (FREE/PAID)
* ✅ phone, email, address optional but recommended

---

## Testing Steps Summary

### 1. Setup Phase:
- Test FREE HOME banner creation with multiple images
- Test PAID HOME banner creation with multiple images
- Test FREE ABOUT banner creation with flat field format
- Test PAID ABOUT banner creation with flat field format
- Verify all banners are stored correctly with proper Cloudinary paths

### 2. Admin Testing:
- Test banner upsert functionality (updating existing banners)
- Test getting banners by pageType and siteType
- Test soft deleting banners
- Test updating specific images in banners

### 3. User Testing:
- Test public HOME banner endpoints for both FREE and PAID
- Test public ABOUT banner endpoints for both FREE and PAID
- Test public contact endpoints for both FREE and PAID
- Verify correct data format for frontend consumption

### 4. About Section Update Testing:
- Test updating all About section content fields at once
- Test updating individual fields (primaryTitle, primaryDescription, etc.)
- Test updating cards using indexed format (cards[0][heading], cards[0][description])
- Test updating only card headings or only descriptions
- Test updating images with aboutImages[] field
- Test updating both content and images in single request
- Test validation for empty/invalid fields

### 5. Edge Cases:
- Test creating ABOUT banner without required fields (should fail)
- Test creating ABOUT banner with less than 2 images (should fail)
- Test creating ABOUT banner without cards (should fail)
- Test duplicate banner creation (should update existing)
- Test inactive banner visibility (should not appear in public APIs)

### 6. Image Upload Testing:
- Test multiple image uploads in single request
- Test single image updates
- Verify Cloudinary folder structure: `brainbuzz/banners/{siteType}/{pageType}/` for HOME and `brainbuzz/banners/{siteType}/about/` for ABOUT
- Test image size and format restrictions

Ensure all endpoints return appropriate error messages for invalid requests and that form-data is properly handled for all image upload operations.