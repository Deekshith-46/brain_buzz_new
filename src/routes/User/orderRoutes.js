// src/routes/User/orderRoutes.js
const express = require('express');
const router = express.Router();
const orderController = require('../../controllers/User/orderController');
const userAuthMiddleware = require('../../middlewares/User/authMiddleware');

// Protected routes (require authentication)
router.get('/:orderId', userAuthMiddleware, orderController.getOrderDetails);
router.get('/', userAuthMiddleware, orderController.getOrderHistory);

module.exports = router;