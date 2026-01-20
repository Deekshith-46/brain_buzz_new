# Online Courses API Filters

This document provides a comprehensive guide to the filtering capabilities available in the Online Courses API. All filter endpoints require user authentication.

## Table of Contents
- [Overview](#overview)
- [Authenticated Filter Endpoints](#authenticated-filter-endpoints)
  - [Get Course Categories](#get-course-categories)
  - [Get Course Subcategories](#get-course-subcategories)
  - [List Courses with Filters](#list-courses-with-filters)
  - [Get Single Course Details](#get-single-course-details)
- [Filter Parameters](#filter-parameters)
- [Response Formats](#response-formats)
- [Access Control](#access-control)

## Overview

The Online Courses API provides robust filtering capabilities that allow clients to retrieve specific subsets of course data based on various criteria. The filtering system is designed to:

1. Present only relevant data to users based on course availability
2. Support dynamic filtering based on course attributes
3. Implement role-based access control for different user types
4. Optimize database queries for performance

## Authenticated Filter Endpoints

All filter endpoints require user authentication. Users must provide a valid JWT token in the Authorization header.

### User vs Admin Access Control

* **User**: Sees only active courses; subcategories update by selected language; first 2 classes free via dynamic `isFree` logic (`index < 2`); locked if not purchased.
* **Admin**: Views all courses regardless of status or language; no purchase/lock restrictions; full access to edit/play.

The system supports role-based course access with shared APIs and dynamic access calculation (no `isFree` stored in DB; access fields computed dynamically per role).

### Get Course Categories

**Endpoint:** `GET /api/v1/courses/filters/categories`

Retrieves all categories that have at least one active online course.

**Query Parameters:**
- `contentType` (optional): Filter by content type. Default is "ONLINE_COURSE".

**Example Request:**
```bash
curl "https://brain-buzz-web.vercel.app/api/v1/courses/filters/categories" \
  -H "Authorization: Bearer USER_JWT_TOKEN"
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "cat_upsc",
      "name": "UPSC",
      "slug": "upsc",
      "description": "UPSC Civil Services Examination preparation",
      "thumbnailUrl": "https://res.cloudinary.com/.../category_thumbnail.jpg"
    },
    {
      "_id": "cat_ssc",
      "name": "SSC",
      "slug": "ssc",
      "description": "SSC Combined Graduate Level preparation",
      "thumbnailUrl": "https://res.cloudinary.com/.../category_thumbnail.jpg"
    }
  ]
}
```

**Business Logic:**
- Only returns categories that have at least one active course
- Prevents showing empty categories to users
- Populates category details (name, slug, description, thumbnailUrl)

### Get Course Subcategories

**Endpoint:** `GET /api/v1/courses/filters/subcategories`

Retrieves all subcategories that have at least one active online course for the specified category and language.

**Query Parameters:**
- `category` (required): The category ID
- `language` (optional): The language ID (e.g., `694006c46abada1001df7f29`)
- `lang` (optional): Language code or name as an alternative to language ID (e.g., `en`, `te`, `English`, `Telugu`)

**Example Requests:**

Using language ID:
```bash
curl "https://brain-buzz-web.vercel.app/api/v1/courses/filters/subcategories?category=cat_upsc&language=lang_english_id" \
  -H "Authorization: Bearer USER_JWT_TOKEN"
```

Using language code:
```bash
curl "https://brain-buzz-web.vercel.app/api/v1/courses/filters/subcategories?category=cat_upsc&lang=en" \
  -H "Authorization: Bearer USER_JWT_TOKEN"
```

Using language name:
```bash
curl "https://brain-buzz-web.vercel.app/api/v1/courses/filters/subcategories?category=cat_upsc&lang=English" \
  -H "Authorization: Bearer USER_JWT_TOKEN"
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "sub_ias",
      "name": "IAS",
      "slug": "ias",
      "description": "Indian Administrative Service preparation",
      "thumbnailUrl": "https://res.cloudinary.com/.../subcategory_thumbnail.jpg"
    },
    {
      "_id": "sub_ips",
      "name": "IPS",
      "slug": "ips",
      "description": "Indian Police Service preparation",
      "thumbnailUrl": "https://res.cloudinary.com/.../subcategory_thumbnail.jpg"
    }
  ]
}
```

**Business Logic:**
- Only returns subcategories that have courses matching the category and language filters
- If no language is specified, defaults to showing subcategories with courses in any language
- Prevents showing empty subcategories to users
- Populates subcategory details (name, slug, description, thumbnailUrl)

## Authenticated Filter Endpoints

These endpoints can be used with or without authentication. When authenticated, additional user-specific information is provided.

### List Courses with Filters

**Endpoint:** `GET /api/v1/courses`

Retrieves a list of active courses based on provided filters.

**Query Parameters:**
- `contentType` (optional): Filter by content type. Default is "ONLINE_COURSE".
- `category` (optional): Filter by category ID
- `subCategory` (optional): Filter by subcategory ID
- `language` (optional): Filter by language ID
- `lang` (optional): Language code or name (alternative to language ID)

**Example Request:**
```bash
curl "https://brain-buzz-web.vercel.app/api/v1/courses?category=cat_upsc&subCategory=sub_ias&language=lang_english"
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "course_123",
      "name": "Complete UPSC IAS Foundation Course",
      "originalPrice": 10000,
      "finalPrice": 8000,
      "thumbnailUrl": "https://res.cloudinary.com/.../thumbnail.jpg",
      "hasPurchased": false,
      "categories": [
        {
          "_id": "cat_upsc",
          "name": "UPSC",
          "slug": "upsc",
          "description": "UPSC Civil Services Examination preparation",
          "thumbnailUrl": "https://res.cloudinary.com/.../category_thumbnail.jpg"
        }
      ],
      "subCategories": [
        {
          "_id": "sub_ias",
          "name": "IAS",
          "slug": "ias",
          "description": "Indian Administrative Service preparation",
          "thumbnailUrl": "https://res.cloudinary.com/.../subcategory_thumbnail.jpg"
        }
      ],
      "languages": [
        {
          "_id": "lang_english",
          "name": "English",
          "code": "en"
        }
      ]
    }
  ]
}
```

**Business Logic:**
- Only returns active courses
- Calculates final price (originalPrice - discountPrice)
- Adds purchase status for authenticated users
- Populates related entities (categories with name, slug, description, thumbnailUrl; subcategories with name, slug, description, thumbnailUrl; languages)

### Get Single Course Details

**Endpoint:** `GET /api/v1/courses/:courseId`

Retrieves detailed information about a specific course, including access-controlled class information.

**Path Parameters:**
- `courseId`: The ID of the course to retrieve

**Example Request:**
```bash
curl "https://brain-buzz-web.vercel.app/api/v1/courses/course_123"
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "_id": "course_123",
    "name": "Complete UPSC IAS Foundation Course",
    "originalPrice": 10000,
    "finalPrice": 8000,
    "hasPurchased": false,
    "classes": [
      {
        "_id": "class_1",
        "title": "Introduction to Indian Polity",
        "topic": "Polity",
        "order": 1,
        "thumbnailUrl": "https://res.cloudinary.com/.../class1_thumb.jpg",
        "isFree": true,
        "isLocked": false,
        "hasAccess": true
      },
      {
        "_id": "class_2",
        "title": "Indian Constitution",
        "topic": "Polity",
        "order": 2,
        "thumbnailUrl": "https://res.cloudinary.com/.../class2_thumb.jpg",
        "isFree": true,
        "isLocked": false,
        "hasAccess": true
      },
      {
        "_id": "class_3",
        "title": "Parliament and State Legislatures",
        "topic": "Polity",
        "order": 3,
        "thumbnailUrl": "https://res.cloudinary.com/.../class3_thumb.jpg",
        "isFree": false,
        "isLocked": true,
        "hasAccess": false
      }
    ]
  }
}
```

**Business Logic:**
- Only returns active courses
- Processes classes with access control:
  - First 2 classes: Free access (isFree=true, isLocked=false)
  - Purchased classes: Unlocked (isLocked=false)
  - Other classes: Locked (isLocked=true)
- Calculates final price
- Adds purchase status for authenticated users

## Filter Parameters

### Content Type
- **Parameter:** `contentType`
- **Default:** `ONLINE_COURSE`
- **Description:** Filter courses by content type

### Category
- **Parameter:** `category`
- **Type:** String (ID)
- **Description:** Filter courses by category ID

### Subcategory
- **Parameter:** `subCategory`
- **Type:** String (ID)
- **Description:** Filter courses by subcategory ID

### Language
- **Parameter:** `language`
- **Type:** String (ID)
- **Description:** Filter courses by language ID

### Language Code/Name
- **Parameter:** `lang`
- **Type:** String
- **Description:** Alternative to language ID; can be language code (e.g., "en") or name (e.g., "English")

## Response Formats

### Category/Subcategory Response
```json
{
  "success": true,
  "data": [
    {
      "_id": "identifier",
      "name": "Display Name",
      "slug": "url-friendly-name",
      "description": "Description of the category/subcategory",
      "thumbnailUrl": "https://res.cloudinary.com/.../thumbnail.jpg"
    }
  ]
}
```

### Course List Response
```json
{
  "success": true,
  "data": [
    {
      "_id": "course_id",
      "name": "Course Name",
      "originalPrice": 10000,
      "finalPrice": 8000,
      "thumbnailUrl": "image_url",
      "hasPurchased": false,
      "categories": [
        {
          "_id": "category_id",
          "name": "Category Name",
          "slug": "category-slug",
          "description": "Category description",
          "thumbnailUrl": "https://res.cloudinary.com/.../category_thumbnail.jpg"
        }
      ],
      "subCategories": [
        {
          "_id": "subcategory_id",
          "name": "Subcategory Name",
          "slug": "subcategory-slug",
          "description": "Subcategory description",
          "thumbnailUrl": "https://res.cloudinary.com/.../subcategory_thumbnail.jpg"
        }
      ],
      "languages": [...]
    }
  ]
}
```

### Course Detail Response
```json
{
  "success": true,
  "data": {
    "_id": "course_id",
    "name": "Course Name",
    "originalPrice": 10000,
    "finalPrice": 8000,
    "hasPurchased": false,
    "categories": [
      {
        "_id": "category_id",
        "name": "Category Name",
        "slug": "category-slug",
        "description": "Category description",
        "thumbnailUrl": "https://res.cloudinary.com/.../category_thumbnail.jpg"
      }
    ],
    "subCategories": [
      {
        "_id": "subcategory_id",
        "name": "Subcategory Name",
        "slug": "subcategory-slug",
        "description": "Subcategory description",
        "thumbnailUrl": "https://res.cloudinary.com/.../subcategory_thumbnail.jpg"
      }
    ],
    "classes": [
      {
        "_id": "class_id",
        "title": "Class Title",
        "topic": "Class Topic",
        "order": 1,
        "thumbnailUrl": "image_url",
        "isFree": true,
        "isLocked": false,
        "hasAccess": true
      }
    ]
  }
}
```

## Testing Order (Postman)

### USER TESTING

1. `GET /api/v1/courses/filters/categories`
2. `GET /api/v1/courses/filters/subcategories?category=ID&language=en`
3. `GET /api/v1/courses?category=ID&subCategory=ID&language=te`
4. `GET /api/v1/courses/:courseId`
5. `POST /api/payment/order/create` (for purchase)
6. `GET /api/v1/courses/:courseId` again

## ADMIN FILTERS

### ADMIN TESTING

1. `GET /api/admin/courses/filters/categories`
2. `GET /api/admin/courses/filters/subcategories?category=ID&language=en`
3. `GET /api/admin/courses/filters/categories?lang=hindi`

### ADMIN TESTING

1. `GET /api/admin/courses` (categories are part of course listing)
2. `GET /api/admin/courses?category=ID`
3. `GET /api/admin/courses/:courseId`

## Access Control

### For Unauthenticated Users
- Can access all public filter endpoints
- See first 2 classes of any course as free
- Cannot access locked content

### For Authenticated Users
- Can access all public filter endpoints
- Access control based on purchase status:
  - **Non-purchased users:** First 2 classes free, rest locked
  - **Purchased users:** All classes unlocked
- Purchase status is indicated in responses

### For Admin Users
- Access all courses regardless of status (active/inactive/draft)
- All classes are unlocked
- No access restrictions on content

### Dynamic Access Calculation
The system uses dynamic access calculation rather than storing access flags in the database:
- No `isFree` field stored permanently in database
- Calculated at runtime using `index < 2` logic
- Access fields computed dynamically per role
- Easy to change business rules later (e.g., "first 3 free" instead of "first 2 free")

## PUBLICATION ADMIN FILTERS

### ADMIN TESTING

1. `GET /api/admin/publications/filters/categories`
2. `GET /api/admin/publications/filters/subcategories?category=ID&language=en`
3. `GET /api/admin/publications/filters/categories?lang=hindi`

## EBOOK ADMIN FILTERS

### ADMIN TESTING

1. `GET /api/admin/ebooks/filters/categories`
2. `GET /api/admin/ebooks/filters/subcategories?category=ID&language=en`
3. `GET /api/admin/ebooks/filters/categories?lang=telugu`

## DAILY QUIZ ADMIN FILTERS

### ADMIN TESTING

1. `GET /api/admin/daily-quizzes/filters/categories`
2. `GET /api/admin/daily-quizzes/filters/subcategories?category=ID&language=en`
3. `GET /api/admin/daily-quizzes/filters/categories?lang=english`

## PREVIOUS QUESTION PAPER ADMIN FILTERS

### ADMIN TESTING

1. `GET /api/admin/previous-question-papers/filters/categories`
2. `GET /api/admin/previous-question-papers/filters/subcategories?category=ID`

## TEST SERIES ADMIN FILTERS

### ADMIN TESTING

1. `GET /api/admin/test-series/filters/categories`
2. `GET /api/admin/test-series/filters/subcategories?category=ID&language=en`
3. `GET /api/admin/test-series/filters/categories?lang=tamil`