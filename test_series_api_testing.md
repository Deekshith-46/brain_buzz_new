# Test Series API Testing Guide

This guide provides step-by-step instructions for testing all Test Series-related APIs, including required request bodies, endpoints, and expected responses.

## Important Note on Request Format

Test Series APIs have different request formats depending on the operation:
1. Basic CRUD operations (create/update Test Series) require form-data with text fields and file uploads
2. Nested operations (adding tests, sections, questions) typically use JSON payloads
3. File uploads (thumbnails, explanation videos) require multipart form-data
4. Bulk operations (adding multiple tests at once) use JSON payloads

## Base URL
```
https://brain-buzz-web.vercel.app/
```

## Authentication
Most admin endpoints require authentication. Ensure you have a valid admin JWT token before making requests.

User endpoints for test attempts require a valid user JWT token. Additionally, the purchase check middleware protects user test attempt endpoints to ensure users have proper access to tests.

---

## ADMIN APIs

### 1. TEST SERIES - Basic CRUD Operations

#### 1.1 Create Test Series
**Endpoint:** `POST /api/admin/test-series`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`
- `Content-Type: multipart/form-data`

**Form Fields:**
- `name`: "UPSC Prelims Test Series"
- `description`: "Complete test series for UPSC Prelims preparation"
- `noOfTests`: 20
- `originalPrice`: 499
- `categoryIds[]`: (array of category IDs)
- `subCategoryIds[]`: (array of sub-category IDs)
- `thumbnail`: (select your image file)
- `discountType`: "percentage" (optional: "percentage" or "fixed")
- `discountValue`: 10 (optional: percentage or fixed amount)
- `date`: "2024-12-31T23:59:59Z" (optional: ISO date string)
- `language`: "English" (optional: Language of the test series)
- `validity`: "Lifetime" (optional: Validity period of the test series)

**Note:** The `noOfTests` field determines the maximum number of tests that can be added to this test series. This limit is enforced when adding tests to the series.

**Expected Response:**
```json
{
  "success": true,
  "message": "Test Series created successfully",
  "data": {
    "_id": "test_series_id",
    "contentType": "TEST_SERIES",
    "accessType": "PAID",
    "date": null,
    "categories": [],
    "subCategories": [],
    "thumbnail": "https://res.cloudinary.com/.../thumbnail.jpg",
    "name": "UPSC Prelims Test Series",
    "noOfTests": 20,
    "description": "Complete test series for UPSC Prelims preparation",
    "originalPrice": 499,
    "discount": {
      "type": null,
      "value": 0,
      "validUntil": null
    },
    "language": "English",
    "validity": "Lifetime",
    "tests": [],
    "isActive": true,
    "createdAt": "timestamp",
    "updatedAt": "timestamp",
    "finalPrice": 499
  }
}
```

#### 1.2 List All Test Series
**Endpoint:** `GET /api/admin/test-series`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`

**Query Parameters (optional):**
- `category`: Filter by category ID
- `subCategory`: Filter by sub-category ID
- `isActive`: Filter by active status (true/false)
- `minPrice`: Minimum price filter
- `maxPrice`: Maximum price filter

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "test_series_id",
      "contentType": "TEST_SERIES",
      "accessType": "PAID",
      "date": null,
      "categories": [],
      "subCategories": [],
      "thumbnail": "https://res.cloudinary.com/.../thumbnail.jpg",
      "name": "UPSC Prelims Test Series",
      "noOfTests": 20,
      "description": "Complete test series for UPSC Prelims preparation",
      "originalPrice": 499,
      "discount": {
        "type": null,
        "value": 0,
        "validUntil": null
      },
      "language": "English",
      "validity": "Lifetime",
      "tests": [],
      "isActive": true,
      "createdAt": "timestamp",
      "updatedAt": "timestamp",
      "finalPrice": 499
    }
  ],
  "meta": {
    "total": 1,
    "totalInDatabase": 1,
    "matchingFilter": 1
  }
}
```

#### 1.3 Get Single Test Series
**Endpoint:** `GET /api/admin/test-series/:id`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`

**Expected Response:**
```json
{
  "data": {
    "_id": "test_series_id",
    "contentType": "TEST_SERIES",
    "accessType": "PAID",
    "date": null,
    "categories": [],
    "subCategories": [],
    "thumbnail": "https://res.cloudinary.com/.../thumbnail.jpg",
    "name": "UPSC Prelims Test Series",
    "noOfTests": 20,
    "description": "Complete test series for UPSC Prelims preparation",
    "originalPrice": 499,
    "discount": {
      "type": null,
      "value": 0,
      "validUntil": null
    },
    "language": "English",
    "validity": "Lifetime",
    "tests": [],
    "isActive": true,
    "createdAt": "timestamp",
    "updatedAt": "timestamp",
    "finalPrice": 499
  }
}
```

#### 1.4 Update Test Series
**Endpoint:** `PUT /api/admin/test-series/:id`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`
- `Content-Type: multipart/form-data`

**Form Fields (any combination):**
- `name`: "Updated UPSC Prelims Test Series"
- `description`: "Updated description"
- `noOfTests`: 25
- `originalPrice`: 599
- `isActive`: true
- `categoryIds[]`: (array of category IDs)
- `subCategoryIds[]`: (array of sub-category IDs)
- `thumbnail`: (select your new image file)
- `discountType`: "percentage" (use empty string "" to remove discount)
- `discountValue`: 15
- `date`: "2025-06-30T23:59:59Z"
- `language`: "Hindi"
- `validity`: "1 Year"

**Note:** The `noOfTests` field determines the maximum number of tests that can be added to this test series. This limit is enforced when adding tests to the series. Reducing this number below the current number of tests in the series is not allowed.

**Expected Response:**
```json
{
  "success": true,
  "message": "Test Series updated successfully",
  "data": {
    "_id": "test_series_id",
    "contentType": "TEST_SERIES",
    "accessType": "PAID",
    "date": null,
    "categories": [],
    "subCategories": [],
    "thumbnail": "https://res.cloudinary.com/.../new_thumbnail.jpg",
    "name": "Updated UPSC Prelims Test Series",
    "noOfTests": 25,
    "description": "Updated description",
    "originalPrice": 599,
    "discount": {
      "type": "percentage",
      "value": 15,
      "validUntil": "2025-06-30T23:59:59Z"
    },
    "language": "Hindi",
    "validity": "1 Year",
    "tests": [],
    "isActive": true,
    "createdAt": "timestamp",
    "updatedAt": "timestamp",
    "finalPrice": 509.15
  }
}
```

#### 1.5 Delete Test Series
**Endpoint:** `DELETE /api/admin/test-series/:id`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`

