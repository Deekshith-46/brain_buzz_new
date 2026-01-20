# Complete Current Affairs API Testing Guide

This document provides comprehensive step-by-step instructions for testing all Current Affairs APIs, including what to pass in the request body for each endpoint.

## Overview

The Current Affairs system supports multiple types of current affairs content and provides dedicated category management for organizing content. The system includes:

1. **Seven types of Current Affairs content**:
   - Latest Current Affairs
   - Monthly Current Affairs
   - Sports Current Affairs
   - State Current Affairs
   - International Current Affairs
   - Politics Current Affairs
   - Local Current Affairs

2. **Dedicated Current Affairs Category Management**:
   - Create, read, update, and delete categories specifically for Current Affairs
   - Soft delete functionality to preserve data integrity
   - Custom ordering for UI display
   - Thumbnail support for visual representation

3. **Filter Helper APIs** for organizing and retrieving content

> **Important Design Decisions**:
> - **Date Handling**: Each Current Affairs type has specific date requirements enforced by backend validation
>   - Latest, Sports, State, International, Politics, Local: Require `date` field
>   - Monthly: Requires `month` field (with optional `date` auto-set to 1st)
> - **Language Strategy**: One language per content entry (best practice for clarity)
> - **Category Separation**: Current Affairs Categories are separate from general categories

Each type of current affair has its own set of CRUD endpoints, and all endpoints require admin authentication.

