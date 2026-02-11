const express = require('express');
const { getAllDeliveries, updateDeliveryStatus, deleteDelivery } = require('../../controllers/Admin/deliveryController');
const adminAuthMiddleware = require('../../middlewares/Admin/authMiddleware');

const router = express.Router();

router.use(adminAuthMiddleware);

// Get all deliveries (dashboard view)
router.get('/', getAllDeliveries);

// Update delivery status
router.patch('/:deliveryId/status', updateDeliveryStatus);

// Delete delivery by ID (for testing)
router.delete('/:deliveryId', deleteDelivery);

module.exports = router;