**Expected Response:**
```json
{
  "message": "Test Series deleted successfully"
}
```

### 2. TESTS - Within a Test Series

#### 2.1 Add Test to Test Series

**Note:** Only the first 2 tests in a series are automatically accessible for free. The system automatically determines FREE vs PAID access based on the test's position in the series. The first two tests are accessible for free, and subsequent tests require purchase. This access logic is calculated dynamically and not stored in the database.

**Important Design Decision:** The `isFree` field is intentionally NOT stored in the database. Instead, FREE/PAID access is derived at runtime based on the test's position. This approach ensures:
- No database pollution with redundant fields
- Future-proof flexibility (can easily change "first 2 free" to "first 3 free")
- Clean separation between admin and user views
- Seamless integration with payment systems
**Endpoint:** `POST /api/admin/test-series/:seriesId/tests`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`
- `Content-Type: application/json`

**Request Body:**
```json
{
  "testName": "General Studies Paper 1 - Test 1",
  "noOfQuestions": 100,
  "totalMarks": 200,
  "positiveMarks": 2,
  "negativeMarks": 0.67,
  "date": "2024-06-15T00:00:00Z",
  "startTime": "2024-06-15T09:00:00Z",
  "endTime": "2024-06-15T12:00:00Z",
  "resultPublishTime": "2024-06-16T12:00:00Z"
}
```

**Note:** The `isFree` flag is automatically determined by the system based on the test's position in the series. The first two tests are automatically marked as free, and subsequent tests are marked as paid. The `isFree` field is calculated dynamically and not stored in the database. Any value provided for `isFree` in the request body will be ignored.

**Access Control Logic:**
- **Admin View:** Admins can access ALL tests without restriction
- **User View (Non-Purchased):** First 2 tests → Free access, Remaining tests → "Buy to unlock"
- **User View (Purchased):** All tests → Unlocked

**Expected Response:
```json
{
  "message": "Test added to series successfully",
  "data": {
    "_id": "test_series_id",
    "contentType": "TEST_SERIES",
    "accessType": "PAID",
    "date": null,
    "categories": [],
    "subCategories": [],
    "thumbnail": "https://res.cloudinary.com/.../thumbnail.jpg",
    "name": "UPSC Prelims Test Series",
    "noOfTests": 20,
    "description": "Complete test series for UPSC Prelims preparation",
    "originalPrice": 499,
    "discount": {
      "type": null,
      "value": 0,
      "validUntil": null
    },
    "tests": [
      {
        "_id": "test_id",
        "testName": "General Studies Paper 1 - Test 1",
        "noOfQuestions": 100,
        "totalMarks": 200,
        "positiveMarks": 2,
        "negativeMarks": 0.67,
        "date": "2024-06-15T00:00:00Z",
        "startTime": "2024-06-15T09:00:00Z",
        "endTime": "2024-06-15T12:00:00Z",
        "instructionsPage1": null,
        "instructionsPage2": null,
        "instructionsPage3": null,
        "totalExplanationVideoUrl": null,
        "resultPublishTime": "2024-06-16T12:00:00Z",
        "sections": [],
        "isFree": true
      }
    ],
    "isActive": true,
    "createdAt": "timestamp",
    "updatedAt": "timestamp",
    "finalPrice": 499
  }
}
```

#### 2.2 Get Single Test from Test Series
**Endpoint:** `GET /api/admin/test-series/:seriesId/tests/:testId`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`

**Expected Response:**
```json
{
  "data": {
    "_id": "test_id",
    "testName": "General Studies Paper 1 - Test 1",
    "noOfQuestions": 100,
    "totalMarks": 200,
    "positiveMarks": 2,
    "negativeMarks": 0.67,
    "date": "2024-06-15T00:00:00Z",
    "startTime": "2024-06-15T09:00:00Z",
    "endTime": "2024-06-15T12:00:00Z",
    "instructionsPage1": null,
    "instructionsPage2": null,
    "instructionsPage3": null,
    "totalExplanationVideoUrl": null,
    "resultPublishTime": "2024-06-16T12:00:00Z",
    "sections": [],
    "isFree": true
  }
}
```

#### 2.3 Update Test in Test Series
**Endpoint:** `PUT /api/admin/test-series/:seriesId/tests/:testId`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`
- `Content-Type: application/json`

**Request Body (any combination of fields):**
```json
{
  "testName": "Updated Test Name",
  "noOfQuestions": 120,
  "totalMarks": 240,
  "positiveMarks": 2,
  "negativeMarks": 0.67,
  "date": "2024-07-15T00:00:00Z",
  "startTime": "2024-07-15T09:00:00Z",
  "endTime": "2024-07-15T12:00:00Z",
  "resultPublishTime": "2024-07-16T12:00:00Z",
  "isFree": false
}
```

**Note:** The `isFree` flag is automatically determined by the system based on the test's position in the series. The first two tests are automatically marked as free, and subsequent tests are marked as paid. The `isFree` field is calculated dynamically and not stored in the database. Any value provided for `isFree` in the request body will be ignored.

**Access Control Logic:**
- **Admin View:** Admins can access ALL tests without restriction
- **User View (Non-Purchased):** First 2 tests → Free access, Remaining tests → "Buy to unlock"
- **User View (Purchased):** All tests → Unlocked

**Expected Response:
```json
{
  "message": "Test updated successfully",
  "data": {
    "_id": "test_series_id",
    "...": "...",
    "tests": [
      {
        "_id": "test_id",
        "testName": "Updated Test Name",
        "noOfQuestions": 120,
        "totalMarks": 240,
        "positiveMarks": 2,
        "negativeMarks": 0.67,
        "date": "2024-07-15T00:00:00Z",
        "startTime": "2024-07-15T09:00:00Z",
        "endTime": "2024-07-15T12:00:00Z",
        "instructionsPage1": null,
        "instructionsPage2": null,
        "instructionsPage3": null,
        "totalExplanationVideoUrl": null,
        "resultPublishTime": "2024-07-16T12:00:00Z",
        "sections": [],
        "isFree": false
      }
    ]
  }
}
```

#### 2.4 Bulk Add Tests to Test Series

**Endpoint:** `POST /api/admin/test-series/:seriesId/tests/bulk`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`
- `Content-Type: application/json`