## Table of Contents
1. [Authentication](#authentication)
2. [Current Affairs Categories](#current-affairs-categories)
3. [Latest Current Affairs](#latest-current-affairs)
4. [Monthly Current Affairs](#monthly-current-affairs)
5. [Sports Current Affairs](#sports-current-affairs)
6. [State Current Affairs](#state-current-affairs)
7. [International Current Affairs](#international-current-affairs)
8. [Politics Current Affairs](#politics-current-affairs)
9. [Local Current Affairs](#local-current-affairs)
10. [Filter Helper APIs](#filter-helper-apis)

## Authentication

All Current Affairs APIs require admin authentication. You need to include a valid JWT token in the Authorization header:

```
Authorization: Bearer <your_admin_token>
```

### Base URLs

- **Current Affairs Content APIs**: `/api/admin/current-affairs/*`
- **Current Affairs Category APIs**: `/api/admin/current-affairs-categories/*`

## Current Affairs Categories

The Current Affairs Category APIs provide dedicated management for categories specifically used in Current Affairs content. These categories are separate from general content categories and provide additional features like custom ordering and soft delete.

> **Important Implementation Notes**:
> - **Date Requirements**: Different Current Affairs types have specific date requirements:
>   - Latest, Sports, State, International, Politics, Local: `date` field is **required**
>   - Monthly: `month` field is **required**, `date` is optional (auto-set to 1st)
> - **Language Best Practice**: Only **one language** should be selected per content entry to avoid confusion
> - **Validation**: Backend validates these rules to ensure data consistency

### 1. Create Current Affairs Category

**Endpoint:** `POST /api/admin/current-affairs-categories`

**Content-Type:** `multipart/form-data`

**Request Body:**
```
Form Fields:
- thumbnail: [Image file] (optional)
- name: "Category Name" (required)
- description: "Category Description" (optional)
- order: 1 (optional, default: 0)
- isActive: true (optional, default: true)
```

**Response:**
```json
{
  "message": "Current Affairs Category created successfully",
  "data": {
    "_id": "categoryId",
    "name": "Category Name",
    "slug": "category-name",
    "description": "Category Description",
    "order": 1,
    "isActive": true,
    "thumbnailUrl": "https://res.cloudinary.com/...",
    "createdAt": "2023-12-01T10:00:00.000Z",
    "updatedAt": "2023-12-01T10:00:00.000Z"
  }
}
```

### 2. Get All Current Affairs Categories

**Endpoint:** `GET /api/admin/current-affairs-categories?[isActive=true]`

**Query Parameters (optional):**
- `isActive`: true/false (filter by active status)

**Response:**
```json
{
  "data": [
    {
      "_id": "categoryId",
      "name": "Category Name",
      "slug": "category-name",
      "description": "Category Description",
      "order": 1,
      "isActive": true,
      "thumbnailUrl": "https://res.cloudinary.com/...",
      "createdAt": "2023-12-01T10:00:00.000Z",
      "updatedAt": "2023-12-01T10:00:00.000Z"
    }
  ]
}
```

### 3. Get Current Affairs Category By ID

**Endpoint:** `GET /api/admin/current-affairs-categories/:id`

**Response:**
```json
{
  "data": {
    "_id": "categoryId",
    "name": "Category Name",
    "slug": "category-name",
    "description": "Category Description",
    "order": 1,
    "isActive": true,
    "thumbnailUrl": "https://res.cloudinary.com/...",
    "createdAt": "2023-12-01T10:00:00.000Z",
    "updatedAt": "2023-12-01T10:00:00.000Z"
  }
}
```

### 4. Update Current Affairs Category

**Endpoint:** `PUT /api/admin/current-affairs-categories/:id`

**Content-Type:** `multipart/form-data`

**Request Body:**
```
Form Fields:
- thumbnail: [Image file] (optional)
- name: "Updated Category Name" (optional)
- description: "Updated Category Description" (optional)
- order: 2 (optional)
- isActive: false (optional)
```

**Response:**
```json
{
  "message": "Current Affairs Category updated successfully",
  "data": {
    "_id": "categoryId",
    "name": "Updated Category Name",
    "slug": "updated-category-name",
    "description": "Updated Category Description",
    "order": 2,
    "isActive": false,
    "thumbnailUrl": "https://res.cloudinary.com/...",
    "createdAt": "2023-12-01T10:00:00.000Z",
    "updatedAt": "2023-12-01T11:00:00.000Z"
  }
}
```

### 5. Delete Current Affairs Category (Soft Delete)

**Endpoint:** `DELETE /api/admin/current-affairs-categories/:id`

**Response:**
```json
{
  "message": "Current Affairs Category deactivated successfully"
}
```

### 6. Toggle Current Affairs Category Status

**Endpoint:** `PATCH /api/admin/current-affairs-categories/:id/toggle-status`

**Request Body:**
```json
{
  "isActive": true
}
```

**Response:**
```json
{
  "message": "Current Affairs Category activated successfully",
  "data": {
    "_id": "categoryId",
    "name": "Category Name",
    "slug": "category-name",
    "description": "Category Description",
    "order": 1,
    "isActive": true,
    "thumbnailUrl": "https://res.cloudinary.com/...",
    "createdAt": "2023-12-01T10:00:00.000Z",
    "updatedAt": "2023-12-01T11:00:00.000Z"
  }
}
```

## Latest Current Affairs

### 1. Create Latest Current Affair

**Endpoint:** `POST /api/admin/current-affairs/latest`

**Content-Type:** `multipart/form-data`

**Request Body:**
```
Form Fields:
- thumbnail: [Image file]
- affair: {
  "date": "2023-12-01",
  "categoryIds": ["categoryId1", "categoryId2"],
  "subCategoryIds": ["subCategoryId1", "subCategoryId2"],
  "languageIds": ["languageId1", "languageId2"],
  "heading": "Important News Headline",
  "description": "Brief description of the news",
  "fullContent": "Complete detailed content of the news article",
  "isActive": true
}
```

**Response:**
```json
{
  "message": "Latest current affair created successfully",
  "data": {
    "_id": "affairId",
    "date": "2023-12-01T00:00:00.000Z",
    "categories": [...],
    "subCategories": [...],
    "languages": [...],
    "heading": "Important News Headline",
    "thumbnailUrl": "https://res.cloudinary.com/...",
    "description": "Brief description of the news",
    "fullContent": "Complete detailed content of the news article",
    "isActive": true,
    "createdAt": "2023-12-01T10:00:00.000Z",
    "updatedAt": "2023-12-01T10:00:00.000Z",
    "__v": 0,
    "affairType": "LatestCurrentAffair"
  }
}
```

### 2. Get All Latest Current Affairs

**Endpoint:** `GET /api/admin/current-affairs/latest?[filters]`

**Query Parameters (optional):**
- `category`: categoryId
- `subCategory`: subCategoryId
- `language`: languageId
- `date`: 2023-12-01
- `isActive`: true/false

**Response:**
```json
{
  "data": [
    {
      "_id": "affairId",
      "date": "2023-12-01T00:00:00.000Z",
      "categories": [...],
      "subCategories": [...],
      "languages": [...],
      "heading": "Important News Headline",
      "thumbnailUrl": "https://res.cloudinary.com/...",
      "description": "Brief description of the news",
      "fullContent": "Complete detailed content of the news article",
      "isActive": true,
      "createdAt": "2023-12-01T10:00:00.000Z",
      "updatedAt": "2023-12-01T10:00:00.000Z",
      "__v": 0,
      "affairType": "LatestCurrentAffair"
    }
  ]
}
```

### 3. Get Latest Current Affair By ID

**Endpoint:** `GET /api/admin/current-affairs/latest/:id`

**Response:**
```json
{
  "data": {
    "_id": "affairId",
    "date": "2023-12-01T00:00:00.000Z",
    "categories": [...],
    "subCategories": [...],
    "languages": [...],
    "heading": "Important News Headline",
    "thumbnailUrl": "https://res.cloudinary.com/...",
    "description": "Brief description of the news",
    "fullContent": "Complete detailed content of the news article",
    "isActive": true,
    "createdAt": "2023-12-01T10:00:00.000Z",
    "updatedAt": "2023-12-01T10:00:00.000Z",
    "__v": 0,
    "affairType": "LatestCurrentAffair"
  }
}
```

### 4. Update Latest Current Affair

**Endpoint:** `PUT /api/admin/current-affairs/latest/:id`

**Content-Type:** `multipart/form-data`

**Request Body:**
```
Form Fields:
- thumbnail: [Image file] (optional)
- affair: {
  "date": "2023-12-01",
  "categoryIds": ["categoryId1", "categoryId2"],
  "subCategoryIds": ["subCategoryId1", "subCategoryId2"],
  "languageIds": ["languageId1", "languageId2"],
  "heading": "Updated News Headline",
  "description": "Updated brief description",
  "fullContent": "Updated complete content",
  "isActive": true
}
```

**Response:**
```json
{
  "message": "Latest current affair updated successfully",
  "data": {
    "_id": "affairId",
    "date": "2023-12-01T00:00:00.000Z",
    "categories": [...],
    "subCategories": [...],
    "languages": [...],
    "heading": "Updated News Headline",
    "thumbnailUrl": "https://res.cloudinary.com/...",
    "description": "Updated brief description",
    "fullContent": "Updated complete content",
    "isActive": true,
    "createdAt": "2023-12-01T10:00:00.000Z",
    "updatedAt": "2023-12-01T11:00:00.000Z",
    "__v": 0,
    "affairType": "LatestCurrentAffair"
  }
}
```

### 5. Delete Latest Current Affair

**Endpoint:** `DELETE /api/admin/current-affairs/latest/:id`

**Response:**
```json
{
  "message": "Latest current affair deleted successfully"
}
```

## Monthly Current Affairs

### 1. Create Monthly Current Affair

**Endpoint:** `POST /api/admin/current-affairs/monthly`

**Content-Type:** `multipart/form-data`

**Request Body:**
```
Form Fields:
- thumbnail: [Image file]
- affair: {
  "date": "2023-12-01",
  "month": "DECEMBER",
  "categoryIds": ["categoryId1", "categoryId2"],
  "subCategoryIds": ["subCategoryId1", "subCategoryId2"],
  "languageIds": ["languageId1", "languageId2"],
  "name": "December 2023 Current Affairs",
  "description": "Comprehensive review of December events",
  "fullContent": "Detailed content covering all important events",
  "isActive": true
}
```

**Valid Months:** JANUARY, FEBRUARY, MARCH, APRIL, MAY, JUNE, JULY, AUGUST, SEPTEMBER, OCTOBER, NOVEMBER, DECEMBER

**Response:**
```json
{
  "message": "Monthly current affair created successfully",
  "data": {
    "_id": "affairId",
    "date": "2023-12-01T00:00:00.000Z",
    "month": "DECEMBER",
    "categories": [...],
    "subCategories": [...],
    "languages": [...],
    "name": "December 2023 Current Affairs",
    "thumbnailUrl": "https://res.cloudinary.com/...",
    "description": "Comprehensive review of December events",
    "fullContent": "Detailed content covering all important events",
    "isActive": true,
    "createdAt": "2023-12-01T10:00:00.000Z",
    "updatedAt": "2023-12-01T10:00:00.000Z",
    "__v": 0,
    "affairType": "MonthlyCurrentAffair"
  }
}
```

### 2. Get All Monthly Current Affairs

**Endpoint:** `GET /api/admin/current-affairs/monthly?[filters]`

**Query Parameters (optional):**
- `category`: categoryId
- `subCategory`: subCategoryId
- `language`: languageId
- `month`: DECEMBER
- `isActive`: true/false

**Response:**
```json
{
  "data": [
    {
      "_id": "affairId",
      "date": "2023-12-01T00:00:00.000Z",
      "month": "DECEMBER",
      "categories": [...],
      "subCategories": [...],
      "languages": [...],
      "name": "December 2023 Current Affairs",
      "thumbnailUrl": "https://res.cloudinary.com/...",
      "description": "Comprehensive review of December events",
      "fullContent": "Detailed content covering all important events",
      "isActive": true,
      "createdAt": "2023-12-01T10:00:00.000Z",
      "updatedAt": "2023-12-01T10:00:00.000Z",
      "__v": 0,
      "affairType": "MonthlyCurrentAffair"
    }
  ]
}
```

### 3. Get Monthly Current Affair By ID

**Endpoint:** `GET /api/admin/current-affairs/monthly/:id`

**Response:**
```json
{
  "data": {
    "_id": "affairId",
    "date": "2023-12-01T00:00:00.000Z",
    "month": "DECEMBER",
    "categories": [...],
    "subCategories": [...],
    "languages": [...],
    "name": "December 2023 Current Affairs",
    "thumbnailUrl": "https://res.cloudinary.com/...",
    "description": "Comprehensive review of December events",
    "fullContent": "Detailed content covering all important events",
    "isActive": true,
    "createdAt": "2023-12-01T10:00:00.000Z",
    "updatedAt": "2023-12-01T10:00:00.000Z",
    "__v": 0,
    "affairType": "MonthlyCurrentAffair"
  }
}
```

### 4. Update Monthly Current Affair

**Endpoint:** `PUT /api/admin/current-affairs/monthly/:id`

**Content-Type:** `multipart/form-data`

**Request Body:**
```
Form Fields:
- thumbnail: [Image file] (optional)
- affair: {
  "date": "2023-12-01",
  "month": "DECEMBER",
  "categoryIds": ["categoryId1", "categoryId2"],
  "subCategoryIds": ["subCategoryId1", "subCategoryId2"],
  "languageIds": ["languageId1", "languageId2"],
  "name": "Updated December 2023 Current Affairs",
  "description": "Updated comprehensive review",
  "fullContent": "Updated detailed content",
  "isActive": true
}
```

**Response:**
```json
{
  "message": "Monthly current affair updated successfully",
  "data": {
    "_id": "affairId",
    "date": "2023-12-01T00:00:00.000Z",
    "month": "DECEMBER",
    "categories": [...],
    "subCategories": [...],
    "languages": [...],
    "name": "Updated December 2023 Current Affairs",
    "thumbnailUrl": "https://res.cloudinary.com/...",
    "description": "Updated comprehensive review",
    "fullContent": "Updated detailed content",
    "isActive": true,
    "createdAt": "2023-12-01T10:00:00.000Z",
    "updatedAt": "2023-12-01T11:00:00.000Z",
    "__v": 0,
    "affairType": "MonthlyCurrentAffair"
  }
}
```

### 5. Delete Monthly Current Affair

**Endpoint:** `DELETE /api/admin/current-affairs/monthly/:id`

**Response:**
```json
{
  "message": "Monthly current affair deleted successfully"
}
```

## Sports Current Affairs

### 1. Create Sports Current Affair

**Endpoint:** `POST /api/admin/current-affairs/sports`

**Content-Type:** `multipart/form-data`

**Request Body:**
```
Form Fields:
- thumbnail: [Image file]
- affair: {
  "date": "2023-12-01",
  "categoryIds": ["categoryId1", "categoryId2"],
  "subCategoryIds": ["subCategoryId1", "subCategoryId2"],
  "languageIds": ["languageId1", "languageId2"],
  "sport": "Cricket",
  "event": "World Cup Finals",
  "description": "Summary of the finals match",
  "fullContent": "Detailed match report including scores, highlights, and player performances",
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Sports current affair created successfully",
  "data": {
    "_id": "affairId",
    "date": "2023-12-01T00:00:00.000Z",
    "categories": [...],
    "subCategories": [...],
    "languages": [...],
    "sport": "Cricket",
    "event": "World Cup Finals",
    "thumbnailUrl": "https://res.cloudinary.com/...",
    "description": "Summary of the finals match",
    "fullContent": "Detailed match report including scores, highlights, and player performances",
    "isActive": true,
    "contentType": "CURRENT_AFFAIRS",
    "createdAt": "2023-12-01T10:00:00.000Z",
    "updatedAt": "2023-12-01T10:00:00.000Z",
    "__v": 0,
    "affairType": "SportsCurrentAffair"
  }
}
```

### 2. Get All Sports Current Affairs

**Endpoint:** `GET /api/admin/current-affairs/sports?[filters]`

**Query Parameters (optional):**
- `sport`: Cricket
- `event`: World Cup Finals
- `date`: 2023-12-01

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "affairId",
      "date": "2023-12-01T00:00:00.000Z",
      "categories": [...],
      "subCategories": [...],
      "languages": [...],
      "sport": "Cricket",
      "event": "World Cup Finals",
      "thumbnailUrl": "https://res.cloudinary.com/...",
      "description": "Summary of the finals match",
      "fullContent": "Detailed match report including scores, highlights, and player performances",
      "isActive": true,
      "contentType": "CURRENT_AFFAIRS",
      "createdAt": "2023-12-01T10:00:00.000Z",
      "updatedAt": "2023-12-01T10:00:00.000Z",
      "__v": 0,
      "affairType": "SportsCurrentAffair"
    }
  ]
}
```

### 3. Get Sports Current Affair By ID

**Endpoint:** `GET /api/admin/current-affairs/sports/:id`

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "affairId",
    "date": "2023-12-01T00:00:00.000Z",
    "categories": [...],
    "subCategories": [...],
    "languages": [...],
    "sport": "Cricket",
    "event": "World Cup Finals",
    "thumbnailUrl": "https://res.cloudinary.com/...",
    "description": "Summary of the finals match",
    "fullContent": "Detailed match report including scores, highlights, and player performances",
    "isActive": true,
    "contentType": "CURRENT_AFFAIRS",
    "createdAt": "2023-12-01T10:00:00.000Z",
    "updatedAt": "2023-12-01T10:00:00.000Z",
    "__v": 0,
    "affairType": "SportsCurrentAffair"
  }
}
```

### 4. Update Sports Current Affair

**Endpoint:** `PUT /api/admin/current-affairs/sports/:id`

**Content-Type:** `multipart/form-data`

**Request Body:**
```
Form Fields:
- thumbnail: [Image file] (optional)
- affair: {
  "date": "2023-12-01",
  "categoryIds": ["categoryId1", "categoryId2"],
  "subCategoryIds": ["subCategoryId1", "subCategoryId2"],
  "languageIds": ["languageId1", "languageId2"],
  "sport": "Cricket",
  "event": "Updated World Cup Finals Report",
  "description": "Updated summary of the finals match",
  "fullContent": "Updated detailed match report",
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Sports current affair updated successfully",
  "data": {
    "_id": "affairId",
    "date": "2023-12-01T00:00:00.000Z",
    "categories": [...],
    "subCategories": [...],
    "languages": [...],
    "sport": "Cricket",
    "event": "Updated World Cup Finals Report",
    "thumbnailUrl": "https://res.cloudinary.com/...",
    "description": "Updated summary of the finals match",
    "fullContent": "Updated detailed match report",
    "isActive": true,
    "contentType": "CURRENT_AFFAIRS",
    "createdAt": "2023-12-01T10:00:00.000Z",
    "updatedAt": "2023-12-01T11:00:00.000Z",
    "__v": 0,
    "affairType": "SportsCurrentAffair"
  }
}
```

### 5. Delete Sports Current Affair

**Endpoint:** `DELETE /api/admin/current-affairs/sports/:id`

**Response:**
```json
{
  "success": true,
  "message": "Sports current affair deleted successfully"
}
```

## State Current Affairs

### 1. Create State Current Affair

**Endpoint:** `POST /api/admin/current-affairs/state`

**Content-Type:** `multipart/form-data`

**Request Body:**
```
Form Fields:
- thumbnail: [Image file]
- affair: {
  "date": "2023-12-01",
  "categoryIds": ["categoryId1", "categoryId2"],
  "subCategoryIds": ["subCategoryId1", "subCategoryId2"],
  "languageIds": ["languageId1", "languageId2"],
  "state": "Telangana",
  "name": "State Legislative Assembly Elections",
  "description": "Overview of election results",
  "fullContent": "Detailed analysis of voting patterns and candidate performances",
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "State current affair created successfully",
  "data": {
    "_id": "affairId",
    "date": "2023-12-01T00:00:00.000Z",
    "categories": [...],
    "subCategories": [...],
    "languages": [...],
    "state": "Telangana",
    "name": "State Legislative Assembly Elections",
    "thumbnailUrl": "https://res.cloudinary.com/...",
    "description": "Overview of election results",
    "fullContent": "Detailed analysis of voting patterns and candidate performances",
    "isActive": true,
    "affairType": "StateCurrentAffair",
    "createdAt": "2023-12-01T10:00:00.000Z",
    "updatedAt": "2023-12-01T10:00:00.000Z",
    "__v": 0
  }
}
```

### 2. Get All State Current Affairs

**Endpoint:** `GET /api/admin/current-affairs/state?[filters]`

**Query Parameters (optional):**
- `state`: Telangana
- `event`: (any event name)
- `date`: 2023-12-01

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "affairId",
      "date": "2023-12-01T00:00:00.000Z",
      "categories": [...],
      "subCategories": [...],
      "languages": [...],
      "state": "Telangana",
      "name": "State Legislative Assembly Elections",
      "thumbnailUrl": "https://res.cloudinary.com/...",
      "description": "Overview of election results",
      "fullContent": "Detailed analysis of voting patterns and candidate performances",
      "isActive": true,
      "affairType": "StateCurrentAffair",
      "createdAt": "2023-12-01T10:00:00.000Z",
      "updatedAt": "2023-12-01T10:00:00.000Z",
      "__v": 0
    }
  ]
}
```

### 3. Get State Current Affair By ID

**Endpoint:** `GET /api/admin/current-affairs/state/:id`

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "affairId",
    "date": "2023-12-01T00:00:00.000Z",
    "categories": [...],
    "subCategories": [...],
    "languages": [...],
    "state": "Telangana",
    "name": "State Legislative Assembly Elections",
    "thumbnailUrl": "https://res.cloudinary.com/...",
    "description": "Overview of election results",
    "fullContent": "Detailed analysis of voting patterns and candidate performances",
    "isActive": true,
    "affairType": "StateCurrentAffair",
    "createdAt": "2023-12-01T10:00:00.000Z",
    "updatedAt": "2023-12-01T10:00:00.000Z",
    "__v": 0
  }
}
```

### 4. Update State Current Affair

**Endpoint:** `PUT /api/admin/current-affairs/state/:id`

**Content-Type:** `multipart/form-data`

**Request Body:**
```
Form Fields:
- thumbnail: [Image file] (optional)
- affair: {
  "date": "2023-12-01",
  "categoryIds": ["categoryId1", "categoryId2"],
  "subCategoryIds": ["subCategoryId1", "subCategoryId2"],
  "languageIds": ["languageId1", "languageId2"],
  "state": "Telangana",
  "name": "Updated State Legislative Assembly Elections Report",
  "description": "Updated overview of election results",
  "fullContent": "Updated detailed analysis",
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "State current affair updated successfully",
  "data": {
    "_id": "affairId",
    "date": "2023-12-01T00:00:00.000Z",
    "categories": [...],
    "subCategories": [...],
    "languages": [...],
    "state": "Telangana",
    "name": "Updated State Legislative Assembly Elections Report",
    "thumbnailUrl": "https://res.cloudinary.com/...",
    "description": "Updated overview of election results",
    "fullContent": "Updated detailed analysis",
    "isActive": true,
    "affairType": "StateCurrentAffair",
    "createdAt": "2023-12-01T10:00:00.000Z",
    "updatedAt": "2023-12-01T11:00:00.000Z",
    "__v": 0
  }
}
```

### 5. Delete State Current Affair

**Endpoint:** `DELETE /api/admin/current-affairs/state/:id`

**Response:**
```json
{
  "success": true,
  "message": "State current affair deleted successfully"
}
```

## International Current Affairs

### 1. Create International Current Affair

**Endpoint:** `POST /api/admin/current-affairs/international`

**Content-Type:** `multipart/form-data`

**Request Body:**
```
Form Fields:
- thumbnail: [Image file]
- affair: {
  "date": "2023-12-01",
  "categoryIds": ["categoryId1", "categoryId2"],
  "subCategoryIds": ["subCategoryId1", "subCategoryId2"],
  "languageIds": ["languageId1", "languageId2"],
  "region": "Europe",
  "name": "EU Climate Agreement Signing",
  "description": "Summary of the historic climate agreement",
  "fullContent": "Detailed account of negotiations and commitments made by EU member countries",
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "International current affair created successfully",
  "data": {
    "_id": "affairId",
    "date": "2023-12-01T00:00:00.000Z",
    "categories": [...],
    "subCategories": [...],
    "languages": [...],
    "region": "Europe",
    "name": "EU Climate Agreement Signing",
    "thumbnailUrl": "https://res.cloudinary.com/...",
    "description": "Summary of the historic climate agreement",
    "fullContent": "Detailed account of negotiations and commitments made by EU member countries",
    "isActive": true,
    "affairType": "InternationalCurrentAffair",
    "createdAt": "2023-12-01T10:00:00.000Z",
    "updatedAt": "2023-12-01T10:00:00.000Z",
    "__v": 0
  }
}
```

### 2. Get All International Current Affairs

**Endpoint:** `GET /api/admin/current-affairs/international?[page=1&limit=10]`

**Query Parameters (optional):**
- `page`: 1 (default)
- `limit`: 10 (default)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "affairId",
      "date": "2023-12-01T00:00:00.000Z",
      "categories": [...],
      "subCategories": [...],
      "languages": [...],
      "region": "Europe",
      "name": "EU Climate Agreement Signing",
      "thumbnailUrl": "https://res.cloudinary.com/...",
      "description": "Summary of the historic climate agreement",
      "fullContent": "Detailed account of negotiations and commitments made by EU member countries",
      "isActive": true,
      "affairType": "InternationalCurrentAffair",
      "createdAt": "2023-12-01T10:00:00.000Z",
      "updatedAt": "2023-12-01T10:00:00.000Z",
      "__v": 0
    }
  ],
  "totalPages": 1,
  "currentPage": 1
}
```

### 3. Get International Current Affair By ID

**Endpoint:** `GET /api/admin/current-affairs/international/:id`

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "affairId",
    "date": "2023-12-01T00:00:00.000Z",
    "categories": [...],
    "subCategories": [...],
    "languages": [...],
    "region": "Europe",
    "name": "EU Climate Agreement Signing",
    "thumbnailUrl": "https://res.cloudinary.com/...",
    "description": "Summary of the historic climate agreement",
    "fullContent": "Detailed account of negotiations and commitments made by EU member countries",
    "isActive": true,
    "affairType": "InternationalCurrentAffair",
    "createdAt": "2023-12-01T10:00:00.000Z",
    "updatedAt": "2023-12-01T10:00:00.000Z",
    "__v": 0
  }
}
```

### 4. Update International Current Affair

**Endpoint:** `PUT /api/admin/current-affairs/international/:id`

**Content-Type:** `multipart/form-data`

**Request Body:**
```
Form Fields:
- thumbnail: [Image file] (optional)
- affair: {
  "date": "2023-12-01",
  "categoryIds": ["categoryId1", "categoryId2"],
  "subCategoryIds": ["subCategoryId1", "subCategoryId2"],
  "languageIds": ["languageId1", "languageId2"],
  "region": "Europe",
  "name": "Updated EU Climate Agreement Report",
  "description": "Updated summary of the agreement",
  "fullContent": "Updated detailed account",
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "International current affair updated successfully",
  "data": {
    "_id": "affairId",
    "date": "2023-12-01T00:00:00.000Z",
    "categories": [...],
    "subCategories": [...],
    "languages": [...],
    "region": "Europe",
    "name": "Updated EU Climate Agreement Report",
    "thumbnailUrl": "https://res.cloudinary.com/...",
    "description": "Updated summary of the agreement",
    "fullContent": "Updated detailed account",
    "isActive": true,
    "affairType": "InternationalCurrentAffair",
    "createdAt": "2023-12-01T10:00:00.000Z",
    "updatedAt": "2023-12-01T11:00:00.000Z",
    "__v": 0
  }
}
```

### 5. Delete International Current Affair

**Endpoint:** `DELETE /api/admin/current-affairs/international/:id`

**Response:**
```json
{
  "success": true,
  "message": "International current affair deleted successfully"
}
```

## Politics Current Affairs

### 1. Create Politics Current Affair

**Endpoint:** `POST /api/admin/current-affairs/politics`

**Content-Type:** `multipart/form-data`

**Request Body:**
```
Form Fields:
- thumbnail: [Image file]
- affair: {
  "date": "2023-12-01",
  "categoryIds": ["categoryId1", "categoryId2"],
  "subCategoryIds": ["subCategoryId1", "subCategoryId2"],
  "languageIds": ["languageId1", "languageId2"],
  "politicalParty": "Congress Party",
  "name": "New Education Policy Announcement",
  "description": "Summary of policy changes",
  "fullContent": "Detailed breakdown of proposed reforms and their implications",
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Politics current affair created successfully",
  "data": {
    "_id": "affairId",
    "date": "2023-12-01T00:00:00.000Z",
    "categories": [...],
    "subCategories": [...],
    "languages": [...],
    "politicalParty": "Congress Party",
    "name": "New Education Policy Announcement",
    "thumbnailUrl": "https://res.cloudinary.com/...",
    "description": "Summary of policy changes",
    "fullContent": "Detailed breakdown of proposed reforms and their implications",
    "isActive": true,
    "affairType": "PoliticsCurrentAffair",
    "createdAt": "2023-12-01T10:00:00.000Z",
    "updatedAt": "2023-12-01T10:00:00.000Z",
    "__v": 0
  }
}
```

### 2. Get All Politics Current Affairs

**Endpoint:** `GET /api/admin/current-affairs/politics?[page=1&limit=10]`

**Query Parameters (optional):**
- `page`: 1 (default)
- `limit`: 10 (default)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "affairId",
      "date": "2023-12-01T00:00:00.000Z",
      "categories": [...],
      "subCategories": [...],
      "languages": [...],
      "politicalParty": "Congress Party",
      "name": "New Education Policy Announcement",
      "thumbnailUrl": "https://res.cloudinary.com/...",
      "description": "Summary of policy changes",
      "fullContent": "Detailed breakdown of proposed reforms and their implications",
      "isActive": true,
      "affairType": "PoliticsCurrentAffair",
      "createdAt": "2023-12-01T10:00:00.000Z",
      "updatedAt": "2023-12-01T10:00:00.000Z",
      "__v": 0
    }
  ],
  "totalPages": 1,
  "currentPage": 1
}
```

### 3.  

**Endpoint:** `GET /api/admin/current-affairs/politics/:id`

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "affairId",
    "date": "2023-12-01T00:00:00.000Z",
    "categories": [...],
    "subCategories": [...],
    "languages": [...],
    "politicalParty": "Congress Party",
    "name": "New Education Policy Announcement",
    "thumbnailUrl": "https://res.cloudinary.com/...",
    "description": "Summary of policy changes",
    "fullContent": "Detailed breakdown of proposed reforms and their implications",
    "isActive": true,
    "affairType": "PoliticsCurrentAffair",
    "createdAt": "2023-12-01T10:00:00.000Z",
    "updatedAt": "2023-12-01T10:00:00.000Z",
    "__v": 0
  }
}
```

