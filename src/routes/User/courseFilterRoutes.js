const express = require('express');
const router = express.Router();
const { 
  getCourseCategories, 
  getCourseSubCategories 
} = require('../../controllers/User/courseController');
const userAuthMiddleware = require('../../middlewares/User/authMiddleware');

// Require authentication for all filter routes
router.use(userAuthMiddleware);

// Get distinct categories for active courses
router.get('/categories', getCourseCategories);

// Get distinct subcategories for active courses based on category and language
router.get('/subcategories', getCourseSubCategories);

module.exports = router;