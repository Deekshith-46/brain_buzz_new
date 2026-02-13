# My Purchases API Documentation

## Overview
This API provides endpoints for users to access only their purchased content including Online Courses, Test Series, and Publications. All endpoints require authentication and return only content that the user has actually purchased with valid access.

## Base URL
```
/api/v1/purchases
```

## Authentication
All endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Get All Purchased Content (Dashboard)
**GET** `/api/v1/purchases` or `/api/v1/purchases/dashboard`

Returns a comprehensive dashboard of all purchased content across all categories.

#### Query Parameters
- `contentType` (optional): Filter by content type (`courses`, `test-series`, `publications`)

#### Response
```json
{
  "success": true,
  "message": "Purchased content retrieved successfully",
  "data": {
    "courses": {
      "items": [...],
      "count": 5,
      "active": 3,
      "expired": 2
    },
    "testSeries": {
      "items": [...],
      "count": 2,
      "active": 2,
      "expired": 0
    },
    "publications": {
      "items": [...],
      "count": 1,
      "active": 1,
      "expired": 0
    },
    "summary": {
      "totalItems": 8,
      "totalActive": 6,
      "totalExpired": 2
    }
  }
}
```

### 2. Get Purchased Courses
**GET** `/api/v1/purchases/courses`

Returns all courses purchased by the user with active access.

#### Response
```json
{
  "success": true,
  "message": "Purchased courses retrieved successfully",
  "data": {
    "courses": [
      {
        "_id": "67890abcdef1234567890abc",
        "name": "GS Foundation Course",
        "thumbnailUrl": "https://example.com/thumbnail.jpg",
        "description": "Complete foundation course for GS prelims",
        "categories": [...],
        "subCategories": [...],
        "languages": [...],
        "hasAccess": true,
        "isValid": true,
        "expiryDate": "2027-12-31T23:59:59.000Z",
        "purchaseDate": "2024-01-15T10:30:00.000Z",
        "purchaseStatus": "active"
      }
    ],
    "totalCount": 1,
    "summary": {
      "active": 1,
      "expired": 0
    }
  }
}
```

### 3. Get Purchased Test Series
**GET** `/api/v1/purchases/test-series`

Returns all test series purchased by the user with active access.

#### Response
```json
{
  "success": true,
  "message": "Purchased test series retrieved successfully",
  "data": {
    "testSeries": [
      {
        "_id": "67890abcdef1234567890def",
        "name": "Prelims Test Series 2024",
        "thumbnail": "https://example.com/thumbnail.jpg",
        "description": "Complete prelims test series",
        "noOfTests": 50,
        "testsCount": 45,
        "categories": [...],
        "subCategories": [...],
        "languages": [...],
        "hasAccess": true,
        "isValid": true,
        "expiryDate": "2025-06-30T23:59:59.000Z",
        "purchaseDate": "2024-03-20T14:15:00.000Z",
        "purchaseStatus": "active"
      }
    ],
    "totalCount": 1,
    "summary": {
      "active": 1,
      "expired": 0
    }
  }
}
```

### 4. Get Purchased Publications
**GET** `/api/v1/purchases/publications`

Returns all publications purchased by the user with active access.

#### Response
```json
{
  "success": true,
  "message": "Purchased publications retrieved successfully",
  "data": {
    "publications": [
      {
        "_id": "67890abcdef1234567890ghi",
        "name": "Current Affairs Yearbook 2024",
        "thumbnailUrl": "https://example.com/thumbnail.jpg",
        "shortDescription": "Comprehensive current affairs coverage",
        "authors": ["Author Name"],
        "categories": [...],
        "subCategories": [...],
        "languages": [...],
        "availableIn": "DIGITAL",
        "isPreviewEnabled": true,
        "previewPages": 10,
        "hasAccess": true,
        "isValid": true,
        "canDownload": true,
        "expiryDate": "2034-12-31T23:59:59.000Z",
        "purchaseDate": "2024-02-10T09:45:00.000Z",
        "purchaseStatus": "active"
      }
    ],
    "totalCount": 1,
    "summary": {
      "active": 1,
      "expired": 0
    }
  }
}
```

