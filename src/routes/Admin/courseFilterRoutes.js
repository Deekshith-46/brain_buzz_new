const express = require('express');
const router = express.Router();
const { 
  getCourseCategories, 
  getCourseSubCategories 
} = require('../../controllers/Admin/courseController');
const adminAuthMiddleware = require('../../middlewares/Admin/authMiddleware');

// Require authentication for all filter routes
router.use(adminAuthMiddleware);

// Get distinct categories for courses
router.get('/categories', getCourseCategories);

// Get distinct subcategories for courses based on category and language
router.get('/subcategories', getCourseSubCategories);

module.exports = router;