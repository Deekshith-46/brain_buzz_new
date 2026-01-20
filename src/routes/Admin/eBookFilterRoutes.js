const express = require('express');
const router = express.Router();
const { 
  getEBookCategories, 
  getEBookSubCategories 
} = require('../../controllers/Admin/eBookController');
const adminAuthMiddleware = require('../../middlewares/Admin/authMiddleware');

// Require authentication for all filter routes
router.use(adminAuthMiddleware);

// Get distinct categories for e-books
router.get('/categories', getEBookCategories);

// Get distinct subcategories for e-books based on category and language
router.get('/subcategories', getEBookSubCategories);

module.exports = router;