**Request Body:**
```json
[
  {
    "testName": "General Studies Paper 1 - Test 1",
    "noOfQuestions": 100,
    "totalMarks": 200,
    "positiveMarks": 2,
    "negativeMarks": 0.67,
    "date": "2024-06-15T00:00:00Z",
    "startTime": "2024-06-15T09:00:00Z",
    "endTime": "2024-06-15T12:00:00Z",
    "resultPublishTime": "2024-06-16T12:00:00Z"
  },
  {
    "testName": "General Studies Paper 1 - Test 2",
    "noOfQuestions": 100,
    "totalMarks": 200,
    "positiveMarks": 2,
    "negativeMarks": 0.67,
    "date": "2024-06-16T00:00:00Z",
    "startTime": "2024-06-16T09:00:00Z",
    "endTime": "2024-06-16T12:00:00Z",
    "resultPublishTime": "2024-06-17T12:00:00Z"
  }
]
```

**Note:** This endpoint allows adding multiple tests to a test series in a single request. The same rules apply as for adding individual tests:
- The `isFree` flag is automatically determined based on position in the series
- Cannot exceed the `noOfTests` limit for the series
- Tests are added in the order they appear in the array

**Access Control Logic:**
- **Admin View:** Admins can access ALL tests without restriction
- **User View (Non-Purchased):** First 2 tests → Free access, Remaining tests → "Buy to unlock"
- **User View (Purchased):** All tests → Unlocked

**Expected Response:**
```json
{
  "success": true,
  "message": "Tests added to series successfully",
  "data": {
    "addedTests": 2,
    "series": {
      "_id": "test_series_id",
      "name": "UPSC Prelims Test Series",
      "noOfTests": 20,
      "tests": [
        {
          "_id": "test_1_id",
          "testName": "General Studies Paper 1 - Test 1",
          "isFree": true
        },
        {
          "_id": "test_2_id",
          "testName": "General Studies Paper 1 - Test 2",
          "isFree": true
        }
      ]
    }
  }
}
```

#### 2.5 Delete Test from Test Series
**Endpoint:** `DELETE /api/admin/test-series/:seriesId/tests/:testId`

#### 2.6 Bulk Add Tests to Test Series
**Endpoint:** `POST /api/admin/test-series/:seriesId/tests/bulk`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`
- `Content-Type: application/json`

**Request Body:**
```json
{
  "tests": [
    {
      "testName": "General Studies Paper 1 - Test 1",
      "noOfQuestions": 100,
      "totalMarks": 200,
      "positiveMarks": 2,
      "negativeMarks": 0.67,
      "date": "2024-06-15T00:00:00Z",
      "startTime": "2024-06-15T09:00:00Z",
      "endTime": "2024-06-15T12:00:00Z",
      "resultPublishTime": "2024-06-16T12:00:00Z"
    },
    {
      "testName": "General Studies Paper 2 - Test 2",
      "noOfQuestions": 80,
      "totalMarks": 160,
      "positiveMarks": 2,
      "negativeMarks": 0.67,
      "date": "2024-06-16T00:00:00Z",
      "startTime": "2024-06-16T09:00:00Z",
      "endTime": "2024-06-16T12:00:00Z",
      "resultPublishTime": "2024-06-17T12:00:00Z"
    }
  ]
}
```

**Note:** This endpoint allows adding multiple tests to a test series in a single request. The same rules apply as for adding individual tests:
- The `isFree` flag is automatically determined based on position in the series
- Cannot exceed the `noOfTests` limit for the series
- Tests are added in the order they appear in the array

**Access Control Logic:**
- **Admin View:** Admins can access ALL tests without restriction
- **User View (Non-Purchased):** First 2 tests → Free access, Remaining tests → "Buy to unlock"
- **User View (Purchased):** All tests → Unlocked

**Expected Response:
```json
{
  "message": "2 tests added to series successfully",
  "data": {
    "_id": "test_series_id",
    "contentType": "TEST_SERIES",
    "accessType": "PAID",
    "date": null,
    "categories": [],
    "subCategories": [],
    "thumbnail": "https://res.cloudinary.com/.../thumbnail.jpg",
    "name": "UPSC Prelims Test Series",
    "noOfTests": 20,
    "description": "Complete test series for UPSC Prelims preparation",
    "originalPrice": 499,
    "discount": {
      "type": null,
      "value": 0,
      "validUntil": null
    },
    "tests": [
      {
        "_id": "test_id_1",
        "testName": "General Studies Paper 1 - Test 1",
        "noOfQuestions": 100,
        "totalMarks": 200,
        "positiveMarks": 2,
        "negativeMarks": 0.67,
        "date": "2024-06-15T00:00:00Z",
        "startTime": "2024-06-15T09:00:00Z",
        "endTime": "2024-06-15T12:00:00Z",
        "instructionsPage1": null,
        "instructionsPage2": null,
        "instructionsPage3": null,
        "totalExplanationVideoUrl": null,
        "resultPublishTime": "2024-06-16T12:00:00Z",
        "sections": [],
        "isFree": true
      },
      {
        "_id": "test_id_2",
        "testName": "General Studies Paper 2 - Test 2",
        "noOfQuestions": 80,
        "totalMarks": 160,
        "positiveMarks": 2,
        "negativeMarks": 0.67,
        "date": "2024-06-16T00:00:00Z",
        "startTime": "2024-06-16T09:00:00Z",
        "endTime": "2024-06-16T12:00:00Z",
        "instructionsPage1": null,
        "instructionsPage2": null,
        "instructionsPage3": null,
        "totalExplanationVideoUrl": null,
        "resultPublishTime": "2024-06-17T12:00:00Z",
        "sections": [],
        "isFree": true
      }
    ],
    "isActive": true,
    "createdAt": "timestamp",
    "updatedAt": "timestamp",
    "finalPrice": 499
  }
}
```

#### 2.7 Delete Test from Test Series
**Endpoint:** `DELETE /api/admin/test-series/:seriesId/tests/:testId`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`

