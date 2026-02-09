# Comprehensive Coupon System Documentation

## Table of Contents
1. [Overview](#overview)
2. [Database Model](#database-model)
3. [Admin Side](#admin-side)
4. [User Side](#user-side)
5. [Integration Points](#integration-points)

## Overview

The coupon system allows administrators to create and manage discount codes that users can apply to their purchases. The system supports percentage and fixed amount discounts with various constraints like minimum purchase amounts, usage limits, and applicability to specific items.

## Database Model

### File: `src/models/Coupon/Coupon.js`

```javascript
// models/Coupon/Coupon.js
const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2'); // Add this line

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  description: String,
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    default: 'percentage'
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0
  },
  minPurchaseAmount: {
    type: Number,
    default: 0
  },
  maxUses: {
    type: Number,
    default: null
  },
  maxUsesPerUser: {
    type: Number,
    default: null
  },
  usedCount: {
    type: Number,
    default: 0
  },
  validFrom: {
    type: Date,
    default: Date.now
  },
  validUntil: {
    type: Date,
    required: true
  },
  applicableItems: [{
    itemType: {
      type: String,
      enum: ['test_series', 'online_course', 'all'],
      required: true
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'applicableItems.itemType'
    }
  }],
  // Default: if applicableItems is empty, coupon applies to all test_series and online_course
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Add pagination plugin
couponSchema.plugin(mongoosePaginate);

// Indexes
couponSchema.index({ code: 1, isActive: 1 });
couponSchema.index({ validUntil: 1, isActive: 1 });

module.exports = mongoose.model('Coupon', couponSchema);
```

## Admin Side

### Routes: `src/routes/Admin/couponRoutes.js`

```javascript
// routes/Admin/couponRoutes.js
const express = require('express');
const router = express.Router();
const adminAuth = require('../../middlewares/Admin/authMiddleware');
const couponController = require('../../controllers/Admin/couponController');
const {
  validateCouponCreation,
  validateCouponUpdate
} = require('../../middlewares/validators/couponValidator');

// Create a new coupon
router.post(
  '/',
  adminAuth,
  validateCouponCreation,
  couponController.createCoupon
);

// Update coupon
router.put(
  '/:couponId',
  adminAuth,
  validateCouponUpdate,
  couponController.updateCoupon
);

// List all coupons
router.get(
  '/',
  adminAuth,
  couponController.listCoupons
);

// Get coupon details
router.get(
  '/:couponId',
  adminAuth,
  couponController.getCoupon
);

// Toggle coupon status
router.patch(
  '/:couponId/toggle-status',
  adminAuth,
  couponController.toggleCouponStatus
);

// Delete coupon
router.delete(
  '/:couponId',
  adminAuth,
  couponController.deleteCoupon
);

module.exports = router;
```

### Controller: `src/controllers/Admin/couponController.js`

```javascript
// controllers/Admin/couponController.js
const Coupon = require('../../models/Coupon/Coupon');
const { validationResult } = require('express-validator');

// Create a new coupon (Admin only)
exports.createCoupon = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      code,
      description,
      discountType,
      discountValue,
      minPurchaseAmount,
      maxUses,
      maxUsesPerUser,
      validFrom,
      validUntil,
      applicableItems
    } = req.body;

    // Check if coupon code already exists
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return res.status(400).json({
        success: false,
        message: 'Coupon code already exists'
      });
    }

    // If applicableItems is not provided or empty, default to 'all' (applies to all test_series and online_course)
    let finalApplicableItems = applicableItems;
    if (!applicableItems || (Array.isArray(applicableItems) && applicableItems.length === 0)) {
      finalApplicableItems = [{ itemType: 'all' }];
    }

    // Create new coupon
    const coupon = new Coupon({
      code: code.toUpperCase(),
      description,
      discountType,
      discountValue,
      minPurchaseAmount: minPurchaseAmount || 0,
      maxUses: maxUses || null,
      maxUsesPerUser: maxUsesPerUser || null,
      validFrom: validFrom || new Date(),
      validUntil,
      applicableItems: finalApplicableItems,
      isActive: true
    });

    await coupon.save();

    res.status(201).json({
      success: true,
      message: 'Coupon created successfully',
      data: coupon
    });
  } catch (error) {
    console.error('Error creating coupon:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create coupon',
      error: error.message
    });
  }
};

// Update coupon (Admin only)
exports.updateCoupon = async (req, res) => {
  try {
    const { couponId } = req.params;
    const updates = req.body;

    // Don't allow updating code
    if (updates.code) {
      delete updates.code;
    }

    // Don't allow updating usedCount
    if (updates.usedCount) {
      delete updates.usedCount;
    }

    const coupon = await Coupon.findByIdAndUpdate(
      couponId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Coupon updated successfully',
      data: coupon
    });
  } catch (error) {
    console.error('Error updating coupon:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update coupon',
      error: error.message
    });
  }
};

// List all coupons (Admin only)
exports.listCoupons = async (req, res) => {
  try {
    const { page = 1, limit = 10, isActive } = req.query;
    const query = {};

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { createdAt: -1 }
    };

    const coupons = await Coupon.paginate(query, options);

    res.status(200).json({
      success: true,
      data: coupons
    });
  } catch (error) {
    console.error('Error listing coupons:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch coupons',
      error: error.message
    });
  }
};

// Get coupon details (Admin only)
exports.getCoupon = async (req, res) => {
  try {
    const { couponId } = req.params;

    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    res.status(200).json({
      success: true,
      data: coupon
    });
  } catch (error) {
    console.error('Error fetching coupon:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch coupon',
      error: error.message
    });
  }
};

// Toggle coupon status (Admin only)
exports.toggleCouponStatus = async (req, res) => {
  try {
    const { couponId } = req.params;

    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    coupon.isActive = !coupon.isActive;
    await coupon.save();

    res.status(200).json({
      success: true,
      message: `Coupon ${coupon.isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        isActive: coupon.isActive
      }
    });
  } catch (error) {
    console.error('Error toggling coupon status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update coupon status',
      error: error.message
    });
  }
};

