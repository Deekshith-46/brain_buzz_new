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
const { getOriginalPrice, getFinalPrice, calculateBaseTotal, calculateOriginalTotal, calculateProductDiscountTotal } = require('../../utils/pricingUtils');
const { resolveCoupon: resolveCouponUtil, calculateCouponDiscount } = require('../../utils/couponUtils');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_RPLRzNCjuNmGdU",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "4GFnyum9JNsGTWCHJHYTqiA6"
});

// Get test series price with coupon
exports.getTestSeriesPrice = async (req, res) => {
  try {
    const { testSeriesId } = req.params;
    const { couponCode } = req.query;

    const testSeries = await TestSeries.findById(testSeriesId).select('price discount finalPrice');
    if (!testSeries) {
      const error = {
        success: false,
        message: 'Test series not found'
      };
      return res ? res.status(404).json(error) : error;
    }

    // Calculate base price with test series discount
    let finalPrice = testSeries.finalPrice || testSeries.price;
    let discountApplied = 0;
    let couponDiscount = 0;
    let coupon = null;

// Coupon logic moved to order creation stage - price APIs should return product price only

    const response = {
      success: true,
      data: {
        originalPrice: testSeries.price,
        finalPrice, // In Rupees
        discountApplied,
        coupon: coupon ? {
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue
        } : null
      }
    };

    // If res is provided (normal HTTP request), use it
    if (res && typeof res.json === 'function') {
      return res.json(response);
    }

    // If no res object (internal call), return the response directly
    return response;

  } catch (error) {
    console.error('Error getting test series price:', error);
    const errorResponse = {
      success: false,
      message: 'Error getting test series price',
      error: error.message
    };

    if (res && typeof res.status === 'function') {
      return res.status(500).json(errorResponse);
    }

    return errorResponse;
  }
};

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
// Coupon logic moved to order creation stage - price APIs should return product price only

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
  const { getOriginalPrice } = require('../../utils/pricingUtils');
  
  return await getOriginalPrice(item);
};

const resolveCoupon = async (couponCode, items, userId = null) => {
  // Use centralized coupon utility
  try {
    const coupon = await require('../../utils/couponUtils').resolveCoupon(couponCode, items, userId);
    return { coupon, discount: 0 };
  } catch (error) {
    console.log('Coupon resolution error:', error.message);
    return { coupon: null, discount: 0 };
  }
};

const applyCouponToTotal = (baseTotal, coupon) => {
  if (!coupon) return { finalAmount: baseTotal, discountAmount: 0 };
  
  const { calculateCouponDiscount } = require('../../utils/couponUtils');
  const discountAmount = calculateCouponDiscount(coupon, baseTotal);
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

    // Compute base total (using final prices after product discounts)
    const baseTotal = await calculateBaseTotal(items);
    const originalTotal = await calculateOriginalTotal(items);
    const productDiscountTotal = await calculateProductDiscountTotal(items);
    
    console.log(`Order creation - Original total: ${originalTotal}, Product discount: ${productDiscountTotal}, Base total: ${baseTotal}, Coupon code: ${couponCode || 'none'}`);

    console.log(`Order creation - Base total: ${baseTotal}, Coupon code: ${couponCode || 'none'}`);

    // Resolve coupon (if any) with strict validation
    let coupon = null;
    
    if (couponCode) {
      try {
        coupon = await resolveCouponUtil(couponCode, items, userId);
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: err.message   // ❗ "Coupon is not applicable to the selected items"
        });
      }
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
    
    // Calculate discount using centralized utility
    const discountAmount = coupon ? calculateCouponDiscount(coupon, baseTotal) : 0;
    const finalAmount = Math.max(0, baseTotal - discountAmount);
    
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

    // Recompute pricing using correct final prices
    const baseTotal = await calculateBaseTotal(items);
    const originalTotal = await calculateOriginalTotal(items);
    const productDiscountTotal = await calculateProductDiscountTotal(items);
    
    console.log(`Payment verification - Original total: ${originalTotal}, Product discount: ${productDiscountTotal}, Base total: ${baseTotal}`);
    
    // Resolve coupon using centralized utility (should match createOrder validation)
    let coupon = null;
    if (couponCode) {
      try {
        coupon = await resolveCouponUtil(couponCode, items, userId);
      } catch (err) {
        console.warn(`Coupon validation failed during verification: ${err.message}`);
        // Continue without coupon if validation fails during verification
      }
    }
    // Calculate discount using centralized utility
    const discountAmount = coupon ? calculateCouponDiscount(coupon, baseTotal) : 0;
    const finalAmount = Math.max(0, baseTotal - discountAmount);
    
    // Calculate coupon-only discount (separate from product discount)
    const couponOnlyDiscount = discountAmount;

    // Build Order items mapping with proper per-item pricing
    const orderItems = [];
    
    for (const item of items) {
      const originalPrice = await getOriginalPrice(item);
      const finalPrice = await getFinalPrice(item);
      orderItems.push({
        itemType: mapOrderItemType(item.itemType),
        itemId: item.itemId,
        price: finalPrice,         // ✅ REQUIRED FIELD for Order schema (after product discounts)
        originalPrice,             // Original price before any discounts
        finalPrice,                // Final price after product discounts (before coupon)
      });
    }

    await Order.create({
      user: userId,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      amount: finalAmount,
      originalAmount: originalTotal, // Store the true original MRP before any discounts
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
      data: {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        amount: finalAmount,
        originalAmount: originalTotal,
        productDiscount: productDiscountTotal,
        couponDiscount: couponOnlyDiscount,
        discountAmount: discountAmount,
        currency: 'INR'
      }
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
          // Add originalAmount and discountAmount with safe fallback logic
          originalAmount: typeof order.originalAmount === 'number' 
            ? order.originalAmount 
            : typeof order.pricing?.baseTotal === 'number' 
            ? order.pricing.baseTotal 
            : null,
          discountAmount: typeof order.discountAmount === 'number' 
            ? order.discountAmount 
            : typeof order.pricing?.couponDiscount === 'number' || typeof order.pricing?.productDiscount === 'number'
            ? (order.pricing.couponDiscount || 0) + (order.pricing.productDiscount || 0)
            : 0,
          amount: Number(order.amount),
          // Normalize itemType to snake_case
          items: order.items.map(item => ({
            ...item,
            itemType: item.itemType.toLowerCase().includes('test') ? 'test_series' : 
                     item.itemType.toLowerCase().includes('course') ? 'online_course' : 
                     item.itemType,
            price: Number(item.price)
          })),
          // Add invoiceId and refundable fields
          invoiceId: `INV-${order._id.toString().substring(0, 8).toUpperCase()}-${new Date(order.createdAt).getFullYear()}`,
          refundable: order.status === 'completed' && new Date() - new Date(order.createdAt) < 30 * 24 * 60 * 60 * 1000 // 30 days refund window
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