const express = require('express');
const router = express.Router();

// Import admin route modules
const adminTestAttemptRoutes = require('./adminTestAttemptRoutes');
const adminTestSeriesRoutes = require('./adminTestSeriesRoutes');
const adminFilterRoutes = require('./adminFilterRoutes');
const deliveryRoutes = require('./deliveryRoutes');

// Mount admin routes
router.use('/test-attempts', adminTestAttemptRoutes);
router.use('/test-series', adminTestSeriesRoutes);
router.use('/filters', adminFilterRoutes);
router.use('/deliveries', deliveryRoutes);

module.exports = router;