// Delete coupon (Admin only)
exports.deleteCoupon = async (req, res) => {
  try {
    const { couponId } = req.params;

    const coupon = await Coupon.findByIdAndDelete(couponId);
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Coupon deleted successfully',
      data: {
        couponId: coupon._id,
        code: coupon.code
      }
    });
  } catch (error) {
    console.error('Error deleting coupon:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete coupon',
      error: error.message
    });
  }
};
```

## User Side

### Routes: `src/routes/User/couponRoutes.js`

```javascript
// routes/User/couponRoutes.js
const express = require('express');
const router = express.Router();
const userAuth = require('../../middlewares/User/authMiddleware');
const couponController = require('../../controllers/User/couponController');

// Get applicable coupons for user's cart
router.post(
  '/applicable',
  userAuth,
  couponController.getApplicableCoupons
);

// Validate a coupon
router.post(
  '/validate',
  userAuth,
  couponController.validateCoupon
);

module.exports = router;
```

### Controller: `src/controllers/User/couponController.js`

```javascript
// controllers/User/couponController.js
const Coupon = require('../../models/Coupon/Coupon');
const Purchase = require('../../models/Purchase/Purchase');
const { PurchaseService } = require('../../../services');

// Get applicable coupons for user's cart
exports.getApplicableCoupons = async (req, res) => {
  try {
    const { items } = req.body;
    const userId = req.user._id;

    if (!Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: 'Items must be an array'
      });
    }

    const applicableCoupons = await PurchaseService.getApplicableCoupons(items, userId);

    res.status(200).json({
      success: true,
      data: applicableCoupons
    });
  } catch (error) {
    console.error('Error getting applicable coupons:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get applicable coupons',
      error: error.message
    });
  }
};

