// controllers/User/couponController.js
const Coupon = require('../../models/Coupon/Coupon');
const Purchase = require('../../models/Purchase/Purchase');

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

    try {
      await require('../../utils/couponUtils').resolveCoupon(code, items, userId);
      
      // If we reach here, coupon is valid and applicable
      const coupons = await PurchaseService.getApplicableCoupons(items, userId);
      const coupon = coupons.find(c => c.code === code.toUpperCase());
      
      if (!coupon) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or inapplicable coupon'
        });
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message
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
      } else if (item.itemType === 'publication') {
        const Publication = require('../../models/Publication/Publication');
        const publication = await Publication.findById(item.itemId).select('price');
        price = publication?.price || 0;
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