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

    // Apply coupon if provided
    if (couponCode) {
      coupon = await Coupon.findOne({
        code: couponCode,
        isActive: true,
        validFrom: { $lte: new Date() },
        validUntil: { $gte: new Date() },
        'applicableItems.itemId': testSeriesId
      });

      if (coupon) {
        if (coupon.discountType === 'percentage') {
          couponDiscount = (finalPrice * coupon.discountValue) / 100;
        } else if (coupon.discountType === 'fixed') {
          couponDiscount = coupon.discountValue;
        }
        // Ensure coupon discount doesn't make price negative
        finalPrice = Math.max(0, finalPrice - couponDiscount);
        discountApplied = testSeries.price - finalPrice;
      }
    }

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