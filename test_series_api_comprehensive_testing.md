# Test Series API - Comprehensive Testing Guide

## Table of Contents
1. [Overview](#overview)
2. [Authentication Setup](#authentication-setup)
3. [API Endpoints](#api-endpoints)
4. [Test Scenarios](#test-scenarios)
5. [Expected Responses](#expected-responses)
6. [Error Cases](#error-cases)
7. [Integration Flows](#integration-flows)

## Overview

This document provides comprehensive testing instructions for the Brain Buzz Test Series API endpoints. The system includes complete exam-taking functionality with purchase flows, access control, and result analysis.

**Base URL**: `http://localhost:5000/api/v1`

## Authentication Setup

### 1. Get JWT Token
```bash
# Login as a user to get JWT token
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### 2. Store JWT Token
- Copy the JWT token from response
- Use in Authorization header: `Authorization: Bearer <TOKEN>`

## API Endpoints

### 1. List Test Series (Public)

**Endpoint**: `GET /api/v1/test-series`

#### Test Steps:
1. **Basic Listing**
   ```bash
   curl -X GET "http://localhost:5000/api/v1/test-series" \
   -H "Authorization: Bearer <JWT_TOKEN>"
   ```

2. **Filter by Category**
   ```bash
   curl -X GET "http://localhost:5000/api/v1/test-series?category=<CATEGORY_ID>" \
   -H "Authorization: Bearer <JWT_TOKEN>"
   ```

3. **Filter by Subcategory**
   ```bash
   curl -X GET "http://localhost:5000/api/v1/test-series?subCategory=<SUBCATEGORY_ID>" \
   -H "Authorization: Bearer <JWT_TOKEN>"
   ```

4. **Filter by Language**
   ```bash
   curl -X GET "http://localhost:5000/api/v1/test-series?lang=en" \
   -H "Authorization: Bearer <JWT_TOKEN>"
   ```

5. **Combined Filters**
   ```bash
   curl -X GET "http://localhost:5000/api/v1/test-series?category=<CAT_ID>&subCategory=<SUBCAT_ID>&lang=en" \
   -H "Authorization: Bearer <JWT_TOKEN>"
   ```

#### Expected Response:
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
      "categories": [...],
      "subCategories": [...],
      "languages": [...],
      "validity": {...},
      "originalPrice": 11000,
      "discount": {
        "type": "fixed",
        "value": 2000,
        "validUntil": null
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

### 2. Get Test Series Detail

**Endpoint**: `GET /api/v1/test-series/:seriesId`

#### Test Steps:
1. **Get Specific Test Series**
   ```bash
   curl -X GET "http://localhost:5000/api/v1/test-series/<SERIES_ID>" \
   -H "Authorization: Bearer <JWT_TOKEN>"
   ```

#### Expected Response:
```json
{
  "success": true,
  "data": {
    "_id": "6945183be8f6a9598db072e2",
    "name": "UPSC Prelims Test Series",
    "description": "Complete test series for UPSC Prelims preparation",
    "thumbnail": "https://example.com/thumbnail.jpg",
    "date": "2025-11-30T18:30:00.000Z",
    "maxTests": 3,
    "categories": [...],
    "subCategories": [...],
    "languages": [...],
    "validity": {...},
    "originalPrice": 11000,
    "discount": {
      "type": "fixed",
      "value": 2000,
      "validUntil": null
    },
    "tests": [
      {
        "_id": "69451a8b992ffa16756db2d3",
        "testName": "Test-1",
        "noOfQuestions": 6,
        "totalMarks": 24,
        "positiveMarks": 4,
        "negativeMarks": 0.5,
        "date": "2024-06-15T00:00:00.000Z",
        "startTime": "2024-06-16T09:00:00.000Z",
        "endTime": "2024-06-16T12:00:00.000Z",
        "testState": "upcoming",
        "accessType": "FREE",
        "hasAccess": true,
        "resultPublishTime": null
      }
    ],
    "hasAccess": false
  }
}
```

### 3. Start Test

**Endpoint**: `POST /api/v1/test-attempts/:seriesId/:testId/start`

#### Prerequisites:
- User must have access to the test series
- Test must be in "live" state
- No active attempt should exist for the same test

#### Test Steps:
1. **Start a Test**
   ```bash
   curl -X POST "http://localhost:5000/api/v1/test-attempts/<SERIES_ID>/<TEST_ID>/start" \
   -H "Authorization: Bearer <JWT_TOKEN>" \
   -H "Content-Type: application/json"
   ```

2. **Verify Multiple Attempt Prevention**
   - Try starting the same test again (should return error)

#### Expected Response:
```json
{
  "success": true,
  "message": "Test started successfully",
  "data": {
    "_id": "test_attempt_id",
    "user": "user_id",
    "testSeries": "series_id",
    "testId": "test_id",
    "startedAt": "2024-01-28T10:00:00.000Z",
    "responses": []
  }
}
```

### 4. Submit Answer

**Endpoint**: `POST /api/v1/test-attempts/:seriesId/:testId/submit-question`

#### Test Steps:
1. **Submit an Answer**
   ```bash
   curl -X POST "http://localhost:5000/api/v1/test-attempts/<SERIES_ID>/<TEST_ID>/submit-question" \
   -H "Authorization: Bearer <JWT_TOKEN>" \
   -H "Content-Type: application/json" \
   -d '{
     "sectionId": "section_id",
     "questionId": "question_id",
     "selectedOption": 0,
     "timeTaken": 45
   }'
   ```

#### Expected Response:
```json
{
  "success": true,
  "message": "Answer submitted successfully",
  "data": {
    "isCorrect": true
    // NOTE: correctOption is NOT returned to prevent cheating
  }
}
```

### 5. Submit Test (Complete)

**Endpoint**: `POST /api/v1/test-attempts/:seriesId/:testId/submit`

#### Test Steps:
1. **Submit Completed Test**
   ```bash
   curl -X POST "http://localhost:5000/api/v1/test-attempts/<SERIES_ID>/<TEST_ID>/submit" \
   -H "Authorization: Bearer <JWT_TOKEN>" \
   -H "Content-Type: application/json"
   ```

#### Expected Response:
```json
{
  "success": true,
  "message": "Test submitted successfully",
  "data": {
    "_id": "attempt_id",
    "user": "user_id",
    "testSeries": "series_id",
    "testId": "test_id",
    "score": 85,
    "correct": 17,
    "incorrect": 3,
    "unattempted": 5,
    "accuracy": 85.0,
    "speed": 1.2,
    "percentage": 70.8,
    "rank": 5,
    "resultGenerated": true,
    "submittedAt": "2024-01-28T11:30:00.000Z"
  }
}
```

### 6. Get Result Analysis

**Endpoint**: `GET /api/v1/test-attempts/:attemptId/result`

#### Test Steps:
1. **Get Detailed Result**
   ```bash
   curl -X GET "http://localhost:5000/api/v1/test-attempts/<ATTEMPT_ID>/result" \
   -H "Authorization: Bearer <JWT_TOKEN>"
   ```

#### Expected Response:
```json
{
  "success": true,
  "message": "Result analysis fetched successfully",
  "data": {
    "userSummary": {
      "userName": "John Doe",
      "userEmail": "john@example.com",
      "testName": "Test-1",
      "testSeriesName": "UPSC Prelims Test Series",
      "score": 85,
      "correct": 17,
      "incorrect": 3,
      "unattempted": 5,
      "accuracy": 85.0,
      "speed": 1.2,
      "percentage": 70.8,
      "rank": 5,
      "totalParticipants": 100,
      "percentile": 95.0
    },
    "cutoffAnalysis": {
      "status": "Passed",
      "userCategory": "General",
      "cutoffs": {
        "general": 70,
        "obc": 65,
        "sc": 60,
        "st": 55
      }
    },
    "sectionReport": [
      {
        "sectionName": "Quantitative Aptitude",
        "correct": 8,
        "incorrect": 2,
        "unattempted": 1,
        "accuracy": 80.0,
        "total": 11
      }
    ],
    "performanceAnalysis": {
      "strongestArea": "Quantitative Aptitude",
      "weakestArea": "Logical Reasoning"
    },
    "questionReport": [
      {
        "questionText": "What is 2+2?",
        "userAnswer": 0,
        "correctAnswer": 2,
        "status": "Incorrect",
        "explanation": "The correct answer is 4",
        "section": "Mathematics"
      }
    ]
  }
}
```

### 7. Get User's Test Attempts

**Endpoint**: `GET /api/v1/test-attempts/my-attempts`

#### Test Steps:
1. **Get All Attempts**
   ```bash
   curl -X GET "http://localhost:5000/api/v1/test-attempts/my-attempts" \
   -H "Authorization: Bearer <JWT_TOKEN>"
   ```

#### Expected Response:
```json
{
  "success": true,
  "data": [
    {
      "_id": "attempt_id",
      "testSeries": {
        "name": "UPSC Prelims Test Series"
      },
      "testId": "test_id",
      "score": 85,
      "accuracy": 85.0,
      "createdAt": "2024-01-28T11:30:00.000Z"
    }
  ]
}
```

### 8. Get Leaderboard

**Endpoint**: `GET /api/v1/test-attempts/:seriesId/:testId/leaderboard`

#### Test Steps:
1. **Get Test Leaderboard**
   ```bash
   curl -X GET "http://localhost:5000/api/v1/test-attempts/<SERIES_ID>/<TEST_ID>/leaderboard" \
   -H "Authorization: Bearer <JWT_TOKEN>"
   ```

#### Expected Response:
```json
{
  "success": true,
  "data": {
    "testId": "test_id",
    "testName": "Test-1",
    "totalParticipants": 100,
    "leaderboard": [
      {
        "position": 1,
        "user": {
          "name": "Alice Johnson",
          "email": "alice@example.com"
        },
        "score": 100,
        "accuracy": 100
      }
    ]
  }
}
```

## Test Scenarios

### Scenario 1: Complete Test Flow
1. List available test series
2. Select a test series
3. Start a test (ensure it's the first 2 tests or user has access)
4. Submit several answers
5. Submit the test
6. View results
7. Check leaderboard

### Scenario 2: Paid Test Access
1. Try to access a paid test without purchase (should fail)
2. Purchase the test series
3. Access the test (should succeed)

### Scenario 3: Free Test Access
1. Access first 2 tests (should be free by default)
2. Verify access without purchase

### Scenario 4: Multiple Attempts Prevention
1. Start a test
2. Try to start the same test again (should fail)
3. Complete the test
4. Try to start again (should fail)

### Scenario 5: Test State Validation
1. Try to start a test that's not live (should fail)
2. Verify test states: upcoming, live, result_pending, results_available

## Error Cases

### 1. No Access Error
**Endpoint**: Any test access endpoint
**Condition**: User doesn't have access
**Expected Status**: 403
**Expected Response**:
```json
{
  "success": false,
  "message": "Please purchase this test series to access this test"
}
```

### 2. Test Not Found
**Endpoint**: `/api/v1/test-attempts/:seriesId/:testId/*`
**Condition**: Invalid seriesId or testId
**Expected Status**: 404
**Expected Response**:
```json
{
  "success": false,
  "message": "Test series not found" // or "Test not found in this series"
}
```

### 3. Multiple Attempt Error
**Endpoint**: `/api/v1/test-attempts/:seriesId/:testId/start`
**Condition**: Active attempt already exists
**Expected Status**: 400
**Expected Response**:
```json
{
  "success": false,
  "message": "You already have an active attempt for this test"
}
```

### 4. Expired Test Error
**Endpoint**: `/api/v1/test-attempts/:seriesId/:testId/*`
**Condition**: Test is not in "live" state
**Expected Status**: 400
**Expected Response**:
```json
{
  "success": false,
  "message": "Test is not available. Current state: upcoming"
}
```

### 5. Unauthorized Access
**Endpoint**: Any endpoint requiring auth
**Condition**: No or invalid JWT token
**Expected Status**: 401
**Expected Response**:
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

## Integration Flows

### Flow 1: Purchase to Test Completion
1. User views available test series
2. User selects and purchases a test series
3. User starts a test from the series
4. User submits answers progressively
5. User completes and submits the test
6. User views detailed results and analysis
7. User checks leaderboard position

### Flow 2: Free Test Access
1. User finds a test series with free quota (first 2 tests)
2. User accesses and starts one of the free tests
3. User completes and submits the test
4. User views results without payment

### Flow 3: Admin Monitoring
1. Admin views all test series
2. Admin monitors participant results
3. Admin checks cutoff settings
4. Admin reviews performance analytics

## Performance Testing

### Load Testing Scenarios:
1. Multiple users accessing the same test simultaneously
2. High-volume answer submissions
3. Concurrent result generation
4. Leaderboard updates with many participants

### Expected Performance:
- API response time: < 500ms for simple queries
- Test start: < 200ms
- Answer submission: < 100ms
- Result generation: < 1000ms

## Security Testing

### 1. Cheating Prevention
- Verify `correctOption` is not returned in submit-answer responses
- Confirm answers cannot be viewed before submission

### 2. Access Control
- Verify unauthorized users cannot access paid tests
- Confirm free quota restrictions work properly
- Ensure admin access bypass works correctly

### 3. Data Integrity
- Verify scores cannot be manipulated
- Confirm ranking calculations are accurate
- Validate purchase verification is secure

## API Contract Validation

### Request Validation:
- All endpoints validate required parameters
- Proper error handling for malformed requests
- Consistent response format across all endpoints

### Response Validation:
- All responses follow `{success, message, data/error}` format
- Data structures are consistent
- Error messages are descriptive and helpful

This comprehensive testing guide covers all aspects of the Test Series API functionality, ensuring complete validation of the system's features and edge cases.