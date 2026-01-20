# User-Side Ordering and Validity Handling Documentation

## Overview

This document covers the complete user-side ordering functionality and validity handling for courses and test series in the Brain Buzz Backend application. It includes all relevant code for how users place orders, make purchases, and how validity periods are managed.

## Table of Contents

1. [Models](#models)
2. [Controllers](#controllers)
3. [Services](#services)
4. [Routes](#routes)
5. [Order Flow Process](#order-flow-process)
6. [Validity Handling](#validity-handling)

## Models

### Order Model
```javascript
// src/models/Order/Order.js
const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
const Schema = mongoose.Schema;

const orderItemSchema = new Schema({
  itemType: {
    type: String,
    enum: ['TestSeries', 'Course', 'testSeries', 'course'], // Support both old and new formats
    required: true
  },
  itemId: {
    type: Schema.Types.ObjectId,
    required: true
    // We'll handle populate manually in the controller
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    default: 1
  }
}, { _id: false });

const orderSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  paymentId: String,
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  items: [orderItemSchema],
  coupon: {
    code: String,
    discountType: String,
    discountValue: Number
  },
  paymentDetails: Object,
  shippingAddress: Object,
  billingAddress: Object
}, { timestamps: true });

// Add pagination plugin
orderSchema.plugin(mongoosePaginate);

// Add indexes for better query performance
orderSchema.index({ user: 1, createdAt: -1 });
// Note: orderId and paymentId already have unique indexes from schema definition

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
```

### Purchase Model
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
// Note: paymentId already has a unique index from schema definition (line 47-48)
purchaseSchema.index({ 'items.itemType': 1, 'items.itemId': 1, user: 1, status: 1 });

module.exports = mongoose.model('Purchase', purchaseSchema);
```

### Validity Option Model
```javascript
const mongoose = require('mongoose');

const validityOptionSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    durationInDays: {
      type: Number,
      required: true,
      min: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ValidityOption', validityOptionSchema);
```

### Course Model (Validity Section)
```javascript
// Relevant part of Course model showing validity
const courseSchema = new mongoose.Schema(
  {
    // ... other fields ...
    validities: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ValidityOption',
      },
    ],
    // ... other fields ...
  },
  {
    timestamps: true,
  }
);
```

### Test Series Model (Validity Section)
```javascript
// Relevant part of TestSeries model showing validity
const testSeriesSchema = new Schema(
  {
    // ... other fields ...
    validity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ValidityOption',
    },
    // ... other fields ...
  },
  {
    timestamps: true,
  }
);
```

## Controllers

### Payment Controller (User Side)
```javascript
const crypto = require('crypto');
const Razorpay = require('razorpay');
const TestSeries = require('../../models/TestSeries/TestSeries');
const Course = require('../../models/Course/Course');
const User = require('../../models/User/User');
const Coupon = require('../../models/Coupon/Coupon');
const { createOrder } = require('../../utils/orderUtils');
const Order = require('../../models/Order/Order');
const Purchase = require('../../models/Purchase/Purchase');
const { PurchaseService } = require('../../../services');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_RPLRzNCjuNmGdU",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "4GFnyum9JNsGTWCHJHYTqiA6"
});

// Get course price (supports coupon like test series)
exports.getCoursePrice = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { couponCode } = req.query;

    const course = await Course.findById(courseId).select('originalPrice discountPrice');
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Calculate finalPrice: originalPrice - discountPrice (if discountPrice is not mentioned, it's 0)
    const discountAmount = typeof course.discountPrice === 'number' && course.discountPrice >= 0
      ? course.discountPrice
      : 0;
    let finalPrice = Math.max(0, course.originalPrice - discountAmount);

    let coupon = null;
    let couponDiscount = 0;
    if (couponCode) {
      const code = couponCode.toUpperCase();
      coupon = await Coupon.findOne({
        code,
        isActive: true,
        validFrom: { $lte: new Date() },
        validUntil: { $gte: new Date() },
        $or: [
          { 'applicableItems.itemType': 'all' },
          { 'applicableItems.itemType': 'online_course', 'applicableItems.itemId': courseId },
        ],
      });

      if (coupon) {
        if (coupon.discountType === 'percentage') {
          couponDiscount = (finalPrice * coupon.discountValue) / 100;
        } else if (coupon.discountType === 'fixed') {
          couponDiscount = coupon.discountValue;
        }
        finalPrice = Math.max(0, finalPrice - couponDiscount);
      }
    }

    const response = {
      success: true,
      data: {
        originalPrice: course.originalPrice,
        finalPrice,
        discountApplied: course.originalPrice - finalPrice,
        coupon: coupon
          ? {
              code: coupon.code,
              discountType: coupon.discountType,
              discountValue: coupon.discountValue,
              discountAmount: couponDiscount,
            }
          : null,
      }
    };
    if (res && typeof res.json === 'function') {
      return res.json(response);
    }
    return response;
  } catch (error) {
    console.error('Error getting course price:', error);
    if (res && typeof res.status === 'function') {
      return res.status(500).json({ success: false, message: 'Error getting course price', error: error.message });
    }
    return { success: false, message: 'Error getting course price', error: error.message };
  }
};

// Helpers for unified orders (test series + online courses)
const mapOrderItemType = (itemType) => {
  if (itemType === 'test_series') return 'TestSeries';
  if (itemType === 'online_course') return 'Course';
  return itemType;
};

const computeBasePrice = async (item) => {
  if (item.itemType === 'test_series') {
    const priceResp = await exports.getTestSeriesPrice(
      { params: { testSeriesId: item.itemId }, query: {} },
      null
    );
    if (!priceResp?.success) throw new Error('Failed to get test series price');
    return priceResp.data.finalPrice;
  }
  if (item.itemType === 'online_course') {
    const priceResp = await exports.getCoursePrice(
      { params: { courseId: item.itemId }, query: {} },
      null
    );
    if (!priceResp?.success) throw new Error('Failed to get course price');
    return priceResp.data.finalPrice;
  }
  throw new Error('Unsupported itemType');
};

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

// Unified create order (test series + online courses)
exports.createOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { couponCode } = req.body;

    // Backward compat: if testSeriesId provided, wrap as items
    let items = req.body.items;
    if (!items && req.body.testSeriesId) {
      items = [{ itemType: 'test_series', itemId: req.body.testSeriesId }];
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'items must be a non-empty array' });
    }

    // Compute base total
    let baseTotal = 0;
    for (const item of items) {
      const price = await computeBasePrice(item);
      baseTotal += price;
    }

    console.log(`Order creation - Base total: ${baseTotal}, Coupon code: ${couponCode || 'none'}`);

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
    
    console.log(`Order creation - Final amount: ${finalAmount}, Discount: ${discountAmount}, Base: ${baseTotal}`);

    // Create Razorpay order
    const options = {
      amount: Math.round(finalAmount * 100),
      currency: 'INR',
      receipt: `order_${Date.now()}`,
      payment_capture: 1,
      notes: {
        items: JSON.stringify(items),
        userId: userId.toString(),
        couponCode: couponCode || '',
        amountInRupees: finalAmount,
      },
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      order: {
        id: order.id,
        amount: finalAmount,
        amountInPaise: order.amount,
        currency: order.currency,
        receipt: order.receipt,
      },
      pricing: {
        baseTotal,
        discountAmount: coupon ? discountAmount : 0,
        finalAmount,
        couponApplied: !!coupon,
        couponCode: coupon ? coupon.code : null,
      },
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating order',
      error: error.message,
    });
  }
};

