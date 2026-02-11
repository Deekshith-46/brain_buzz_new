// services/purchaseService.js
const mongoose = require('mongoose');
const Purchase = require('../src/models/Purchase/Purchase');
const Coupon = require('../src/models/Coupon/Coupon');

class PurchaseService {
    // Add this method to the PurchaseService class
static async getApplicableCoupons(items, userId) {
  const now = new Date();

  const coupons = await Coupon.find({
    isActive: true,
    validFrom: { $lte: now },
    validUntil: { $gte: now }
  });

  const usedCoupons = await Purchase.distinct('coupon.code', {
    user: userId,
    status: 'completed'
  });

  return coupons.filter(coupon => {
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) return false;
    if (usedCoupons.includes(coupon.code)) return false;

    return coupon.applicableItems.some(ai =>
      ai.itemType === 'all' ||
      items.some(item => item.itemType === ai.itemType)
    );
  }).sort((a, b) => b.discountValue - a.discountValue);
}

  // Validate coupon and calculate discount
  static async validateCoupon(code, items, userId) {
    // Use centralized coupon utility to resolve and validate coupon
    let coupon;
    try {
      coupon = await require('../src/utils/couponUtils').resolveCoupon(code, items, userId);
    } catch (error) {
      throw new Error(error.message);
    }

    // Calculate total amount
    let totalAmount = 0;
    const itemPrices = {};
    
    const { getOriginalPrice } = require('../src/utils/pricingUtils');

    for (const item of items) {
      const price = await getOriginalPrice(item);
      itemPrices[item.itemId] = price;
      totalAmount += price;
    }

    // Check minimum purchase amount
    if (totalAmount < coupon.minPurchaseAmount) {
      throw new Error(`Minimum purchase amount of ${coupon.minPurchaseAmount} required for this coupon`);
    }

    // Calculate discount
    const { calculateCouponDiscount } = require('../src/utils/couponUtils');
    const discount = calculateCouponDiscount(coupon, totalAmount);

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
    
    const { getOriginalPrice } = require('../src/utils/pricingUtils');

    for (const item of items) {
      const price = await getOriginalPrice(item);
      itemPrices[item.itemId] = price;
      totalAmount += price;
    }

    let discountAmount = 0;
    let finalAmount = totalAmount;
    let couponData = null;

    // Apply coupon if provided
    if (couponCode) {
      // Use centralized coupon utility to resolve and validate coupon
      let coupon;
      try {
        coupon = await require('../src/utils/couponUtils').resolveCoupon(couponCode, items, userId);
      } catch (error) {
        throw new Error(error.message);
      }
      
      // Calculate discount
      const { calculateCouponDiscount } = require('../src/utils/couponUtils');
      discountAmount = calculateCouponDiscount(coupon, totalAmount);
      
      finalAmount = Math.max(0, totalAmount - discountAmount);
      couponData = {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue
      };
    }

    // Set expiry date based on validity from the purchased items using enum system
    const { getMaxExpiryDate } = require('../src/utils/expiryUtils');
    const validityLabels = [];
    
    // Collect validity labels from all items
    for (const item of items) {
      if (item.itemType === 'online_course') {
        const Course = mongoose.model('Course');
        const course = await Course.findById(item.itemId);
        if (course && course.validity) {
          validityLabels.push(course.validity);
        }
      } else if (item.itemType === 'test_series') {
        const TestSeries = mongoose.model('TestSeries');
        const testSeries = await TestSeries.findById(item.itemId);
        if (testSeries && testSeries.validity) {
          validityLabels.push(testSeries.validity);
        }
      } else if (item.itemType === 'publication') {
        const Publication = mongoose.model('Publication');
        const publication = await Publication.findById(item.itemId);
        if (publication && publication.validity) {
          validityLabels.push(publication.validity);
        }
      }
    }
    
    // Calculate expiry date using the utility function
    const expiryDate = getMaxExpiryDate(validityLabels);

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
      
      // Update expiry date based on validity from the purchased items using enum system
      const { getMaxExpiryDate } = require('../src/utils/expiryUtils');
      const validityLabels = [];
      
      // Collect validity labels from all items
      for (const item of purchase.items) {
        if (item.itemType === 'online_course') {
          const Course = mongoose.model('Course');
          const course = await Course.findById(item.itemId);
          if (course && course.validity) {
            validityLabels.push(course.validity);
          }
        } else if (item.itemType === 'test_series') {
          const TestSeries = mongoose.model('TestSeries');
          const testSeries = await TestSeries.findById(item.itemId);
          if (testSeries && testSeries.validity) {
            validityLabels.push(testSeries.validity);
          }
        } else if (item.itemType === 'publication') {
          const Publication = mongoose.model('Publication');
          const publication = await Publication.findById(item.itemId);
          if (publication && publication.validity) {
            validityLabels.push(publication.validity);
          }
        }
      }
      
      // Calculate expiry date using the utility function
      const newExpiryDate = getMaxExpiryDate(validityLabels);
      purchase.expiryDate = newExpiryDate;
      
      await purchase.save();

      // Increment coupon usage count atomically to prevent race conditions
      if (purchase.coupon?.code) {
        const result = await Coupon.updateOne(
          {
            code: purchase.coupon.code,
            $or: [
              { maxUses: null },
              { $expr: { $lt: ['$usedCount', '$maxUses'] } }
            ]
          },
          { $inc: { usedCount: 1 } }
        );
        
        // Log warning if coupon usage exceeded maxUses
        if (result.modifiedCount === 0) {
          console.warn(`Coupon ${purchase.coupon.code} may have exceeded maxUses limit during increment.`);
        }
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
      status: 'completed'
    });

    if (!purchase) {
      return false;
    }

    // Use the expiry utility to check validity
    const { isPurchaseValid } = require('../src/utils/expiryUtils');
    return isPurchaseValid(purchase.expiryDate);
  }
}

module.exports = PurchaseService;