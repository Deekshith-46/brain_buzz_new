// src/routes/Admin/orderRoutes.js
const express = require('express');
const router = express.Router();
const  adminAuthMiddleware  = require('../../middlewares/Admin/authMiddleware');
const orderController = require('../../controllers/Admin/orderController');

// Get all orders (with optional filters)
router.get('/', adminAuthMiddleware, orderController.getAllOrders);

// Get order by ID
router.get('/:orderId', adminAuthMiddleware, orderController.getOrderById);

// Update order status
router.patch('/:orderId/status', adminAuthMiddleware, orderController.updateOrderStatus);

// Get orders by user ID
router.get('/user/:userId', adminAuthMiddleware, orderController.getOrdersByUser);

module.exports = router;