### 4. Update Politics Current Affair

**Endpoint:** `PUT /api/admin/current-affairs/politics/:id`

**Content-Type:** `multipart/form-data`

**Request Body:**
```
Form Fields:
- thumbnail: [Image file] (optional)
- affair: {
  "date": "2023-12-01",
  "categoryIds": ["categoryId1", "categoryId2"],
  "subCategoryIds": ["subCategoryId1", "subCategoryId2"],
  "languageIds": ["languageId1", "languageId2"],
  "politicalParty": "Congress Party",
  "name": "Updated Education Policy Report",
  "description": "Updated summary of policy changes",
  "fullContent": "Updated detailed breakdown",
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Politics current affair updated successfully",
  "data": {
    "_id": "affairId",
    "date": "2023-12-01T00:00:00.000Z",
    "categories": [...],
    "subCategories": [...],
    "languages": [...],
    "politicalParty": "Congress Party",
    "name": "Updated Education Policy Report",
    "thumbnailUrl": "https://res.cloudinary.com/...",
    "description": "Updated summary of policy changes",
    "fullContent": "Updated detailed breakdown",
    "isActive": true,
    "affairType": "PoliticsCurrentAffair",
    "createdAt": "2023-12-01T10:00:00.000Z",
    "updatedAt": "2023-12-01T11:00:00.000Z",
    "__v": 0
  }
}
```

