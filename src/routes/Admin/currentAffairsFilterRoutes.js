const express = require('express');
const router = express.Router();

const {
  getCurrentAffairsCategories,
  getCurrentAffairsSubCategories
} = require('../../controllers/Admin/currentAffairsController');

const adminAuthMiddleware = require('../../middlewares/Admin/authMiddleware');

// Require authentication for all filter routes
router.use(adminAuthMiddleware);

// Get distinct categories for current affairs
router.get('/categories', getCurrentAffairsCategories);

// Get distinct subcategories for current affairs based on category and language
router.get('/subcategories', getCurrentAffairsSubCategories);

module.exports = router;
