// src/utils/pricingUtils.js
const TestSeries = require('../models/TestSeries/TestSeries');
const Course = require('../models/Course/Course');
const Publication = require('../models/Publication/Publication');

/**
 * Get the original price for a single item (before any discounts)
 * Supports validity-based pricing
 */
const getOriginalPrice = async (item) => {
  if (item.itemType === 'test_series') {
    const ts = await TestSeries.findById(item.itemId).select('originalPrice price validities');
    
    // Check for validity-based pricing
    if (item.validity && ts?.validities && ts.validities.length > 0) {
      const validityOption = ts.validities.find(v => v.label === item.validity);
      if (validityOption) {
        return validityOption.pricing.originalPrice;
      }
    }
    
    // Fallback to legacy pricing
    return ts?.originalPrice ?? ts?.price ?? 0;
  }

  if (item.itemType === 'online_course') {
    const c = await Course.findById(item.itemId).select('originalPrice price validities');
    
    // Check for validity-based pricing
    if (item.validity && c?.validities && c.validities.length > 0) {
      const validityOption = c.validities.find(v => v.label === item.validity);
      if (validityOption) {
        return validityOption.pricing.originalPrice;
      }
    }
    
    // Fallback to legacy pricing
    return c?.originalPrice ?? c?.price ?? 0;
  }

  if (item.itemType === 'publication') {
    const p = await Publication.findById(item.itemId).select('originalPrice');
    return p?.originalPrice ?? 0;
  }

  throw new Error(`Unsupported itemType: ${item.itemType}`);
};

/**
 * Get the final price for a single item (after product-level discounts)
 * This is the correct base price for coupon calculations
 * Supports validity-based pricing
 */
const getFinalPrice = async (item) => {
  if (item.itemType === 'test_series') {
    const ts = await TestSeries.findById(item.itemId).select('originalPrice price finalPrice validities');
    
    // Check for validity-based pricing
    if (item.validity && ts?.validities && ts.validities.length > 0) {
      const validityOption = ts.validities.find(v => v.label === item.validity);
      if (validityOption) {
        return validityOption.pricing.finalPrice;
      }
    }
    
    // Fallback to legacy pricing
    return ts?.finalPrice ?? ts?.price ?? ts?.originalPrice ?? 0;
  }

  if (item.itemType === 'online_course') {
    const c = await Course.findById(item.itemId).select('originalPrice price finalPrice discountValue validities');
    
    // Check for validity-based pricing
    if (item.validity && c?.validities && c.validities.length > 0) {
      const validityOption = c.validities.find(v => v.label === item.validity);
      if (validityOption) {
        return validityOption.pricing.finalPrice;
      }
    }
    
    // Fallback to legacy pricing
    if (c?.finalPrice) {
      return c.finalPrice;
    } else if (c?.originalPrice) {
      const discountValue = c.discountValue || 0;
      const discountType = c.discountType || 'fixed';
      
      if (discountType === 'percentage') {
        const calculatedDiscount = (c.originalPrice * discountValue) / 100;
        return c.originalPrice - calculatedDiscount;
      } else {
        // fixed discount type
        return c.originalPrice - discountValue;
      }
    }
    return c?.price ?? c?.originalPrice ?? 0;
  }

  if (item.itemType === 'publication') {
    const p = await Publication.findById(item.itemId).select('originalPrice discountValue discountType finalPrice');
    // For publications, finalPrice should be originalPrice minus discountValue
    if (p?.finalPrice !== undefined) {
      return p.finalPrice;
    } else if (p?.originalPrice) {
      const discountValue = p.discountValue || 0;
      const discountType = p.discountType || 'fixed';
      
      if (discountType === 'percentage') {
        // Cap percentage at 100%
        const cappedPercentage = Math.min(discountValue, 100);
        const calculatedDiscount = (p.originalPrice * cappedPercentage) / 100;
        return Math.max(p.originalPrice - calculatedDiscount, 0);
      } else {
        // fixed discount type - cap at original price
        const cappedDiscount = Math.min(discountValue, p.originalPrice);
        return Math.max(p.originalPrice - cappedDiscount, 0);
      }
    }
    return p?.originalPrice ?? 0;
  }

  throw new Error(`Unsupported itemType: ${item.itemType}`);
};

/**
 * Calculate the base total for a list of items (using final prices after product discounts)
 */
const calculateBaseTotal = async (items) => {
  let total = 0;
  for (const item of items) {
    total += await getFinalPrice(item);
  }
  return total;
};

/**
 * Calculate the original total (before any discounts)
 */
const calculateOriginalTotal = async (items) => {
  let total = 0;
  for (const item of items) {
    total += await getOriginalPrice(item);
  }
  return total;
};

/**
 * Calculate product-level discount total
 */
const calculateProductDiscountTotal = async (items) => {
  let originalTotal = 0;
  let finalTotal = 0;
  
  for (const item of items) {
    originalTotal += await getOriginalPrice(item);
    finalTotal += await getFinalPrice(item);
  }
  
  return Math.max(0, originalTotal - finalTotal);
};

module.exports = { getOriginalPrice, getFinalPrice, calculateBaseTotal, calculateOriginalTotal, calculateProductDiscountTotal };