### 5. Delete Politics Current Affair

**Endpoint:** `DELETE /api/admin/current-affairs/politics/:id`

**Response:**
```json
{
  "success": true,
  "message": "Politics current affair deleted successfully"
}
```

## Local Current Affairs

### 1. Create Local Current Affair

**Endpoint:** `POST /api/admin/current-affairs/local`

**Content-Type:** `multipart/form-data`

**Request Body:**
```
Form Fields:
- thumbnail: [Image file]
- affair: {
  "date": "2023-12-01",
  "categoryIds": ["categoryId1", "categoryId2"],
  "subCategoryIds": ["subCategoryId1", "subCategoryId2"],
  "languageIds": ["languageId1", "languageId2"],
  "location": "Hyderabad",
  "name": "Local Infrastructure Development Project",
  "description": "Overview of new metro rail extension",
  "fullContent": "Detailed project timeline, budget allocation, and benefits to residents",
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Local current affair created successfully",
  "data": {
    "_id": "affairId",
    "date": "2023-12-01T00:00:00.000Z",
    "categories": [...],
    "subCategories": [...],
    "languages": [...],
    "location": "Hyderabad",
    "name": "Local Infrastructure Development Project",
    "thumbnailUrl": "https://res.cloudinary.com/...",
    "description": "Overview of new metro rail extension",
    "fullContent": "Detailed project timeline, budget allocation, and benefits to residents",
    "isActive": true,
    "affairType": "LocalCurrentAffair",
    "createdAt": "2023-12-01T10:00:00.000Z",
    "updatedAt": "2023-12-01T10:00:00.000Z",
    "__v": 0
  }
}
```

