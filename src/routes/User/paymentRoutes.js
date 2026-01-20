// src/routes/User/paymentRoutes.js
const express = require('express');
const router = express.Router();
const paymentController = require('../../controllers/User/paymentController');
const userAuthMiddleware = require('../../middlewares/User/authMiddleware');

// Public route to get test series price
router.get('/test-series/:testSeriesId/price', paymentController.getTestSeriesPrice);
router.get('/courses/:courseId/price', paymentController.getCoursePrice);

// Protected routes (require authentication)
router.post('/create-order', userAuthMiddleware, paymentController.createOrder);
router.post('/verify', userAuthMiddleware, paymentController.verifyPayment);
router.get('/orders', userAuthMiddleware, paymentController.getOrderHistory);

module.exports = router;