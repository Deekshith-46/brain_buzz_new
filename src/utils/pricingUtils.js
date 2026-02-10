// src/utils/pricingUtils.js
const TestSeries = require('../models/TestSeries/TestSeries');
const Course = require('../models/Course/Course');
const Publication = require('../models/Publication/Publication');

/**
 * Get the original price for a single item (before any discounts)
 */
const getOriginalPrice = async (item) => {
  if (item.itemType === 'test_series') {
    const ts = await TestSeries.findById(item.itemId).select('originalPrice price');
    return ts?.originalPrice ?? ts?.price ?? 0;
  }

  if (item.itemType === 'online_course') {
    const c = await Course.findById(item.itemId).select('originalPrice price');
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
 */
const getFinalPrice = async (item) => {
  if (item.itemType === 'test_series') {
    const ts = await TestSeries.findById(item.itemId).select('originalPrice price finalPrice');
    // Use finalPrice if available, otherwise fallback to regular price
    return ts?.finalPrice ?? ts?.price ?? ts?.originalPrice ?? 0;
  }

  if (item.itemType === 'online_course') {
    const c = await Course.findById(item.itemId).select('originalPrice price finalPrice discountPrice');
    // For courses, finalPrice should be originalPrice minus discountPrice
    if (c?.finalPrice) {
      return c.finalPrice;
    } else if (c?.discountPrice !== undefined && c?.originalPrice) {
      return c.originalPrice - c.discountPrice;
    }
    return c?.price ?? c?.originalPrice ?? 0;
  }

  if (item.itemType === 'publication') {
    const p = await Publication.findById(item.itemId).select('originalPrice discountPrice finalPrice');
    // For publications, finalPrice should be originalPrice minus discountPrice
    if (p?.finalPrice) {
      return p.finalPrice;
    } else if (p?.discountPrice !== undefined && p?.originalPrice) {
      return p.originalPrice - p.discountPrice;
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