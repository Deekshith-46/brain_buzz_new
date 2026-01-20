const express = require('express');
const router = express.Router();
const { 
  getDailyQuizCategories, 
  getDailyQuizSubCategories 
} = require('../../controllers/Admin/dailyQuizController');
const adminAuthMiddleware = require('../../middlewares/Admin/authMiddleware');

// Require authentication for all filter routes
router.use(adminAuthMiddleware);

// Get distinct categories for daily quizzes
router.get('/categories', getDailyQuizCategories);

// Get distinct subcategories for daily quizzes based on category and language
router.get('/subcategories', getDailyQuizSubCategories);

module.exports = router;