**Expected Response:**
```json
{
  "message": "Test removed from series successfully",
  "data": {
    "_id": "test_series_id",
    "...": "...",
    "tests": []
  }
}
```

### 3. TEST INSTRUCTIONS

#### 3.1 Update Test Instructions
**Endpoint:** `PUT /api/admin/test-series/:seriesId/tests/:testId/instructions`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`
- `Content-Type: application/json`

**Request Body:**
```json
{
  "instructionsPage1": "Please read all instructions carefully before starting the test.",
  "instructionsPage2": "The test consists of 100 questions with negative marking.",
  "instructionsPage3": "You have 3 hours to complete the test."
}
```

**Expected Response:**
```json
{
  "message": "Test instructions updated successfully",
  "data": {
    "_id": "test_series_id",
    "...": "...",
    "tests": [
      {
        "_id": "test_id",
        "testName": "General Studies Paper 1 - Test 1",
        "instructionsPage1": "Please read all instructions carefully before starting the test.",
        "instructionsPage2": "The test consists of 100 questions with negative marking.",
        "instructionsPage3": "You have 3 hours to complete the test.",
        "...": "..."
      }
    ]
  }
}
```

### 4. TEST EXPLANATION VIDEO

#### 4.1 Update Test Explanation Video
**Endpoint:** `POST /api/admin/test-series/:seriesId/tests/:testId/explanation-video`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`
- `Content-Type: multipart/form-data`

**Form Fields:**
- `explanationVideo`: (select your video file)

**Expected Response:**
```json
{
  "message": "Test explanation video updated successfully",
  "data": {
    "_id": "test_series_id",
    "...": "...",
    "tests": [
      {
        "_id": "test_id",
        "testName": "General Studies Paper 1 - Test 1",
        "totalExplanationVideoUrl": "https://res.cloudinary.com/.../explanation_video.mp4",
        "...": "..."
      }
    ]
  }
}
```

### 5. SECTIONS - Within a Test

#### 5.1 Add Section to Test
**Endpoint:** `POST /api/admin/test-series/:seriesId/tests/:testId/sections`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`
- `Content-Type: application/json`

**Request Body:**
```json
{
  "title": "General Science",
  "order": 1,
  "noOfQuestions": 20
}
```

**Note:** The `noOfQuestions` field represents the maximum number of questions that can be added to this section. This limit is enforced when adding questions to the section.

**Expected Response:**
```json
{
  "message": "Section added to test successfully",
  "data": {
    "_id": "test_series_id",
    "...": "...",
    "tests": [
      {
        "_id": "test_id",
        "testName": "General Studies Paper 1 - Test 1",
        "sections": [
          {
            "_id": "section_id",
            "title": "General Science",
            "order": 1,
            "noOfQuestions": 20,
            "questions": []
          }
        ],
        "...": "..."
      }
    ]
  }
}
```

#### 5.2 Update Section in Test
**Endpoint:** `PUT /api/admin/test-series/:seriesId/tests/:testId/sections/:sectionId`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`
- `Content-Type: application/json`

**Request Body (any combination of fields):**
```json
{
  "title": "Updated General Science",
  "order": 2,
  "noOfQuestions": 25
}
```

**Note:** The `noOfQuestions` field represents the maximum number of questions that can be added to this section. This limit is enforced when adding questions to the section. Reducing this number below the current number of questions in the section is not allowed.

**Expected Response:**
```json
{
  "message": "Section updated successfully",
  "data": {
    "_id": "test_series_id",
    "...": "...",
    "tests": [
      {
        "_id": "test_id",
        "testName": "General Studies Paper 1 - Test 1",
        "sections": [
          {
            "_id": "section_id",
            "title": "Updated General Science",
            "order": 2,
            "noOfQuestions": 25,
            "questions": []
          }
        ],
        "...": "..."
      }
    ]
  }
}
```

#### 5.3 Delete Section from Test
**Endpoint:** `DELETE /api/admin/test-series/:seriesId/tests/:testId/sections/:sectionId`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`

**Expected Response:**
```json
{
  "message": "Section removed from test successfully",
  "data": {
    "_id": "test_series_id",
    "...": "...",
    "tests": [
      {
        "_id": "test_id",
        "testName": "General Studies Paper 1 - Test 1",
        "sections": [],
        "...": "..."
      }
    ]
  }
}
```

### 6. QUESTIONS - Within a Section

#### 6.1 Add Single Question to Section
**Endpoint:** `POST /api/admin/test-series/:seriesId/tests/:testId/sections/:sectionId/questions`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`
- `Content-Type: application/json`

**Note:** Duplicate question numbers are not allowed within a section. The system will reject requests with duplicate question numbers in the same section.

**Request Body:**
```json
{
  "questionNumber": 1,
  "questionText": "What is the capital of India?",
  "options": [
    "Mumbai",
    "Delhi",
    "Kolkata",
    "Chennai"
  ],
  "correctOptionIndex": 1,
  "explanation": "Delhi is the capital of India.",
  "marks": 2,
  "negativeMarks": 0.67
}
```

**Expected Response:**
```json
{
  "message": "Question(s) added to section successfully",
  "data": {
    "_id": "test_series_id",
    "...": "...",
    "tests": [
      {
        "_id": "test_id",
        "testName": "General Studies Paper 1 - Test 1",
        "sections": [
          {
            "_id": "section_id",
            "title": "General Science",
            "questions": [
              {
                "_id": "question_id",
                "questionNumber": 1,
                "questionText": "What is the capital of India?",
                "options": [
                  "Mumbai",
                  "Delhi",
                  "Kolkata",
                  "Chennai"
                ],
                "correctOptionIndex": 1,
                "explanation": "Delhi is the capital of India.",
                "marks": 2,
                "negativeMarks": 0.67
              }
            ]
          }
        ],
        "...": "..."
      }
    ]
  }
}
```

