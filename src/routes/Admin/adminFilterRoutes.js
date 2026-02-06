const express = require('express');
const router = express.Router();

// Import admin filter controller
const { 
  getTestSeriesCategories, 
  getTestSeriesSubCategories 
} = require('../../controllers/Admin/adminFilterController');

// Import admin auth middleware
const authenticateAdmin = require('../../middlewares/Admin/authMiddleware');

// Apply admin authentication to all routes
router.use(authenticateAdmin);

// Admin Filter Routes (reusing user controllers since no difference)
router.get('/test-series/categories', getTestSeriesCategories);
router.get('/test-series/subcategories', getTestSeriesSubCategories);

module.exports = router;