// Create course order
exports.createCourseOrder = async (req, res) => {
  try {
    const { courseId, couponCode } = req.body;
    const userId = req.user._id;

    const course = await Course.findById(courseId);
    if (!course || !course.isActive) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Compute price
    const priceResp = await exports.getCoursePrice({ params: { courseId }, query: { couponCode } }, null);
    const finalPrice = priceResp.data.finalPrice;

    // Create Razorpay order
    const options = {
      amount: Math.round(finalPrice * 100),
      currency: 'INR',
      receipt: `order_course_${Date.now()}`,
      payment_capture: 1,
      notes: {
        courseId: courseId.toString(),
        userId: userId.toString(),
        couponCode: couponCode || '',
        amountInRupees: finalPrice
      }
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      order: {
        id: order.id,
        amount: finalPrice,
        amountInPaise: order.amount,
        currency: order.currency,
        receipt: order.receipt
      }
    });
  } catch (error) {
    console.error('Error creating course order:', error);
    res.status(500).json({ success: false, message: 'Error creating course order', error: error.message });
  }
};

// Verify payment (unified)
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Verify signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || "4GFnyum9JNsGTWCHJHYTqiA6")
      .update(text)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid signature'
      });
    }

    // Get order details from Razorpay
    const order = await razorpay.orders.fetch(razorpay_order_id);
    const { items: itemsStr, userId, couponCode } = order.notes;
    const items = JSON.parse(itemsStr || '[]');

    // Recompute pricing
    let baseTotal = 0;
    for (const item of items) {
      const price = await computeBasePrice(item);
      baseTotal += price;
    }
    const { coupon } = await resolveCoupon(couponCode, items, userId);
    const { finalAmount, discountAmount } = applyCouponToTotal(baseTotal, coupon);

    // Build Order items mapping
    // Calculate price per item (split evenly if multiple items)
    const pricePerItem = finalAmount / items.length;
    const orderItems = items.map((it) => ({
      itemType: mapOrderItemType(it.itemType),
      itemId: it.itemId,
      price: pricePerItem,
    }));

    await Order.create({
      user: userId,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      amount: finalAmount,
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
    });

    // Grant access per item
    // Calculate expiry date based on validity duration from the course/test series
    for (const it of items) {
      // Fetch the validity duration from the course or test series
      let validityDurationInDays = 365; // Default to 1 year if no validity found
      
      if (it.itemType === 'test_series') {
        const testSeries = await TestSeries.findById(it.itemId);
        if (testSeries && testSeries.validity && testSeries.validity.length > 0) {
          // Assuming validity is an array and we take the first one
          const validityOption = testSeries.validity[0];
          if (validityOption && validityOption.durationInDays) {
            validityDurationInDays = validityOption.durationInDays;
          }
        }
        
        // Debug logging
        console.log(`Test Series Purchase - Item ID: ${it.itemId}, Validity Days: ${validityDurationInDays}`);
        
        await Purchase.updateOne(
          {
            user: userId,
            'items.itemType': 'test_series',
            'items.itemId': it.itemId,
          },
          {
            $set: {
              amount: finalAmount,
              discountAmount,
              finalAmount,
              status: 'completed',
              paymentId: razorpay_payment_id,
              expiryDate: new Date(Date.now() + validityDurationInDays * 24 * 60 * 60 * 1000), // Use actual validity
            },
            $setOnInsert: {
              user: userId,
              items: [{ itemType: 'test_series', itemId: it.itemId }],
              coupon: coupon
                ? {
                  code: coupon.code,
                  discountType: coupon.discountType,
                  discountValue: coupon.discountValue,
                }
                : null,
              purchaseDate: new Date(),
            },
          },
          { upsert: true }
        );
      } else if (it.itemType === 'online_course') {
        const course = await Course.findById(it.itemId);
        if (course && course.validities && course.validities.length > 0) {
          // Assuming validities is an array and we take the first one
          const validityOption = course.validities[0];
          if (validityOption && validityOption.durationInDays) {
            validityDurationInDays = validityOption.durationInDays;
          }
        }
        
        // Debug logging
        console.log(`Course Purchase - Item ID: ${it.itemId}, Validity Days: ${validityDurationInDays}`);
        
        await Purchase.updateOne(
          {
            user: userId,
            'items.itemType': 'online_course',
            'items.itemId': it.itemId,
          },
          {
            $set: {
              amount: finalAmount,
              discountAmount,
              finalAmount,
              status: 'completed',
              paymentId: razorpay_payment_id,
              expiryDate: new Date(Date.now() + validityDurationInDays * 24 * 60 * 60 * 1000), // Use actual validity
            },
            $setOnInsert: {
              user: userId,
              items: [{ itemType: 'online_course', itemId: it.itemId }],
              coupon: coupon
                ? {
                  code: coupon.code,
                  discountType: coupon.discountType,
                  discountValue: coupon.discountValue,
                }
                : null,
              purchaseDate: new Date(),
            },
          },
          { upsert: true }
        );
      }
    }

    res.json({
      success: true,
      message: 'Payment verified successfully',
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      amount: finalAmount,
      currency: 'INR'
    });

  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying payment',
      error: error.message
    });
  }
};

