# Publications and E-Books API Testing Guide

This document provides detailed step-by-step instructions for testing the Publications and E-Books APIs through the Admin interface.

## Table of Contents
1. [Publications API](#publications-api)
   - [Create Publication](#create-publication)
   - [Get Publications](#get-publications)
   - [Get Publication by ID](#get-publication-by-id)
   - [Update Publication](#update-publication)
   - [Delete Publication](#delete-publication)
2. [E-Books API](#e-books-api)
   - [Create E-Book](#create-e-book)
   - [Get E-Books](#get-e-books)
   - [Get E-Book by ID](#get-e-book-by-id)
   - [Update E-Book](#update-e-book)
   - [Delete E-Book](#delete-e-book)

## Publications API

### Create Publication

**Endpoint**: `POST /api/admin/publications`
**Method**: POST
**Content-Type**: `multipart/form-data`
**Authentication**: Required (Admin token)

#### Required Fields
- `publication` (JSON string) - Contains all publication data

#### Optional File Fields
- `thumbnail` - Publication cover image
- `authorImages` - Array of author profile pictures
- `galleryImages` - Array of additional images
- `bookFile` - Main publication file (PDF/document)

#### Publication Data Structure (in `publication` field):
```json
{
  "name": "Complete History of Ancient Civilizations",
  "startDate": "2024-01-15",
  "categoryIds": ["693feae85e290d8730b3846d"],
  "subCategoryIds": ["693feb7f5e290d8730b38472"],
  "languageIds": ["language_object_id"],
  "validityIds": ["validity_object_id"],
  "originalPrice": 1500,
  "discountPrice": 1200,
  // Note: discountPercent is automatically calculated by the backend
  "availableIn": "BOTH", // Options: "PUBLICATION", "E_BOOK", "BOTH"
  "pricingNote": "Special offer for early buyers",
  "shortDescription": "Comprehensive guide to ancient civilizations",
  "detailedDescription": "Detailed exploration of ancient civilizations...",
  "authors": [
    {
      "name": "Dr. John Smith",
      "qualification": "PhD in Ancient History",
      "subject": "History"
    }
  ],
  "isActive": true
}
```

#### Sample Request:
```bash
curl -X POST http://localhost:5000/api/admin/publications \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F 'publication={"name":"Complete History of Ancient Civilizations","startDate":"2024-01-15","categoryIds":["693feae85e290d8730b3846d"],"subCategoryIds":["693feb7f5e290d8730b38472"],"languageIds":["language_object_id"],"validityIds":["validity_object_id"],"originalPrice":1500,"discountPrice":1200,"availableIn":"BOTH","pricingNote":"Special offer for early buyers","shortDescription":"Comprehensive guide to ancient civilizations","detailedDescription":"Detailed exploration of ancient civilizations...","authors":[{"name":"Dr. John Smith","qualification":"PhD in Ancient History","subject":"History"}],"isActive":true}' \
  -F "thumbnail=@/path/to/publication-cover.jpg" \
  -F "authorImages[]=@/path/to/author1.jpg" \
  -F "galleryImages[]=@/path/to/gallery1.jpg" \
  -F "galleryImages[]=@/path/to/gallery2.jpg" \
  -F "bookFile=@/path/to/publication-file.pdf"
```

#### Success Response:
```
{
  "message": "Publication created successfully",
  "data": {
    "_id": "publication_object_id",
    "contentType": "PUBLICATION",
    "accessType": "PAID",
    "name": "Complete History of Ancient Civilizations",
    "startDate": "2024-01-15T00:00:00.000Z",
    "categories": ["693feae85e290d8730b3846d"],
    "subCategories": ["693feb7f5e290d8730b38472"],
    "languages": ["language_object_id"],
    "validities": ["validity_object_id"],
    "thumbnailUrl": "https://res.cloudinary.com/your-account/image/upload/v1234567890/brainbuzz/publications/thumbnails/cover.jpg",
    "originalPrice": 1500,
    "discountPrice": 1200,
    "discountPercent": 20, // Automatically calculated: ((1500-1200)/1500)*100
    "availableIn": "BOTH",
    "pricingNote": "Special offer for early buyers",
    "shortDescription": "Comprehensive guide to ancient civilizations",
    "detailedDescription": "Detailed exploration of ancient civilizations...",
    "authors": [
      {
        "_id": "author_object_id",
        "photoUrl": "https://res.cloudinary.com/your-account/image/upload/v1234567891/brainbuzz/publications/authors/author1.jpg",
        "name": "Dr. John Smith",
        "qualification": "PhD in Ancient History",
        "subject": "History"
      }
    ],
    "galleryImages": [
      "https://res.cloudinary.com/your-account/image/upload/v1234567892/brainbuzz/publications/images/gallery1.jpg",
      "https://res.cloudinary.com/your-account/image/upload/v1234567893/brainbuzz/publications/images/gallery2.jpg"
    ],
    "bookFileUrl": "https://res.cloudinary.com/your-account/raw/upload/v1234567894/brainbuzz/publications/books/publication-file.pdf",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Get Publications

**Endpoint**: `GET /api/admin/publications`
**Method**: GET
**Authentication**: Required (Admin token)

#### Query Parameters (all optional):
- `category` - Filter by category ID
- `subCategory` - Filter by subcategory ID
- `language` - Filter by language ID
- `isActive` - Filter by active status (true/false)

#### Sample Request:
```bash
curl -X GET "http://localhost:5000/api/admin/publications?isActive=true&category=693feae85e290d8730b3846d" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

#### Success Response:
```json
{
  "data": [
    {
      "_id": "publication_object_id",
      "contentType": "PUBLICATION",
      "accessType": "PAID",
      "name": "Complete History of Ancient Civilizations",
      "startDate": "2024-01-15T00:00:00.000Z",
      "categories": [
        {
          "_id": "693feae85e290d8730b3846d",
          "name": "History",
          "slug": "history"
        }
      ],
      "subCategories": [
        {
          "_id": "693feb7f5e290d8730b38472",
          "name": "Ancient History",
          "slug": "ancient-history"
        }
      ],
      "languages": [
        {
          "_id": "language_object_id",
          "name": "English",
          "code": "en"
        }
      ],
      "validities": [
        {
          "_id": "validity_object_id",
          "label": "1 Year",
          "durationInDays": 365
        }
      ],
      "thumbnailUrl": "https://res.cloudinary.com/your-account/image/upload/v1234567890/brainbuzz/publications/thumbnails/cover.jpg",
      "originalPrice": 1500,
      "discountPrice": 1200,
      "discountPercent": 20,
      "availableIn": "BOTH",
      "pricingNote": "Special offer for early buyers",
      "shortDescription": "Comprehensive guide to ancient civilizations",
      "detailedDescription": "Detailed exploration of ancient civilizations...",
      "authors": [
        {
          "_id": "author_object_id",
          "photoUrl": "https://res.cloudinary.com/your-account/image/upload/v1234567891/brainbuzz/publications/authors/author1.jpg",
          "name": "Dr. John Smith",
          "qualification": "PhD in Ancient History",
          "subject": "History"
        }
      ],
      "galleryImages": [
        "https://res.cloudinary.com/your-account/image/upload/v1234567892/brainbuzz/publications/images/gallery1.jpg",
        "https://res.cloudinary.com/your-account/image/upload/v1234567893/brainbuzz/publications/images/gallery2.jpg"
      ],
      "bookFileUrl": "https://res.cloudinary.com/your-account/raw/upload/v1234567894/brainbuzz/publications/books/publication-file.pdf",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### Get Publication by ID

**Endpoint**: `GET /api/admin/publications/:id`
**Method**: GET
**Authentication**: Required (Admin token)

#### Sample Request:
```bash
curl -X GET "http://localhost:5000/api/admin/publications/PUBLICATION_OBJECT_ID" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

#### Success Response:
```json
{
  "data": {
    "_id": "publication_object_id",
    "contentType": "PUBLICATION",
    "accessType": "PAID",
    "name": "Complete History of Ancient Civilizations",
    "startDate": "2024-01-15T00:00:00.000Z",
    "categories": [
      {
        "_id": "693feae85e290d8730b3846d",
        "name": "History",
        "slug": "history"
      }
    ],
    "subCategories": [
      {
        "_id": "693feb7f5e290d8730b38472",
        "name": "Ancient History",
        "slug": "ancient-history"
      }
    ],
    "languages": [
      {
        "_id": "language_object_id",
        "name": "English",
        "code": "en"
      }
    ],
    "validities": [
      {
        "_id": "validity_object_id",
        "label": "1 Year",
        "durationInDays": 365
      }
    ],
    "thumbnailUrl": "https://res.cloudinary.com/your-account/image/upload/v1234567890/brainbuzz/publications/thumbnails/cover.jpg",
    "originalPrice": 1500,
    "discountPrice": 1200,
    "discountPercent": 20,
    "availableIn": "BOTH",
    "pricingNote": "Special offer for early buyers",
    "shortDescription": "Comprehensive guide to ancient civilizations",
    "detailedDescription": "Detailed exploration of ancient civilizations...",
    "authors": [
      {
        "_id": "author_object_id",
        "photoUrl": "https://res.cloudinary.com/your-account/image/upload/v1234567891/brainbuzz/publications/authors/author1.jpg",
        "name": "Dr. John Smith",
        "qualification": "PhD in Ancient History",
        "subject": "History"
      }
    ],
    "galleryImages": [
      "https://res.cloudinary.com/your-account/image/upload/v1234567892/brainbuzz/publications/images/gallery1.jpg",
      "https://res.cloudinary.com/your-account/image/upload/v1234567893/brainbuzz/publications/images/gallery2.jpg"
    ],
    "bookFileUrl": "https://res.cloudinary.com/your-account/raw/upload/v1234567894/brainbuzz/publications/books/publication-file.pdf",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Update Publication

**Endpoint**: `PATCH /api/admin/publications/:id`
**Method**: PATCH
**Content-Type**: `multipart/form-data`
**Authentication**: Required (Admin token)

#### Updatable Fields
- `name` - Publication name
- `startDate` - Start date
- `originalPrice` - Original price (affects discountPercent calculation)
- `discountPrice` - Discount price (affects discountPercent calculation)
- `availableIn` - Available in format (PUBLICATION, E_BOOK, BOTH)
- `shortDescription` - Short description
- `detailedDescription` - Detailed description
- `isActive` - Active status
- `validities` - Validity IDs array
- `pricingNote` - Pricing note
// Note: `discountPercent` is automatically calculated based on originalPrice and discountPrice

#### Sample Request:
```bash
curl -X PATCH http://localhost:5000/api/admin/publications/PUBLICATION_OBJECT_ID \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "name=Updated History of Ancient Civilizations" \
  -F "originalPrice=1600" \
  -F "discountPrice=1300"
```

#### Success Response:
```
{
  "message": "Publication updated successfully",
  "data": {
    "_id": "publication_object_id",
    "contentType": "PUBLICATION",
    "accessType": "PAID",
    "name": "Updated History of Ancient Civilizations",
    "startDate": "2024-01-15T00:00:00.000Z",
    "categories": ["693feae85e290d8730b3846d"],
    "subCategories": ["693feb7f5e290d8730b38472"],
    "languages": ["language_object_id"],
    "validities": ["validity_object_id"],
    "thumbnailUrl": "https://res.cloudinary.com/your-account/image/upload/v1234567895/brainbuzz/publications/thumbnails/new-cover.jpg",
    "originalPrice": 1600,
    "discountPrice": 1300,
    "discountPercent": 18.75, // Automatically calculated: ((1600-1300)/1600)*100
    "availableIn": "BOTH",
    "pricingNote": "Special offer for early buyers",
    "shortDescription": "Comprehensive guide to ancient civilizations",
    "detailedDescription": "Detailed exploration of ancient civilizations...",
    "authors": [
      {
        "_id": "author_object_id",
        "photoUrl": "https://res.cloudinary.com/your-account/image/upload/v1234567891/brainbuzz/publications/authors/author1.jpg",
        "name": "Dr. John Smith",
        "qualification": "PhD in Ancient History",
        "subject": "History"
      }
    ],
    "galleryImages": [
      "https://res.cloudinary.com/your-account/image/upload/v1234567892/brainbuzz/publications/images/gallery1.jpg",
      "https://res.cloudinary.com/your-account/image/upload/v1234567893/brainbuzz/publications/images/gallery2.jpg"
    ],
    "bookFileUrl": "https://res.cloudinary.com/your-account/raw/upload/v1234567894/brainbuzz/publications/books/publication-file.pdf",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T11:45:00.000Z"
  }
}
```

### Update Publication Book File

**Endpoint**: `PUT /api/admin/publications/:id/book`
**Method**: PUT
**Content-Type**: `multipart/form-data`
**Authentication**: Required (Admin token)

#### Required Fields
- `bookFile` - New book file (PDF/document)

#### Sample Request:
```bash
curl -X PUT http://localhost:5000/api/admin/publications/PUBLICATION_OBJECT_ID/book \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "bookFile=@/path/to/new-publication-file.pdf"
```

#### Success Response:
```json
{
  "message": "Book updated successfully",
  "data": {
    "_id": "publication_object_id",
    "contentType": "PUBLICATION",
    "accessType": "PAID",
    "name": "Complete History of Ancient Civilizations",
    "startDate": "2024-01-15T00:00:00.000Z",
    "categories": ["693feae85e290d8730b3846d"],
    "subCategories": ["693feb7f5e290d8730b38472"],
    "languages": ["language_object_id"],
    "validities": ["validity_object_id"],
    "thumbnailUrl": "https://res.cloudinary.com/your-account/image/upload/v1234567890/brainbuzz/publications/thumbnails/cover.jpg",
    "originalPrice": 1500,
    "discountPrice": 1200,
    "discountPercent": 20,
    "availableIn": "BOTH",
    "pricingNote": "Special offer for early buyers",
    "shortDescription": "Comprehensive guide to ancient civilizations",
    "detailedDescription": "Detailed exploration of ancient civilizations...",
    "authors": [
      {
        "_id": "author_object_id",
        "photoUrl": "https://res.cloudinary.com/your-account/image/upload/v1234567891/brainbuzz/publications/authors/author1.jpg",
        "name": "Dr. John Smith",
        "qualification": "PhD in Ancient History",
        "subject": "History"
      }
    ],
    "galleryImages": [
      "https://res.cloudinary.com/your-account/image/upload/v1234567892/brainbuzz/publications/images/gallery1.jpg",
      "https://res.cloudinary.com/your-account/image/upload/v1234567893/brainbuzz/publications/images/gallery2.jpg"
    ],
    "bookFileUrl": "https://res.cloudinary.com/your-account/raw/upload/v1234567898/brainbuzz/publications/books/new-publication-file.pdf",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T12:00:00.000Z"
  }
}
```

### Update Publication Thumbnail

**Endpoint**: `PUT /api/admin/publications/:id/thumbnail`
**Method**: PUT
**Content-Type**: `multipart/form-data`
**Authentication**: Required (Admin token)

#### Required Fields
- `thumbnail` - New thumbnail image

#### Sample Request:
```bash
curl -X PUT http://localhost:5000/api/admin/publications/PUBLICATION_OBJECT_ID/thumbnail \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "thumbnail=@/path/to/new-thumbnail.jpg"
```

#### Success Response:
```json
{
  "message": "Thumbnail updated successfully",
  "data": {
    "_id": "publication_object_id",
    "contentType": "PUBLICATION",
    "accessType": "PAID",
    "name": "Complete History of Ancient Civilizations",
    "startDate": "2024-01-15T00:00:00.000Z",
    "categories": ["693feae85e290d8730b3846d"],
    "subCategories": ["693feb7f5e290d8730b38472"],
    "languages": ["language_object_id"],
    "validities": ["validity_object_id"],
    "thumbnailUrl": "https://res.cloudinary.com/your-account/image/upload/v1234567899/brainbuzz/publications/thumbnails/new-thumbnail.jpg",
    "originalPrice": 1500,
    "discountPrice": 1200,
    "discountPercent": 20,
    "availableIn": "BOTH",
    "pricingNote": "Special offer for early buyers",
    "shortDescription": "Comprehensive guide to ancient civilizations",
    "detailedDescription": "Detailed exploration of ancient civilizations...",
    "authors": [
      {
        "_id": "author_object_id",
        "photoUrl": "https://res.cloudinary.com/your-account/image/upload/v1234567891/brainbuzz/publications/authors/author1.jpg",
        "name": "Dr. John Smith",
        "qualification": "PhD in Ancient History",
        "subject": "History"
      }
    ],
    "galleryImages": [
      "https://res.cloudinary.com/your-account/image/upload/v1234567892/brainbuzz/publications/images/gallery1.jpg",
      "https://res.cloudinary.com/your-account/image/upload/v1234567893/brainbuzz/publications/images/gallery2.jpg"
    ],
    "bookFileUrl": "https://res.cloudinary.com/your-account/raw/upload/v1234567894/brainbuzz/publications/books/publication-file.pdf",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T12:05:00.000Z"
  }
}
```

### Update Publication Categories

**Endpoint**: `PUT /api/admin/publications/:id/categories`
**Method**: PUT
**Content-Type**: `application/json`
**Authentication**: Required (Admin token)

#### Updatable Fields
- `categories` - Array of category IDs
- `subCategories` - Array of subcategory IDs

#### Sample Request:
```bash
curl -X PUT http://localhost:5000/api/admin/publications/PUBLICATION_OBJECT_ID/categories \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"categories":["new_category_id"],"subCategories":["new_subcategory_id"]}'
```

#### Success Response:
```json
{
  "message": "Categories updated successfully",
  "data": {
    "_id": "publication_object_id",
    "contentType": "PUBLICATION",
    "accessType": "PAID",
    "name": "Complete History of Ancient Civilizations",
    "startDate": "2024-01-15T00:00:00.000Z",
    "categories": ["new_category_id"],
    "subCategories": ["new_subcategory_id"],
    "languages": ["language_object_id"],
    "validities": ["validity_object_id"],
    "thumbnailUrl": "https://res.cloudinary.com/your-account/image/upload/v1234567890/brainbuzz/publications/thumbnails/cover.jpg",
    "originalPrice": 1500,
    "discountPrice": 1200,
    "discountPercent": 20,
    "availableIn": "BOTH",
    "pricingNote": "Special offer for early buyers",
    "shortDescription": "Comprehensive guide to ancient civilizations",
    "detailedDescription": "Detailed exploration of ancient civilizations...",
    "authors": [
      {
        "_id": "author_object_id",
        "photoUrl": "https://res.cloudinary.com/your-account/image/upload/v1234567891/brainbuzz/publications/authors/author1.jpg",
        "name": "Dr. John Smith",
        "qualification": "PhD in Ancient History",
        "subject": "History"
      }
    ],
    "galleryImages": [
      "https://res.cloudinary.com/your-account/image/upload/v1234567892/brainbuzz/publications/images/gallery1.jpg",
      "https://res.cloudinary.com/your-account/image/upload/v1234567893/brainbuzz/publications/images/gallery2.jpg"
    ],
    "bookFileUrl": "https://res.cloudinary.com/your-account/raw/upload/v1234567894/brainbuzz/publications/books/publication-file.pdf",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T12:10:00.000Z"
  }
}
```

### Add Author to Publication

**Endpoint**: `POST /api/admin/publications/:id/authors`
**Method**: POST
**Content-Type**: `multipart/form-data`
**Authentication**: Required (Admin token)

#### Required Fields
- `name` - Author name
- `qualification` - Author qualification
- `subject` - Author subject

#### Optional File Fields
- `authorImage` - Author profile picture

#### Sample Request:
```bash
curl -X POST http://localhost:5000/api/admin/publications/PUBLICATION_OBJECT_ID/authors \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "name=Dr. Jane Doe" \
  -F "qualification=PhD in Modern History" \
  -F "subject=History" \
  -F "authorImage=@/path/to/author2.jpg"
```

#### Success Response:
```json
{
  "message": "Author added successfully",
  "data": {
    "_id": "publication_object_id",
    "contentType": "PUBLICATION",
    "accessType": "PAID",
    "name": "Complete History of Ancient Civilizations",
    "startDate": "2024-01-15T00:00:00.000Z",
    "categories": ["693feae85e290d8730b3846d"],
    "subCategories": ["693feb7f5e290d8730b38472"],
    "languages": ["language_object_id"],
    "validities": ["validity_object_id"],
    "thumbnailUrl": "https://res.cloudinary.com/your-account/image/upload/v1234567890/brainbuzz/publications/thumbnails/cover.jpg",
    "originalPrice": 1500,
    "discountPrice": 1200,
    "discountPercent": 20,
    "availableIn": "BOTH",
    "pricingNote": "Special offer for early buyers",
    "shortDescription": "Comprehensive guide to ancient civilizations",
    "detailedDescription": "Detailed exploration of ancient civilizations...",
    "authors": [
      {
        "_id": "author_object_id",
        "photoUrl": "https://res.cloudinary.com/your-account/image/upload/v1234567891/brainbuzz/publications/authors/author1.jpg",
        "name": "Dr. John Smith",
        "qualification": "PhD in Ancient History",
        "subject": "History"
      },
      {
        "_id": "new_author_object_id",
        "photoUrl": "https://res.cloudinary.com/your-account/image/upload/v1234567900/brainbuzz/publications/authors/author2.jpg",
        "name": "Dr. Jane Doe",
        "qualification": "PhD in Modern History",
        "subject": "History"
      }
    ],
    "galleryImages": [
      "https://res.cloudinary.com/your-account/image/upload/v1234567892/brainbuzz/publications/images/gallery1.jpg",
      "https://res.cloudinary.com/your-account/image/upload/v1234567893/brainbuzz/publications/images/gallery2.jpg"
    ],
    "bookFileUrl": "https://res.cloudinary.com/your-account/raw/upload/v1234567894/brainbuzz/publications/books/publication-file.pdf",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T12:15:00.000Z"
  }
}
```

### Update Publication Author

**Endpoint**: `PUT /api/admin/publications/:id/authors/:authorId`
**Method**: PUT
**Content-Type**: `multipart/form-data`
**Authentication**: Required (Admin token)

#### Updatable Fields
- `name` - Author name
- `qualification` - Author qualification
- `subject` - Author subject

#### Optional File Fields
- `authorImage` - New author profile picture

#### Sample Request:
```bash
curl -X PUT http://localhost:5000/api/admin/publications/PUBLICATION_OBJECT_ID/authors/AUTHOR_OBJECT_ID \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "name=Dr. Jane Smith" \
  -F "qualification=PhD in World History" \
  -F "subject=History" \
  -F "authorImage=@/path/to/new-author-image.jpg"
```

#### Success Response:
```json
{
  "message": "Author updated successfully",
  "data": {
    "_id": "publication_object_id",
    "contentType": "PUBLICATION",
    "accessType": "PAID",
    "name": "Complete History of Ancient Civilizations",
    "startDate": "2024-01-15T00:00:00.000Z",
    "categories": ["693feae85e290d8730b3846d"],
    "subCategories": ["693feb7f5e290d8730b38472"],
    "languages": ["language_object_id"],
    "validities": ["validity_object_id"],
    "thumbnailUrl": "https://res.cloudinary.com/your-account/image/upload/v1234567890/brainbuzz/publications/thumbnails/cover.jpg",
    "originalPrice": 1500,
    "discountPrice": 1200,
    "discountPercent": 20,
    "availableIn": "BOTH",
    "pricingNote": "Special offer for early buyers",
    "shortDescription": "Comprehensive guide to ancient civilizations",
    "detailedDescription": "Detailed exploration of ancient civilizations...",
    "authors": [
      {
        "_id": "author_object_id",
        "photoUrl": "https://res.cloudinary.com/your-account/image/upload/v1234567891/brainbuzz/publications/authors/author1.jpg",
        "name": "Dr. John Smith",
        "qualification": "PhD in Ancient History",
        "subject": "History"
      },
      {
        "_id": "updated_author_object_id",
        "photoUrl": "https://res.cloudinary.com/your-account/image/upload/v1234567901/brainbuzz/publications/authors/new-author-image.jpg",
        "name": "Dr. Jane Smith",
        "qualification": "PhD in World History",
        "subject": "History"
      }
    ],
    "galleryImages": [
      "https://res.cloudinary.com/your-account/image/upload/v1234567892/brainbuzz/publications/images/gallery1.jpg",
      "https://res.cloudinary.com/your-account/image/upload/v1234567893/brainbuzz/publications/images/gallery2.jpg"
    ],
    "bookFileUrl": "https://res.cloudinary.com/your-account/raw/upload/v1234567894/brainbuzz/publications/books/publication-file.pdf",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T12:20:00.000Z"
  }
}
```

### Delete Publication Author

**Endpoint**: `DELETE /api/admin/publications/:id/authors/:authorId`
**Method**: DELETE
**Authentication**: Required (Admin token)

#### Sample Request:
```bash
curl -X DELETE http://localhost:5000/api/admin/publications/PUBLICATION_OBJECT_ID/authors/AUTHOR_OBJECT_ID \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

#### Success Response:
```json
{
  "message": "Author removed successfully",
  "data": {
    "_id": "publication_object_id",
    "contentType": "PUBLICATION",
    "accessType": "PAID",
    "name": "Complete History of Ancient Civilizations",
    "startDate": "2024-01-15T00:00:00.000Z",
    "categories": ["693feae85e290d8730b3846d"],
    "subCategories": ["693feb7f5e290d8730b38472"],
    "languages": ["language_object_id"],
    "validities": ["validity_object_id"],
    "thumbnailUrl": "https://res.cloudinary.com/your-account/image/upload/v1234567890/brainbuzz/publications/thumbnails/cover.jpg",
    "originalPrice": 1500,
    "discountPrice": 1200,
    "discountPercent": 20,
    "availableIn": "BOTH",
    "pricingNote": "Special offer for early buyers",
    "shortDescription": "Comprehensive guide to ancient civilizations",
    "detailedDescription": "Detailed exploration of ancient civilizations...",
    "authors": [
      {
        "_id": "author_object_id",
        "photoUrl": "https://res.cloudinary.com/your-account/image/upload/v1234567891/brainbuzz/publications/authors/author1.jpg",
        "name": "Dr. John Smith",
        "qualification": "PhD in Ancient History",
        "subject": "History"
      }
    ],
    "galleryImages": [
      "https://res.cloudinary.com/your-account/image/upload/v1234567892/brainbuzz/publications/images/gallery1.jpg",
      "https://res.cloudinary.com/your-account/image/upload/v1234567893/brainbuzz/publications/images/gallery2.jpg"
    ],
    "bookFileUrl": "https://res.cloudinary.com/your-account/raw/upload/v1234567894/brainbuzz/publications/books/publication-file.pdf",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T12:25:00.000Z"
  }
}
```

### Add Image to Publication Gallery

**Endpoint**: `POST /api/admin/publications/:id/images`
**Method**: POST
**Content-Type**: `multipart/form-data`
**Authentication**: Required (Admin token)

#### Required Fields
- `image` - Image file to add to gallery

#### Sample Request:
```bash
curl -X POST http://localhost:5000/api/admin/publications/PUBLICATION_OBJECT_ID/images \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "image=@/path/to/additional-image.jpg"
```

#### Success Response:
```json
{
  "message": "Image added successfully",
  "data": {
    "_id": "publication_object_id",
    "contentType": "PUBLICATION",
    "accessType": "PAID",
    "name": "Complete History of Ancient Civilizations",
    "startDate": "2024-01-15T00:00:00.000Z",
    "categories": ["693feae85e290d8730b3846d"],
    "subCategories": ["693feb7f5e290d8730b38472"],
    "languages": ["language_object_id"],
    "validities": ["validity_object_id"],
    "thumbnailUrl": "https://res.cloudinary.com/your-account/image/upload/v1234567890/brainbuzz/publications/thumbnails/cover.jpg",
    "originalPrice": 1500,
    "discountPrice": 1200,
    "discountPercent": 20,
    "availableIn": "BOTH",
    "pricingNote": "Special offer for early buyers",
    "shortDescription": "Comprehensive guide to ancient civilizations",
    "detailedDescription": "Detailed exploration of ancient civilizations...",
    "authors": [
      {
        "_id": "author_object_id",
        "photoUrl": "https://res.cloudinary.com/your-account/image/upload/v1234567891/brainbuzz/publications/authors/author1.jpg",
        "name": "Dr. John Smith",
        "qualification": "PhD in Ancient History",
        "subject": "History"
      }
    ],
    "galleryImages": [
      "https://res.cloudinary.com/your-account/image/upload/v1234567892/brainbuzz/publications/images/gallery1.jpg",
      "https://res.cloudinary.com/your-account/image/upload/v1234567893/brainbuzz/publications/images/gallery2.jpg",
      "https://res.cloudinary.com/your-account/image/upload/v1234567902/brainbuzz/publications/images/additional-image.jpg"
    ],
    "bookFileUrl": "https://res.cloudinary.com/your-account/raw/upload/v1234567894/brainbuzz/publications/books/publication-file.pdf",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T12:30:00.000Z"
  }
}
```

### Remove Image from Publication Gallery

**Endpoint**: `DELETE /api/admin/publications/:id/images`
**Method**: DELETE
**Content-Type**: `application/json`
**Authentication**: Required (Admin token)

#### Required Fields
- `imageUrl` - URL of the image to remove

#### Sample Request:
```bash
curl -X DELETE http://localhost:5000/api/admin/publications/PUBLICATION_OBJECT_ID/images \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"imageUrl":"https://res.cloudinary.com/your-account/image/upload/v1234567892/brainbuzz/publications/images/gallery1.jpg"}'
```

#### Success Response:
```json
{
  "message": "Image removed successfully",
  "data": {
    "_id": "publication_object_id",
    "contentType": "PUBLICATION",
    "accessType": "PAID",
    "name": "Complete History of Ancient Civilizations",
    "startDate": "2024-01-15T00:00:00.000Z",
    "categories": ["693feae85e290d8730b3846d"],
    "subCategories": ["693feb7f5e290d8730b38472"],
    "languages": ["language_object_id"],
    "validities": ["validity_object_id"],
    "thumbnailUrl": "https://res.cloudinary.com/your-account/image/upload/v1234567890/brainbuzz/publications/thumbnails/cover.jpg",
    "originalPrice": 1500,
    "discountPrice": 1200,
    "discountPercent": 20,
    "availableIn": "BOTH",
    "pricingNote": "Special offer for early buyers",
    "shortDescription": "Comprehensive guide to ancient civilizations",
    "detailedDescription": "Detailed exploration of ancient civilizations...",
    "authors": [
      {
        "_id": "author_object_id",
        "photoUrl": "https://res.cloudinary.com/your-account/image/upload/v1234567891/brainbuzz/publications/authors/author1.jpg",
        "name": "Dr. John Smith",
        "qualification": "PhD in Ancient History",
        "subject": "History"
      }
    ],
    "galleryImages": [
      "https://res.cloudinary.com/your-account/image/upload/v1234567893/brainbuzz/publications/images/gallery2.jpg"
    ],
    "bookFileUrl": "https://res.cloudinary.com/your-account/raw/upload/v1234567894/brainbuzz/publications/books/publication-file.pdf",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T12:35:00.000Z"
  }
}
```

### Delete Publication

**Endpoint**: `DELETE /api/admin/publications/:id`
**Method**: DELETE
**Authentication**: Required (Admin token)

#### Sample Request:
```bash
curl -X DELETE http://localhost:5000/api/admin/publications/PUBLICATION_OBJECT_ID \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

#### Success Response:
```json
{
  "message": "Publication deleted successfully"
}
```

## E-Books API

### Create E-Book

**Endpoint**: `POST /api/admin/ebooks`
**Method**: POST
**Content-Type**: `multipart/form-data`
**Authentication**: Required (Admin token)

#### Required Fields
- `ebook` (JSON string) - Contains all e-book data

#### Optional File Fields
- `thumbnail` - E-Book cover image
- `bookFile` - Main e-book file (PDF/document)

#### E-Book Data Structure (in `ebook` field):
```json
{
  "name": "Complete Guide to Modern Economics",
  "startDate": "2024-01-20",
  "categoryIds": ["category_object_id"],
  "subCategoryIds": ["subcategory_object_id"],
  "languageIds": ["language_object_id"],
  "description": "Comprehensive guide covering all aspects of modern economics...",
  "isActive": true
}
```

#### Sample Request:
```bash
curl -X POST http://localhost:5000/api/admin/ebooks \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F 'ebook={"name":"Complete Guide to Modern Economics","startDate":"2024-01-20","categoryIds":["category_object_id"],"subCategoryIds":["subcategory_object_id"],"languageIds":["language_object_id"],"description":"Comprehensive guide covering all aspects of modern economics...","isActive":true}' \
  -F "thumbnail=@/path/to/ebook-cover.jpg" \
  -F "bookFile=@/path/to/ebook-file.pdf"
```

#### Success Response:
```json
{
  "message": "E-Book created successfully",
  "data": {
    "_id": "ebook_object_id",
    "contentType": "E_BOOK",
    "accessType": "FREE",
    "name": "Complete Guide to Modern Economics",
    "startDate": "2024-01-20T00:00:00.000Z",
    "categories": ["category_object_id"],
    "subCategories": ["subcategory_object_id"],
    "languages": ["language_object_id"],
    "thumbnailUrl": "https://res.cloudinary.com/your-account/image/upload/v1234567896/brainbuzz/ebooks/thumbnails/cover.jpg",
    "description": "Comprehensive guide covering all aspects of modern economics...",
    "bookFileUrl": "https://res.cloudinary.com/your-account/raw/upload/v1234567897/brainbuzz/ebooks/books/ebook-file.pdf",
    "isActive": true,
    "createdAt": "2024-01-20T10:30:00.000Z",
    "updatedAt": "2024-01-20T10:30:00.000Z"
  }
}
```

### Get E-Books

**Endpoint**: `GET /api/admin/ebooks`
**Method**: GET
**Authentication**: Required (Admin token)

#### Query Parameters (all optional):
- `category` - Filter by category ID
- `subCategory` - Filter by subcategory ID
- `language` - Filter by language ID
- `isActive` - Filter by active status (true/false)

#### Sample Request:
```bash
curl -X GET "http://localhost:5000/api/admin/ebooks?isActive=true&category=category_object_id" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

#### Success Response:
```json
{
  "data": [
    {
      "_id": "ebook_object_id",
      "contentType": "E_BOOK",
      "accessType": "FREE",
      "name": "Complete Guide to Modern Economics",
      "startDate": "2024-01-20T00:00:00.000Z",
      "categories": [
        {
          "_id": "category_object_id",
          "name": "Economics",
          "slug": "economics"
        }
      ],
      "subCategories": [
        {
          "_id": "subcategory_object_id",
          "name": "Modern Economics",
          "slug": "modern-economics"
        }
      ],
      "languages": [
        {
          "_id": "language_object_id",
          "name": "English",
          "code": "en"
        }
      ],
      "thumbnailUrl": "https://res.cloudinary.com/your-account/image/upload/v1234567896/brainbuzz/ebooks/thumbnails/cover.jpg",
      "description": "Comprehensive guide covering all aspects of modern economics...",
      "bookFileUrl": "https://res.cloudinary.com/your-account/raw/upload/v1234567897/brainbuzz/ebooks/books/ebook-file.pdf",
      "isActive": true,
      "createdAt": "2024-01-20T10:30:00.000Z",
      "updatedAt": "2024-01-20T10:30:00.000Z"
    }
  ]
}
```

### Get E-Book by ID

**Endpoint**: `GET /api/admin/ebooks/:id`
**Method**: GET
**Authentication**: Required (Admin token)

#### Sample Request:
```bash
curl -X GET "http://localhost:5000/api/admin/ebooks/EBOOK_OBJECT_ID" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

#### Success Response:
```json
{
  "data": {
    "_id": "ebook_object_id",
    "contentType": "E_BOOK",
    "accessType": "FREE",
    "name": "Complete Guide to Modern Economics",
    "startDate": "2024-01-20T00:00:00.000Z",
    "categories": [
      {
        "_id": "category_object_id",
        "name": "Economics",
        "slug": "economics"
      }
    ],
    "subCategories": [
      {
        "_id": "subcategory_object_id",
        "name": "Modern Economics",
        "slug": "modern-economics"
      }
    ],
    "languages": [
      {
        "_id": "language_object_id",
        "name": "English",
        "code": "en"
      }
    ],
    "thumbnailUrl": "https://res.cloudinary.com/your-account/image/upload/v1234567896/brainbuzz/ebooks/thumbnails/cover.jpg",
    "description": "Comprehensive guide covering all aspects of modern economics...",
    "bookFileUrl": "https://res.cloudinary.com/your-account/raw/upload/v1234567897/brainbuzz/ebooks/books/ebook-file.pdf",
    "isActive": true,
    "createdAt": "2024-01-20T10:30:00.000Z",
    "updatedAt": "2024-01-20T10:30:00.000Z"
  }
}
```

### Update E-Book

**Endpoint**: `PATCH /api/admin/ebooks/:id`
**Method**: PATCH
**Content-Type**: `multipart/form-data`
**Authentication**: Required (Admin token)

#### Updatable Fields
- `name` - E-Book name
- `startDate` - Start date
- `description` - Description
- `isActive` - Active status

#### Sample Request:
```bash
curl -X PATCH http://localhost:5000/api/admin/ebooks/EBOOK_OBJECT_ID \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "name=Updated Guide to Modern Economics" \
  -F "description=Updated comprehensive guide covering all aspects of modern economics..."
```

#### Success Response:
```json
{
  "message": "E-Book updated successfully",
  "data": {
    "_id": "ebook_object_id",
    "contentType": "E_BOOK",
    "accessType": "FREE",
    "name": "Updated Guide to Modern Economics",
    "startDate": "2024-01-20T00:00:00.000Z",
    "categories": ["category_object_id"],
    "subCategories": ["subcategory_object_id"],
    "languages": ["language_object_id"],
    "thumbnailUrl": "https://res.cloudinary.com/your-account/image/upload/v1234567896/brainbuzz/ebooks/thumbnails/cover.jpg",
    "description": "Updated comprehensive guide covering all aspects of modern economics...",
    "bookFileUrl": "https://res.cloudinary.com/your-account/raw/upload/v1234567897/brainbuzz/ebooks/books/ebook-file.pdf",
    "isActive": true,
    "createdAt": "2024-01-20T10:30:00.000Z",
    "updatedAt": "2024-01-20T11:45:00.000Z"
  }
}
```

### Update E-Book Book File

**Endpoint**: `PUT /api/admin/ebooks/:id/book`
**Method**: PUT
**Content-Type**: `multipart/form-data`
**Authentication**: Required (Admin token)

#### Required Fields
- `bookFile` - New book file (PDF/document)

#### Sample Request:
```bash
curl -X PUT http://localhost:5000/api/admin/ebooks/EBOOK_OBJECT_ID/book \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "bookFile=@/path/to/new-ebook-file.pdf"
```

#### Success Response:
```json
{
  "message": "Book updated successfully",
  "data": {
    "_id": "ebook_object_id",
    "contentType": "E_BOOK",
    "accessType": "FREE",
    "name": "Complete Guide to Modern Economics",
    "startDate": "2024-01-20T00:00:00.000Z",
    "categories": ["category_object_id"],
    "subCategories": ["subcategory_object_id"],
    "languages": ["language_object_id"],
    "thumbnailUrl": "https://res.cloudinary.com/your-account/image/upload/v1234567896/brainbuzz/ebooks/thumbnails/cover.jpg",
    "description": "Comprehensive guide covering all aspects of modern economics...",
    "bookFileUrl": "https://res.cloudinary.com/your-account/raw/upload/v1234567903/brainbuzz/ebooks/books/new-ebook-file.pdf",
    "isActive": true,
    "createdAt": "2024-01-20T10:30:00.000Z",
    "updatedAt": "2024-01-20T12:00:00.000Z"
  }
}
```

### Update E-Book Thumbnail

**Endpoint**: `PUT /api/admin/ebooks/:id/thumbnail`
**Method**: PUT
**Content-Type**: `multipart/form-data`
**Authentication**: Required (Admin token)

#### Required Fields
- `thumbnail` - New thumbnail image

#### Sample Request:
```bash
curl -X PUT http://localhost:5000/api/admin/ebooks/EBOOK_OBJECT_ID/thumbnail \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "thumbnail=@/path/to/new-ebook-thumbnail.jpg"
```

#### Success Response:
```json
{
  "message": "Thumbnail updated successfully",
  "data": {
    "_id": "ebook_object_id",
    "contentType": "E_BOOK",
    "accessType": "FREE",
    "name": "Complete Guide to Modern Economics",
    "startDate": "2024-01-20T00:00:00.000Z",
    "categories": ["category_object_id"],
    "subCategories": ["subcategory_object_id"],
    "languages": ["language_object_id"],
    "thumbnailUrl": "https://res.cloudinary.com/your-account/image/upload/v1234567904/brainbuzz/ebooks/thumbnails/new-ebook-thumbnail.jpg",
    "description": "Comprehensive guide covering all aspects of modern economics...",
    "bookFileUrl": "https://res.cloudinary.com/your-account/raw/upload/v1234567897/brainbuzz/ebooks/books/ebook-file.pdf",
    "isActive": true,
    "createdAt": "2024-01-20T10:30:00.000Z",
    "updatedAt": "2024-01-20T12:05:00.000Z"
  }
}
```

### Update E-Book Categories

**Endpoint**: `PUT /api/admin/ebooks/:id/categories`
**Method**: PUT
**Content-Type**: `application/json`
**Authentication**: Required (Admin token)

#### Updatable Fields
- `categories` - Array of category IDs
- `subCategories` - Array of subcategory IDs

#### Sample Request:
```bash
curl -X PUT http://localhost:5000/api/admin/ebooks/EBOOK_OBJECT_ID/categories \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"categories":["new_category_id"],"subCategories":["new_subcategory_id"]}'
```

#### Success Response:
```json
{
  "message": "Categories updated successfully",
  "data": {
    "_id": "ebook_object_id",
    "contentType": "E_BOOK",
    "accessType": "FREE",
    "name": "Complete Guide to Modern Economics",
    "startDate": "2024-01-20T00:00:00.000Z",
    "categories": ["new_category_id"],
    "subCategories": ["new_subcategory_id"],
    "languages": ["language_object_id"],
    "thumbnailUrl": "https://res.cloudinary.com/your-account/image/upload/v1234567896/brainbuzz/ebooks/thumbnails/cover.jpg",
    "description": "Comprehensive guide covering all aspects of modern economics...",
    "bookFileUrl": "https://res.cloudinary.com/your-account/raw/upload/v1234567897/brainbuzz/ebooks/books/ebook-file.pdf",
    "isActive": true,
    "createdAt": "2024-01-20T10:30:00.000Z",
    "updatedAt": "2024-01-20T12:10:00.000Z"
  }
}
```

### Delete E-Book

**Endpoint**: `DELETE /api/admin/ebooks/:id`
**Method**: DELETE
**Authentication**: Required (Admin token)

#### Sample Request:
```bash
curl -X DELETE http://localhost:5000/api/admin/ebooks/EBOOK_OBJECT_ID \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

#### Success Response:
```json
{
  "message": "E-Book deleted successfully"
}
```

## Content Type Validation

Both Publications and E-Books implement content type isolation:

1. **Publications** require categories and subcategories with `contentType: "PUBLICATION"`
2. **E-Books** require categories and subcategories with `contentType: "E_BOOK"`

Attempting to use categories or subcategories with mismatched content types will result in an error:
```json
{
  "message": "Server error",
  "error": "Category History does not match content type PUBLICATION"
}
```

Ensure you use the correct category and subcategory IDs that match the respective content types when creating or updating publications and e-books.

## AvailableIn Field Values

For Publications, the `availableIn` field accepts the following values:
- `"PUBLICATION"` - Only available as a physical publication
- `"E_BOOK"` - Only available as a digital e-book
- `"BOTH"` - Available in both physical and digital formats

## Key Improvements Made

### 1. Fixed Form Data Parsing
- Added `upload.none()` middleware to PATCH routes for both Publications and E-Books
- This ensures that form-data is properly parsed for update requests

### 2. Automatic Discount Calculation
- The backend now automatically calculates `discountPercent` based on `originalPrice` and `discountPrice`
- Removed `discountPercent` from client-requestable fields as it should be derived

### 3. Improved Error Handling
- Better validation and error messages for missing or invalid data
- More robust handling of partial updates
