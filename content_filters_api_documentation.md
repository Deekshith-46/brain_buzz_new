# Filter API Documentation

This document provides comprehensive details about all the filter APIs available in the Brain Buzz Web application. The filters follow a consistent pattern similar to the online courses filters, allowing users to filter content by categories and subcategories.

## Table of Contents
1. [Publication Filters](#publication-filters)
2. [EBook Filters](#ebook-filters)
3. [Daily Quiz Filters](#daily-quiz-filters)
4. [Previous Question Paper Filters](#previous-question-paper-filters)
5. [Test Series Filters](#test-series-filters)

---

## Publication Filters

### Admin Publication Filters

- **Endpoint**: `GET /api/admin/publications/filters/categories`
- **Authentication**: Required (Admin)
- **Description**: Get all publication categories (including inactive publications)
- **Query Parameters**:
  - `contentType` (optional): Filter by content type (defaults to PUBLICATION)

- **Endpoint**: `GET /api/admin/publications/filters/subcategories`
- **Authentication**: Required (Admin)
- **Description**: Get all publication subcategories (including inactive publications)
- **Query Parameters**:
  - `category`: Category ID to filter subcategories
  - `language` (optional): Language ID to filter
  - `lang` (optional): Language name or code to filter

### User Publication Filters



Publications now include price calculation similar to online courses:
- `originalPrice`: The original price of the publication
- `discountPrice`: The discount amount
- `finalPrice`: Calculated as `originalPrice - discountPrice`
- `hasPurchased`: Boolean indicating if the user has purchased this publication

### Get Publication Categories
- **Endpoint**: `GET /api/v1/filters/publications/categories`
- **Authentication**: Required
- **Description**: Fetches distinct categories for active publications
- **Query Parameters**:
  - `language` (optional): Filter by language ObjectId
  - `lang` (optional): Filter by language code or name (case insensitive)
- **Response**:
```json
{
  "data": [
    {
      "_id": "category_id",
      "name": "Category Name",
      "slug": "category-slug",
      "description": "Category description",
      "thumbnailUrl": "https://example.com/image.jpg"
    }
  ]
}
```

### Get Publication Subcategories
- **Endpoint**: `GET /api/v1/filters/publications/subcategories`
- **Authentication**: Required
- **Description**: Fetches distinct subcategories for active publications based on category and language
- **Query Parameters**:
  - `category` (required): Category ObjectId
  - `language` (optional): Filter by language ObjectId
  - `lang` (optional): Filter by language code or name (case insensitive)
- **Response**:
```json
{
  "data": [
    {
      "_id": "subcategory_id",
      "name": "Subcategory Name",
      "slug": "subcategory-slug",
      "description": "Subcategory description",
      "thumbnailUrl": "https://example.com/image.jpg"
    }
  ]
}
```

---

## EBook Filters

### Admin EBook Filters

- **Endpoint**: `GET /api/admin/ebooks/filters/categories`
- **Authentication**: Required (Admin)
- **Description**: Get all e-book categories (including inactive e-books)

- **Endpoint**: `GET /api/admin/ebooks/filters/subcategories`
- **Authentication**: Required (Admin)
- **Description**: Get all e-book subcategories (including inactive e-books)
- **Query Parameters**:
  - `category`: Category ID to filter subcategories
  - `language` (optional): Language ID to filter
  - `lang` (optional): Language name or code to filter

### User EBook Filters



### Get EBook Categories
- **Endpoint**: `GET /api/v1/filters/ebooks/categories`
- **Authentication**: Required
- **Description**: Fetches distinct categories for active e-books
- **Query Parameters**:
  - `language` (optional): Filter by language ObjectId
  - `lang` (optional): Filter by language code or name (case insensitive)
- **Response**:
```json
{
  "data": [
    {
      "_id": "category_id",
      "name": "Category Name",
      "slug": "category-slug",
      "description": "Category description",
      "thumbnailUrl": "https://example.com/image.jpg"
    }
  ]
}
```

### Get EBook Subcategories
- **Endpoint**: `GET /api/v1/filters/ebooks/subcategories`
- **Authentication**: Required
- **Description**: Fetches distinct subcategories for active e-books based on category and language
- **Query Parameters**:
  - `category` (required): Category ObjectId
  - `language` (optional): Filter by language ObjectId
  - `lang` (optional): Filter by language code or name (case insensitive)
- **Response**:
```json
{
  "data": [
    {
      "_id": "subcategory_id",
      "name": "Subcategory Name",
      "slug": "subcategory-slug",
      "description": "Subcategory description",
      "thumbnailUrl": "https://example.com/image.jpg"
    }
  ]
}
```

---

## Daily Quiz Filters

### Admin Daily Quiz Filters

- **Endpoint**: `GET /api/admin/daily-quizzes/filters/categories`
- **Authentication**: Required (Admin)
- **Description**: Get all daily quiz categories (including inactive quizzes)

- **Endpoint**: `GET /api/admin/daily-quizzes/filters/subcategories`
- **Authentication**: Required (Admin)
- **Description**: Get all daily quiz subcategories (including inactive quizzes)
- **Query Parameters**:
  - `category`: Category ID to filter subcategories
  - `language` (optional): Language ID to filter
  - `lang` (optional): Language name or code to filter

### User Daily Quiz Filters



### Get Daily Quiz Categories
- **Endpoint**: `GET /api/v1/filters/daily-quizzes/categories`
- **Authentication**: Required
- **Description**: Fetches distinct categories for active daily quizzes
- **Query Parameters**:
  - `language` (optional): Filter by language ObjectId
  - `lang` (optional): Filter by language code or name (case insensitive)
- **Response**:
```json
{
  "data": [
    {
      "_id": "category_id",
      "name": "Category Name",
      "slug": "category-slug",
      "description": "Category description",
      "thumbnailUrl": "https://example.com/image.jpg"
    }
  ]
}
```

### Get Daily Quiz Subcategories
- **Endpoint**: `GET /api/v1/filters/daily-quizzes/subcategories`
- **Authentication**: Required
- **Description**: Fetches distinct subcategories for active daily quizzes based on category and language
- **Query Parameters**:
  - `category` (required): Category ObjectId
  - `language` (optional): Filter by language ObjectId
  - `lang` (optional): Filter by language code or name (case insensitive)
- **Response**:
```json
{
  "data": [
    {
      "_id": "subcategory_id",
      "name": "Subcategory Name",
      "slug": "subcategory-slug",
      "description": "Subcategory description",
      "thumbnailUrl": "https://example.com/image.jpg"
    }
  ]
}
```

---

## Previous Question Paper Filters

### Admin PYQ Filters

- **Endpoint**: `GET /api/admin/previous-question-papers/filters/categories`
- **Authentication**: Required (Admin)
- **Description**: Get all PYQ categories (including inactive papers)

- **Endpoint**: `GET /api/admin/previous-question-papers/filters/subcategories`
- **Authentication**: Required (Admin)
- **Description**: Get all PYQ subcategories (including inactive papers)
- **Query Parameters**:
  - `category`: Category ID to filter subcategories

### User PYQ Filters



### Get Previous Question Paper Categories
- **Endpoint**: `GET /api/v1/filters/previous-question-papers/categories`
- **Authentication**: Required
- **Description**: Fetches distinct categories for active previous question papers
- **Query Parameters**: None
- **Response**:
```json
{
  "data": [
    {
      "_id": "category_id",
      "name": "Category Name",
      "slug": "category-slug",
      "description": "Category description",
      "thumbnailUrl": "https://example.com/image.jpg"
    }
  ]
}
```

### Get Previous Question Paper Subcategories
- **Endpoint**: `GET /api/v1/filters/previous-question-papers/subcategories`
- **Authentication**: Required
- **Description**: Fetches distinct subcategories for active previous question papers based on category
- **Query Parameters**:
  - `category` (required): Category ObjectId
- **Response**:
```json
{
  "data": [
    {
      "_id": "subcategory_id",
      "name": "Subcategory Name",
      "slug": "subcategory-slug",
      "description": "Subcategory description",
      "thumbnailUrl": "https://example.com/image.jpg"
    }
  ]
}
```

---

## Test Series Filters

### Admin Test Series Filters

- **Endpoint**: `GET /api/admin/test-series/filters/categories`
- **Authentication**: Required (Admin)
- **Description**: Get all test series categories (including inactive series)

- **Endpoint**: `GET /api/admin/test-series/filters/subcategories`
- **Authentication**: Required (Admin)
- **Description**: Get all test series subcategories (including inactive series)
- **Query Parameters**:
  - `category`: Category ID to filter subcategories
  - `language` (optional): Language ID to filter
  - `lang` (optional): Language name or code to filter

### User Test Series Filters



### Get Test Series Categories
- **Endpoint**: `GET /api/v1/filters/test-series/categories`
- **Authentication**: Required
- **Description**: Fetches distinct categories for active test series
- **Query Parameters**:
  - `language` (optional): Filter by language ObjectId
  - `lang` (optional): Filter by language code or name (case insensitive)
- **Response**:
```json
{
  "data": [
    {
      "_id": "category_id",
      "name": "Category Name",
      "slug": "category-slug",
      "description": "Category description",
      "thumbnailUrl": "https://example.com/image.jpg"
    }
  ]
}
```

### Get Test Series Subcategories
- **Endpoint**: `GET /api/v1/filters/test-series/subcategories`
- **Authentication**: Required
- **Description**: Fetches distinct subcategories for active test series based on category and language
- **Query Parameters**:
  - `category` (required): Category ObjectId
  - `language` (optional): Filter by language ObjectId
  - `lang` (optional): Filter by language code or name (case insensitive)
- **Response**:
```json
{
  "data": [
    {
      "_id": "subcategory_id",
      "name": "Subcategory Name",
      "slug": "subcategory-slug",
      "description": "Subcategory description",
      "thumbnailUrl": "https://example.com/image.jpg"
    }
  ]
}
```

---

## Common Error Responses

All filter endpoints return consistent error responses:

- **400 Bad Request**: Invalid query parameters (e.g., invalid language code)
- **401 Unauthorized**: Missing or invalid authentication token
- **500 Internal Server Error**: Server-side error

### Example Error Response:
```json
{
  "message": "Error message",
  "error": "Detailed error information"
}
```

## Implementation Notes

1. All endpoints require authentication via JWT token in the Authorization header
2. The filter endpoints follow the same pattern as online course filters
3. Categories and subcategories are extracted from active content only
4. Language filtering is supported for content types that have language associations
5. The system prevents duplicate category/subcategory entries in the response