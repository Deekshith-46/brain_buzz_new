const express = require('express');
const router = express.Router();
const { 
  getPublicationCategories, 
  getPublicationSubCategories 
} = require('../../controllers/Admin/publicationController');
const adminAuthMiddleware = require('../../middlewares/Admin/authMiddleware');

// Require authentication for all filter routes
router.use(adminAuthMiddleware);

// Get distinct categories for publications
router.get('/categories', getPublicationCategories);

// Get distinct subcategories for publications based on category and language
router.get('/subcategories', getPublicationSubCategories);

module.exports = router;