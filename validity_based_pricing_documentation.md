# Validity-Based Pricing System Documentation

## Overview

This document describes the new validity-based pricing system that allows different pricing for different validity periods within the same course or test series.

## Key Features

### 1. Multiple Validity Options
- Single course/test series can have multiple validity periods
- Each validity period has its own pricing
- Users select validity during purchase
- Price, discount, and expiry date depend on selected validity

### 2. Data Structure

#### New Schema Fields

**Course and TestSeries Models:**
```javascript
{
  // DEPRECATED: Legacy fields kept for backward compatibility
  originalPrice: Number,
  discountPrice: Number,
  validity: String, // Default validity
  
  // NEW: Validity-based pricing structure
  validities: [
    {
      label: {
        type: String,
        enum: VALIDITY_LABELS, // '1_MONTH', '2_MONTHS', '3_MONTHS', '6_MONTHS', '1_YEAR', '2_YEARS', 'UNLIMITED'
      },
      pricing: {
        originalPrice: Number,
        discountPrice: Number,
        finalPrice: Number
      }
    }
  ]
}
```

### 3. Example Data Structure

```json
{
  "name": "UPSC Prelims Complete Course",
  "validities": [
    {
      "label": "1_MONTH",
      "pricing": {
        "originalPrice": 10000,
        "discountPrice": 2000,
        "finalPrice": 8000
      }
    },
    {
      "label": "3_MONTHS",
      "pricing": {
        "originalPrice": 14000,
        "discountPrice": 3000,
        "finalPrice": 11000
      }
    },
    {
      "label": "1_YEAR",
      "pricing": {
        "originalPrice": 18000,
        "discountPrice": 4000,
        "finalPrice": 14000
      }
    }
  ]
}
```

## API Changes

### 1. Admin APIs

#### Create Course/Test Series
**Endpoint:** `POST /api/admin/courses/full` or `POST /api/admin/test-series`

**Request Body:**
```json
{
  "name": "UPSC Prelims Course",
  "validities": [
    {
      "label": "1_MONTH",
      "pricing": {
        "originalPrice": 10000,
        "discountPrice": 2000
      }
    },
    {
      "label": "3_MONTHS", 
      "pricing": {
        "originalPrice": 14000,
        "discountPrice": 3000
      }
    }
  ],
  // ... other fields
}
```

#### Update Course/Test Series
**Endpoint:** `PATCH /api/admin/courses/:id` or `PATCH /api/admin/test-series/:id`

Same structure as create, but only sends fields to update.

### 2. User APIs

#### List Courses/Test Series
**Endpoints:** 
- `GET /api/users/courses`
- `GET /api/users/test-series`

**Response:**
```json
{
  "data": [
    {
      "_id": "698c9e4949bcce2be56c5d70",
      "name": "UPSC Prelims Course",
      "validity": "1_YEAR", // Legacy field (backward compatibility)
      "validityOptions": [
        {
          "label": "1_MONTH",
          "pricing": {
            "originalPrice": 10000,
            "discountPrice": 2000,
            "finalPrice": 8000
          }
        },
        {
          "label": "3_MONTHS",
          "pricing": {
            "originalPrice": 14000,
            "discountPrice": 3000,
            "finalPrice": 11000
          }
        }
      ],
      "hasPurchased": true,
      "isValid": true
    }
  ]
}
```

#### Get Single Course/Test Series
**Endpoints:**
- `GET /api/users/courses/:id`
- `GET /api/users/test-series/:id`

**Response includes same validityOptions structure as above.**

### 3. Purchase APIs

#### Create Order
**Endpoint:** `POST /api/users/orders/create`

**Request Body:**
```json
{
  "items": [
    {
      "itemType": "online_course",
      "itemId": "698c9e4949bcce2be56c5d70",
      "validity": "3_MONTHS"  // REQUIRED: Selected validity period
    }
  ],
  "couponCode": "SAVE10"
}
```

**Response:**
```json
{
  "success": true,
  "order": {
    "id": "order_xyz123",
    "amount": 11000,  // Price based on selected validity
    "amountInPaise": 1100000
  },
  "pricing": {
    "baseTotal": 11000,
    "discountAmount": 1100,  // Coupon discount
    "finalAmount": 9900
  }
}
```

#### Verify Payment
**Endpoint:** `POST /api/users/payments/verify`

Same structure as create order. The system:
1. Uses pricing from selected validity option
2. Calculates expiry date based on validity label
3. Stores selected validity and pricing in purchase record

## Implementation Details

### 1. Pricing Calculation

The system automatically calculates `finalPrice` as:
```
finalPrice = originalPrice - discountPrice
```

This happens:
- In model pre-save hooks
- In pricing utilities when calculating order totals
- During payment verification

### 2. Expiry Date Calculation

Uses the existing `calculateExpiryDate()` utility:
```javascript
const expiryDate = calculateExpiryDate(selectedValidityLabel);
```

### 3. Purchase Record Storage

Purchases now store:
```javascript
{
  "items": [
    {
      "itemType": "online_course",
      "itemId": "698c9e4949bcce2be56c5d70",
      "validity": "3_MONTHS",  // Selected validity
      "pricing": {            // Pricing at time of purchase
        "originalPrice": 14000,
        "discountPrice": 3000,
        "finalPrice": 11000
      }
    }
  ],
  "expiryDate": "2026-05-11T15:23:28.021Z"  // Calculated from validity
}
```

## Migration Process

### 1. Run Migration Script
```bash
node migrate_validity_based_pricing.js
```

This script:
- Converts existing courses to new structure
- Converts existing test series to new structure  
- Preserves existing pricing data
- Maintains backward compatibility

### 2. Backward Compatibility

The system maintains full backward compatibility:
- Legacy `originalPrice`, `discountPrice`, `validity` fields still work
- Existing APIs continue to function
- Old purchase records unaffected
- Admin can gradually migrate content

## Validation Rules

### Admin Creation/Update
- Each validity option must have a valid label from `VALIDITY_LABELS`
- `originalPrice` must be a positive number
- `discountPrice` must be non-negative and ≤ `originalPrice`
- At least one validity option required

### User Purchase
- Validity selection required for course/test series purchases
- Selected validity must exist in the item's validities array
- Pricing calculated from selected validity option

## Testing

### Test Cases

1. **Create course with multiple validities**
2. **Purchase with different validity selections**
3. **Verify correct pricing applied**
4. **Verify correct expiry dates**
5. **Test backward compatibility with legacy data**
6. **Test migration script**

### Example Test Payload
```json
{
  "name": "Test Course",
  "validities": [
    {
      "label": "1_MONTH",
      "pricing": {
        "originalPrice": 5000,
        "discountPrice": 500
      }
    },
    {
      "label": "6_MONTHS",
      "pricing": {
        "originalPrice": 12000,
        "discountPrice": 1200
      }
    }
  ]
}
```

## Benefits

1. **Flexible Pricing:** Different prices for different durations
2. **Better UX:** Clear pricing options for users
3. **Scalable:** Easy to add new validity periods
4. **Backward Compatible:** Existing functionality preserved
5. **Future-Proof:** Extensible design for additional features

## Rollback Plan

If issues arise:
1. Stop new course/test series creation
2. Revert code changes
3. Database remains compatible (legacy fields preserved)
4. Existing purchases unaffected