#### 6.2 Add Multiple Questions to Section
**Endpoint:** `POST /api/admin/test-series/:seriesId/tests/:testId/sections/:sectionId/questions`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`
- `Content-Type: application/json`

**Note:** Duplicate question numbers are not allowed within a section. The system will reject requests with duplicate question numbers in the same section. Additionally, the total number of questions cannot exceed the section's noOfQuestions limit.

**Request Body:**
```json
{
  "questions": [
    {
      "questionNumber": 2,
      "questionText": "Which planet is known as the Red Planet?",
      "options": [
        "Earth",
        "Mars",
        "Jupiter",
        "Venus"
      ],
      "correctOptionIndex": 1,
      "explanation": "Mars is known as the Red Planet.",
      "marks": 2,
      "negativeMarks": 0.67
    },
    {
      "questionNumber": 3,
      "questionText": "What is the largest mammal?",
      "options": [
        "Elephant",
        "Blue Whale",
        "Giraffe",
        "Hippopotamus"
      ],
      "correctOptionIndex": 1,
      "explanation": "Blue Whale is the largest mammal.",
      "marks": 2,
      "negativeMarks": 0.67
    }
  ]
}
```

**Expected Response:**
```json
{
  "message": "Question(s) added to section successfully",
  "data": {
    "_id": "test_series_id",
    "...": "...",
    "tests": [
      {
        "_id": "test_id",
        "testName": "General Studies Paper 1 - Test 1",
        "sections": [
          {
            "_id": "section_id",
            "title": "General Science",
            "questions": [
              {
                "_id": "question_id_1",
                "questionNumber": 1,
                "questionText": "What is the capital of India?",
                "...": "..."
              },
              {
                "_id": "question_id_2",
                "questionNumber": 2,
                "questionText": "Which planet is known as the Red Planet?",
                "...": "..."
              },
              {
                "_id": "question_id_3",
                "questionNumber": 3,
                "questionText": "What is the largest mammal?",
                "...": "..."
              }
            ]
          }
        ],
        "...": "..."
      }
    ]
  }
}
```

#### 6.3 Update Question in Section
**Endpoint:** `PUT /api/admin/test-series/:seriesId/tests/:testId/sections/:sectionId/questions/:questionId`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`
- `Content-Type: application/json`

**Request Body (any combination of fields):**
```json
{
  "questionText": "What is the capital city of India?",
  "options": [
    "Mumbai",
    "New Delhi",
    "Kolkata",
    "Chennai"
  ],
  "correctOptionIndex": 1,
  "explanation": "New Delhi is the capital city of India.",
  "marks": 3,
  "negativeMarks": 1
}
```

**Expected Response:**
```json
{
  "message": "Question updated successfully",
  "data": {
    "_id": "test_series_id",
    "...": "...",
    "tests": [
      {
        "_id": "test_id",
        "testName": "General Studies Paper 1 - Test 1",
        "sections": [
          {
            "_id": "section_id",
            "title": "General Science",
            "questions": [
              {
                "_id": "question_id",
                "questionNumber": 1,
                "questionText": "What is the capital city of India?",
                "options": [
                  "Mumbai",
                  "New Delhi",
                  "Kolkata",
                  "Chennai"
                ],
                "correctOptionIndex": 1,
                "explanation": "New Delhi is the capital city of India.",
                "marks": 3,
                "negativeMarks": 1
              }
            ]
          }
        ],
        "...": "..."
      }
    ]
  }
}
```

#### 6.4 Delete Question from Section
**Endpoint:** `DELETE /api/admin/test-series/:seriesId/tests/:testId/sections/:sectionId/questions/:questionId`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`

**Expected Response:**
```json
{
  "message": "Question removed from section successfully",
  "data": {
    "_id": "test_series_id",
    "...": "...",
    "tests": [
      {
        "_id": "test_id",
        "testName": "General Studies Paper 1 - Test 1",
        "sections": [
          {
            "_id": "section_id",
            "title": "General Science",
            "questions": []
          }
        ],
        "...": "..."
      }
    ]
  }
}
```

### 7. TEST ATTEMPT MANAGEMENT

#### 7.1 Set Cutoff for Test
**Endpoint:** `POST /api/admin/test-series/:seriesId/tests/:testId/cutoff`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`
- `Content-Type: application/json`

**Request Body:**
```json
{
  "general": 120,
  "obc": 110,
  "sc": 100,
  "st": 90
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Cutoff set successfully",
  "data": {
    "_id": "cutoff_id",
    "testSeries": "test_series_id",
    "testId": "test_id",
    "cutoff": {
      "general": 120,
      "obc": 110,
      "sc": 100,
      "st": 90
    },
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
}
```