### 2. Get All Local Current Affairs

**Endpoint:** `GET /api/admin/current-affairs/local?[page=1&limit=10]`

**Query Parameters (optional):**
- `page`: 1 (default)
- `limit`: 10 (default)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "affairId",
      "date": "2023-12-01T00:00:00.000Z",
      "categories": [...],
      "subCategories": [...],
      "languages": [...],
      "location": "Hyderabad",
      "name": "Local Infrastructure Development Project",
      "thumbnailUrl": "https://res.cloudinary.com/...",
      "description": "Overview of new metro rail extension",
      "fullContent": "Detailed project timeline, budget allocation, and benefits to residents",
      "isActive": true,
      "affairType": "LocalCurrentAffair",
      "createdAt": "2023-12-01T10:00:00.000Z",
      "updatedAt": "2023-12-01T10:00:00.000Z",
      "__v": 0
    }
  ],
  "totalPages": 1,
  "currentPage": 1
}
```

### 3. Get Local Current Affair By ID

**Endpoint:** `GET /api/admin/current-affairs/local/:id`

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "affairId",
    "date": "2023-12-01T00:00:00.000Z",
    "categories": [...],
    "subCategories": [...],
    "languages": [...],
    "location": "Hyderabad",
    "name": "Local Infrastructure Development Project",
    "thumbnailUrl": "https://res.cloudinary.com/...",
    "description": "Overview of new metro rail extension",
    "fullContent": "Detailed project timeline, budget allocation, and benefits to residents",
    "isActive": true,
    "affairType": "LocalCurrentAffair",
    "createdAt": "2023-12-01T10:00:00.000Z",
    "updatedAt": "2023-12-01T10:00:00.000Z",
    "__v": 0
  }
}
```