// Verify course payment
exports.verifyCoursePayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || "4GFnyum9JNsGTWCHJHYTqiA6")
      .update(text)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    const order = await razorpay.orders.fetch(razorpay_order_id);
    const { courseId, userId, couponCode } = order.notes;

    const priceResp = await exports.getCoursePrice(
      { params: { courseId }, query: { couponCode } },
      null
    );
    if (!priceResp || !priceResp.success) {
      return res.status(400).json(priceResp);
    }
    const finalPrice = priceResp.data.finalPrice;
    const discountAmount = priceResp.data.coupon?.discountAmount || 0;

    // Create Order record (for bookkeeping)
    await Order.create({
      user: userId,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      amount: finalPrice,
      currency: 'INR',
      status: 'completed',
      items: [
        {
          itemType: 'Course',
          itemId: courseId,
          price: finalPrice
        }
      ],
      coupon: priceResp.data.coupon,
      paymentDetails: {
        ...order,
        amountInRupees: finalPrice
      }
    });

    // Grant access via Purchase record
    // Calculate expiry date based on validity duration from the course
    const course = await Course.findById(courseId);
    let validityDurationInDays = 365; // Default to 1 year if no validity found
    if (course && course.validities && course.validities.length > 0) {
      // Assuming validities is an array and we take the first one
      const validityOption = course.validities[0];
      if (validityOption && validityOption.durationInDays) {
        validityDurationInDays = validityOption.durationInDays;
      }
    }
    
    // Debug logging
    console.log(`Course Purchase - Item ID: ${courseId}, Validity Days: ${validityDurationInDays}`);
    
    await Purchase.updateOne(
      {
        user: userId,
        'items.itemType': 'online_course',
        'items.itemId': courseId
      },
      {
        $set: {
          amount: finalPrice,
          discountAmount,
          finalAmount: finalPrice,
          status: 'completed',
          paymentId: razorpay_payment_id,
          expiryDate: new Date(Date.now() + validityDurationInDays * 24 * 60 * 60 * 1000), // Use actual validity
        },
        $setOnInsert: {
          user: userId,
          items: [{ itemType: 'online_course', itemId: courseId }],
          coupon: priceResp.data.coupon || null,
          purchaseDate: new Date()
        }
      },
      { upsert: true }
    );

    res.json({
      success: true,
      message: 'Payment verified successfully',
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      amount: finalPrice,
      currency: 'INR'
    });
  } catch (error) {
    console.error('Error verifying course payment:', error);
    res.status(500).json({ success: false, message: 'Error verifying course payment', error: error.message });
  }
};

