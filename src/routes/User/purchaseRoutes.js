const express = require('express');
const router = express.Router();

const {
  getMyPurchasedCourses,
  getMyPurchasedTestSeries,
  getMyPurchasedPublications,
  getMyPurchasedContent,
  getPurchaseHistory
} = require('../../controllers/User/myPurchasesController');

const userAuthMiddleware = require('../../middlewares/User/authMiddleware');

// All routes require authentication
router.use(userAuthMiddleware);

// Main endpoints for purchased content
router.get('/courses', getMyPurchasedCourses);           // GET /api/user/purchases/courses
router.get('/test-series', getMyPurchasedTestSeries);    // GET /api/user/purchases/test-series
router.get('/publications', getMyPurchasedPublications); // GET /api/user/purchases/publications

// Comprehensive dashboard endpoint
router.get('/', getMyPurchasedContent);                  // GET /api/user/purchases
router.get('/dashboard', getMyPurchasedContent);         // GET /api/user/purchases/dashboard

// Purchase history endpoint
router.get('/history', getPurchaseHistory);              // GET /api/user/purchases/history

module.exports = router;