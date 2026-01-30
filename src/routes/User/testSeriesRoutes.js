// In src/routes/User/testSeriesRoutes.js

const express = require('express');
const router = express.Router();
const userAuthMiddleware = require('../../middlewares/User/authMiddleware');
const {
  listPublicTestSeries,
  getPublicTestSeriesById,
  getPublicTestInSeries,
  getPublicTestInSeriesPublic, // New controller function for public access
  listTestSeries // New listing endpoint with filters
} = require('../../controllers/User/testSeriesPublicController');

// List of active Test Series (requires user authentication)
router.get('/', userAuthMiddleware, listPublicTestSeries);

// List test series with filters (matches Online Course format)
router.get('/filters', userAuthMiddleware, listTestSeries);

// Details for a single Test Series (requires user authentication)
router.get('/:seriesId', userAuthMiddleware, getPublicTestSeriesById);
router.get('/public/:seriesId/tests/:testId', getPublicTestInSeriesPublic); // Public endpoint

// Test details; video URL only for authenticated & paid users
router.get('/:seriesId/tests/:testId', userAuthMiddleware, getPublicTestInSeries);

module.exports = router;