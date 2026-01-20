# Course Access Control API Testing Documentation

## Overview

This document provides comprehensive API testing procedures for the enhanced access control system implemented in the Brain Buzz Backend application. The system ensures proper enforcement of course access rules, including free previews, purchase requirements, and validity periods.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Authentication Setup](#authentication-setup)
3. [Test Data Preparation](#test-data-preparation)
4. [API Endpoints Testing](#api-endpoints-testing)
5. [Business Logic Tests](#business-logic-tests)
6. [Edge Cases Testing](#edge-cases-testing)
7. [Performance Tests](#performance-tests)
8. [Expected Responses](#expected-responses)

## Prerequisites

Before starting the API tests, ensure the following:

- Backend server is running
- Database is populated with test data
- Authentication tokens are available for testing users
- Course data exists in the system
- Purchase data is properly configured

## Authentication Setup

All user course-related endpoints require authentication. Prepare authentication tokens for different user types:

### 1. Admin User Token
- Purpose: Test admin access to all courses
- Expected behavior: Unrestricted access to all content

### 2. Regular User Token (No Purchase)
- Purpose: Test access for users without any purchases
- Expected behavior: Free preview access only (first 2 classes)

### 3. Regular User Token (Valid Purchase)
- Purpose: Test access for users with valid purchases
- Expected behavior: Full access to purchased content

### 4. Regular User Token (Expired Purchase)
- Purpose: Test access for users with expired purchases
- Expected behavior: No access to content despite previous purchase

## Test Data Preparation

### 1. Course Creation Test Data
```
POST /api/v1/admin/courses/create-full-course

{
  "name": "Test Course for Access Control",
  "courseType": "Programming",
  "startDate": "2024-01-01",
  "categories": ["<category_id>"],
  "subCategories": ["<sub_category_id>"],
  "languages": ["<language_id>"],
  "validities": ["<validity_option_id>"],
  "thumbnailUrl": "https://example.com/thumbnail.jpg",
  "originalPrice": 1000,
  "discountPrice": 200,
  "discountPercent": 20,
  "pricingNote": "Test pricing note",
  "shortDescription": "Test course for access control",
  "detailedDescription": "This is a test course to verify access control functionality",
  "isActive": true,
  "contentType": "ONLINE_COURSE",
  "accessType": "PAID"
}
```

### 2. Course with Multiple Classes
Prepare a course with at least 5 classes to test the first 2 free preview rule:
- Class 1: Free preview
- Class 2: Free preview
- Class 3: Requires purchase
- Class 4: Requires purchase
- Class 5: Requires purchase

### 3. Free Course Test Data
```
{
  "name": "Free Test Course",
  "accessType": "FREE",
  // ... other fields
}
```

## API Endpoints Testing

### 1. List Courses (`GET /api/v1/user/courses/courses`)

#### Test Case 1.1: List Courses for User Without Purchase
**Method:** GET  
**Endpoint:** `/api/v1/user/courses/courses`  
**Headers:** `Authorization: Bearer <token>`  
**Query Parameters:** None  
**Expected Result:** List of courses with `hasPurchased: false` and `isValid: false`

**Steps:**
1. Authenticate as user without any purchases
2. Send GET request to `/api/v1/user/courses/courses`
3. Verify response contains course list
4. Verify `hasPurchased: false` for all courses
5. Verify `isValid: false` for all courses

**Expected Response:**
```json
{
  "data": [
    {
      "_id": "<course_id>",
      "name": "Test Course",
      "thumbnailUrl": "https://example.com/thumbnail.jpg",
      "originalPrice": 1000,
      "discountPrice": 200,
      "finalPrice": 800,
      "languages": [...],
      "validities": [...],
      "hasPurchased": false,
      "isValid": false
    }
  ]
}
```

#### Test Case 1.2: List Courses for User With Valid Purchase
**Method:** GET  
**Endpoint:** `/api/v1/user/courses/courses`  
**Headers:** `Authorization: Bearer <token>`  
**Query Parameters:** None  
**Expected Result:** List of courses with `hasPurchased: true` and `isValid: true` for purchased courses

### 2. Get Course By ID (`GET /api/v1/user/courses/courses/:id`)

#### Test Case 2.1: Get Course for User Without Purchase
**Method:** GET  
**Endpoint:** `/api/v1/user/courses/courses/<course_id>`  
**Headers:** `Authorization: Bearer <token>`  
**Expected Result:** Course data with first 2 classes unlocked, others locked

**Steps:**
1. Authenticate as user without purchase
2. Send GET request to `/api/v1/user/courses/courses/<course_id>`
3. Verify course data returned
4. Verify first 2 classes have `isFree: true` and `hasAccess: true`
5. Verify remaining classes have `isFree: false`, `isLocked: true`, and `hasAccess: false`
6. Verify video URLs are hidden for locked classes

**Expected Response:**
```json
{
  "data": {
    "_id": "<course_id>",
    "name": "Test Course",
    "classes": [
      {
        "_id": "<class_1_id>",
        "title": "Introduction",
        "isFree": true,
        "isLocked": false,
        "hasAccess": true,
        "videoUrl": "https://example.com/video1.mp4"
      },
      {
        "_id": "<class_2_id>",
        "title": "Basic Concepts",
        "isFree": true,
        "isLocked": false,
        "hasAccess": true,
        "videoUrl": "https://example.com/video2.mp4"
      },
      {
        "_id": "<class_3_id>",
        "title": "Advanced Topics",
        "isFree": false,
        "isLocked": true,
        "hasAccess": false,
        // videoUrl should be omitted for locked content
        "title": "Advanced Topics"
      }
    ],
    "hasPurchased": false,
    "isPurchaseValid": false
  }
}
```

#### Test Case 2.2: Get Course for User With Valid Purchase
**Method:** GET  
**Endpoint:** `/api/v1/user/courses/courses/<course_id>`  
**Headers:** `Authorization: Bearer <token>`  
**Expected Result:** Course data with all classes unlocked

#### Test Case 2.3: Get Course for Admin User
**Method:** GET  
**Endpoint:** `/api/v1/user/courses/courses/<course_id>`  
**Headers:** `Authorization: Bearer <admin_token>`  
**Expected Result:** Course data with all classes unlocked regardless of purchase status

### 3. Get Course Class (`GET /api/v1/user/courses/courses/:courseId/classes/:classId`)

#### Test Case 3.1: Access First 2 Classes Without Purchase
**Method:** GET  
**Endpoint:** `/api/v1/user/courses/courses/<course_id>/classes/<class_1_or_2_id>`  
**Headers:** `Authorization: Bearer <token_without_purchase>`  
**Expected Result:** Successful access to class data

**Steps:**
1. Authenticate as user without purchase
2. Send GET request for first 2 classes
3. Verify 200 status code
4. Verify class data returned with video URL

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "_id": "<class_id>",
    "title": "Class Title",
    "videoUrl": "https://example.com/video.mp4",
    // ... other class data
  }
}
```

#### Test Case 3.2: Access Class 3+ Without Purchase
**Method:** GET  
**Endpoint:** `/api/v1/user/courses/courses/<course_id>/classes/<class_3_or_more_id>`  
**Headers:** `Authorization: Bearer <token_without_purchase>`  
**Expected Result:** 403 Forbidden access denied

**Steps:**
1. Authenticate as user without purchase
2. Send GET request for 3rd or higher class
3. Verify 403 status code
4. Verify access denied message

**Expected Response:**
```json
{
  "success": false,
  "message": "Please purchase this course to access this content",
  "requiresPurchase": true
}
```

#### Test Case 3.3: Access Class 3+ With Valid Purchase
**Method:** GET  
**Endpoint:** `/api/v1/user/courses/courses/<course_id>/classes/<class_3_or_more_id>`  
**Headers:** `Authorization: Bearer <token_with_valid_purchase>`  
**Expected Result:** Successful access to class data

#### Test Case 3.4: Access Class With Expired Purchase
**Method:** GET  
**Endpoint:** `/api/v1/user/courses/courses/<course_id>/classes/<class_3_or_more_id>`  
**Headers:** `Authorization: Bearer <token_with_expired_purchase>`  
**Expected Result:** 403 Forbidden due to expired purchase

### 4. Initiate Course Purchase (`POST /api/v1/user/courses/courses/:courseId/purchase`)

#### Test Case 4.1: Purchase Course Successfully
**Method:** POST  
**Endpoint:** `/api/v1/user/courses/courses/<course_id>/purchase`  
**Headers:** `Authorization: Bearer <token>`  
**Body:**
```json
{
  "couponCode": "OPTIONAL_COUPON_CODE"
}
```
**Expected Result:** Purchase initiated successfully

**Steps:**
1. Authenticate as user
2. Send POST request to initiate purchase
3. Verify 200 status code
4. Verify purchase data in response

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "paymentId": "pay_...",
    "amount": 800,
    "currency": "INR",
    "couponApplied": true/false,
    "discountAmount": 200
  }
}
```

#### Test Case 4.2: Attempt to Purchase Already Purchased Course
**Method:** POST  
**Endpoint:** `/api/v1/user/courses/courses/<purchased_course_id>/purchase`  
**Headers:** `Authorization: Bearer <token_with_existing_purchase>`  
**Expected Result:** 400 Bad Request indicating already purchased

## Business Logic Tests

### 1. Free Preview Policy Test
**Objective:** Verify that first 2 classes are always free

**Test Steps:**
1. Create a course with 5+ classes
2. Authenticate as user without purchase
3. Access first 2 classes - should succeed
4. Access 3rd class - should fail
5. Verify only first 2 classes are accessible without purchase

### 2. Purchase Validation Test
**Objective:** Verify purchase status and validity period

**Test Steps:**
1. Purchase a course successfully
2. Verify access to all classes (including 3rd and beyond)
3. Simulate expiry date by setting it in the past
4. Verify access is now denied to protected content
5. Restore valid expiry date
6. Verify access is restored

### 3. Free Course Access Test
**Objective:** Verify free courses are always accessible

**Test Steps:**
1. Create a course with `accessType: 'FREE'`
2. Authenticate as any user
3. Verify access to all classes without purchase requirement
4. Verify `hasPurchased: true` for free courses (considered purchased)

### 4. Admin Access Test
**Objective:** Verify admin users have unrestricted access

**Test Steps:**
1. Authenticate as admin user
2. Access any course (purchased or not)
3. Access any class (first 2 or beyond)
4. Verify full access to all content
5. Verify admin access bypasses purchase validation

## Edge Cases Testing

### 1. Invalid Course ID Test
**Method:** GET  
**Endpoint:** `/api/v1/user/courses/courses/invalid_id`  
**Expected Result:** 404 Not Found

### 2. Non-existent Course Test
**Method:** GET  
**Endpoint:** `/api/v1/user/courses/courses/<non_existent_id>`  
**Expected Result:** 404 Not Found

### 3. Invalid Class ID Test
**Method:** GET  
**Endpoint:** `/api/v1/user/courses/courses/<course_id>/classes/invalid_class_id`  
**Expected Result:** 404 Not Found

### 4. Non-existent Class Test
**Method:** GET  
**Endpoint:** `/api/v1/user/courses/courses/<course_id>/classes/<non_existent_class_id>`  
**Expected Result:** 404 Not Found

### 5. Expired Purchase Test
**Method:** GET  
**Endpoint:** `/api/v1/user/courses/courses/<course_id>/classes/<class_3_or_more_id>`  
**Headers:** `Authorization: Bearer <token_with_expired_purchase>`  
**Expected Result:** 403 Forbidden due to expired purchase

### 6. Pending Purchase Test
**Method:** GET  
**Endpoint:** `/api/v1/user/courses/courses/<course_id>/classes/<class_3_or_more_id>`  
**Headers:** `Authorization: Bearer <token_with_pending_purchase>`  
**Expected Result:** 403 Forbidden due to pending purchase

### 7. Course Deactivation Test
**Method:** GET  
**Endpoint:** `/api/v1/user/courses/courses/<deactivated_course_id>/classes/<class_id>`  
**Headers:** `Authorization: Bearer <any_token>`  
**Expected Result:** 404 Not Found (inactive course)

## Performance Tests

### 1. Course with Many Classes Test
**Objective:** Test performance with courses having 50+ classes

**Test Steps:**
1. Create a course with 50+ classes
2. Access course detail endpoint
3. Measure response time
4. Verify response time is reasonable (< 2 seconds)
5. Verify no N+1 query issues occur

### 2. Concurrent Access Test
**Objective:** Test system under concurrent access

**Test Steps:**
1. Simulate multiple users accessing same course simultaneously
2. Verify system handles concurrent requests properly
3. Verify database connections are managed efficiently
4. Monitor response times under load

### 3. Large Dataset Test
**Objective:** Test with large number of courses and users

**Test Steps:**
1. Populate database with 1000+ courses
2. Create 1000+ users with various purchase statuses
3. Test course listing performance
4. Verify pagination works correctly
5. Monitor memory usage and response times

## Expected Responses

### Success Responses
- **200 OK**: For successful GET requests with data
- **201 Created**: For successful POST requests
- **204 No Content**: For successful DELETE requests

### Error Responses
- **400 Bad Request**: Invalid input data
- **401 Unauthorized**: Missing or invalid authentication
- **403 Forbidden**: Access denied due to permissions or purchase requirements
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Unexpected server error

### Common Error Messages
- `"Course not found"`: Course doesn't exist or is inactive
- `"Class not found"`: Specific class doesn't exist in course
- `"Please purchase this course to access this content"`: Purchase required for content access
- `"You need to purchase this course to access this content"`: Purchase required
- `"You have already purchased this course"`: Duplicate purchase attempt
- `"Course not found or inactive"`: Course is inactive or doesn't exist

## Test Execution Checklist

### Pre-Test Setup
- [ ] Database is clean and seeded with test data
- [ ] Server is running
- [ ] Authentication tokens are prepared
- [ ] Test courses are created
- [ ] Test users are created
- [ ] Purchase records are set up

### Core Functionality Tests
- [ ] List courses works for all user types
- [ ] Get course by ID works with proper access control
- [ ] Get class works with first 2 free rule
- [ ] Purchase initiation works correctly
- [ ] Admin access bypass works
- [ ] Free course access works

### Business Logic Tests
- [ ] First 2 classes are always free
- [ ] Purchase validation works
- [ ] Expiry date validation works
- [ ] Free courses are always accessible
- [ ] Purchase status validation works

### Edge Case Tests
- [ ] Invalid IDs handled properly
- [ ] Non-existent resources return 404
- [ ] Expired purchases denied access
- [ ] Pending purchases denied access
- [ ] Deactivated courses inaccessible

### Performance Tests
- [ ] Large courses load efficiently
- [ ] No N+1 query issues
- [ ] Response times are acceptable
- [ ] Concurrent access handled properly

### Post-Test Cleanup
- [ ] Test data cleaned up (optional)
- [ ] Test results documented
- [ ] Issues logged if found
- [ ] Performance metrics recorded