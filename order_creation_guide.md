# Order Creation Guide for Test Series and Online Courses

This document provides a comprehensive step-by-step guide for creating orders for Test Series and Online Courses in the Brain Buzz Web application.

## Table of Contents
1. [Overview](#overview)
2. [Order Flow for Online Courses](#order-flow-for-online-courses)
3. [Order Flow for Test Series](#order-flow-for-test-series)
4. [API Endpoints](#api-endpoints)
5. [Implementation Details](#implementation-details)
6. [Postman Testing](#postman-testing)

## Overview

The Brain Buzz platform supports ordering both Online Courses and Test Series. Each order follows a specific flow involving payment processing through Razorpay and creating records in the database to track user access.

## Order Flow for Online Courses

### Step 1: Initiate Course Purchase
- **Endpoint**: `POST /api/payment/order/create`
- **Purpose**: Create a payment order for an online course
- **Authentication**: Required (User JWT token)

### Step 2: Payment Processing
- User is redirected to Razorpay for payment
- Payment details are processed securely
- Payment ID is returned upon successful payment

### Step 3: Order Completion
- Payment verification occurs
- Purchase record is created in the database
- User gains access to the purchased course

## Order Flow for Test Series

### Step 1: Initiate Test Series Purchase
- **Endpoint**: `POST /api/payment/order/create`
- **Purpose**: Create a payment order for a test series
- **Authentication**: Required (User JWT token)

### Step 2: Payment Processing
- User is redirected to Razorpay for payment
- Payment details are processed securely
- Payment ID is returned upon successful payment

### Step 3: Order Completion
- Payment verification occurs
- Purchase record is created in the database
- User gains access to the purchased test series

## API Endpoints

### 1. Create Payment Order (Generic)
```http
POST /api/payment/order/create
```

**Headers:**
- `Authorization: Bearer <user_jwt_token>`
- `Content-Type: application/json`

**Request Body:**
```json
{
  "items": [
    {
      "itemType": "online_course" | "test_series",
      "itemId": "<course_id_or_test_series_id>",
      "quantity": 1
    }
  ],
  "couponCode": "OPTIONAL_COUPON_CODE"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orderId": "razorpay_order_id",
    "amount": 8000,
    "currency": "INR",
    "items": [
      {
        "itemType": "online_course",
        "itemId": "course_id",
        "name": "Course Name",
        "originalPrice": 10000,
        "finalPrice": 8000
      }
    ],
    "couponApplied": true,
    "discountAmount": 2000
  }
}
```

### 2. Verify Payment and Complete Order
```http
POST /api/payment/verify
```

**Headers:**
- `Authorization: Bearer <user_jwt_token>`
- `Content-Type: application/json`

**Request Body:**
```json
{
  "orderId": "razorpay_order_id",
  "paymentId": "razorpay_payment_id",
  "signature": "razorpay_signature"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment verified and order completed successfully",
  "data": {
    "orderId": "order_id",
    "paymentId": "razorpay_payment_id",
    "items": [
      {
        "itemType": "online_course",
        "itemId": "course_id",
        "status": "completed"
      }
    ]
  }
}
```

### 3. Get User Orders
```http
GET /api/orders
```

**Headers:**
- `Authorization: Bearer <user_jwt_token>`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "orderId": "order_id",
      "paymentId": "payment_id",
      "items": [
        {
          "itemType": "online_course",
          "itemId": "course_id",
          "status": "completed"
        }
      ],
      "totalAmount": 8000,
      "currency": "INR",
      "createdAt": "2023-12-23T10:30:00.000Z",
      "status": "completed"
    }
  ]
}
```

## Implementation Details

### 1. Online Course Order Process

#### Step 1: User selects a course
- User navigates to course details page
- User clicks "Buy Now" or "Enroll Now" button
- System checks if user has already purchased the course

#### Step 2: Create payment order
- Send POST request to `/api/payment/order/create`
- Include course ID in the request body
- System calculates final price with any applicable discounts

#### Step 3: Process payment
- Redirect user to Razorpay payment gateway
- User enters payment details
- Razorpay processes the payment

#### Step 4: Verify payment
- Razorpay sends payment verification to backend
- System verifies the payment signature
- Create purchase record in database

#### Step 5: Grant access
- Update user's access to the course
- User can now access all course content

### 2. Test Series Order Process

#### Step 1: User selects a test series
- User navigates to test series details page
- User clicks "Buy Now" or "Enroll Now" button
- System checks if user has already purchased the test series

#### Step 2: Create payment order
- Send POST request to `/api/payment/order/create`
- Include test series ID in the request body
- System calculates final price with any applicable discounts

#### Step 3: Process payment
- Redirect user to Razorpay payment gateway
- User enters payment details
- Razorpay processes the payment

#### Step 4: Verify payment
- Razorpay sends payment verification to backend
- System verifies the payment signature
- Create purchase record in database

#### Step 5: Grant access
- Update user's access to the test series
- User can now access all test series content

## Postman Testing

### Test 1: Create Online Course Order
1. Set up POST request to `{{BASE_URL}}/api/payment/order/create`
2. Add Authorization header with user JWT token
3. Set Content-Type to `application/json`
4. Request body:
```json
{
  "items": [
    {
      "itemType": "online_course",
      "itemId": "course_id_here"
    }
  ]
}
```
5. Send request and verify response

### Test 2: Create Test Series Order
1. Set up POST request to `{{BASE_URL}}/api/payment/order/create`
2. Add Authorization header with user JWT token
3. Set Content-Type to `application/json`
4. Request body:
```json
{
  "items": [
    {
      "itemType": "test_series",
      "itemId": "test_series_id_here"
    }
  ]
}
```
5. Send request and verify response

### Test 3: Verify Payment
1. Set up POST request to `{{BASE_URL}}/api/payment/verify`
2. Add Authorization header with user JWT token
3. Set Content-Type to `application/json`
4. Request body:
```json
{
  "orderId": "razorpay_order_id",
  "paymentId": "razorpay_payment_id",
  "signature": "razorpay_signature"
}
```
5. Send request and verify response

### Test 4: Get User Orders
1. Set up GET request to `{{BASE_URL}}/api/orders`
2. Add Authorization header with user JWT token
3. Send request and verify response

## Error Handling

### Common Error Responses

#### 400 Bad Request
- Invalid course/test series ID
- User already purchased the item
- Invalid coupon code

#### 401 Unauthorized
- Missing or invalid JWT token
- User not authenticated

#### 404 Not Found
- Course/test series not found
- Order not found

#### 500 Internal Server Error
- Payment gateway issues
- Database connection errors

### Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

## Security Considerations

1. All order endpoints require user authentication
2. Payment verification includes signature validation
3. Course/test series access is validated before purchase
4. Sensitive payment information is handled by Razorpay
5. Order amounts are validated server-side

## Troubleshooting

### Issue: Payment order creation fails
**Solution**: Check if the course/test series ID is valid and the item exists in the database

### Issue: Payment verification fails
**Solution**: Verify that the Razorpay signature matches and the order ID is valid

### Issue: User doesn't get access after payment
**Solution**: Check if the purchase record was created correctly in the database

### Issue: Duplicate purchase attempts
**Solution**: System should prevent users from purchasing the same course/test series multiple times