#### 7.2 Get Cutoff for Test
**Endpoint:** `GET /api/admin/test-series/:seriesId/tests/:testId/cutoff`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`

**Expected Response:**
```json
{
  "success": true,
  "message": "Cutoff fetched successfully",
  "data": {
    "_id": "cutoff_id",
    "testSeries": "test_series_id",
    "testId": "test_id",
    "cutoff": {
      "general": 120,
      "obc": 110,
      "sc": 100,
      "st": 90
    },
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
}
```

#### 7.3 Update Cutoff for Test
**Endpoint:** `PUT /api/admin/test-series/:seriesId/tests/:testId/cutoff`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`
- `Content-Type: application/json`

**Request Body (any combination of fields):**
```json
{
  "general": 125,
  "obc": 115
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Cutoff updated successfully",
  "data": {
    "_id": "cutoff_id",
    "testSeries": "test_series_id",
    "testId": "test_id",
    "cutoff": {
      "general": 125,
      "obc": 115,
      "sc": 100,
      "st": 90
    },
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
}
```

#### 7.4 Delete Cutoff for Test
**Endpoint:** `DELETE /api/admin/test-series/:seriesId/tests/:testId/cutoff`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`

**Expected Response:**
```json
{
  "success": true,
  "message": "Cutoff deleted successfully"
}
```

#### 7.5 View All Participants Score, Rank, Accuracy
**Endpoint:** `GET /api/admin/test-series/:seriesId/tests/:testId/participants`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`

**Expected Response:**
```json
{
  "success": true,
  "message": "Participants fetched successfully",
  "data": [
    {
      "userId": "user_id",
      "userName": "John Doe",
      "userEmail": "john@example.com",
      "score": 180,
      "rank": 1,
      "accuracy": 90,
      "totalParticipants": 100,
      "correct": 90,
      "incorrect": 10,
      "unattempted": 0,
      "speed": 30
    }
  ]
}
```

---

## USER APIs (PUBLIC)

### 1. List Public Test Series
**Endpoint:** `GET /api/user/test-series`  

**Query Parameters (optional):**
- `category`: Filter by category ID
- `subCategory`: Filter by sub-category ID
- `isActive`: Filter by active status (true/false, default: true)
- `minPrice`: Minimum price filter
- `maxPrice`: Maximum price filter

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "test_series_id",
      "contentType": "TEST_SERIES",
      "accessType": "PAID",
      "date": null,
      "categories": [],
      "subCategories": [],
      "thumbnail": "https://res.cloudinary.com/.../thumbnail.jpg",
      "name": "UPSC Prelims Test Series",
      "noOfTests": 20,
      "description": "Complete test series for UPSC Prelims preparation",
      "originalPrice": 499,
      "discount": {
        "type": null,
        "value": 0,
        "validUntil": null
      },
      "language": "English",
      "validity": "Lifetime",
      "tests": [],
      "isActive": true,
      "createdAt": "timestamp",
      "updatedAt": "timestamp",
      "finalPrice": 499
    }
  ]
}
```

### 2. Get Single Public Test Series
**Endpoint:** `GET /api/user/test-series/:id`  

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "_id": "test_series_id",
    "contentType": "TEST_SERIES",
    "accessType": "PAID",
    "date": null,
    "categories": [],
    "subCategories": [],
    "thumbnail": "https://res.cloudinary.com/.../thumbnail.jpg",
    "name": "UPSC Prelims Test Series",
    "noOfTests": 20,
    "description": "Complete test series for UPSC Prelims preparation",
    "originalPrice": 499,
    "discount": {
      "type": null,
      "value": 0,
      "validUntil": null
    },
    "language": "English",
    "validity": "Lifetime",
    "tests": [],
    "isActive": true,
    "createdAt": "timestamp",
    "updatedAt": "timestamp",
    "finalPrice": 499
  }
}
```

### 3. Test Attempt APIs

#### 3.1 Start Test
**Endpoint:** `POST /api/user/test-attempt/:seriesId/:testId/start`  
**Headers:** 
- `Authorization: Bearer <user_jwt_token>`

**Note:** Users can only start tests when they are in 'live' state. Test timing states are enforced as follows:
- **upcoming**: Before startTime
- **live**: Between startTime and endTime
- **result_pending**: After endTime but before resultPublishTime
- **results_available**: After resultPublishTime or if no resultPublishTime, after endTime

**Expected Response:**
```json
{
  "success": true,
  "message": "Test started successfully",
  "data": {
    "_id": "test_attempt_id",
    "user": "user_id",
    "testSeries": "test_series_id",
    "testId": "test_id",
    "startedAt": "timestamp",
    "responses": [],
    "resultGenerated": false,
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
}
```

**Note:** This endpoint is protected by the purchase check middleware. Users must either:
1. Have purchased the test series, or
2. Be accessing one of the first 2 free tests in the series, or
3. Be accessing a test series marked as FREE

#### 3.2 Submit Answer
**Endpoint:** `POST /api/user/test-attempt/:seriesId/:testId/submit-question`  
**Headers:** 
- `Authorization: Bearer <user_jwt_token>`
- `Content-Type: application/json`

**Note:** Users can only submit answers when the test is in 'live' state. Test timing states are enforced.

**Request Body:**
```json
{
  "sectionId": "section_id",
  "questionId": "question_id",
  "selectedOption": 1,
  "timeTaken": 45
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Answer submitted successfully",
  "data": {
    "isCorrect": true,
    "correctOption": 1
  }
}
```

**Note:** This endpoint is protected by the purchase check middleware. Users must either:
1. Have purchased the test series, or
2. Be accessing one of the first 2 free tests in the series, or
3. Be accessing a test series marked as FREE

#### 3.3 Submit Test (Finish Test)
**Endpoint:** `POST /api/user/test-attempt/:seriesId/:testId/submit`  
**Headers:** 
- `Authorization: Bearer <user_jwt_token>`

**Note:** Users can only submit tests when the test is in 'live' state. Test timing states are enforced.

**Expected Response:**
```json
{
  "success": true,
  "message": "Test submitted successfully",
  "data": {
    "_id": "test_attempt_id",
    "user": "user_id",
    "testSeries": "test_series_id",
    "testId": "test_id",
    "startedAt": "timestamp",
    "submittedAt": "timestamp",
    "responses": [
      {
        "sectionId": "section_id",
        "questionId": "question_id",
        "selectedOption": 1,
        "isCorrect": true,
        "timeTaken": 45
      }
    ],
    "score": 180,
    "correct": 90,
    "incorrect": 10,
    "unattempted": 0,
    "accuracy": 90,
    "speed": 30,
    "percentage": 90,
    "rank": 1,
    "resultGenerated": true,
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
}
```

**Note:** This endpoint is protected by the purchase check middleware. Users must either:
1. Have purchased the test series, or
2. Be accessing one of the first 2 free tests in the series, or
3. Be accessing a test series marked as FREE

#### 3.4 Get Full Result Analysis
**Endpoint:** `GET /api/user/test-attempt/:attemptId/result`  
**Headers:** 
- `Authorization: Bearer <user_jwt_token>`

