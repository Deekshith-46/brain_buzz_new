const express = require('express');
const router = express.Router();

// Import admin route modules
const adminTestAttemptRoutes = require('./adminTestAttemptRoutes');
const adminTestSeriesRoutes = require('./adminTestSeriesRoutes');
const adminFilterRoutes = require('./adminFilterRoutes');

// Mount admin routes
router.use('/test-attempts', adminTestAttemptRoutes);
router.use('/test-series', adminTestSeriesRoutes);
router.use('/filters', adminFilterRoutes);

module.exports = router;