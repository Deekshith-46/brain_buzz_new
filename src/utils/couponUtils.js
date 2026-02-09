// src/utils/couponUtils.js
const Coupon = require('../models/Coupon/Coupon');
const Purchase = require('../models/Purchase/Purchase');

/**
 * Centralized function to check if a coupon is applicable to given items
 */
const isCouponApplicable = (coupon, items) => {
  return coupon.applicableItems.some(ai =>
    ai.itemType === 'all' ||
    items.some(item => item.itemType === ai.itemType)
  );
};

/**
 * Centralized function to resolve and validate a coupon
 */
const resolveCoupon = async (couponCode, items, userId = null) => {
  if (!couponCode) {
    throw new Error('Coupon code is required');
  }

  const code = couponCode.toUpperCase();

  // Find the coupon by code and basic validity
  const coupon = await Coupon.findOne({
    code,
    isActive: true,
    validFrom: { $lte: new Date() },
    validUntil: { $gte: new Date() }
  });

  if (!coupon) {
    throw new Error('Invalid or expired coupon');
  }

  // Check if coupon has reached maxUses limit
  if (coupon.maxUses !== null && coupon.maxUses !== undefined && coupon.usedCount >= coupon.maxUses) {
    throw new Error(`Coupon ${code} has reached maximum uses (${coupon.usedCount}/${coupon.maxUses})`);
  }

  // Check if user has exceeded maxUsesPerUser limit
  if (userId && coupon.maxUsesPerUser !== null && coupon.maxUsesPerUser !== undefined) {
    const userCouponUsage = await Purchase.countDocuments({
      user: userId,
      'coupon.code': code,
      status: 'completed'
    });
    
    if (userCouponUsage >= coupon.maxUsesPerUser) {
      throw new Error(`You have already used this coupon ${userCouponUsage}/${coupon.maxUsesPerUser} times`);
    }
  }

  // Check if coupon is applicable to any of the items
  const isApplicable = isCouponApplicable(coupon, items);

  if (!isApplicable) {
    throw new Error('Coupon is not applicable to the selected items');
  }

  return coupon;
};

/**
 * Centralized function to calculate discount amount
 */
const calculateCouponDiscount = (coupon, totalAmount) => {
  if (coupon.discountType === 'percentage') {
    return (totalAmount * coupon.discountValue) / 100;
  } else if (coupon.discountType === 'fixed') {
    return Math.min(coupon.discountValue, totalAmount);
  }
  return 0;
};

module.exports = {
  isCouponApplicable,
  resolveCoupon,
  calculateCouponDiscount
};