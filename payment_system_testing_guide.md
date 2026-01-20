# Payment System Testing Guide

## Table of Contents
1. [Overview](#overview)
2. [API Endpoints](#api-endpoints)
3. [Detailed Request/Response Examples](#detailed-requestresponse-examples)
4. [Test Scenarios](#test-scenarios)
5. [Error Handling](#error-handling)
6. [Integration Flow](#integration-flow)

## Overview

The payment system follows a unified architecture with three main endpoints:
- **Create Order**: Initiates payment process for items
- **Verify Payment**: Confirms payment completion and grants access
- **Order History**: Retrieves user's purchase history

## API Endpoints

### 1. Create Order
**Endpoint**: `POST /api/payment/create-order`
**Description**: Creates a payment order for one or more items
**Authentication**: Required (JWT Bearer token)

### 2. Verify Payment
**Endpoint**: `POST /api/payment/verify`
**Description**: Verifies payment completion with Razorpay and updates purchase status
**Authentication**: Required (JWT Bearer token)

### 3. Get Order History
**Endpoint**: `GET /api/payment/orders`
**Description**: Retrieves user's order history
**Authentication**: Required (JWT Bearer token)

## Detailed Request/Response Examples

### 1. Create Order

#### Request
```http
POST /api/payment/create-order
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "items": [
    {
      "itemType": "online_course",
      "itemId": "69400e26f0d7ea83af6ae958",
      "quantity": 1
    }
  ],
  "couponCode": "SUMMER20"
}
```

#### Response (Success)
```json
{
  "success": true,
  "order": {
    "id": "order_HjKlMnOpQrStUv",
    "amount": 4500,
    "amountInPaise": 450000,
    "currency": "INR",
    "receipt": "order_1678886400000"
  },
  "pricing": {
    "baseTotal": 5000,
    "discountAmount": 500,
    "finalAmount": 4500,
    "couponApplied": true,
    "couponCode": "SUMMER20"
  }
}
```

#### Multiple Items Request
```http
POST /api/payment/create-order
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "items": [
    {
      "itemType": "online_course",
      "itemId": "69400e26f0d7ea83af6ae958",
      "quantity": 1
    },
    {
      "itemType": "test_series",
      "itemId": "5a4b3c2d1e0f9a8b7c6d5e4f",
      "quantity": 1
    }
  ],
  "couponCode": "BUNDLE20"
}
```

### 2. Verify Payment

#### Request
```http
POST /api/payment/verify
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "razorpay_order_id": "order_HjKlMnOpQrStUv",
  "razorpay_payment_id": "pay_IjKlMnOpQrStUvWx",
  "razorpay_signature": "signature_hash_from_razorpay"
}
```

#### Response (Success)
```json
{
  "success": true,
  "message": "Payment verified successfully",
  "orderId": "order_HjKlMnOpQrStUv",
  "paymentId": "pay_IjKlMnOpQrStUvWx",
  "amount": 4500,
  "currency": "INR"
}
```

### 3. Get Order History

#### Request
```http
GET /api/payment/orders?page=1&limit=10
Authorization: Bearer {jwt_token}
```

#### Response (Success)
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "_id": "64a7b8c9d1e2f3a4b5c6d7e8",
        "user": "63a7b8c9d1e2f3a4b5c6d7e8",
        "orderId": "order_HjKlMnOpQrStUv",
        "paymentId": "pay_IjKlMnOpQrStUvWx",
        "amount": 4500,
        "currency": "INR",
        "status": "completed",
        "items": [
          {
            "itemType": "Course",
            "itemId": "69400e26f0d7ea83af6ae958",
            "price": 4500,
            "itemDetails": {
              "name": "Advanced JavaScript Course",
              "description": "Learn advanced JavaScript concepts"
            }
          }
        ],
        "coupon": {
          "code": "SUMMER20",
          "discountType": "percentage",
          "discountValue": 10
        },
        "paymentDetails": {
          "id": "order_HjKlMnOpQrStUv",
          "entity": "order",
          "amount": 450000,
          "amount_paid": 450000,
          "status": "paid"
        },
        "createdAt": "2023-07-12T10:30:00.000Z",
        "updatedAt": "2023-07-12T10:31:00.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "totalPages": 1
  }
}
```

## Test Scenarios

### Scenario 1: Single Course Purchase
1. **Create Order**: 
   - Send request with single online_course item
   - Verify successful order creation
   - Check pricing calculation with coupon

2. **Process Payment**: 
   - Simulate Razorpay payment completion
   - Call verify endpoint with payment details

3. **Verify Access**: 
   - Check if user has access to purchased course

### Scenario 2: Bundle Purchase (Multiple Items)
1. **Create Order**: 
   - Send request with multiple different item types
   - Verify bundle pricing calculation
   - Check coupon applicability

2. **Process Payment**: 
   - Complete payment for bundle
   - Verify all items are granted access

### Scenario 3: Coupon Application
1. **Valid Coupon**: 
   - Apply valid coupon code
   - Verify discount calculation
   - Check if discount is applied to final amount

2. **Invalid Coupon**: 
   - Apply invalid/expired coupon
   - Verify error response

### Scenario 4: Price Validation
1. **Item Existence**: 
   - Verify items exist before creating order
   - Check for 404 response if item doesn't exist

2. **Pricing Accuracy**: 
   - Compare calculated prices with expected values
   - Verify discounts are applied correctly

## Error Handling

### Common Error Responses

#### 400 Bad Request
```json
{
  "success": false,
  "message": "items must be a non-empty array"
}
```

#### 401 Unauthorized
```json
{
  "success": false,
  "message": "Authentication required"
}
```

#### 404 Not Found
```json
{
  "success": false,
  "message": "Course not found"
}
```

#### 400 Invalid Coupon
```json
{
  "success": false,
  "message": "Minimum purchase amount of 5000 required for this coupon",
  "order": {
    "amount": 4500,
    "baseTotal": 4500,
    "couponRequired": 5000
  }
}
```

#### 500 Server Error
```json
{
  "success": false,
  "message": "Error creating order",
  "error": "Error message details"
}
```

## Integration Flow

### Complete Purchase Flow
```
1. User selects items → Request to /api/payment/create-order
2. System calculates prices → Returns Razorpay order details
3. User completes payment in Razorpay → Gets payment details
4. App sends payment verification → POST /api/payment/verify
5. System confirms payment → Grants access to purchased items
6. User accesses order history → GET /api/payment/orders
```

### Test Steps

1. **Setup**: Obtain valid JWT token
2. **Create Order**: 
   - Prepare valid items array
   - Include optional coupon code
   - Send POST request to `/api/payment/create-order`
   - Verify 200 response with order details
3. **Simulate Payment**: 
   - Mock Razorpay payment completion
   - Obtain payment ID and signature
4. **Verify Payment**: 
   - Send payment details to `/api/payment/verify`
   - Verify 200 response with success message
5. **Check Access**: 
   - Attempt to access purchased content
   - Verify access is granted
6. **View History**: 
   - Call `/api/payment/orders`
   - Verify order appears in history

### Sample Test Data
```javascript
// Test Course ID
const courseId = "69400e26f0d7ea83af6ae958";

// Test Test Series ID  
const testSeriesId = "5a4b3c2d1e0f9a8b7c6d5e4f";

// Valid JWT Token
const jwtToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";

// Valid Coupon Code
const couponCode = "SUMMER20";
```

## Security Considerations

1. **Authentication**: All endpoints require valid JWT token
2. **Authorization**: Users can only access their own order history
3. **Payment Verification**: Signature validation prevents fraud
4. **Price Integrity**: Prices are calculated server-side, not client-side
5. **Coupon Validation**: Coupons are validated server-side with expiration checks

## Performance Testing Points

1. **Response Time**: Order creation should be < 1 second
2. **Concurrent Requests**: System should handle multiple simultaneous orders
3. **Large Bundles**: System should handle orders with many items (> 10 items)
4. **Cache Efficiency**: Price calculations should be optimized

This testing guide provides comprehensive coverage of the payment system functionality, error handling, and integration scenarios.