### 4. Update Local Current Affair

**Endpoint:** `PUT /api/admin/current-affairs/local/:id`

**Content-Type:** `multipart/form-data`

**Request Body:**
```
Form Fields:
- thumbnail: [Image file] (optional)
- affair: {
  "date": "2023-12-01",
  "categoryIds": ["categoryId1", "categoryId2"],
  "subCategoryIds": ["subCategoryId1", "subCategoryId2"],
  "languageIds": ["languageId1", "languageId2"],
  "location": "Hyderabad",
  "name": "Updated Local Infrastructure Development Report",
  "description": "Updated overview of metro rail extension",
  "fullContent": "Updated detailed project information",
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Local current affair updated successfully",
  "data": {
    "_id": "affairId",
    "date": "2023-12-01T00:00:00.000Z",
    "categories": [...],
    "subCategories": [...],
    "languages": [...],
    "location": "Hyderabad",
    "name": "Updated Local Infrastructure Development Report",
    "thumbnailUrl": "https://res.cloudinary.com/...",
    "description": "Updated overview of metro rail extension",
    "fullContent": "Updated detailed project information",
    "isActive": true,
    "affairType": "LocalCurrentAffair",
    "createdAt": "2023-12-01T10:00:00.000Z",
    "updatedAt": "2023-12-01T11:00:00.000Z",
    "__v": 0
  }
}
```

