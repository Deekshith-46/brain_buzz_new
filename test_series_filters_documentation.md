# Test Series Filters API Documentation

## Overview
This document provides comprehensive documentation for the Test Series filtering API endpoints. These endpoints allow filtering Test Series by various criteria including categories, subcategories, and languages, similar to the Online Courses filtering system.

## Base URL
`BASE_URL/api/v1/test-series`

## Endpoints

### 1. List Public Test Series with Filtering
**GET** `/api/v1/test-series`

#### Description
Retrieves a list of public test series with optional filtering by category, subcategory, and language.

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| category | String | No | Filter by category ID |
| subCategory | String | No | Filter by subcategory ID |
| lang | String | No | Filter by language code |

#### Example Request
```
GET /api/v1/test-series?category=693fe9805e290d8730b38451&subCategory=693fec205e290d8730b38483&lang=en
```

#### Example Response
```json
{
  "success": true,
  "data": [
    {
      "_id": "6945183be8f6a9598db072e2",
      "name": "UPSC Prelims Test Series",
      "description": "Complete test series for UPSC Prelims preparation",
      "thumbnail": "https://example.com/thumbnail.jpg",
      "date": "2025-11-30T18:30:00.000Z",
      "maxTests": 3,
      "testsCount": 3,
      "categories": [
        {
          "_id": "693fe9805e290d8730b38451",
          "name": "UPSC",
          "slug": "upsc"
        }
      ],
      "subCategories": [
        {
          "_id": "693fec205e290d8730b38483",
          "name": "UPSC Prelims",
          "slug": "upsc-prelims"
        }
      ],
      "languages": [
        {
          "_id": "694006d06abada1001df7f2c",
          "name": "English",
          "code": "en"
        }
      ],
      "validity": {
        "_id": "some-validity-id",
        "label": "6 Months",
        "durationInDays": 180
      },
      "originalPrice": 999,
      "discount": {
        "type": "percentage",
        "value": 20,
        "validUntil": "2024-12-31T23:59:59.000Z"
      },
      "hasAccess": false
    }
  ],
  "meta": {
    "total": 1,
    "totalInDatabase": 1,
    "activeInDatabase": 1
  }
}
```

#### Response Fields
| Field | Type | Description |
|-------|------|-------------|
| success | Boolean | Indicates if the request was successful |
| data | Array | Array of test series objects |
| data[i]._id | String | Unique identifier of the test series |
| data[i].name | String | Name of the test series |
| data[i].description | String | Description of the test series |
| data[i].thumbnail | String | URL to the thumbnail image |
| data[i].date | Date | Date of the test series |
| data[i].maxTests | Number | Maximum number of tests in the series |
| data[i].testsCount | Number | Actual number of tests in the series |
| data[i].categories | Array | Array of category objects |
| data[i].subCategories | Array | Array of subcategory objects |
| data[i].languages | Array | Array of language objects |
| data[i].validity | Object | Validity period information |
| data[i].originalPrice | Number | Original price of the test series |
| data[i].discount | Object | Discount information |
| data[i].hasAccess | Boolean | Whether the user has access to the test series |
| meta.total | Number | Total number of test series matching the filters |
| meta.totalInDatabase | Number | Total number of test series in the database |
| meta.activeInDatabase | Number | Total number of active test series in the database |

### 2. Get Test Series Languages
**GET** `/api/v1/test-series/languages`

#### Description
Retrieves a list of languages available for test series.

#### Example Request
```
GET /api/v1/test-series/languages
```

#### Example Response
```json
{
  "success": true,
  "data": [
    {
      "_id": "694006d06abada1001df7f2c",
      "name": "English",
      "code": "en"
    },
    {
      "_id": "694006d06abada1001df7f2d",
      "name": "Hindi",
      "code": "hi"
    }
  ]
}
```

### 3. Get Test Series Categories
**GET** `/api/v1/test-series/categories`

#### Description
Retrieves a list of categories available for test series.

#### Example Request
```
GET /api/v1/test-series/categories
```

#### Example Response
```json
{
  "success": true,
  "data": [
    {
      "_id": "693fe9805e290d8730b38451",
      "name": "UPSC",
      "slug": "upsc",
      "contentType": "TEST_SERIES"
    }
  ]
}
```

### 4. Get Test Series Subcategories
**GET** `/api/v1/test-series/subcategories`

#### Description
Retrieves a list of subcategories available for test series.

#### Example Request
```
GET /api/v1/test-series/subcategories
```

#### Example Response
```json
{
  "success": true,
  "data": [
    {
      "_id": "693fec205e290d8730b38483",
      "name": "UPSC Prelims",
      "slug": "upsc-prelims",
      "contentType": "TEST_SERIES"
    }
  ]
}
```

## Authentication
These endpoints require a valid JWT token in the Authorization header for authenticated users. For unauthenticated users, the `hasAccess` field will always be `false`.

## Error Responses
Common error responses:
- `401 Unauthorized`: Missing or invalid JWT token
- `404 Not Found`: Test series not found
- `500 Internal Server Error`: Server error occurred

## Notes
- The `subCategory` parameter is case-sensitive and refers to the ObjectId of the subcategory
- The `lang` parameter refers to the language code (e.g., 'en' for English, 'hi' for Hindi)
- The `hasAccess` field indicates whether the authenticated user has purchased access to the test series
- Price-related fields (`originalPrice`, `discount`) are included in the response for purchase decision support
- **Important**: The query parameter is `subCategory` (not `subcategories`) and `lang` (not `language`)