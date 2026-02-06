# Admin Test Series APIs Documentation

## Overview
This document outlines all the Admin-specific APIs for managing and taking test series. The admin portal operates separately from the user portal with its own authentication and routes. Admins can bypass purchase restrictions and attempt tests unlimited times.

## Authentication
All admin APIs require admin authentication using the `authenticateAdmin` middleware. Include the admin JWT token in the Authorization header:

```
Authorization: Bearer <admin-jwt-token>
```

## Base URL
```
http://localhost:5000/api/admin/
```

---

## 🔑 Authentication APIs

### Admin Login
```
POST /api/admin/login
```
Authenticate admin user to get JWT token for subsequent API calls.

---

## 📋 Test Series Management APIs

### Get All Test Series
```
GET /api/admin/test-series
```
**Description:** Get all test series available in the system (no access restrictions for admin).

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search by name or description
- `category` (optional): Filter by category ID
- `subCategory` (optional): Filter by subcategory ID

**Response:**
```json
{
  "success": true,
  "message": "Test series fetched successfully",
  "data": {
    "testSeries": [
      {
        "_id": "string",
        "name": "string",
        "description": "string",
        "thumbnail": "string",
        "category": {},
        "subCategory": {},
        "totalTests": 5,
        "publishedTests": 4,
        "upcomingTests": 0,
        "liveTests": 1,
        "isPublished": true,
        "createdAt": "timestamp",
        "updatedAt": "timestamp"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalItems": 1,
      "itemsPerPage": 10
    }
  }
}
```

### Get Test Series by ID
```
GET /api/admin/test-series/:seriesId
```
**Description:** Get detailed information about a specific test series.

**Parameters:**
- `seriesId`: ID of the test series

**Response:**
```json
{
  "success": true,
  "message": "Test series fetched successfully",
  "data": {
    "_id": "string",
    "name": "string",
    "description": "string",
    "thumbnail": "string",
    "category": {},
    "subCategory": {},
    "isPublished": true,
    "createdAt": "timestamp",
    "updatedAt": "timestamp",
    "tests": [
      {
        "_id": "string",
        "testName": "string",
        "durationInSeconds": 3600,
        "positiveMarks": 4,
        "negativeMarks": 0.5,
        "isPublished": true,
        "startTime": "timestamp",
        "endTime": "timestamp",
        "totalQuestions": 10,
        "sections": 2
      }
    ]
  }
}
```

### Get Test by ID
```
GET /api/admin/test-series/:seriesId/tests/:testId
```
**Description:** Get detailed information about a specific test including full question visibility (correct answers, explanations).

**Parameters:**
- `seriesId`: ID of the test series
- `testId`: ID of the test

**Response:**
```json
{
  "success": true,
  "message": "Test fetched successfully",
  "data": {
    "testSeriesName": "string",
    "test": {
      "_id": "string",
      "testName": "string",
      "durationInSeconds": 3600,
      "positiveMarks": 4,
      "negativeMarks": 0.5,
      "isPublished": true,
      "startTime": "timestamp",
      "endTime": "timestamp",
      "totalMarks": 40,
      "sections": [
        {
          "_id": "string",
          "title": "string",
          "questions": [
            {
              "_id": "string",
              "questionNumber": 1,
              "questionText": "string",
              "options": ["option1", "option2", "option3", "option4"],
              "correctOptionIndex": 2,
              "explanation": "string",
              "marks": 4,
              "negativeMarks": 0.5
            }
          ]
        }
      ]
    }
  }
}
```

---

## 📊 Filter APIs

### Get Test Series Categories
```
GET /api/admin/filters/test-series/categories
```
**Description:** Get all available test series categories.

### Get Test Series Subcategories
```
GET /api/admin/filters/test-series/subcategories
```
**Description:** Get all available test series subcategories.

---

## 🧪 Exam Taking APIs

### Start Test
```
POST /api/admin/test-attempts/:seriesId/:testId/start
```
**Description:** Start a test attempt. Admins can bypass purchase restrictions and take tests unlimited times.

**Parameters:**
- `seriesId`: ID of the test series
- `testId`: ID of the test

**Response:**
```json
{
  "success": true,
  "message": "Test started successfully",
  "data": {
    "attemptId": "string",
    "testName": "string",
    "durationInSeconds": 3600,
    "totalMarks": 40,
    "startedAt": "timestamp"
  }
}
```

### Get Live Questions
```
GET /api/admin/test-attempts/:attemptId/questions
```
**Description:** Get all questions for the current test attempt. Admins can see correct answers and explanations.

**Parameters:**
- `attemptId`: ID of the test attempt

