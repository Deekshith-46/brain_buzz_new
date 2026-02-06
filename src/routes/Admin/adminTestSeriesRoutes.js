const express = require('express');
const router = express.Router();

// Import admin controllers
const {
  getAllTestSeries,
  getTestSeriesById,
  getTestById
} = require('../../controllers/Admin/adminTestSeriesController');

// Import admin auth middleware
const authenticateAdmin = require('../../middlewares/Admin/authMiddleware');

// Apply admin authentication to all routes
router.use(authenticateAdmin);

// Admin Test Series Routes
router.get('/', getAllTestSeries);
router.get('/:seriesId', getTestSeriesById);
router.get('/:seriesId/tests/:testId', getTestById);

module.exports = router;