# Complete Purchase & Order System Documentation

## Table of Contents
1. [Overview](#overview)
2. [Models](#models)
3. [Services](#services)
4. [Controllers](#controllers)
5. [Routes](#routes)
6. [Payment Integration](#payment-integration)
7. [Access Control](#access-control)
8. [Usage Examples](#usage-examples)

## Overview

This documentation covers the complete purchase and order system for the Brain Buzz platform, including functionality for:
- Online Courses
- Test Series  
- Publications

The system handles purchase validation, coupon application, validity periods, and access control.

## Models

### Purchase Model
**File:** `src/models/Purchase/Purchase.js`

```javascript
// models/Purchase/Purchase.js
const mongoose = require('mongoose');

const purchaseItemSchema = new mongoose.Schema({
  itemType: {
    type: String,
    enum: ['test_series', 'online_course'],
    required: true
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'items.itemType'
  },
  contentType: {
    type: String,
    required: true
  }
}, { _id: false });

const purchaseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [purchaseItemSchema],
  amount: {
    type: Number,
    required: true
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  finalAmount: {
    type: Number,
    required: true
  },
  coupon: {
    code: String,
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage'
    },
    discountValue: Number
  },
  paymentId: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  purchaseDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date,
    required: true
  }
}, { timestamps: true });

// Indexes
purchaseSchema.index({ user: 1, status: 1 });
purchaseSchema.index({ 'items.itemType': 1, 'items.itemId': 1, user: 1, status: 1 });

module.exports = mongoose.model('Purchase', purchaseSchema);
```

### Course Model (Relevant Fields)
**File:** `src/models/Course/Course.js`

```javascript
// models/Course/Course.js (relevant fields)
const courseSchema = new mongoose.Schema({
  // ... other fields
  accessType: {
    type: String,
    enum: ['FREE', 'PAID'],
    default: 'PAID'
  },
  contentType: {
    type: String,
    enum: ['ONLINE_COURSE', 'TEST_SERIES', 'PUBLICATION'],
    default: 'ONLINE_COURSE'
  },
  originalPrice: {
    type: Number,
    required: function() {
      return this.accessType === 'PAID';
    }
  },
  discountPrice: {
    type: Number,
    required: function() {
      return this.accessType === 'PAID';
    }
  },
  validities: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ValidityOption'
  }],
  classes: [{
    _id: mongoose.Schema.Types.ObjectId,
    title: String,
    description: String,
    videoUrl: String,
    duration: String,
    order: Number
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });
```

### Test Series Model (Relevant Fields)
**File:** `src/models/TestSeries/TestSeries.js`

```javascript
// models/TestSeries/TestSeries.js (relevant fields)
const testSeriesSchema = new mongoose.Schema({
  // ... other fields
  name: {
    type: String,
    required: true
  },
  description: String,
  price: {
    type: Number,
    required: true
  },
  validity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ValidityOption'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });
```

### Publication Model (Relevant Fields)
**File:** `src/models/Publication/Publication.js`

```javascript
// models/Publication/Publication.js (relevant fields)
const publicationSchema = new mongoose.Schema({
  // ... other fields
  title: {
    type: String,
    required: true
  },
  description: String,
  price: {
    type: Number,
    required: true
  },
  contentType: {
    type: String,
    enum: ['ONLINE_COURSE', 'TEST_SERIES', 'PUBLICATION'],
    default: 'PUBLICATION'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });
```

### Validity Option Model
**File:** `src/models/Course/ValidityOption.js`

```javascript
// models/Course/ValidityOption.js
const mongoose = require('mongoose');

const validityOptionSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true
  },
  durationInDays: {
    type: Number,
    required: true
  },
  description: String
}, { timestamps: true });

module.exports = mongoose.model('ValidityOption', validityOptionSchema);
```

### Coupon Model
**File:** `src/models/Coupon/Coupon.js`

```javascript
// models/Coupon/Coupon.js
const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true
  },
  discountValue: {
    type: Number,
    required: true
  },
  minPurchaseAmount: {
    type: Number,
    default: 0
  },
  validFrom: {
    type: Date,
    required: true
  },
  validUntil: {
    type: Date,
    required: true
  },
  applicableItems: [{
    itemType: {
      type: String,
      enum: ['test_series', 'online_course', 'publication', 'all']
    },
    itemId: mongoose.Schema.Types.ObjectId
  }],
  maxUses: {
    type: Number,
    default: null
  },
  usedCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Coupon', couponSchema);
```

## Services

### Purchase Service
**File:** `services/purchaseService.js`

```javascript
// services/purchaseService.js
const mongoose = require('mongoose');
const Purchase = require('../src/models/Purchase/Purchase');
const Coupon = require('../src/models/Coupon/Coupon');

class PurchaseService {
  // Get applicable coupons for items
  static async getApplicableCoupons(items, userId) {
    const itemIds = {
      test_series: [],
      online_course: []
    };

    // Categorize items by type
    items.forEach(item => {
      if (item.itemType === 'test_series') {
        itemIds.test_series.push(item.itemId);
      } else if (item.itemType === 'online_course') {
        itemIds.online_course.push(item.itemId);
      }
    });

    // Build the query for applicable coupons
    const query = {
      isActive: true,
      validFrom: { $lte: new Date() },
      validUntil: { $gte: new Date() },
      $or: [
        { maxUses: null },
        { $expr: { $lt: ['$usedCount', '$maxUses'] } }
      ],
      $or: [
        { 'applicableItems.itemType': 'all' },
        {
          $or: [
            {
              'applicableItems.itemType': 'test_series',
              'applicableItems.itemId': { $in: itemIds.test_series }
            },
            {
              'applicableItems.itemType': 'online_course',
              'applicableItems.itemId': { $in: itemIds.online_course }
            }
          ]
        }
      ]
    };

    // Exclude coupons the user has already used
    const usedCoupons = await Purchase.distinct('coupon.code', {
      user: userId,
      status: 'completed',
      'coupon.code': { $exists: true, $ne: null }
    });

    if (usedCoupons.length > 0) {
      query.code = { $nin: usedCoupons };
    }

    return Coupon.find(query).sort({ discountValue: -1 });
  }

  // Validate coupon and calculate discount
  static async validateCoupon(code, items, userId) {
    const coupon = await Coupon.findOne({
      code,
      isActive: true,
      validFrom: { $lte: new Date() },
      validUntil: { $gte: new Date() },
      $or: [
        { maxUses: null },
        { $expr: { $lt: ['$usedCount', '$maxUses'] } }
      ]
    });

    if (!coupon) {
      throw new Error('Invalid or expired coupon');
    }

    // Check if user has already used this coupon
    const userUsed = await Purchase.findOne({
      user: userId,
      'coupon.code': code,
      status: 'completed'
    });

    if (userUsed) {
      throw new Error('You have already used this coupon');
    }

    // Calculate total amount
    let totalAmount = 0;
    const itemPrices = {};

    for (const item of items) {
      let price = 0;
      
      if (item.itemType === 'test_series') {
        const testSeries = await mongoose.model('TestSeries').findById(item.itemId).select('price');
        price = testSeries?.price || 0;
      } else if (item.itemType === 'online_course') {
        const course = await mongoose.model('Course').findById(item.itemId).select('discountPrice');
        price = course?.discountPrice || 0;
      }
      
      itemPrices[item.itemId] = price;
      totalAmount += price;
    }

    // Check minimum purchase amount
    if (totalAmount < coupon.minPurchaseAmount) {
      throw new Error(`Minimum purchase amount of ${coupon.minPurchaseAmount} required for this coupon`);
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (totalAmount * coupon.discountValue) / 100;
    } else {
      discount = coupon.discountValue;
    }

    return {
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue
      },
      discountAmount: discount,
      finalAmount: Math.max(0, totalAmount - discount)
    };
  }

  // Create a purchase record
  static async createPurchase(userId, items, paymentId, couponCode = null) {
    // Calculate total amount
    let totalAmount = 0;
    const itemPrices = {};

    for (const item of items) {
      let price = 0;
      
      if (item.itemType === 'test_series') {
        const testSeries = await mongoose.model('TestSeries').findById(item.itemId).select('price');
        price = testSeries?.price || 0;
      } else if (item.itemType === 'online_course') {
        const course = await mongoose.model('Course').findById(item.itemId).select('discountPrice');
        price = course?.discountPrice || 0;
      }
      
      itemPrices[item.itemId] = price;
      totalAmount += price;
    }

    let discountAmount = 0;
    let finalAmount = totalAmount;
    let couponData = null;

    // Apply coupon if provided
    if (couponCode) {
      const coupons = await this.getApplicableCoupons(items, userId);
      const coupon = coupons.find(c => c.code === couponCode.toUpperCase());
      
      if (!coupon) {
        throw new Error('Invalid or inapplicable coupon');
      }

      // Calculate discount based on coupon type
      if (coupon.discountType === 'percentage') {
        discountAmount = (totalAmount * coupon.discountValue) / 100;
      } else {
        discountAmount = Math.min(coupon.discountValue, totalAmount);
      }

      finalAmount = Math.max(0, totalAmount - discountAmount);
      couponData = {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue
      };
    }

    // Set expiry date based on validity from the purchased items
    const expiryDate = new Date();
    
    // Default to 1 year if no specific validity is found
    let maxValidityInDays = 365;
    
    for (const item of items) {
      let validityInDays = 365; // Default to 1 year
      
      if (item.itemType === 'online_course') {
        const Course = mongoose.model('Course');
        const course = await Course.findById(item.itemId);
        if (course && course.validities && course.validities.length > 0) {
          // Get the first validity option and use its duration
          const validityOption = await mongoose.model('ValidityOption').findById(course.validities[0]);
          if (validityOption && validityOption.durationInDays) {
            validityInDays = validityOption.durationInDays;
          }
        }
      } else if (item.itemType === 'test_series') {
        const TestSeries = mongoose.model('TestSeries');
        const testSeries = await TestSeries.findById(item.itemId);
        if (testSeries && testSeries.validity) {
          const validityOption = await mongoose.model('ValidityOption').findById(testSeries.validity);
          if (validityOption && validityOption.durationInDays) {
            validityInDays = validityOption.durationInDays;
          }
        }
      }
      
      // Use the maximum validity period among all items
      maxValidityInDays = Math.max(maxValidityInDays, validityInDays);
    }
    
    // Set expiry date based on validity in days
    expiryDate.setDate(expiryDate.getDate() + maxValidityInDays);

    // Create purchase record
    const purchase = new Purchase({
      user: userId,
      items,
      amount: totalAmount,
      discountAmount,
      finalAmount,
      coupon: couponData,
      paymentId,
      status: 'pending',
      expiryDate
    });

    await purchase.save();
    return purchase;
  }

  // Verify payment and update purchase status
  static async verifyPayment(paymentId) {
    const purchase = await Purchase.findOne({ paymentId });
    if (!purchase) {
      throw new Error('Purchase not found');
    }

    // Verify payment with payment gateway
    const isPaymentValid = await this.verifyWithPaymentGateway(paymentId, purchase.finalAmount);

    if (isPaymentValid) {
      purchase.status = 'completed';
      
      // Update expiry date based on validity from the purchased items
      const expiryDate = new Date();
      
      // Default to 1 year if no specific validity is found
      let maxValidityInDays = 365;
      
      for (const item of purchase.items) {
        let validityInDays = 365; // Default to 1 year
        
        if (item.itemType === 'online_course') {
          const Course = mongoose.model('Course');
          const course = await Course.findById(item.itemId);
          if (course && course.validities && course.validities.length > 0) {
            // Get the first validity option and use its duration
            const validityOption = await mongoose.model('ValidityOption').findById(course.validities[0]);
            if (validityOption && validityOption.durationInDays) {
              validityInDays = validityOption.durationInDays;
            }
          }
        } else if (item.itemType === 'test_series') {
          const TestSeries = mongoose.model('TestSeries');
          const testSeries = await TestSeries.findById(item.itemId);
          if (testSeries && testSeries.validity) {
            const validityOption = await mongoose.model('ValidityOption').findById(testSeries.validity);
            if (validityOption && validityOption.durationInDays) {
              validityInDays = validityOption.durationInDays;
            }
          }
        }
        
        // Use the maximum validity period among all items
        maxValidityInDays = Math.max(maxValidityInDays, validityInDays);
      }
      
      // Set expiry date based on validity in days
      const newExpiryDate = new Date();
      newExpiryDate.setDate(newExpiryDate.getDate() + maxValidityInDays);
      purchase.expiryDate = newExpiryDate;
      
      await purchase.save();

      // Increment coupon usage count
      if (purchase.coupon?.code) {
        await Coupon.updateOne(
          { code: purchase.coupon.code },
          { $inc: { usedCount: 1 } }
        );
      }

      return purchase;
    } else {
      purchase.status = 'failed';
      await purchase.save();
      throw new Error('Payment verification failed');
    }
  }

  // Helper method to verify payment with payment gateway
  static async verifyWithPaymentGateway(paymentId, amount) {
    // Implement actual payment gateway verification
    // This is a mock implementation
    return new Promise(resolve => {
      setTimeout(() => {
        // In a real implementation, verify with your payment gateway
        resolve(true);
      }, 1000);
    });
  }

  // Check if user has access to an item
  static async hasAccess(userId, itemType, itemId) {
    const purchase = await Purchase.findOne({
      user: userId,
      'items.itemType': itemType,
      'items.itemId': itemId,
      status: 'completed',
      expiryDate: { $gt: new Date() }
    });

    return !!purchase;
  }
}

module.exports = PurchaseService;
```

## Controllers

### Course Controller (Purchase Function)
**File:** `src/controllers/User/courseController.js`

```javascript
// src/controllers/User/courseController.js (relevant function)
const Course = require('../../models/Course/Course');
const PurchaseService = require('../../../services/purchaseService');
const { getCourseAccessContext } = require('../../middlewares/checkCourseAccess');

// Initiate purchase for an online course (mock payment creation)
exports.initiateCoursePurchase = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;
    const { couponCode } = req.body || {};

    const course = await Course.findOne({ _id: courseId, isActive: true }).select('originalPrice discountPrice name contentType');
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Already purchased?
    const accessContext = await getCourseAccessContext(userId, courseId);
    if (accessContext.hasPurchase && accessContext.isValid) {
      return res.status(400).json({ success: false, message: 'You have already purchased this course' });
    }

    // Create mock payment id and purchase record
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Fetch course to get its contentType
    const courseForContentType = await Course.findById(courseId).select('contentType');
    const contentType = courseForContentType?.contentType || 'ONLINE_COURSE';
    
    const purchase = await PurchaseService.createPurchase(
      userId,
      [{ itemType: 'online_course', itemId: courseId, contentType }],
      paymentId,
      couponCode
    );

    return res.status(200).json({
      success: true,
      data: {
        paymentId: purchase.paymentId,
        amount: purchase.finalAmount,
        currency: 'INR',
        couponApplied: !!purchase.coupon,
        discountAmount: purchase.discountAmount,
      },
    });
  } catch (error) {
    const errorResponse = handleDatabaseError(error);
    return res.status(errorResponse.statusCode).json({
      success: false,
      message: errorResponse.message,
      error: errorResponse.error
    });
  }
};
```

### Payment Controller
**File:** `src/controllers/User/paymentController.js`

```javascript
// src/controllers/User/paymentController.js
const Course = require('../../models/Course/Course');
const TestSeries = require('../../models/TestSeries/TestSeries');
const PurchaseService = require('../../../services/purchaseService');
const Purchase = require('../../models/Purchase/Purchase');

// Get course price
exports.getCoursePrice = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId).select('originalPrice discountPrice name');
    
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    
    return res.status(200).json({
      success: true,
      data: {
        id: course._id,
        name: course.name,
        originalPrice: course.originalPrice,
        discountPrice: course.discountPrice,
        finalPrice: course.discountPrice || course.originalPrice
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get test series price
exports.getTestSeriesPrice = async (req, res) => {
  try {
    const { testSeriesId } = req.params;
    const testSeries = await TestSeries.findById(testSeriesId).select('price name');
    
    if (!testSeries) {
      return res.status(404).json({ success: false, message: 'Test series not found' });
    }
    
    return res.status(200).json({
      success: true,
      data: {
        id: testSeries._id,
        name: testSeries.name,
        price: testSeries.price
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Create general order (for multiple items)
exports.createOrder = async (req, res) => {
  try {
    const { items, couponCode } = req.body;
    const userId = req.user._id;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Items are required' });
    }

    // Validate items
    for (const item of items) {
      if (!item.itemType || !item.itemId) {
        return res.status(400).json({ success: false, message: 'Each item must have itemType and itemId' });
      }
      
      // Validate item exists
      let itemExists = false;
      if (item.itemType === 'test_series') {
        const testSeries = await TestSeries.findById(item.itemId);
        itemExists = !!testSeries;
      } else if (item.itemType === 'online_course') {
        const course = await Course.findById(item.itemId);
        itemExists = !!course;
      }
      
      if (!itemExists) {
        return res.status(404).json({ success: false, message: `Item ${item.itemId} not found` });
      }
    }

    // Get content types for all items
    const itemsWithContentTypes = [];
    for (const item of items) {
      let contentType = '';
      
      if (item.itemType === 'test_series') {
        const testSeries = await TestSeries.findById(item.itemId).select('contentType');
        contentType = testSeries?.contentType || 'TEST_SERIES';
      } else if (item.itemType === 'online_course') {
        const course = await Course.findById(item.itemId).select('contentType');
        contentType = course?.contentType || 'ONLINE_COURSE';
      }
      
      itemsWithContentTypes.push({
        ...item,
        contentType
      });
    }

    // Create mock payment order
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const purchase = await PurchaseService.createPurchase(
      userId,
      itemsWithContentTypes,
      paymentId,
      couponCode
    );

    return res.status(200).json({
      success: true,
      data: {
        orderId: paymentId,
        order: {
          paymentId: purchase.paymentId,
          amount: purchase.finalAmount,
          currency: 'INR',
          couponApplied: !!purchase.coupon,
          discountAmount: purchase.discountAmount,
          items: purchase.items.map(item => ({
            id: item.itemId,
            type: item.itemType,
            contentType: item.contentType
          }))
        }
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Create course-specific order
exports.createCourseOrder = async (req, res) => {
  try {
    const { courseId, couponCode } = req.body;
    const userId = req.user._id;

    if (!courseId) {
      return res.status(400).json({ success: false, message: 'Course ID is required' });
    }

    const course = await Course.findById(courseId).select('originalPrice discountPrice name contentType');
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Check if already purchased
    const existingPurchase = await Purchase.findOne({
      user: userId,
      'items.itemType': 'online_course',
      'items.itemId': courseId,
      status: 'completed',
      expiryDate: { $gt: new Date() }
    });

    if (existingPurchase) {
      return res.status(400).json({ success: false, message: 'You have already purchased this course' });
    }

    // Get content type
    const contentType = course.contentType || 'ONLINE_COURSE';

    // Create mock payment order
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const purchase = await PurchaseService.createPurchase(
      userId,
      [{ itemType: 'online_course', itemId: courseId, contentType }],
      paymentId,
      couponCode
    );

    return res.status(200).json({
      success: true,
      data: {
        orderId: paymentId,
        order: {
          paymentId: purchase.paymentId,
          amount: purchase.finalAmount,
          currency: 'INR',
          couponApplied: !!purchase.coupon,
          discountAmount: purchase.discountAmount,
        }
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Verify general payment
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing payment verification data' });
    }

    // Verify payment with service
    const purchase = await PurchaseService.verifyPayment(razorpay_payment_id);

    return res.status(200).json({
      success: true,
      data: {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        status: purchase.status,
        expiryDate: purchase.expiryDate
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Verify course-specific payment
exports.verifyCoursePayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing payment verification data' });
    }

    // Verify payment with service
    const purchase = await PurchaseService.verifyPayment(razorpay_payment_id);

    return res.status(200).json({
      success: true,
      data: {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        status: purchase.status,
        expiryDate: purchase.expiryDate
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get order history
exports.getOrderHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const purchases = await Purchase.find({ user: userId })
      .populate('items.itemId', 'name title')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: purchases
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
```

### Test Series Controller (Purchase Functions)
**File:** `src/controllers/User/testSeriesController.js`

```javascript
// src/controllers/User/testSeriesController.js (relevant functions)
const TestSeries = require('../../models/TestSeries/TestSeries');
const PurchaseService = require('../../../services/purchaseService');

// Initiate purchase for a test series
exports.purchaseTestSeries = async (req, res) => {
  try {
    const { testSeriesId } = req.params;
    const userId = req.user._id;
    const { couponCode } = req.body || {};

    const testSeries = await TestSeries.findById(testSeriesId).select('name price contentType');
    if (!testSeries) {
      return res.status(404).json({ success: false, message: 'Test series not found' });
    }

    // Check if already purchased
    const existingPurchase = await Purchase.findOne({
      user: userId,
      'items.itemType': 'test_series',
      'items.itemId': testSeriesId,
      status: 'completed',
      expiryDate: { $gt: new Date() }
    });

    if (existingPurchase) {
      return res.status(400).json({ success: false, message: 'You have already purchased this test series' });
    }

    // Get content type
    const contentType = testSeries.contentType || 'TEST_SERIES';

    // Create mock payment id and purchase record
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const purchase = await PurchaseService.createPurchase(
      userId,
      [{ itemType: 'test_series', itemId: testSeriesId, contentType }],
      paymentId,
      couponCode
    );

    return res.status(200).json({
      success: true,
      data: {
        paymentId: purchase.paymentId,
        amount: purchase.finalAmount,
        currency: 'INR',
        couponApplied: !!purchase.coupon,
        discountAmount: purchase.discountAmount,
      },
    });
  } catch (error) {
    const errorResponse = handleDatabaseError(error);
    return res.status(errorResponse.statusCode).json({
      success: false,
      message: errorResponse.message,
      error: errorResponse.error
    });
  }
};
```

### Publication Controller (Purchase Functions)
**File:** `src/controllers/User/publicationController.js`

```javascript
// src/controllers/User/publicationController.js (relevant functions)
const Publication = require('../../models/Publication/Publication');
const PurchaseService = require('../../../services/purchaseService');

// Initiate purchase for a publication
exports.purchasePublication = async (req, res) => {
  try {
    const { publicationId } = req.params;
    const userId = req.user._id;
    const { couponCode } = req.body || {};

    const publication = await Publication.findById(publicationId).select('title price contentType');
    if (!publication) {
      return res.status(404).json({ success: false, message: 'Publication not found' });
    }

    // Check if already purchased
    const existingPurchase = await Purchase.findOne({
      user: userId,
      'items.itemType': 'publication',
      'items.itemId': publicationId,
      status: 'completed',
      expiryDate: { $gt: new Date() }
    });

    if (existingPurchase) {
      return res.status(400).json({ success: false, message: 'You have already purchased this publication' });
    }

    // Get content type
    const contentType = publication.contentType || 'PUBLICATION';

    // Create mock payment id and purchase record
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const purchase = await PurchaseService.createPurchase(
      userId,
      [{ itemType: 'publication', itemId: publicationId, contentType }],
      paymentId,
      couponCode
    );

    return res.status(200).json({
      success: true,
      data: {
        paymentId: purchase.paymentId,
        amount: purchase.finalAmount,
        currency: 'INR',
        couponApplied: !!purchase.coupon,
        discountAmount: purchase.discountAmount,
      },
    });
  } catch (error) {
    const errorResponse = handleDatabaseError(error);
    return res.status(errorResponse.statusCode).json({
      success: false,
      message: errorResponse.message,
      error: errorResponse.error
    });
  }
};
```

## Routes

### Course Routes
**File:** `src/routes/User/courseRoutes.js`

```javascript
// src/routes/User/courseRoutes.js
const express = require('express');
const { 
  listCourses, 
  getCourseById, 
  getCourseClass, 
  initiateCoursePurchase
} = require('../../controllers/User/courseController');
const userAuthMiddleware = require('../../middlewares/User/authMiddleware');
const { checkCourseAccess } = require('../../middlewares/checkCourseAccess');

const router = express.Router();

// All course routes require authenticated user
router.use(userAuthMiddleware);

router.get('/courses', listCourses);
router.get('/courses/:id', getCourseById);
router.get('/courses/:courseId/classes/:classId', checkCourseAccess, getCourseClass);
router.post('/courses/:courseId/purchase', initiateCoursePurchase);

module.exports = router;
```

### Payment Routes
**File:** `src/routes/User/paymentRoutes.js`

```javascript
// src/routes/User/paymentRoutes.js
const express = require('express');
const router = express.Router();
const paymentController = require('../../controllers/User/paymentController');
const userAuthMiddleware = require('../../middlewares/User/authMiddleware');

// Public route to get test series price
router.get('/test-series/:testSeriesId/price', paymentController.getTestSeriesPrice);
router.get('/courses/:courseId/price', paymentController.getCoursePrice);

// Protected routes (require authentication)
router.post('/create-order', userAuthMiddleware, paymentController.createOrder);
router.post('/verify', userAuthMiddleware, paymentController.verifyPayment);
router.post('/courses/create-order', userAuthMiddleware, paymentController.createCourseOrder);
router.post('/courses/verify', userAuthMiddleware, paymentController.verifyCoursePayment);
router.get('/orders', userAuthMiddleware, paymentController.getOrderHistory);

module.exports = router;
```

### Test Series Routes
**File:** `src/routes/User/testSeriesRoutes.js`

```javascript
// src/routes/User/testSeriesRoutes.js
const express = require('express');
const { 
  listTestSeries, 
  getTestSeriesById,
  purchaseTestSeries
} = require('../../controllers/User/testSeriesPublicController');
const userAuthMiddleware = require('../../middlewares/User/authMiddleware');
const checkTestAccess = require('../../middlewares/checkTestAccess');

const router = express.Router();

// All routes require authenticated user
router.use(userAuthMiddleware);

router.get('/test-series', listTestSeries);
router.get('/test-series/:id', getTestSeriesById);
router.post('/test-series/:testSeriesId/purchase', purchaseTestSeries);

module.exports = router;
```

### Publication Routes
**File:** `src/routes/User/publicationRoutes.js`

```javascript
// src/routes/User/publicationRoutes.js
const express = require('express');
const { 
  listPublications, 
  getPublicationById,
  purchasePublication
} = require('../../controllers/User/publicationController');
const userAuthMiddleware = require('../../middlewares/User/authMiddleware');

const router = express.Router();

// All routes require authenticated user
router.use(userAuthMiddleware);

router.get('/publications', listPublications);
router.get('/publications/:id', getPublicationById);
router.post('/publications/:publicationId/purchase', purchasePublication);

module.exports = router;
```

## Payment Integration

### Razorpay Integration
The system uses Razorpay for payment processing. Here's how the integration works:

1. **Create Order**: Client requests to create an order with items and coupon
2. **Payment Gateway**: Razorpay order is created with the amount
3. **Payment Processing**: User completes payment through Razorpay UI
4. **Verification**: Payment verification webhook/callback validates payment
5. **Update Status**: Purchase record status updated to 'completed'

### Price Calculation Flow
1. Items are validated for existence and pricing
2. Total amount is calculated based on item prices
3. Coupon discount is applied if valid
4. Final amount is determined
5. Validity period is calculated based on purchased items

## Access Control

### Course Access Middleware
**File:** `src/middlewares/checkCourseAccess.js`

```javascript
// src/middlewares/checkCourseAccess.js (simplified)
const checkCourseAccess = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const courseId = req.params.courseId || req.body.courseId || req.query.courseId || req.params.id;
    const classId = req.params.classId;
    
    // Validate required parameters
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Course ID is required'
      });
    }

    // Find the course to check if it's active
    const course = await Course.findById(courseId);
    if (!course || !course.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or inactive'
      });
    }

    // Derive classIndex safely
    let classIndex = -1;

    if (classId && Array.isArray(course.classes)) {
      classIndex = course.classes.findIndex(
        c => c._id && c._id.toString() === classId
      );
    }

    // If still not found, default safely
    if (classIndex < 0) {
      classIndex = 0;
    }

    // If it's a free course, allow access
    if (course.accessType === 'FREE') {
      req.courseAccess = {
        hasAccess: true,
        isFree: true,
        isPurchased: false,
        classIndex
      };
      return next();
    }

    // Check if it's one of the first 2 classes (free preview)
    if (classIndex < 2) {
      req.courseAccess = {
        hasAccess: true,
        isFree: true,
        isPurchased: false,
        classIndex
      };
      return next();
    }

    // Check if user has purchased the course
    const purchase = await Purchase.findOne({
      user: userId,
      'items.itemType': 'online_course',
      'items.itemId': courseId,
      status: 'completed',
      expiryDate: { $gt: new Date() } // Check if purchase is still valid
    });

    if (!purchase) {
      return res.status(403).json({
        success: false,
        message: 'You need to purchase this course to access this content',
        requiresPurchase: true
      });
    }

    // User has purchased and course is still valid
    req.courseAccess = {
      hasAccess: true,
      isFree: false,
      isPurchased: true,
      classIndex,
      purchase: purchase
    };

    next();
  } catch (error) {
    console.error('Error in checkCourseAccess middleware:', {
      error: error.message,
      stack: error.stack,
      courseId: req.params.courseId || req.params.id,
      classId: req.params.classId,
      userId: req.user?._id
    });
    res.status(500).json({
      success: false,
      message: 'Error checking course access',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};
```

## Usage Examples

### 1. Purchase a Course

**Request:**
```http
POST /api/v1/users/courses/{courseId}/purchase
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "couponCode": "SUMMER20"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentId": "pay_1234567890",
    "amount": 4500,
    "currency": "INR",
    "couponApplied": true,
    "discountAmount": 500
  }
}
```

### 2. Purchase Multiple Items

**Request:**
```http
POST /api/v1/payment/create-order
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "items": [
    {
      "itemType": "online_course",
      "itemId": "course_id_1"
    },
    {
      "itemType": "test_series",
      "itemId": "test_series_id_1"
    }
  ],
  "couponCode": "BUNDLE20"
}
```

### 3. Get Item Price

**Request:**
```http
GET /api/v1/payment/courses/{courseId}/price
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "course_id_1",
    "name": "Advanced JavaScript",
    "originalPrice": 5000,
    "discountPrice": 4500,
    "finalPrice": 4500
  }
}
```

### 4. Verify Payment

**Request:**
```http
POST /api/v1/payment/verify
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "razorpay_order_id": "order_1234567890",
  "razorpay_payment_id": "pay_1234567890",
  "razorpay_signature": "signature_hash"
}
```

### 5. Get Order History

**Request:**
```http
GET /api/v1/payment/orders
Authorization: Bearer {jwt_token}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "purchase_id_1",
      "user": "user_id_1",
      "items": [...],
      "amount": 4500,
      "finalAmount": 4000,
      "status": "completed",
      "expiryDate": "2024-12-31T23:59:59.000Z",
      "createdAt": "2023-01-01T00:00:00.000Z"
    }
  ]
}
```

## Error Handling

Common error responses:

- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Access denied (no purchase)
- `404 Not Found`: Item not found
- `409 Conflict`: Already purchased
- `500 Internal Server Error`: Server error

## Security Considerations

1. All purchase endpoints require authentication
2. Purchase validation includes status and expiry checks
3. Coupon validation prevents duplicate usage
4. Content access is verified through middleware
5. Payment verification is mandatory before granting access

This comprehensive system provides a robust foundation for handling purchases of courses, test series, and publications with proper access control and validation.