### 5. Delete Local Current Affair

**Endpoint:** `DELETE /api/admin/current-affairs/local/:id`

**Response:**
```json
{
  "success": true,
  "message": "Local current affair deleted successfully"
}
```

## Filter Helper APIs

These APIs help with filtering and categorizing current affairs.

> **Important Note About Categories**: Current Affairs use two distinct types of categories:
> 1. **General Categories** - Shared across all content types (Courses, Publications, etc.)
> 2. **Current Affairs Categories** - Dedicated categories managed via `/api/admin/current-affairs-categories` (see [Current Affairs Categories](#current-affairs-categories))
>
> **Best Practice**: Use Current Affairs Categories for organizing Current Affairs content specifically, and General Categories for broader content organization.

### 1. Get Categories With Current Affairs

**Endpoint:** `GET /api/admin/current-affairs/categories`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "categoryId",
      "name": "General Knowledge",
      "slug": "general-knowledge",
      "thumbnailUrl": "https://res.cloudinary.com/..."
    }
  ]
}
```

### 2. Get Subcategories and Languages by Category

**Endpoint:** `GET /api/admin/current-affairs/categories/:categoryId/details`

**Response:**
```json
{
  "success": true,
  "data": {
    "subCategories": [
      {
        "_id": "subCategoryId",
        "name": "Current Affairs",
        "slug": "current-affairs",
        "thumbnailUrl": "https://res.cloudinary.com/...",
        "category": "categoryId"
      }
    ],
    "languages": [
      {
        "_id": "languageId",
        "name": "English",
        "code": "en"
      }
    ]
  }
}
```

### 3. Get Subcategories for a Category (Defaults to English)

**Endpoint:** `GET /api/admin/current-affairs/categories/:categoryId/subcategories-default`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "subCategoryId",
      "name": "Current Affairs",
      "slug": "current-affairs",
      "thumbnailUrl": "https://res.cloudinary.com/...",
      "category": "categoryId"
    }
  ],
  "defaultLanguage": "en"
}
```

