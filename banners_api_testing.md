# Banner System API Testing Guide

This guide provides step-by-step instructions for testing all banner-related APIs, including required request bodies, endpoints, and expected responses.

## Important Note on Request Format

All banner creation and update requests must follow a specific format:
1. Metadata (pageType, heading, description) must be sent as individual form fields
2. Images must be sent as an array of files in a field called `images[]`
3. Content-Type must be `multipart/form-data`

This is different from some other APIs in the system that use JSON payloads.

## Base URL
```
https://brain-buzz-web.vercel.app/
```

## Authentication
Most admin endpoints require authentication. Ensure you have a valid admin JWT token before making requests.

---

## ADMIN APIs

### 1. Create / Replace Banner (UPSERT)

**Endpoint:** `POST /api/admin/banners`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`
- `Content-Type: multipart/form-data`

#### Form-Data (HOME)
```
pageType: HOME
images[]: banner1.jpg
images[]: banner2.jpg
images[]: banner3.jpg
```

#### Form-Data (ABOUT)
```
pageType: ABOUT
heading: Everything you need to know
description: Long about us text here...
images[]: about1.jpg
images[]: about2.jpg
```

#### Expected Response (Success):
```json
{
  "success": true,
  "message": "HOME banner saved successfully",
  "data": {
    "_id": "banner_id",
    "pageType": "HOME",
    "images": [
      {
        "_id": "6943e167c83aae32628d4457",
        "id": "1702904408562-0",
        "url": "https://res.cloudinary.com/.../banner1.jpg"
      },
      {
        "_id": "6943e167c83aae32628d4458",
        "id": "1702904408562-1",
        "url": "https://res.cloudinary.com/.../banner2.jpg"
      },
      {
        "_id": "6943e167c83aae32628d4459",
        "id": "1702904408562-2",
        "url": "https://res.cloudinary.com/.../banner3.jpg"
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
  "message": "ABOUT banner saved successfully",
  "data": {
    "_id": "banner_id",
    "pageType": "ABOUT",
    "heading": "Everything you need to know",
    "description": "Long about us text here...",
    "images": [
      {
        "_id": "6943e167c83aae32628d445a",
        "id": "1702904408562-0",
        "url": "https://res.cloudinary.com/.../about1.jpg"
      },
      {
        "_id": "6943e167c83aae32628d445b",
        "id": "1702904408562-1",
        "url": "https://res.cloudinary.com/.../about2.jpg"
      }
    ],
    "isActive": true,
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
}
```

### 2. Get Banner (Admin)

**Endpoint:** `GET /api/admin/banners/:pageType`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`

#### Examples:
```
GET /api/admin/banners/HOME
GET /api/admin/banners/ABOUT
```

#### Expected Response:
```json
{
  "success": true,
  "data": {
    "_id": "banner_id",
    "pageType": "HOME",
    "images": [
      {
        "_id": "6943e167c83aae32628d4457",
        "id": "1702904408562-0",
        "url": "https://res.cloudinary.com/.../banner1.jpg"
      },
      {
        "_id": "6943e167c83aae32628d4458",
        "id": "1702904408562-1",
        "url": "https://res.cloudinary.com/.../banner2.jpg"
      }
    ],
    "isActive": true,
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
}
```

### 3. Delete Banner (Optional)

**Endpoint:** `DELETE /api/admin/banners/:pageType`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`

#### Examples:
```
DELETE /api/admin/banners/HOME
DELETE /api/admin/banners/ABOUT
```

#### Expected Response:
```json
{
  "success": true,
  "message": "HOME banner deleted successfully"
}
```

### 4. Update Specific Image in Banner (using _id)

**Endpoint:** `PUT /api/admin/banners/:pageType/images/:imageId`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`
- `Content-Type: multipart/form-data`

**Note:** The `:imageId` parameter refers to the `_id` field of the image object, not the `id` field.

#### Form Fields:
- `image`: (select your new image file)

#### Examples:
```
PUT /api/admin/banners/HOME/images/6943e167c83aae32628d4457
PUT /api/admin/banners/ABOUT/images/6943e167c83aae32628d4458
```

#### Expected Response:
```json
{
  "success": true,
  "message": "Image updated successfully",
  "data": {
    "_id": "banner_id",
    "pageType": "HOME",
    "images": [
      {
        "_id": "6943e167c83aae32628d4457",
        "id": "1702904408562-0",
        "url": "https://res.cloudinary.com/.../new_image.jpg"
      },
      {
        "_id": "6943e167c83aae32628d4458",
        "id": "1702904408562-1",
        "url": "https://res.cloudinary.com/.../other_image.jpg"
      }
    ],
    "isActive": true,
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
}
```

---

## USER APIs (PUBLIC)

### 1. Home Page Banner

**Endpoint:** `GET /api/public/home-banner`  

#### Expected Response:
```json
{
  "success": true,
  "images": [
    "https://res.cloudinary.com/.../banner1.jpg",
    "https://res.cloudinary.com/.../banner2.jpg"
  ]
}
```

### 2. About Page Banner

**Endpoint:** `GET /api/public/about-banner`  

#### Expected Response:
```json
{
  "success": true,
  "heading": "Everything you need to know",
  "description": "About us description text...",
  "images": [
    "https://res.cloudinary.com/.../about1.jpg",
    "https://res.cloudinary.com/.../about2.jpg"
  ]
}
```

---

## Validation Rules

### HOME Page Validation
* ❌ heading not allowed
* ❌ description not allowed
* ✅ images[] required

### ABOUT Page Validation
* ✅ heading required
* ✅ description required
* ✅ images[] required

---

## Testing Steps Summary

1. **Setup Phase:**
   - Test HOME banner creation with multiple images
   - Test ABOUT banner creation with heading, description, and images
   - Verify both banners are stored correctly

2. **Admin Testing:**
   - Test banner upsert functionality (updating existing banners)
   - Test getting banners by page type
   - Test deleting banners

3. **User Testing:**
   - Test public home banner endpoint
   - Test public about banner endpoint
   - Verify correct data format for frontend consumption

4. **Edge Cases:**
   - Test creating banner without images (should fail)
   - Test creating ABOUT banner without heading/description (should fail)
   - Test creating HOME banner with heading/description (should be ignored)
   - Test duplicate banner creation (should update existing)

Ensure all endpoints return appropriate error messages for invalid requests.

---

## Troubleshooting Common Issues

### Example Request Format

Here's a complete example of how to format your request:

**Endpoint:** `POST /api/admin/banners`
**Headers:**
- `Authorization: Bearer your_admin_token`
- `Content-Type: multipart/form-data`

**Form Fields (HOME):**
- `pageType`: `HOME`
- `images`: (select your first image file)
- `images`: (select your second image file)

**Form Fields (ABOUT):**
- `pageType`: `ABOUT`
- `heading`: `Everything you need to know`
- `description`: `Long about us text here...`
- `images`: (select your first image file)
- `images`: (select your second image file)

**Important Notes:**
1. When using tools like Postman, select 'form-data' and add multiple rows with the same key name 'images'
2. Each 'images' field should have type 'File' and contain one image
3. The field name should be exactly 'images' (without brackets)

Replace the file selections with actual image files.

### 1. "At least one image is required" Error

**Cause:** This error occurs when no images are included in the request or images are not sent in the correct format.

**Solution:**
1. Ensure you're sending at least one file in the `images` field
2. When using tools like Postman, add multiple rows with the same key name `images` (each containing one file)
3. Verify that the image files are not corrupted
4. Check that files are being sent as 'File' type, not 'Text'
5. Make sure the field name is exactly 'images' (without brackets)

### 2. "Page type is required" Error

**Cause:** Missing pageType field in the request.

**Solution:**
1. Ensure you're sending the `pageType` field with value `HOME` or `ABOUT`
2. Check that field name matches exactly (case-sensitive)

### 3. "Heading is required for ABOUT page" Error

**Cause:** Creating an ABOUT banner without providing a heading.

**Solution:**
1. When creating an ABOUT banner, ensure you include the `heading` field
2. The heading field is only required for ABOUT banners, not HOME banners

### 4. "Description is required for ABOUT page" Error

**Cause:** Creating an ABOUT banner without providing a description.

**Solution:**
1. When creating an ABOUT banner, ensure you include the `description` field
2. The description field is only required for ABOUT banners, not HOME banners

### 5. "Invalid page type" Error

**Cause:** Sending an invalid value for pageType (not HOME or ABOUT).

**Solution:**
1. Ensure pageType is exactly `HOME` or `ABOUT` (uppercase)
2. Check for typos in the pageType value