# Step-by-Step Purchase Process for Publications (HardCopy, EBOOK, PUBLICATION, BOTH)

## Table of Contents
1. [Overview](#overview)
2. [HardCopy Purchase Process](#hardcopy-purchase-process)
3. [EBOOK Purchase Process](#ebook-purchase-process)
4. [PUBLICATION Purchase Process](#publication-purchase-process)
5. [BOTH Purchase Process](#both-purchase-process)
6. [Common Validation Steps](#common-validation-steps)
7. [Delivery Management](#delivery-management)
8. [Access Control](#access-control)
9. [Admin Dashboard Features](#admin-dashboard-features)

---

## Overview

This document outlines the step-by-step purchase process for different types of publications in the Brain Buzz platform. The system handles four availability types:
- **HARDCOPY**: Physical books requiring delivery
- **EBOOK**: Digital books with immediate access
- **PUBLICATION**: General publication type (typically digital)
- **BOTH**: Combination of physical and digital access

### Key Principles
- **Purchase-driven access control** (not admin-controlled)
- **Zero-trust digital security model**
- **Automated delivery management** for physical products
- **Consistent user experience** across all types

---

## HardCopy Purchase Process

### Step 1: Add to Cart
1. User browses available publications
2. Selects a publication with `availableIn: "HARDCOPY"`
3. Adds to cart
4. Proceeds to checkout

### Step 2: Delivery Address Validation
1. System detects that item requires physical delivery
2. **MANDATORY**: Delivery address form appears
3. User must provide:
   - Full Name
   - Phone Number
   - Email Address
   - Address Line
   - City
   - State
   - Pincode

### Step 3: Form Validation
1. System validates all delivery address fields are complete
2. Checks required fields are not empty
3. If validation fails → Returns to form with error messages
4. If validation passes → Proceeds to payment

### Step 4: Payment Processing
1. Creates Razorpay order
2. Calculates price based on original price and discounts
3. Processes payment securely through Razorpay
4. Waits for payment verification

### Step 5: Payment Verification
1. User completes payment
2. Receives payment confirmation from Razorpay
3. System verifies payment authenticity
4. Creates Order record in database

### Step 6: Purchase Granting
1. Creates Purchase record linking user to publication
2. Sets access rights based on purchase (not admin locks)

### Step 7: Delivery Record Creation
1. **AUTOMATIC**: System creates Delivery record
2. Links to:
   - User who made purchase
   - Publication purchased
   - Order reference
   - Delivery address information
3. Sets initial status to "pending"

### Step 8: Admin Notification
1. Admin receives notification of new delivery
2. Can view delivery details in dashboard
3. Begins fulfillment process

---

## EBOOK Purchase Process

### Step 1: Add to Cart
1. User browses available publications
2. Selects a publication with `availableIn: "EBOOK"`
3. Adds to cart
4. Proceeds to checkout

### Step 2: No Delivery Address Required
1. System recognizes this is a digital product
2. **SKIPS** delivery address validation
3. Proceeds directly to payment

### Step 3: Payment Processing
1. Creates Razorpay order
2. Calculates price based on original price and discounts
3. Processes payment securely through Razorpay
4. Waits for payment verification

### Step 4: Payment Verification
1. User completes payment
2. Receives payment confirmation from Razorpay
3. System verifies payment authenticity
4. Creates Order record in database

### Step 5: Immediate Digital Access
1. Creates Purchase record linking user to publication
2. **IMMEDIATE ACCESS**: User can access digital content
3. No delivery required
4. Access controlled by purchase history (not admin locks)

### Step 6: File Access
1. User can download/access digital files
2. Files served through secure Cloudinary URLs
3. Access validated against purchase history

---

## PUBLICATION Purchase Process

### Step 1: Add to Cart
1. User browses available publications
2. Selects a publication with `availableIn: "PUBLICATION"`
3. Adds to cart
4. Proceeds to checkout

### Step 2: Content Type Determination
1. System identifies content type as digital publication
2. **IF** publication has `bookFileUrl` → treat as digital access
3. **IF** no `bookFileUrl` → treat as reference material only
4. **IF** `availableIn: "PUBLICATION"` → may include digital content

### Step 3: Validation & Payment
1. **IF** digital content exists → No delivery required
2. **IF** physical component exists → Delivery validation required
3. Proceeds to payment processing

### Step 4: Payment & Access Granting
1. Creates Razorpay order
2. Processes payment
3. Creates Order record
4. Grants appropriate access based on content type

---

## BOTH Purchase Process

### Step 1: Add to Cart
1. User browses available publications
2. Selects a publication with `availableIn: "BOTH"`
3. Adds to cart
4. Proceeds to checkout

### Step 2: Dual Validation Required
1. System recognizes this is BOTH physical AND digital
2. **MANDATORY**: Delivery address required (for physical copy)
3. **AUTOMATIC**: Digital access granted (for digital copy)

### Step 3: Delivery Address Validation
1. **MANDATORY**: Complete delivery address required
2. All fields must be filled:
   - Full Name
   - Phone Number
   - Email Address
   - Address Line
   - City
   - State
   - Pincode

### Step 4: Payment Processing
1. Creates Razorpay order
2. Calculates combined price (physical + digital)
3. Processes payment for both components

### Step 5: Dual Access Granting
1. Creates Order record
2. **IMMEDIATE**: Digital access granted
3. **AUTOMATIC**: Delivery record created for physical copy
4. User gets both digital download and physical delivery

### Step 6: Delivery Management
1. Creates Delivery record for physical component
2. Links to user, publication, and order
3. Maintains separate tracking for physical delivery
4. Digital access available immediately

---

## Common Validation Steps

### Pre-Purchase Validation
1. **Item Type Check**: Validates availability type
2. **Delivery Requirement**: Checks if delivery address needed
3. **Price Calculation**: Applies discounts and calculates final amount
4. **Inventory Check**: Verifies availability (if applicable)

### Address Validation (For Physical Items)
1. **Field Completeness**: All address fields required
2. **Format Validation**: Proper format for phone, pincode, etc.
3. **Geographic Validation**: Check if delivery possible to location
4. **User Verification**: Confirm contact details

### Payment Validation
1. **Amount Verification**: Matches calculated price
2. **Payment Method**: Validates payment gateway
3. **Security Checks**: Fraud prevention measures
4. **Transaction Confirmation**: Razorpay signature verification

---

## Delivery Management

### Delivery Record Structure
```javascript
{
  user: ObjectId,           // Reference to purchasing user
  publication: ObjectId,    // Reference to publication
  order: ObjectId,          // Reference to order
  // Delivery Address
  fullName: String,         // Recipient name
  phone: String,            // Contact number
  email: String,            // Contact email
  addressLine: String,      // Street address
  city: String,             // City
  state: String,            // State/Province
  pincode: String,          // Postal/ZIP code
  // Status Tracking
  status: String,           // pending, processing, shipped, delivered, cancelled
  trackingNumber: String,   // Courier tracking number
  shippedAt: Date,          // Shipment timestamp
  deliveredAt: Date,        // Delivery timestamp
  createdAt: Date,          // Creation timestamp
  updatedAt: Date           // Last update timestamp
}
```

### Admin Delivery Dashboard
1. **View All Deliveries**: See all pending/active deliveries
2. **Filter Options**: By status, user, publication, date
3. **Update Status**: Change delivery status with tracking info
4. **Bulk Operations**: Update multiple deliveries at once

### Status Flow
1. **pending** → Initial state after purchase
2. **processing** → Admin acknowledges order
3. **shipped** → Package dispatched with tracking number
4. **delivered** → Package delivered to customer
5. **cancelled** → Order cancelled

---

## Access Control

### Digital Access Model
1. **Purchase-Driven**: Access granted based on purchase history
2. **No Admin Locks**: Removed `isDigitalLocked` field
3. **Secure URLs**: Cloudinary signed URLs with expiration
4. **Validation**: Checks purchase history before file access

### File Access Flow
```
User Request → Validate Purchase History → Generate Secure URL → Serve File
```

### Preview Settings
1. **Fixed Pages**: `previewPages` set to 2 (immutable)
2. **Toggle Only**: Admin can only toggle `isPreviewEnabled`
3. **No Page Control**: Preview pages value is fixed

---

## Admin Dashboard Features

### Order Management
1. **View All Orders**: See all user orders
2. **Filter Options**: By status, user, date, amount
3. **Order Details**: View complete order information
4. **Status Updates**: Update order status

### Publication Management
1. **Create Publications**: Add new publications
2. **Set Availability**: Choose HARDCOPY, EBOOK, PUBLICATION, BOTH
3. **Upload Files**: PDF files for digital content
4. **Pricing**: Set original and discounted prices

### Delivery Tracking
1. **Delivery Dashboard**: View all active deliveries
2. **Status Updates**: Update delivery status
3. **Tracking Info**: Add tracking numbers
4. **User Communication**: Notify users of status changes

### User Access Control
1. **Purchase History**: View user purchases
2. **Access Verification**: Confirm access rights
3. **No Manual Unlock**: Access purely purchase-driven

---

## Error Handling & Edge Cases

### Common Issues
1. **Missing Delivery Address**: HardCopy without address → Validation failure
2. **Incomplete Payment**: Payment not completed → Order cancellation
3. **File Access Denied**: No purchase → Access denied
4. **Delivery Issues**: Address problems → Status updates

### Recovery Steps
1. **Retry Payment**: Allow payment retry for failed transactions
2. **Update Address**: Allow address correction for delivery issues
3. **Manual Intervention**: Admin can assist with special cases
4. **Refund Process**: Handle cancellations appropriately

---

## Summary

The purchase process is designed to be seamless across all publication types while maintaining proper validation and security:

| Publication Type | Delivery Required | Digital Access | Admin Control |
|------------------|-------------------|----------------|----------------|
| HARDCOPY         | ✅ Yes           | ❌ No          | ❌ None        |
| EBOOK            | ❌ No            | ✅ Yes         | ❌ None        |
| PUBLICATION      | Conditional      | Conditional    | ❌ None        |
| BOTH             | ✅ Yes           | ✅ Yes         | ❌ None        |

All access is now **purchase-driven**, ensuring security and consistency across the platform.