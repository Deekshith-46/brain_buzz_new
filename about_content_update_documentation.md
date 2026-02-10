# About Section Content Update Documentation

## Overview

This document describes the new functionality for admins to update title, description, and card content in the About section of the banner system.

## New API Endpoints

### 1. Update About Section Content (Bulk Update)
**Endpoint:** `PUT /api/admin/banners/about/:siteType/content`

**Purpose:** Update multiple fields in the About section at once (titles, descriptions, cards)

**Parameters:**
- `siteType` (path): FREE or PAID

**Content-Type:** `application/json` OR `multipart/form-data`

**Request Body (JSON Format):**
```json
{
  "primaryTitle": "Optional - New primary title",
  "primaryDescription": "Optional - New primary description", 
  "secondaryTitle": "Optional - New secondary title",
  "cards": [
    {
      "heading": "Required if cards provided",
      "description": "Required if cards provided"
    }
  ]
}
```

**Request Body (Form-Data Format):**
```
primaryTitle: Optional - New primary title
primaryDescription: Optional - New primary description
secondaryTitle: Optional - New secondary title
cards[0][heading]: Required if cards provided
cards[0][description]: Required if cards provided
cards[1][heading]: Optional additional card
cards[1][description]: Optional additional card
```

**Features:**
- ✅ Update any combination of fields
- ✅ Partial updates supported (only provide fields you want to change)
- ✅ Full validation for required fields
- ✅ Automatic trimming of whitespace
- ✅ Card array validation

### 2. Update Specific Card
**Endpoint:** `PUT /api/admin/banners/about/:siteType/cards/:cardIndex`

**Purpose:** Update a specific card by its index position

**Parameters:**
- `siteType` (path): FREE or PAID
- `cardIndex` (path): Zero-based index of the card to update

**Content-Type:** `application/json` OR `multipart/form-data`

**Request Body (JSON Format):**
```json
{
  "heading": "Optional - New card heading",
  "description": "Optional - New card description"
}
```

**Request Body (Form-Data Format):**
```
heading: Optional - New card heading
description: Optional - New card description
```

**Features:**
- ✅ Update individual card fields
- ✅ Update heading only or description only
- ✅ Index boundary validation
- ✅ Field validation

## Usage Examples

### Update All About Content
```bash
curl -X PUT \
  http://localhost:5000/api/admin/banners/about/FREE/content \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "primaryTitle": "New Primary Title",
    "primaryDescription": "Updated description...",
    "secondaryTitle": "New Secondary Title",
    "cards": [
      {
        "heading": "Card 1 Heading",
        "description": "Card 1 Description"
      }
    ]
  }'
```

### Update Only Primary Title
```bash
curl -X PUT \
  http://localhost:5000/api/admin/banners/about/FREE/content \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "primaryTitle": "Updated Title Only"
  }'
```

### Update Specific Card (First Card)
```bash
curl -X PUT \
  http://localhost:5000/api/admin/banners/about/FREE/cards/0 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "heading": "Updated Card Heading",
    "description": "Updated Card Description"
  }'
```

### Update Only Card Description
```bash
curl -X PUT \
  http://localhost:5000/api/admin/banners/about/PAID/cards/1 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Updated description only"
  }'
```

## Validation Rules

### Content Update Validation
- `primaryTitle`: String, non-empty when provided
- `primaryDescription`: String, non-empty when provided  
- `secondaryTitle`: String, non-empty when provided
- `cards`: Array required when provided, minimum 1 card
- Each card must have non-empty `heading` and `description`

### Card Update Validation
- `cardIndex`: Must be valid zero-based index
- `heading`: String, non-empty when provided
- `description`: String, non-empty when provided
- At least one field (heading or description) must be provided

## Error Handling

### Common Error Responses

**400 Bad Request - Invalid Input:**
```json
{
  "success": false,
  "message": "Primary title must be a non-empty string"
}
```

**404 Not Found - Banner/Content Not Found:**
```json
{
  "success": false,
  "message": "ABOUT FREE banner not found"
}
```

**404 Not Found - Invalid Card Index:**
```json
{
  "success": false,
  "message": "Card at index 5 not found"
}
```

## Implementation Details

### Controller Functions Added
1. `updateAboutContent` - Handles bulk content updates
2. `updateAboutCard` - Handles specific card updates

### Key Features
- **Dual Format Support**: Accepts both JSON and form-data content types
- **Partial Updates**: Only provided fields are updated
- **Validation**: Comprehensive input validation
- **Error Handling**: Detailed error messages
- **Security**: Admin authentication required
- **Flexibility**: Support for individual or bulk updates

### Database Operations
- Uses MongoDB's `$set` operator for efficient partial updates
- Maintains data integrity through validation
- Preserves existing data when fields aren't provided

## Testing

A test script is provided at `test_about_content_update.js` that demonstrates:
- Bulk content updates
- Individual field updates
- Specific card updates
- Error case handling
- Validation testing

## Integration with Existing System

These new endpoints work seamlessly with:
- Existing banner model structure
- Current authentication middleware
- Cloudinary image management
- Multi-site banner system
- User-facing APIs (no changes needed)

## Migration Notes

No database migration required. The new functionality works with existing banner documents that have the `about` field structure.