// Get order history
exports.getOrderHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const userId = req.user._id;

    const orders = await Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    // Manually populate items
    const TestSeries = require('../../models/TestSeries/TestSeries');
    const Course = require('../../models/Course/Course');
    
    for (const order of orders) {
      for (const item of order.items) {
        let model;
        if (item.itemType === 'TestSeries' || item.itemType === 'testSeries') {
          model = TestSeries;
        } else if (item.itemType === 'Course' || item.itemType === 'course') {
          model = Course;
        }
        
        if (model && item.itemId) {
          try {
            const populated = await model.findById(item.itemId).select('name description').lean();
            item.itemDetails = populated;
          } catch (err) {
            console.error(`Error populating item ${item.itemId}:`, err.message);
            item.itemDetails = null;
          }
        }
      }
    }

    const total = await Order.countDocuments({ user: userId });

    res.json({
      success: true,
      data: {
        orders: orders.map(order => ({
          ...order,
          amount: Number(order.amount),
          items: order.items.map(item => ({
            ...item,
            price: Number(item.price)
          }))
        })),
        total,
        page: Number(page),
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching order history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order history',
      error: error.message
    });
  }
};
```

### Order Controller (User Side)
```javascript
// src/controllers/User/orderController.js
const Order = require('../../models/Order/Order');
const TestSeries = require('../../models/TestSeries/TestSeries');