**Response:**
```json
{
  "success": true,
  "message": "Questions fetched successfully",
  "data": {
    "testName": "string",
    "durationInSeconds": 3600,
    "totalMarks": 40,
    "testState": "live",
    "questions": [
      {
        "questionId": "string",
        "questionNumber": 1,
        "questionText": "string",
        "options": ["option1", "option2", "option3", "option4"],
        "selectedOption": null,
        "isCorrect": null,
        "timeTaken": 0,
        "markedForReview": false,
        "visited": false,
        "attempted": false,
        "sectionId": "string",
        "sectionTitle": "string",
        "correctOptionIndex": 2,
        "explanation": "string",
        "marks": 4,
        "negativeMarks": 0.5
      }
    ]
  }
}
```

### Submit Question
```
POST /api/admin/test-attempts/:seriesId/:testId/submit-question
```
**Description:** Submit an answer for a specific question.

**Parameters:**
- `seriesId`: ID of the test series
- `testId`: ID of the test

**Request Body:**
```json
{
  "questionId": "string",
  "selectedOption": 2,
  "timeTaken": 30,
  "markedForReview": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Question submitted successfully",
  "data": {
    "questionId": "string",
    "selectedOption": 2,
    "isCorrect": true,
    "markedForReview": true
  }
}
```

### Visit Question
```
POST /api/admin/test-attempts/:seriesId/:testId/visit-question
```
**Description:** Mark a question as visited without submitting an answer.

**Request Body:**
```json
{
  "questionId": "string"
}
```

### Submit Test
```
POST /api/admin/test-attempts/:seriesId/:testId/submit
```
**Description:** Submit the entire test and calculate results.

**Parameters:**
- `seriesId`: ID of the test series
- `testId`: ID of the test

**Response:**
```json
{
  "success": true,
  "message": "Test submitted successfully",
  "data": {
    "attemptId": "string",
    "score": 36,
    "correct": 9,
    "incorrect": 1,
    "unattempted": 0,
    "accuracy": 90,
    "percentage": 90,
    "totalTime": 1200
  }
}
```

### Get Result Analysis
```
GET /api/admin/test-attempts/:attemptId/result
```
**Description:** Get detailed result analysis for a submitted test. Admin results don't include cutoff, rank, or percentile.

**Parameters:**
- `attemptId`: ID of the test attempt

**Response:**
```json
{
  "success": true,
  "message": "Result analysis fetched successfully",
  "data": {
    "userSummary": {
      "userName": "string",
      "userEmail": "string",
      "testName": "string",
      "testSeriesName": "string",
      "score": 36,
      "maxScore": 40,
      "correct": 9,
      "incorrect": 1,
      "unattempted": 0,
      "accuracy": 90,
      "speed": 0.45,
      "percentage": 90
    },
    "sectionReport": [
      {
        "sectionName": "string",
        "correct": 5,
        "incorrect": 0,
        "unattempted": 0,
        "accuracy": 100,
        "total": 5
      }
    ],
    "performanceAnalysis": {
      "strongestArea": "string",
      "weakestArea": "string"
    },
    "questionReport": [
      {
        "questionText": "string",
        "userAnswer": 2,
        "correctAnswer": 2,
        "status": "Correct",
        "explanation": "string",
        "section": "string"
      }
    ]
  }
}
```

### Get My Attempts
```
GET /api/admin/test-attempts/my-attempts
```
**Description:** Get all test attempts made by the admin user (unlimited attempts allowed).

**Query Parameters:**
- `seriesId` (optional): Filter by test series ID
- `testId` (optional): Filter by test ID

**Response:**
```json
{
  "success": true,
  "message": "Attempts fetched successfully",
  "data": [
    {
      "attemptId": "string",
      "testName": "string",
      "testSeriesName": "string",
      "startedAt": "timestamp",
      "submittedAt": "timestamp",
      "status": "SUBMITTED",
      "score": 36,
      "correct": 9,
      "incorrect": 1,
      "unattempted": 0,
      "accuracy": 90,
      "percentage": 90
    }
  ]
}
```

---

## 🔐 Admin Authentication Required
All the above APIs require admin authentication. Make sure to include the admin JWT token in the Authorization header for each request.

## 📝 Key Differences from User APIs
1. **No Purchase Checks**: Admins can attempt any test without purchase validation
2. **Unlimited Attempts**: No restriction on number of attempts per test
3. **Full Visibility**: Admins can see correct answers and explanations during the test
4. **No Leaderboard Impact**: Admin attempts don't affect rankings
5. **No Cutoff Evaluation**: Admin results don't include cutoff analysis
6. **No Rank/Percentile**: Admin results exclude competitive metrics

## 🚀 Testing Tips
- Use separate admin credentials for testing
- Verify that admin attempts are flagged with `isAdminAttempt: true`
- Test unlimited attempts on the same test
- Confirm that admin results don't appear in leaderboards
- Ensure admin can access expired/past tests for review purposes