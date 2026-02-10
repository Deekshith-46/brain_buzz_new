const express = require('express');
const { getAllDeliveries, updateDeliveryStatus } = require('../../controllers/Admin/deliveryController');
const adminAuthMiddleware = require('../../middlewares/Admin/authMiddleware');

const router = express.Router();

router.use(adminAuthMiddleware);

// Get all deliveries (dashboard view)
router.get('/', getAllDeliveries);

// Update delivery status
router.patch('/:deliveryId/status', updateDeliveryStatus);

module.exports = router;