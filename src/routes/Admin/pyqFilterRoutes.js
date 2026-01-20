const express = require('express');
const router = express.Router();
const { 
  getPYQCategories, 
  getPYQSubCategories 
} = require('../../controllers/Admin/pyqController');
const adminAuthMiddleware = require('../../middlewares/Admin/authMiddleware');

// Require authentication for all filter routes
router.use(adminAuthMiddleware);

// Get distinct categories for previous question papers
router.get('/categories', getPYQCategories);

// Get distinct subcategories for previous question papers based on category
router.get('/subcategories', getPYQSubCategories);

module.exports = router;