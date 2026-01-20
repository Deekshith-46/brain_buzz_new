const express = require('express');
const router = express.Router();
const {
  getLiveClassCategories,
  getLanguagesByCategory,
  getSubCategoriesByCategoryAndLanguage,
  getLiveClasses,
  getLiveClassById,
  searchLiveClasses,
} = require('../../controllers/User/liveClassController');

// Get all Categories for Live Classes
router.get('/categories', getLiveClassCategories);

// Get Languages for a specific Category
router.get('/languages', getLanguagesByCategory);

// Get SubCategories for a specific Category and Language
router.get('/subcategories', getSubCategoriesByCategoryAndLanguage);

// Get Live Classes with filtering
router.get('/', getLiveClasses);

// Get a single Live Class by ID
router.get('/:id', getLiveClassById);

// Search Live Classes
router.get('/search', searchLiveClasses);

module.exports = router;