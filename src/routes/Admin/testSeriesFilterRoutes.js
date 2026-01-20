const express = require('express');
const router = express.Router();
const { 
  getTestSeriesCategories, 
  getTestSeriesSubCategories 
} = require('../../controllers/Admin/testSeriesController');
const adminAuthMiddleware = require('../../middlewares/Admin/authMiddleware');

// Require authentication for all filter routes
router.use(adminAuthMiddleware);

// Get distinct categories for test series
router.get('/categories', getTestSeriesCategories);

// Get distinct subcategories for test series based on category and language
router.get('/subcategories', getTestSeriesSubCategories);

module.exports = router;