### 4. Get Subcategories for a Category Filtered by Language

**Endpoint:** `GET /api/admin/current-affairs/categories/:categoryId/subcategories?lang=en`

**Query Parameters:**
- `lang`: Language code (e.g., en, te, hi)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "subCategoryId",
      "name": "Current Affairs",
      "slug": "current-affairs",
      "thumbnailUrl": "https://res.cloudinary.com/...",
      "category": "categoryId"
    }
  ],
  "language": "en"
}
```

### 5. Get Filtered Current Affairs

**Endpoint:** `GET /api/admin/current-affairs/affairs?[filters]`

**Query Parameters:**
- `categoryId`: categoryId (General Category)
- `subCategoryId`: subCategoryId
- `lang`: Language code (e.g., en, te, hi)
- `affairType`: Type of affair (e.g., LatestCurrentAffair, MonthlyCurrentAffair)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      // Current affair object
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

### 6. Get Available Affair Types

**Endpoint:** `GET /api/admin/current-affairs/types?[filters]`

**Query Parameters:**
- `categoryId`: categoryId (General Category, optional)
- `subCategoryId`: subCategoryId (optional)
- `lang`: Language code (e.g., en, te, hi) (optional)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "name": "Latest",
      "value": "LatestCurrentAffair"
    },
    {
      "name": "Monthly",
      "value": "MonthlyCurrentAffair"
    },
    {
      "name": "Sports",
      "value": "SportsCurrentAffair"
    },
    {
      "name": "State",
      "value": "StateCurrentAffair"
    },
    {
      "name": "International",
      "value": "InternationalCurrentAffair"
    },
    {
      "name": "Politics",
      "value": "PoliticsCurrentAffair"
    },
    {
      "name": "Local",
      "value": "LocalCurrentAffair"
    }
  ]
}
```

## Conclusion

This comprehensive API testing guide covers all aspects of the Current Affairs system:

1. **Dedicated Category Management**: The new `/api/admin/current-affairs-categories` endpoints provide full CRUD operations for managing Current Affairs-specific categories with features like custom ordering and soft delete.

2. **Seven Content Types**: Each type of current affair (Latest, Monthly, Sports, State, International, Politics, Local) has its own set of endpoints for complete content management.

3. **Filter Helper APIs**: Advanced filtering capabilities allow for dynamic content organization and retrieval.

4. **Consistent Design**: All endpoints follow REST conventions and require admin authentication for security.

### Best Practices

- Use the dedicated Current Affairs Category APIs for managing categories specifically related to current affairs content
- Leverage soft delete functionality to preserve data integrity
- Utilize the `order` field in categories to control UI presentation
- Take advantage of the filter helper APIs for dynamic content organization
- Always include proper authentication headers in API requests
- Follow date requirements per Current Affairs type (date for Latest/Sports/etc., month for Monthly)
- Select only one language per content entry for clarity
- Use Current Affairs Categories for organizing Current Affairs content specifically