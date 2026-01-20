const express = require('express');
const {
  listCurrentAffairs,
  getCurrentAffairById,
  // Filter helpers
  getCategoriesWithCurrentAffairs,
  getLanguagesByCategory,
  getSubCategoriesByCategory,
  getSubCategoriesByLanguage,
  getFilteredCurrentAffairs,
  getAvailableAffairTypes,
  getCurrentAffairsCategoryTypes
} = require('../../controllers/User/currentAffairsController');

const router = express.Router();

// -------- Public Filter Helper Routes (MUST come before :id route) --------
// Step 1: Get all categories with current affairs
router.get('/current-affairs/categories', getCategoriesWithCurrentAffairs);

// Step 2a: Get available languages for a category
router.get('/current-affairs/categories/:categoryId/languages', getLanguagesByCategory);

// Step 2b: Get subcategories for a category (defaults to English)
router.get('/current-affairs/categories/:categoryId/subcategories-default', getSubCategoriesByCategory);

// Step 3: Get subcategories filtered by selected language
router.get('/current-affairs/categories/:categoryId/subcategories', getSubCategoriesByLanguage);

// Step 4: Get filtered current affairs
router.get('/current-affairs/affairs', getFilteredCurrentAffairs);

// Get subcategories by category (using query param)
router.get('/current-affairs/subcategories', getSubCategoriesByLanguage);

// Get available affair types
router.get('/current-affairs/types', getAvailableAffairTypes);

// Get available Current Affairs category types
router.get('/current-affairs/category-types', getCurrentAffairsCategoryTypes);

// -------- General Current Affairs Routes --------
// Get all current affairs
router.get('/current-affairs', listCurrentAffairs);

// Get single current affair by ID (MUST be last to avoid conflicts)
router.get('/current-affairs/:id', getCurrentAffairById);

module.exports = router;