**Note:** Users can only view results when the test is in 'results_available' state. Test timing states are enforced.

**Expected Response:**
```json
{
  "success": true,
  "message": "Result analysis fetched successfully",
  "data": {
    "userSummary": {
      "userName": "John Doe",
      "userEmail": "john@example.com",
      "testName": "General Studies Paper 1 - Test 1",
      "testSeriesName": "UPSC Prelims Test Series",
      "score": 180,
      "correct": 90,
      "incorrect": 10,
      "unattempted": 0,
      "accuracy": 90,
      "speed": 30,
      "percentage": 90,
      "rank": 1,
      "totalParticipants": 100,
      "percentile": 99
    },
    "cutoffAnalysis": {
      "status": "Passed",
      "userCategory": "GEN",
      "cutoffs": {
        "general": 120,
        "obc": 110,
        "sc": 100,
        "st": 90
      }
    },
    "sectionReport": [
      {
        "sectionName": "General Science",
        "correct": 45,
        "incorrect": 5,
        "unattempted": 0,
        "accuracy": 90,
        "total": 50
      }
    ],
    "performanceAnalysis": {
      "strongestArea": "General Science",
      "weakestArea": "History"
    },
    "questionReport": [
      {
        "questionText": "What is the capital of India?",
        "userAnswer": 1,
        "correctAnswer": 1,
        "status": "Correct",
        "explanation": "Delhi is the capital of India.",
        "section": "General Science"
      }
    ]
  }
}
```

**Note:** This endpoint is protected by the purchase check middleware. Users must either:
1. Have purchased the test series, or
2. Be accessing one of the first 2 free tests in the series, or
3. Be accessing a test series marked as FREE

Additionally, results are only visible when the test is in 'results_available' state based on timing configuration.

