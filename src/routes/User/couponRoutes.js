// routes/User/couponRoutes.js
const express = require('express');
const router = express.Router();
const userAuth = require('../../middlewares/User/authMiddleware');
const couponController = require('../../controllers/User/couponController');

// Get applicable coupons for user's cart
router.post(
  '/applicable',
  userAuth,
  couponController.getApplicableCoupons
);

// Validate a coupon
router.post(
  '/validate',
  userAuth,
  couponController.validateCoupon
);

module.exports = router;