// Validate a coupon
exports.validateCoupon = async (req, res) => {
  try {
    const { code, items } = req.body;
    const userId = req.user._id;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Coupon code is required'
      });
    }

    const coupons = await PurchaseService.getApplicableCoupons(items, userId);
    const coupon = coupons.find(c => c.code === code.toUpperCase());

    if (!coupon) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or inapplicable coupon'
      });
    }

    // Calculate discount for the items
    let totalAmount = 0;
    for (const item of items) {
      let price = 0;
      
      if (item.itemType === 'test_series') {
        const TestSeries = require('../../models/TestSeries/TestSeries');
        const testSeries = await TestSeries.findById(item.itemId).select('price');
        price = testSeries?.price || 0;
      } else if (item.itemType === 'online_course') {
        const Course = require('../../models/Course/Course');
        const course = await Course.findById(item.itemId).select('price');
        price = course?.price || 0;
      }
      
      totalAmount += price;
    }

    // Check minimum purchase amount
    if (totalAmount < coupon.minPurchaseAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum purchase amount of ${coupon.minPurchaseAmount} required for this coupon`
      });
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (totalAmount * coupon.discountValue) / 100;
    } else {
      discount = Math.min(coupon.discountValue, totalAmount);
    }

    res.status(200).json({
      success: true,
      data: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount: discount,
        finalAmount: Math.max(0, totalAmount - discount)
      }
    });
  } catch (error) {
    console.error('Error validating coupon:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate coupon',
      error: error.message
    });
  }
};
```

## Integration Points

### Payment Controller Integration: `src/controllers/User/paymentController.js`

```javascript
const Coupon = require('../../models/Coupon/Coupon');

// Helper function to resolve coupon
const resolveCoupon = async (couponCode, items, userId = null) => {
  if (!couponCode) return { coupon: null, discount: 0 };
  const code = couponCode.toUpperCase();
  
  // First, find the coupon by code and basic validity
  let coupon = await Coupon.findOne({
    code,
    isActive: true,
    validFrom: { $lte: new Date() },
    validUntil: { $gte: new Date() },
  });
  
  if (!coupon) {
    console.log(`Coupon ${code} not found or expired`);
    return { coupon: null, discount: 0 };
  }
  
  // Check if coupon has reached maxUses limit
  if (coupon.maxUses !== null && coupon.maxUses !== undefined && coupon.usedCount >= coupon.maxUses) {
    console.log(`Coupon ${code} has reached maximum uses (${coupon.usedCount}/${coupon.maxUses})`);
    return { coupon: null, discount: 0 };
  }
  
  // Check if user has exceeded maxUsesPerUser limit
  if (userId && coupon.maxUsesPerUser !== null && coupon.maxUsesPerUser !== undefined) {
    const Purchase = require('../../models/Purchase/Purchase');
    const userCouponUsage = await Purchase.countDocuments({
      user: userId,
      'coupon.code': code,
      status: 'completed'
    });
    
    if (userCouponUsage >= coupon.maxUsesPerUser) {
      console.log(`User has exceeded max uses per user for coupon ${code} (${userCouponUsage}/${coupon.maxUsesPerUser})`);
      return { coupon: null, discount: 0 };
    }
  }
  
  // Check if coupon is applicable to any of the items
  const isApplicable = coupon.applicableItems.some(applicableItem => {
    // Check if coupon applies to all items
    if (applicableItem.itemType === 'all') {
      return true;
    }
    
    // Check if coupon applies to any of the items in the order
    return items.some(item => {
      // Match item type
      if (item.itemType !== applicableItem.itemType) {
        return false;
      }
      
      // If coupon has no specific itemId, it applies to all items of this type
      if (!applicableItem.itemId) {
        return true;
      }
      
      // Otherwise, check if itemId matches
      return applicableItem.itemId.toString() === item.itemId.toString();
    });
  });
  
  if (!isApplicable) {
    console.log(`Coupon ${code} found but not applicable to items:`, items);
    return { coupon: null, discount: 0 };
  }
  
  console.log(`Coupon ${code} found and will be applied:`, {
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    minPurchaseAmount: coupon.minPurchaseAmount
  });
  
  return { coupon, discount: 0 };
};

// Helper function to apply coupon to total
const applyCouponToTotal = (baseTotal, coupon) => {
  if (!coupon) return { finalAmount: baseTotal, discountAmount: 0 };
  let discountAmount = 0;
  if (coupon.discountType === 'percentage') {
    discountAmount = (baseTotal * coupon.discountValue) / 100;
  } else if (coupon.discountType === 'fixed') {
    discountAmount = Math.min(coupon.discountValue, baseTotal);
  }
  const finalAmount = Math.max(0, baseTotal - discountAmount);
  return { finalAmount, discountAmount };
};

// In the createOrder function
exports.createOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { couponCode } = req.body;

    // ... other code ...

    // Resolve coupon (if any) and apply on total
    const { coupon, discount } = await resolveCoupon(couponCode, items, userId);
    
    if (couponCode && !coupon) {
      console.warn(`Coupon code ${couponCode} was provided but coupon not found or not applicable`);
    }
    
    // Check minimum purchase amount if coupon exists
    if (coupon && coupon.minPurchaseAmount && baseTotal < coupon.minPurchaseAmount) {
      console.warn(`Coupon ${coupon.code} requires minimum purchase of ${coupon.minPurchaseAmount}, but total is ${baseTotal}`);
      // Don't apply coupon if minimum purchase not met
      const { finalAmount, discountAmount } = applyCouponToTotal(baseTotal, null);
      return res.status(400).json({
        success: false,
        message: `Minimum purchase amount of ${coupon.minPurchaseAmount} required for this coupon`,
        order: {
          amount: finalAmount,
          baseTotal,
          couponRequired: coupon.minPurchaseAmount
        }
      });
    }
    
    const { finalAmount, discountAmount } = applyCouponToTotal(baseTotal, coupon);
    
    // ... continue with order creation
  } catch (error) {
    // ... error handling
  }
};

// In the verifyPayment function
exports.verifyPayment = async (req, res) => {
  try {
    // ... other code ...

    // Recompute pricing
    let baseTotal = 0;
    for (const item of items) {
      const price = await computeBasePrice(item);  // Uses originalPrice instead of finalPrice
      baseTotal += price;
    }
    const { coupon } = await resolveCoupon(couponCode, items, userId);
    const { finalAmount, discountAmount } = applyCouponToTotal(baseTotal, coupon);

    // ... continue with order creation including pricing information
    await Order.create({
      user: userId,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      amount: finalAmount,
      originalAmount: baseTotal, // Store the original amount before any discounts
      discountAmount: discountAmount, // Store total discount amount
      currency: 'INR',
      status: 'completed',
      items: orderItems,
      coupon: coupon
        ? {
            code: coupon.code,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
          }
        : null,
      paymentDetails: {
        ...order,
        amountInRupees: finalAmount,
      },
      pricing: { // Store detailed pricing information
        baseTotal,
        productDiscount: productDiscountTotal,
        couponDiscount: couponOnlyDiscount,
        finalAmount
      }
    });

    // ... continue with purchase creation
  } catch (error) {
    // ... error handling
  }
};
```

## Service Integration: `services/purchaseService.js`

```javascript
// Service method to get applicable coupons
static async getApplicableCoupons(items, userId) {
  const now = new Date();
  
  // Find all active coupons that are currently valid
  const allCoupons = await Coupon.find({
    isActive: true,
    validFrom: { $lte: now },
    validUntil: { $gte: now }
  });

  // Filter coupons based on item applicability and usage limits
  const applicableCoupons = [];
  
  for (const coupon of allCoupons) {
    // Check if coupon has reached maxUses limit
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      continue;
    }
    
    // Check if user has exceeded maxUsesPerUser limit
    if (userId && coupon.maxUsesPerUser !== null) {
      const userCouponUsage = await Purchase.countDocuments({
        user: userId,
        'coupon.code': coupon.code,
        status: 'completed'
      });
      
      if (userCouponUsage >= coupon.maxUsesPerUser) {
        continue;
      }
    }
    
    // Check if coupon is applicable to any of the items
    const isApplicable = coupon.applicableItems.some(applicableItem => {
      // Check if coupon applies to all items
      if (applicableItem.itemType === 'all') {
        return true;
      }
      
      // Check if coupon applies to any of the items in the cart
      return items.some(item => {
        // Match item type
        if (item.itemType !== applicableItem.itemType) {
          return false;
        }
        
        // If coupon has no specific itemId, it applies to all items of this type
        if (!applicableItem.itemId) {
          return true;
        }
        
        // Otherwise, check if itemId matches
        return applicableItem.itemId.toString() === item.itemId.toString();
      });
    });
    
    if (isApplicable) {
      applicableCoupons.push({
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minPurchaseAmount: coupon.minPurchaseAmount,
        maxUses: coupon.maxUses,
        maxUsesPerUser: coupon.maxUsesPerUser,
        validUntil: coupon.validUntil,
        usedCount: coupon.usedCount
      });
    }
  }
  
  return applicableCoupons;
}
```

## API Endpoints Summary

### Admin Endpoints
- `POST /api/v1/admin/coupons` - Create a new coupon
- `PUT /api/v1/admin/coupons/:couponId` - Update a coupon
- `GET /api/v1/admin/coupons` - List all coupons
- `GET /api/v1/admin/coupons/:couponId` - Get coupon details
- `PATCH /api/v1/admin/coupons/:couponId/toggle-status` - Activate/deactivate coupon
- `DELETE /api/v1/admin/coupons/:couponId` - Delete a coupon

### User Endpoints
- `POST /api/v1/coupons/applicable` - Get applicable coupons for user's cart
- `POST /api/v1/coupons/validate` - Validate a coupon code

## Key Features

1. **Flexible Discount Types**: Supports both percentage and fixed amount discounts
2. **Item-Specific Applicability**: Coupons can be restricted to specific test series, online courses, or all items
3. **Usage Limits**: Supports maximum total uses and maximum uses per user
4. **Time Restrictions**: Coupons have validity periods with start and end dates
5. **Minimum Purchase Amount**: Coupons can require a minimum purchase amount
6. **Real-time Validation**: Comprehensive validation on both admin and user sides
7. **Usage Tracking**: Tracks how many times each coupon has been used
8. **Security**: All endpoints are properly authenticated and validated

## Business Logic

- Coupons are case-insensitive (automatically converted to uppercase)
- Coupons can only be applied to valid items as specified in applicableItems
- Usage limits are enforced both globally and per-user
- Time-based validity ensures coupons can only be used within their validity period
- Minimum purchase amounts prevent abuse of small-value coupons
- Proper error handling provides clear feedback to users and admins