### 5. Get Purchase History
**GET** `/api/v1/purchases/history`

Returns detailed purchase history with pagination.

#### Query Parameters
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

#### Response
```json
{
  "success": true,
  "message": "Purchase history retrieved successfully",
  "data": {
    "purchases": [
      {
        "_id": "purchase_id_123",
        "user": "user_id_456",
        "items": [
          {
            "itemType": "online_course",
            "itemId": "course_id_789",
            "content": {
              "_id": "course_id_789",
              "name": "Course Name",
              "hasAccess": true,
              "isValid": true,
              "expiryDate": "2027-12-31T23:59:59.000Z",
              "purchaseDate": "2024-01-15T10:30:00.000Z"
            }
          }
        ],
        "amount": 2999,
        "finalAmount": 2699,
        "discountAmount": 300,
        "status": "completed",
        "paymentId": "pay_1234567890",
        "purchaseDate": "2024-01-15T10:30:00.000Z",
        "expiryDate": "2027-12-31T23:59:59.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalItems": 25,
      "itemsPerPage": 10
    }
  }
}
```

## Response Fields Explanation

### Common Fields for Content Items
- `hasAccess`: Boolean indicating if user has purchased the item
- `isValid`: Boolean indicating if the purchase is currently valid (not expired)
- `expiryDate`: ISO date string when the purchase expires
- `purchaseDate`: ISO date string when the purchase was made
- `purchaseStatus`: String indicating purchase status (`active`, `expired`, `not_purchased`, `error`)

### Course-Specific Fields
- `thumbnailUrl`: Course thumbnail image URL
- `categories`: Array of category objects
- `subCategories`: Array of sub-category objects
- `languages`: Array of language objects

### Test Series-Specific Fields
- `thumbnail`: Test series thumbnail image URL
- `noOfTests`: Total number of tests in series
- `testsCount`: Actual number of tests available

### Publication-Specific Fields
- `availableIn`: Format availability (`DIGITAL`, `HARDCOPY`, `BOTH`)
- `isPreviewEnabled`: Boolean for preview availability
- `previewPages`: Number of preview pages available
- `canDownload`: Boolean indicating if download is allowed

## Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Authentication required"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "No purchased content found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Error fetching purchased content",
  "error": "Detailed error message"
}
```

## Usage Examples

### JavaScript/Fetch
```javascript
// Get all purchased content
const response = await fetch('/api/v1/purchases', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
console.log(data.data.summary.totalItems); // Total purchased items

// Get only purchased courses
const coursesResponse = await fetch('/api/v1/purchases/courses', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const coursesData = await coursesResponse.json();
console.log(coursesData.data.courses); // Array of purchased courses

// Get purchase history with pagination
const historyResponse = await fetch('/api/v1/purchases/history?page=1&limit=10', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Axios
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});

// Get purchased test series
const getTestSeries = async () => {
  try {
    const response = await api.get('/purchases/test-series');
    return response.data.data.testSeries;
  } catch (error) {
    console.error('Error fetching test series:', error);
  }
};

// Get dashboard summary
const getDashboard = async () => {
  try {
    const response = await api.get('/purchases/dashboard');
    return response.data.data.summary;
  } catch (error) {
    console.error('Error fetching dashboard:', error);
  }
};
```

## Key Features

1. **Access Validation**: Only returns content with verified purchases
2. **Expiry Checking**: Validates purchase expiry dates in real-time
3. **Unified Interface**: Consistent response structure across all content types
4. **Detailed Metadata**: Rich information including categories, languages, and access status
5. **Pagination Support**: Purchase history includes pagination for large datasets
6. **Summary Statistics**: Dashboard provides overview counts and status breakdowns
7. **Security**: All endpoints require authentication and validate user ownership

## Integration with Frontend

These APIs are designed to power the "My Courses", "My Test Series", and "My Publications" sections of your frontend application. The response structure makes it easy to:

- Display only purchased content in UI cards
- Show expiration warnings for expiring content
- Enable/disable access based on `hasAccess` and `isValid` flags
- Show download buttons for publications based on `canDownload` flag
- Display progress indicators using purchase dates