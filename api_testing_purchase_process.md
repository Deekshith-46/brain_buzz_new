# API Testing Documentation: Purchase Process for Publications

## Table of Contents
1. [Overview](#overview)
2. [API Endpoints](#api-endpoints)
3. [Test Scenarios](#test-scenarios)
4. [Request/Response Examples](#requestresponse-examples)
5. [Edge Case Testing](#edge-case-testing)
6. [Integration Testing](#integration-testing)
7. [Postman Collection](#postman-collection)

---

## Overview

This document provides comprehensive API testing documentation for the purchase process of different publication types (HardCopy, EBOOK, PUBLICATION, BOTH). It includes test scenarios, request/response examples, and validation criteria.

---

## API Endpoints

### User Endpoints

#### 1. Create Order
- **Endpoint**: `POST /api/user/payment/create-order`
- **Authentication**: User JWT Required
- **Purpose**: Create an order with selected publications

#### 2. Verify Payment
- **Endpoint**: `POST /api/user/payment/verify`
- **Authentication**: User JWT Required
- **Purpose**: Verify payment and complete purchase

#### 3. Get Order History
- **Endpoint**: `GET /api/user/orders/history`
- **Authentication**: User JWT Required
- **Purpose**: Get user's order history with delivery status

### Admin Endpoints

#### 4. Get All Deliveries
- **Endpoint**: `GET /api/admin/deliveries`
- **Authentication**: Admin JWT Required
- **Purpose**: View all deliveries in the system

#### 5. Update Delivery Status
- **Endpoint**: `PATCH /api/admin/deliveries/:deliveryId/status`
- **Authentication**: Admin JWT Required
- **Purpose**: Update delivery status and tracking info

---

## Test Scenarios

### Scenario 1: HardCopy Purchase Flow

#### Pre-conditions
- User is authenticated
- Publication exists with `availableIn: "HARDCOPY"`
- Delivery address is required

#### Test Steps
1. **Request Order Creation** with HardCopy publication
2. **Validate** delivery address is required
3. **Submit** order with complete delivery address
4. **Verify** order is created successfully
5. **Check** delivery record is created automatically
6. **Confirm** delivery status is "pending"

#### Expected Results
- Order creation succeeds with delivery address
- Delivery record created with correct user, publication, and order references
- Status set to "pending" initially

### Scenario 2: EBOOK Purchase Flow

#### Pre-conditions
- User is authenticated
- Publication exists with `availableIn: "EBOOK"`
- No delivery address required

#### Test Steps
1. **Request Order Creation** with EBOOK publication
2. **Validate** no delivery address required
3. **Submit** order without delivery address
4. **Verify** order is created successfully
5. **Check** no delivery record is created
6. **Confirm** digital access is granted

#### Expected Results
- Order creation succeeds without delivery address
- No delivery record created
- Digital access granted immediately

### Scenario 3: BOTH Purchase Flow

#### Pre-conditions
- User is authenticated
- Publication exists with `availableIn: "BOTH"`
- Delivery address is required for physical component

#### Test Steps
1. **Request Order Creation** with BOTH publication
2. **Validate** delivery address is required
3. **Submit** order with complete delivery address
4. **Verify** order is created successfully
5. **Check** delivery record is created for physical component
6. **Confirm** digital access is granted immediately

#### Expected Results
- Order creation succeeds with delivery address
- Delivery record created for physical component
- Digital access granted immediately

### Scenario 4: PUBLICATION Purchase Flow

#### Pre-conditions
- User is authenticated
- Publication exists with `availableIn: "PUBLICATION"`
- May include digital content

#### Test Steps
1. **Request Order Creation** with PUBLICATION
2. **Validate** requirements based on content type
3. **Submit** order with appropriate information
4. **Verify** order is created successfully
5. **Check** appropriate access is granted

#### Expected Results
- Order creation succeeds based on content type
- Appropriate access granted (digital or otherwise)

---

## Request/Response Examples

### 1. Create Order - HardCopy

#### Request
```http
POST /api/user/payment/create-order
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "items": [
    {
      "itemType": "publication",
      "itemId": "698b0afe5b5a39a046c39106"
    }
  ],
  "deliveryAddress": {
    "fullName": "John Doe",
    "phone": "9876543210",
    "email": "john@example.com",
    "addressLine": "123 Main St",
    "city": "Bangalore",
    "state": "Karnataka",
    "pincode": "560001"
  }
}
```

#### Response
```http
{
  "success": true,
  "order": {
    "id": "order_xyz123",
    "amount": 1500,
    "amountInPaise": 150000,
    "currency": "INR",
    "receipt": "order_1234567890"
  },
  "pricing": {
    "baseTotal": 2000,
    "discountAmount": 500,
    "finalAmount": 1500,
    "couponApplied": false
  }
}
```

### 2. Create Order - EBOOK (No Delivery Address)

#### Request
```http
POST /api/user/payment/create-order
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "items": [
    {
      "itemType": "publication",
      "itemId": "698b0ad15b5a39a046c39100"
    }
  ]
  // No deliveryAddress required
}
```

#### Response
```http
{
  "success": true,
  "order": {
    "id": "order_abc456",
    "amount": 1350,
    "amountInPaise": 135000,
    "currency": "INR",
    "receipt": "order_0987654321"
  }
}
```

### 3. Verify Payment

#### Request
```http
POST /api/user/payment/verify
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "razorpay_order_id": "order_xyz123",
  "razorpay_payment_id": "pay_abc123",
  "razorpay_signature": "signature_hash"
}
```

#### Response
```http
{
  "success": true,
  "message": "Payment verified successfully",
  "data": {
    "orderId": "order_xyz123",
    "paymentId": "pay_abc123",
    "amount": 1500,
    "originalAmount": 2000,
    "discountAmount": 500,
    "currency": "INR"
  }
}
```

### 4. Get Order History

#### Request
```http
GET /api/user/orders/history?page=1&limit=10
Authorization: Bearer <user_token>
```

#### Response
```http
{
  "success": true,
  "data": {
    "orders": [
      {
        "_id": "order_id_123",
        "orderId": "order_xyz123",
        "paymentId": "pay_abc123",
        "amount": 1500,
        "status": "completed",
        "items": [
          {
            "itemType": "publication",
            "itemId": "pub_id_456",
            "itemDetails": {
              "name": "Complete HardCopy of Ancient Civilizations"
            }
          }
        ],
        "deliveries": [
          {
            "_id": "delivery_id_789",
            "status": "shipped",
            "trackingNumber": "TRK123456",
            "shippedAt": "2023-12-01T10:00:00Z"
          }
        ],
        "invoiceId": "INV_ORDERID123-2023",
        "refundable": true
      }
    ],
    "total": 1,
    "page": 1,
    "totalPages": 1
  }
}
```

### 5. Get All Deliveries (Admin)

#### Request
```http
GET /api/admin/deliveries?page=1&limit=10
Authorization: Bearer <admin_token>
```

#### Response
```http
{
  "success": true,
  "data": {
    "docs": [
      {
        "_id": "delivery_id_789",
        "user": {
          "firstName": "John",
          "lastName": "Doe",
          "email": "john@example.com"
        },
        "publication": {
          "name": "Complete HardCopy of Ancient Civilizations"
        },
        "order": {
          "orderId": "order_xyz123",
          "status": "completed"
        },
        "fullName": "John Doe",
        "phone": "9876543210",
        "email": "john@example.com",
        "addressLine": "123 Main St",
        "city": "Bangalore",
        "state": "Karnataka",
        "pincode": "560001",
        "status": "shipped",
        "trackingNumber": "TRK123456",
        "shippedAt": "2023-12-01T10:00:00Z",
        "createdAt": "2023-11-30T10:00:00Z"
      }
    ],
    "totalDocs": 1,
    "limit": 10,
    "totalPages": 1,
    "page": 1
  }
}
```

### 6. Update Delivery Status (Admin)

#### Request
```http
PATCH /api/admin/deliveries/delivery_id_789/status
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "status": "delivered",
  "trackingNumber": "TRK123456"
}
```

#### Response
```http
{
  "success": true,
  "message": "Delivery updated",
  "data": {
    "_id": "delivery_id_789",
    "status": "delivered",
    "trackingNumber": "TRK123456",
    "deliveredAt": "2023-12-02T10:00:00Z"
  }
}
```

---

## Edge Case Testing

### 1. Missing Delivery Address for HardCopy
- **Input**: Order with HardCopy publication but no delivery address
- **Expected**: 400 Bad Request with error message
- **Response**:
```json
{
  "success": false,
  "message": "Delivery address required for hardcopy publications"
}
```

### 2. Incomplete Delivery Address
- **Input**: Order with HardCopy and incomplete delivery address
- **Expected**: 400 Bad Request with error message
- **Response**:
```json
{
  "success": false,
  "message": "Complete delivery address required for hardcopy publications"
}
```

### 3. Unauthorized Access to Admin Endpoints
- **Input**: Admin endpoint accessed with user token
- **Expected**: 403 Forbidden
- **Response**:
```json
{
  "success": false,
  "message": "Access denied"
}
```

### 4. Invalid Publication ID
- **Input**: Order with non-existent publication ID
- **Expected**: 400 Bad Request or 404 Not Found
- **Response**:
```json
{
  "success": false,
  "message": "Publication not found"
}
```

### 5. Invalid Payment Signature
- **Input**: Verify payment with invalid signature
- **Expected**: 400 Bad Request
- **Response**:
```json
{
  "success": false,
  "message": "Invalid signature"
}
```

---

## Integration Testing

### 1. Complete Purchase Flow Test
- Create order with HardCopy publication
- Complete payment verification
- Verify delivery record creation
- Check user access to digital content (if applicable)
- Validate admin delivery dashboard shows record

### 2. EBOOK Purchase Flow Test
- Create order with EBOOK publication
- Complete payment verification
- Verify no delivery record created
- Check user has immediate digital access
- Validate file download works

### 3. BOTH Purchase Flow Test
- Create order with BOTH publication
- Complete payment verification
- Verify delivery record created for physical
- Verify immediate digital access granted
- Check both components work independently

### 4. Admin Delivery Management Test
- Create multiple orders with delivery items
- Update delivery statuses through admin panel
- Verify user order history shows updated status
- Test bulk status updates

---

## Postman Collection

### Environment Variables
```
BASE_URL: http://localhost:5000/api
USER_TOKEN: <user_jwt_token>
ADMIN_TOKEN: <admin_jwt_token>
```

### Collections Structure
```
Brain Buzz API Tests
├── Authentication
│   ├── User Login
│   └── Admin Login
├── Publication Purchase
│   ├── Create Order - HardCopy
│   ├── Create Order - EBOOK
│   ├── Create Order - BOTH
│   ├── Verify Payment
│   └── Get Order History
├── Admin Delivery Management
│   ├── Get All Deliveries
│   ├── Update Delivery Status
│   └── Filter Deliveries
└── Validation Tests
    ├── Missing Delivery Address
    ├── Invalid Payment Signature
    └── Unauthorized Access
```

### Test Scripts Examples

#### Create Order Test Script
```javascript
pm.test("Order creation successful", function () {
    pm.response.to.have.status(200);
    const responseJson = pm.response.json();
    pm.expect(responseJson.success).to.be.true;
    pm.expect(responseJson.order).to.have.property('id');
    pm.expect(responseJson.order).to.have.property('amount');
});

pm.environment.set("ORDER_ID", pm.response.json().order.id);
```

#### Verify Payment Test Script
```javascript
pm.test("Payment verification successful", function () {
    pm.response.to.have.status(200);
    const responseJson = pm.response.json();
    pm.expect(responseJson.success).to.be.true;
    pm.expect(responseJson.message).to.include('successfully');
    pm.expect(responseJson.data).to.have.property('orderId');
    pm.expect(responseJson.data).to.have.property('paymentId');
});
```

#### Delivery Status Update Test Script
```javascript
pm.test("Delivery status updated successfully", function () {
    pm.response.to.have.status(200);
    const responseJson = pm.response.json();
    pm.expect(responseJson.success).to.be.true;
    pm.expect(responseJson.message).to.equal('Delivery updated');
    pm.expect(responseJson.data.status).to.equal('delivered');
});
```

---

## Test Automation Framework

### Running Tests
```bash
# Install Newman globally
npm install -g newman

# Run collection
newman run Brain-Buzz-API-Tests.postman_collection.json \
  -e Brain-Buzz-Environment.postman_environment.json \
  --reporters html,cli,junit \
  --reporter-html-export ./reports/api-test-report.html
```

### Continuous Integration
```yaml
# .github/workflows/api-tests.yml
name: API Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
      - name: Install Newman
        run: npm install -g newman
      - name: Run API Tests
        run: newman run collection.json -e environment.json
```

---

## Quality Assurance Checklist

### Before Deployment
- [ ] All API endpoints tested with valid inputs
- [ ] Error handling tested with invalid inputs
- [ ] Authentication/authorization tested
- [ ] Edge cases covered
- [ ] Performance tested with concurrent requests
- [ ] Security tested for vulnerabilities
- [ ] Integration tests pass end-to-end

### Post-Deployment
- [ ] Monitor API response times
- [ ] Check error logs for unexpected issues
- [ ] Verify delivery status updates work
- [ ] Confirm file downloads work properly
- [ ] Test admin dashboard functionality
- [ ] Validate user experience

---

## Summary

This API testing documentation provides comprehensive coverage for the purchase process of all publication types. It includes detailed test scenarios, request/response examples, and automation frameworks to ensure quality and reliability of the system.