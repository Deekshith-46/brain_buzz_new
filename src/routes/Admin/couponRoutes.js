// routes/Admin/couponRoutes.js
const express = require('express');
const router = express.Router();
const adminAuth = require('../../middlewares/Admin/authMiddleware');
const couponController = require('../../controllers/Admin/couponController');
const {
  validateCouponCreation,
  validateCouponUpdate
} = require('../../middlewares/validators/couponValidator');

// Create a new coupon
router.post(
  '/',
  adminAuth,
  validateCouponCreation,
  couponController.createCoupon
);

// Update coupon
router.put(
  '/:couponId',
  adminAuth,
  validateCouponUpdate,
  couponController.updateCoupon
);

// List all coupons
router.get(
  '/',
  adminAuth,
  couponController.listCoupons
);

// Get coupon details
router.get(
  '/:couponId',
  adminAuth,
  couponController.getCoupon
);

// Toggle coupon status
router.patch(
  '/:couponId/toggle-status',
  adminAuth,
  couponController.toggleCouponStatus
);

// Delete coupon
router.delete(
  '/:couponId',
  adminAuth,
  couponController.deleteCoupon
);

module.exports = router;