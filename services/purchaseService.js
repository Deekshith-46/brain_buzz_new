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