// Get order details
exports.getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user._id;

    const order = await Order.findOne({
      _id: orderId,
      user: userId
    })
    .populate('items.itemId', 'name title description')
    .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });

  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order details',
      error: error.message
    });
  }
};

// Get user's order history
exports.getOrderHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const userId = req.user._id;

    const [orders, total] = await Promise.all([
      Order.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .populate('items.itemId', 'name title')
        .lean(),
      Order.countDocuments({ user: userId })
    ]);

    res.status(200).json({
      success: true,
      data: {
        orders,
        total,
        page: Number(page),
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching order history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order history',
      error: error.message
    });
  }
};
```

## Services

### Purchase Service
```javascript
// services/purchaseService.js
const mongoose = require('mongoose');
const Purchase = require('../src/models/Purchase/Purchase');
const Coupon = require('../src/models/Coupon/Coupon');

class PurchaseService {
    // Add this method to the PurchaseService class
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
        const course = await mongoose.model('Course').findById(item.itemId).select('price');
        price = course?.price || 0;
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
        const course = await mongoose.model('Course').findById(item.itemId).select('price');
        price = course?.price || 0;
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
    // First, we need to determine the validity period for the items being purchased
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
      // This ensures the expiry is calculated based on the actual validity duration
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

## Routes

### Order Routes (User Side)
```javascript
// src/routes/User/orderRoutes.js
const express = require('express');
const router = express.Router();
const orderController = require('../../controllers/User/orderController');
const userAuthMiddleware = require('../../middlewares/User/authMiddleware');

// Protected routes (require authentication)
router.get('/:orderId', userAuthMiddleware, orderController.getOrderDetails);
router.get('/', userAuthMiddleware, orderController.getOrderHistory);

module.exports = router;
```

## Order Flow Process

The user-side ordering process involves the following steps:

1. **Price Calculation**: The user requests to purchase a course or test series, and the system calculates the final price considering discounts and any applicable coupon codes.

2. **Order Creation**: A Razorpay order is created with the calculated amount, and the system prepares the order details with the necessary metadata.

3. **Payment Processing**: The user completes the payment through the Razorpay payment gateway.

4. **Payment Verification**: Once the payment is completed, the system verifies the payment signature and creates records in both the Order and Purchase collections.

5. **Access Granting**: Upon successful payment verification, the user's access to the purchased content is granted based on the validity period.

## Validity Handling

Validity periods are managed through the following mechanisms:

1. **Validity Options Model**: Defines different validity periods (e.g., 30 days, 90 days, 365 days) that can be assigned to courses and test series.

2. **Course Validity**: Courses have a `validities` field which is an array of references to ValidityOption documents. When a course is purchased, the system uses the first validity option to determine the access period.

3. **Test Series Validity**: Test series have a `validity` field which is a reference to a single ValidityOption document. When a test series is purchased, the system uses this validity option to determine the access period.

4. **Purchase Expiry**: When a purchase is created or verified, the system calculates the expiry date based on the validity duration of the purchased items. The purchase record stores this expiry date.

5. **Access Validation**: The system checks the user's access by verifying that:
   - A purchase record exists for the user and the specific item
   - The purchase status is 'completed'
   - The current date is before the expiry date

6. **Maximum Validity**: When purchasing multiple items, the system uses the maximum validity period among all purchased items to determine the overall access period.

This ensures that users have access to their purchased content for the specified validity period, after which access expires automatically.