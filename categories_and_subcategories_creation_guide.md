# Categories and Subcategories Creation Guide for All Content Types

This document provides detailed step-by-step instructions for creating categories and subcategories for all content types in the Brain Buzz platform.

## Table of Contents
1. [Overview](#overview)
2. [Content Types](#content-types)
3. [Category Creation](#category-creation)
   - [Create Category for Each Content Type](#create-category-for-each-content-type)
4. [Subcategory Creation](#subcategory-creation)
   - [Create Subcategory for Each Content Type](#create-subcategory-for-each-content-type)
5. [API Endpoints](#api-endpoints)
   - [Category APIs](#category-apis)
   - [Subcategory APIs](#subcategory-apis)
6. [Content Type Validation](#content-type-validation)

## Overview

The Brain Buzz platform implements isolated Category and SubCategory records per content type to prevent cross-module edits. Each category and subcategory must have a specific `contentType` field that determines which content type it belongs to.

## Content Types

The following content types are supported:
- `ONLINE_COURSE`
- `TEST_SERIES`
- `DAILY_QUIZ`
- `LIVE_CLASS`
- `PUBLICATION`
- `E_BOOK`
- `CURRENT_AFFAIRS`

## Category Creation

### Create Category for Each Content Type

To create categories for different content types, you need to specify the `contentType` field in your request.

#### General Category Creation Process

**Endpoint**: `POST /api/admin/categories`
**Method**: POST
**Content-Type**: `multipart/form-data`
**Authentication**: Required (Admin token)

#### Required Fields
- `name` (string) - Name of the category
- `contentType` (string) - One of the supported content types
- `description` (string, optional) - Description of the category
- `isActive` (boolean, optional) - Whether the category is active (default: true)

#### Optional File Fields
- `thumbnail` - Category thumbnail image

#### Sample Requests for Each Content Type

##### 1. ONLINE_COURSE Category
```bash
curl -X POST http://localhost:5000/api/admin/categories \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "name=UPSC Preparation" \
  -F "contentType=ONLINE_COURSE" \
  -F "description=Comprehensive courses for UPSC preparation" \
  -F "isActive=true" \
  -F "thumbnail=@/path/to/thumbnail.jpg"
```

##### 2. TEST_SERIES Category
```bash
curl -X POST http://localhost:5000/api/admin/categories \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "name=Mock Tests" \
  -F "contentType=TEST_SERIES" \
  -F "description=Practice tests for various exams" \
  -F "isActive=true" \
  -F "thumbnail=@/path/to/thumbnail.jpg"
```

##### 3. DAILY_QUIZ Category
```bash
curl -X POST http://localhost:5000/api/admin/categories \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "name=Daily Practice" \
  -F "contentType=DAILY_QUIZ" \
  -F "description=Daily quizzes for continuous learning" \
  -F "isActive=true" \
  -F "thumbnail=@/path/to/thumbnail.jpg"
```

##### 4. LIVE_CLASS Category
```bash
curl -X POST http://localhost:5000/api/admin/categories \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "name=Live Sessions" \
  -F "contentType=LIVE_CLASS" \
  -F "description=Interactive live classes" \
  -F "isActive=true" \
  -F "thumbnail=@/path/to/thumbnail.jpg"
```

##### 5. PUBLICATION Category
```bash
curl -X POST http://localhost:5000/api/admin/categories \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "name=Study Materials" \
  -F "contentType=PUBLICATION" \
  -F "description=Printed study materials and books" \
  -F "isActive=true" \
  -F "thumbnail=@/path/to/thumbnail.jpg"
```

##### 6. E_BOOK Category
```bash
curl -X POST http://localhost:5000/api/admin/categories \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "name=E-Books" \
  -F "contentType=E_BOOK" \
  -F "description=Digital books and study materials" \
  -F "isActive=true" \
  -F "thumbnail=@/path/to/thumbnail.jpg"
```

##### 7. CURRENT_AFFAIRS Category
```bash
curl -X POST http://localhost:5000/api/admin/categories \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "name=Current Affairs" \
  -F "contentType=CURRENT_AFFAIRS" \
  -F "description=Latest updates and current affairs" \
  -F "isActive=true" \
  -F "thumbnail=@/path/to/thumbnail.jpg"
```

#### Success Response
```json
{
  "message": "Category created successfully",
  "data": {
    "_id": "category_object_id",
    "name": "UPSC Preparation",
    "slug": "upsc-preparation",
    "thumbnailUrl": "https://res.cloudinary.com/your-account/image/upload/v1234567890/brainbuzz/categories/thumbnails/thumbnail.jpg",
    "description": "Comprehensive courses for UPSC preparation",
    "contentType": "ONLINE_COURSE",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

## Subcategory Creation

### Create Subcategory for Each Content Type

Subcategories are linked to their parent categories and inherit the content type from the parent category.

#### General Subcategory Creation Process

**Endpoint**: `POST /api/admin/subcategories`
**Method**: POST
**Content-Type**: `multipart/form-data`
**Authentication**: Required (Admin token)

#### Required Fields
- `category` (string) - ID of the parent category
- `name` (string) - Name of the subcategory
- `description` (string, optional) - Description of the subcategory
- `isActive` (boolean, optional) - Whether the subcategory is active (default: true)

#### Optional File Fields
- `thumbnail` - Subcategory thumbnail image

#### Sample Requests for Each Content Type

##### 1. ONLINE_COURSE Subcategory
```bash
curl -X POST http://localhost:5000/api/admin/subcategories \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "category=CATEGORY_ID_FROM_ONLINE_COURSE" \
  -F "name=History" \
  -F "description=History courses for UPSC" \
  -F "isActive=true" \
  -F "thumbnail=@/path/to/thumbnail.jpg"
```

##### 2. TEST_SERIES Subcategory
```bash
curl -X POST http://localhost:5000/api/admin/subcategories \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "category=CATEGORY_ID_FROM_TEST_SERIES" \
  -F "name=General Studies" \
  -F "description=General studies mock tests" \
  -F "isActive=true" \
  -F "thumbnail=@/path/to/thumbnail.jpg"
```

##### 3. DAILY_QUIZ Subcategory
```bash
curl -X POST http://localhost:5000/api/admin/subcategories \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "category=CATEGORY_ID_FROM_DAILY_QUIZ" \
  -F "name=GK Questions" \
  -F "description=General knowledge daily quizzes" \
  -F "isActive=true" \
  -F "thumbnail=@/path/to/thumbnail.jpg"
```

##### 4. LIVE_CLASS Subcategory
```bash
curl -X POST http://localhost:5000/api/admin/subcategories \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "category=CATEGORY_ID_FROM_LIVE_CLASS" \
  -F "name=GS Lectures" \
  -F "description=General studies live lectures" \
  -F "isActive=true" \
  -F "thumbnail=@/path/to/thumbnail.jpg"
```

##### 5. PUBLICATION Subcategory
```bash
curl -X POST http://localhost:5000/api/admin/subcategories \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "category=CATEGORY_ID_FROM_PUBLICATION" \
  -F "name=History Books" \
  -F "description=History related publications" \
  -F "isActive=true" \
  -F "thumbnail=@/path/to/thumbnail.jpg"
```

##### 6. E_BOOK Subcategory
```bash
curl -X POST http://localhost:5000/api/admin/subcategories \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "category=CATEGORY_ID_FROM_E_BOOK" \
  -F "name=Polity E-Books" \
  -F "description=Polity related digital books" \
  -F "isActive=true" \
  -F "thumbnail=@/path/to/thumbnail.jpg"
```

##### 7. CURRENT_AFFAIRS Subcategory
```bash
curl -X POST http://localhost:5000/api/admin/subcategories \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "category=CATEGORY_ID_FROM_CURRENT_AFFAIRS" \
  -F "name=Monthly Updates" \
  -F "description=Monthly current affairs updates" \
  -F "isActive=true" \
  -F "thumbnail=@/path/to/thumbnail.jpg"
```

#### Success Response
```json
{
  "message": "Subcategory created successfully",
  "data": {
    "_id": "subcategory_object_id",
    "category": "category_object_id",
    "name": "History",
    "slug": "history",
    "thumbnailUrl": "https://res.cloudinary.com/your-account/image/upload/v1234567891/brainbuzz/subcategories/thumbnails/thumbnail.jpg",
    "description": "History courses for UPSC",
    "contentType": "ONLINE_COURSE",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

## API Endpoints

### Category APIs

#### Create Category
**Endpoint**: `POST /api/admin/categories`
**Method**: POST
**Content-Type**: `multipart/form-data`
**Authentication**: Required (Admin token)

**Body Parameters**:
- `name` (string, required) - Name of the category
- `contentType` (string, required) - Content type of the category
- `description` (string, optional) - Description of the category
- `isActive` (boolean, optional) - Active status of the category
- `thumbnail` (file, optional) - Thumbnail image

#### Get Categories
**Endpoint**: `GET /api/admin/categories`
**Method**: GET
**Authentication**: Required (Admin token)

**Query Parameters**:
- `contentType` (string, required) - Content type to filter categories

**Sample Request**:
```bash
curl -X GET "http://localhost:5000/api/admin/categories?contentType=ONLINE_COURSE" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

#### Get Category by ID
**Endpoint**: `GET /api/admin/categories/:id`
**Method**: GET
**Authentication**: Required (Admin token)

**Sample Request**:
```bash
curl -X GET "http://localhost:5000/api/admin/categories/CATEGORY_ID" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

#### Update Category
**Endpoint**: `PUT /api/admin/categories/:id`
**Method**: PUT
**Content-Type**: `multipart/form-data`
**Authentication**: Required (Admin token)

**Body Parameters**:
- `name` (string, optional) - Name of the category
- `description` (string, optional) - Description of the category
- `isActive` (boolean, optional) - Active status of the category
- `thumbnail` (file, optional) - Thumbnail image

#### Delete Category
**Endpoint**: `DELETE /api/admin/categories/:id`
**Method**: DELETE
**Authentication**: Required (Admin token)

**Sample Request**:
```bash
curl -X DELETE "http://localhost:5000/api/admin/categories/CATEGORY_ID" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Subcategory APIs

#### Create Subcategory
**Endpoint**: `POST /api/admin/subcategories`
**Method**: POST
**Content-Type**: `multipart/form-data`
**Authentication**: Required (Admin token)

**Body Parameters**:
- `category` (string, required) - ID of the parent category
- `name` (string, required) - Name of the subcategory
- `description` (string, optional) - Description of the subcategory
- `isActive` (boolean, optional) - Active status of the subcategory
- `thumbnail` (file, optional) - Thumbnail image

#### Get Subcategories
**Endpoint**: `GET /api/admin/subcategories`
**Method**: GET
**Authentication**: Required (Admin token)

**Query Parameters**:
- `contentType` (string, required) - Content type to filter subcategories
- `category` (string, optional) - Parent category ID to filter subcategories

**Sample Request**:
```bash
curl -X GET "http://localhost:5000/api/admin/subcategories?contentType=ONLINE_COURSE&category=CATEGORY_ID" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

#### Get Subcategory by ID
**Endpoint**: `GET /api/admin/subcategories/:id`
**Method**: GET
**Authentication**: Required (Admin token)

**Sample Request**:
```bash
curl -X GET "http://localhost:5000/api/admin/subcategories/SUBCATEGORY_ID" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

#### Update Subcategory
**Endpoint**: `PUT /api/admin/subcategories/:id`
**Method**: PUT
**Content-Type**: `multipart/form-data`
**Authentication**: Required (Admin token)

**Body Parameters**:
- `category` (string, optional) - ID of the parent category
- `name` (string, optional) - Name of the subcategory
- `description` (string, optional) - Description of the subcategory
- `isActive` (boolean, optional) - Active status of the subcategory
- `thumbnail` (file, optional) - Thumbnail image

#### Delete Subcategory
**Endpoint**: `DELETE /api/admin/subcategories/:id`
**Method**: DELETE
**Authentication**: Required (Admin token)

**Sample Request**:
```bash
curl -X DELETE "http://localhost:5000/api/admin/subcategories/SUBCATEGORY_ID" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## Content Type Validation

All categories and subcategories implement content type isolation:

1. Each category must have a `contentType` field matching one of the supported content types
2. Each subcategory inherits the `contentType` from its parent category
3. When creating content (courses, publications, etc.), the system validates that categories and subcategories match the content's content type

Attempting to use categories or subcategories with mismatched content types will result in an error:
```json
{
  "message": "Server error",
  "error": "Category History does not match content type PUBLICATION"
}
```

Ensure you use the correct category and subcategory IDs that match the respective content types when creating content.