#### 3.5 Get User's Test Attempts
**Endpoint:** `GET /api/user/test-attempt/my-attempts`  
**Headers:** 
- `Authorization: Bearer <user_jwt_token>`

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "test_attempt_id",
      "user": "user_id",
      "testSeries": "test_series_id",
      "testId": "test_id",
      "startedAt": "timestamp",
      "submittedAt": "timestamp",
      "responses": [],
      "score": 180,
      "correct": 90,
      "incorrect": 10,
      "unattempted": 0,
      "accuracy": 90,
      "speed": 30,
      "percentage": 90,
      "rank": 1,
      "resultGenerated": true,
      "createdAt": "timestamp",
      "updatedAt": "timestamp"
    }
  ]
}
```

---

## Validation Rules

### Test Series Creation/Update
* ✅ name is required
* ✅ noOfTests must be greater than 0
* ✅ originalPrice cannot be negative
* ✅ categoryIds and subCategoryIds must be valid ObjectId arrays
* ✅ discount validation:
  * discountType must be "percentage" or "fixed" (or null/empty to remove)
  * discountValue must be a positive number
  * percentage discounts cannot exceed 100%
  * discountValidUntil must be a future date if provided
* ✅ date must be a valid ISO date string if provided
* ✅ language must be a non-empty string if provided
* ✅ validity must be a non-empty string if provided

### Test Creation/Update
* ✅ testName is required
* ❌ noOfQuestions, totalMarks, positiveMarks, negativeMarks are optional but should be consistent
* ✅ startTime must be before endTime
* ✅ date should be consistent with startTime/endTime
* ✅ resultPublishTime must be after endTime if provided
* ✅ isFree flag is automatically set based on test position (first 2 tests are free)
* ✅ FREE/PAID access is determined dynamically, not stored in database
* ✅ Access control enforced by purchase check middleware
* ✅ Admins bypass all access restrictions
* ✅ Users can access first 2 tests free, remaining require purchase
* ✅ Cannot add more tests than noOfTests limit
* ✅ Test timing states enforced (upcoming, live, result_pending, results_available)
* ✅ Users can only start tests when they are in 'live' state
* ✅ Results are only visible after resultPublishTime

### Section Creation/Update
* ✅ title is required
* ❌ order and noOfQuestions are optional
* ✅ noOfQuestions limit enforced when adding questions
* ✅ Duplicate question numbers are not allowed within a section
* ✅ Section question limits enforced during question addition

### Question Creation/Update
* ✅ questionText is required
* ✅ options array is required
* ✅ correctOptionIndex must be valid index in options array
* ✅ marks and negativeMarks should be non-negative numbers

### Test Attempt Management
* ✅ resultPublishTime controls when results are visible to users
* ✅ cutoff values must be non-negative numbers
* ✅ only admins can set/view cutoffs
* ✅ participants list is only visible after resultPublishTime
* ✅ Test timing states enforced (upcoming, live, result_pending, results_available)
* ✅ Users can only start tests when they are in 'live' state
* ✅ Results are only visible after resultPublishTime
* ✅ Purchase check middleware prevents unauthorized access to paid tests
* ✅ Users must purchase test series before accessing paid tests (except first 2 free tests)
* ✅ Access control logic: First 2 tests → Free, Tests 3+ → Require purchase
* ✅ Admins can access all tests without purchase requirements
* ✅ Dynamic access determination at runtime (not stored in DB)

---

## Testing Steps Summary

1. **Setup Phase:**
   - Create categories and sub-categories if needed
   - Create a test series with basic information
   - Verify test series is stored correctly

2. **Adding Tests:**
   - Add multiple tests to the test series
   - Verify the first 2 tests are marked as free automatically
   - Check that you cannot exceed noOfTests limit
   - Set resultPublishTime to control when results are visible
   - Test bulk test upload functionality

3. **Adding Sections:**
   - Add sections to each test
   - Verify sections are properly associated with tests

4. **Adding Questions:**
   - Add questions to each section
   - Verify noOfQuestions limit is enforced
   - Test both single and bulk question addition

5. **Updating Content:**
   - Update test series details
   - Update test information
   - Update section details
   - Update question content

6. **Deleting Content:**
   - Delete questions from sections
   - Delete sections from tests
   - Delete tests from series
   - Delete entire test series

7. **Setting Up Test Controls:**
   - Set cutoff scores for different categories
   - Configure result publish time
   - Add test instructions
   - Upload explanation videos

8. **User Test Flow Testing:**
   - Start a test as a user
   - Submit answers to questions
   - Finish the test
   - View results (only after resultPublishTime)
   - Check ranking and performance analysis

9. **Admin Monitoring:**
   - View participant scores and rankings
   - Update cutoff scores
   - Monitor test attempts

10. **User Access Testing:**
    - Test public endpoints for listing and retrieving test series
    - Verify proper data is exposed to users
    - Confirm authentication is required for user test attempt endpoints
    - Ensure result visibility is controlled by resultPublishTime
    - Verify purchase check middleware prevents unauthorized access to paid tests
    - Test bulk test upload functionality
    - Verify test timing state enforcement (upcoming, live, result_pending, results_available)
    - Confirm section question limits are enforced
    - Validate that only the first 2 tests are free regardless of manual settings
    - **FREE/Paid Access Testing:**
      * Verify first 2 tests in any series are accessible without purchase
      * Confirm tests 3+ require purchase for access
      * Test admin override (admins can access all tests)
      * Validate dynamic access determination (no `isFree` field in database)
      * Check proper error messaging for restricted tests
      * Verify "Buy to unlock" UI elements display correctly
      * Test access persistence for purchased users

11. **Filtering Testing:**
    - Test category-based filtering:
      * Request: `GET /api/admin/test-series?category=<category_id>`
      * Expected: Only test series belonging to the specified category are returned
    - Test sub-category filtering:
      * Request: `GET /api/admin/test-series?subCategory=<sub_category_id>`
      * Expected: Only test series belonging to the specified sub-category are returned
    - Test active status filtering:
      * Request: `GET /api/admin/test-series?isActive=true`
      * Expected: Only active test series are returned
      * Request: `GET /api/admin/test-series?isActive=false`
      * Expected: Only inactive test series are returned
    - Test price range filtering:
      * Request: `GET /api/admin/test-series?minPrice=100&maxPrice=500`
      * Expected: Only test series with originalPrice between 100 and 500 are returned
      * Request: `GET /api/admin/test-series?minPrice=300`
      * Expected: Only test series with originalPrice >= 300 are returned
    - Test combined filtering:
      * Request: `GET /api/admin/test-series?category=<category_id>&isActive=true&minPrice=100`
      * Expected: Only active test series belonging to the specified category with originalPrice >= 100 are returned
    - Test user-side filtering:
      * Request: `GET /api/user/test-series?category=<category_id>`
      * Expected: Only active test series belonging to the specified category are returned to users

Ensure all endpoints return appropriate error messages for invalid requests.

---

## FREE vs PAID Test Access Logic

### Core Design Principle

The Brain Buzz platform implements a sophisticated access control system for test series that differentiates between FREE and PAID content. This system is designed with the following principles:

1. **Dynamic Access Determination**: FREE/PAID status is calculated at runtime, not stored in the database
2. **Position-Based Access**: The first 2 tests in any series are automatically FREE
3. **Flexible Rules**: Business rules can be easily modified without database changes
4. **Clear Separation**: Different access rules for Admins vs Users

### Implementation Details

#### How FREE/Paid Access Works

1. **No Persistent Storage**: The `isFree` field is NEVER stored in the database
2. **Runtime Calculation**: Access type is determined dynamically based on test position
3. **Automatic Assignment**: First 2 tests = FREE, Remaining tests = PAID
4. **Admin Override**: Admins bypass all access restrictions

#### User Access Scenarios

**Scenario 1: Non-Purchased User**
- Can access first 2 tests in any series (FREE)
- Cannot access tests 3+ without purchasing the series
- Sees "Buy to unlock" messaging for paid tests

**Scenario 2: Purchased User**
- Can access ALL tests in the purchased series
- No restrictions based on test position
- Full access to all test features

**Scenario 3: Admin User**
- Can access ALL tests in ALL series
- No purchase requirements
- No position-based restrictions
- Full administrative capabilities

### Benefits of This Approach

#### 1. Database Efficiency
- No redundant `isFree` fields cluttering the database
- Cleaner data model with fewer maintenance concerns
- Reduced storage overhead

#### 2. Business Flexibility
- Can easily change "first 2 free" to "first 3 free" with one code change
- No database migrations required for rule changes
- A/B testing different free tier strategies

#### 3. Security & Consistency
- Eliminates possibility of inconsistent `isFree` flags
- Centralized logic reduces bugs
- Admins always have full access regardless of flags

#### 4. Payment Integration
- Seamless integration with Razorpay and other payment systems
- Clear distinction between free and paid content for billing
- Automatic access granting upon successful purchase

### Technical Implementation

#### Backend Logic

The FREE/PAID determination happens in the controller layer:

```javascript
// For user-facing endpoints
const testsWithAccessInfo = testSeries.tests.map((test, index) => ({
  ...test.toObject(),
  accessType: index < 2 ? "FREE" : "PAID",
  hasAccess: userHasPurchased || index < 2
}));
```

#### Access Control Middleware

Purchase check middleware enforces access rules:

```javascript
// Simplified logic
if (userHasPurchased(testSeriesId)) {
  allowAccess();
} else if (testIndex < 2) {
  allowAccess();
} else {
  blockAccess();
}
```

### Testing Guidelines

#### Admin Testing
1. Verify admins can access ALL tests regardless of position
2. Confirm no purchase requirements for admin users
3. Test CRUD operations on tests 1-N without restrictions

#### User Testing (Non-Purchased)
1. Verify free access to tests 1-2 in any series
2. Confirm blocked access to tests 3+ without purchase
3. Check proper error messaging for restricted tests
4. Validate "Buy to unlock" UI elements

#### User Testing (Purchased)
1. Verify full access to ALL tests after purchase
2. Confirm no position-based restrictions post-purchase
3. Test all test features work correctly
4. Validate access persists across sessions

#### Edge Cases
1. Series with only 1 test (should be FREE)
2. Series with only 2 tests (both should be FREE)
3. Adding/removing tests affecting position-based access
4. Changing test order and impact on FREE/PAID status
5. Bulk operations maintaining correct access logic