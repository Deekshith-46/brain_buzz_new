const express = require('express');
const router = express.Router();

// Import admin controllers (will create these)
const {
  startTest,
  getLiveQuestions,
  submitQuestion,
  visitQuestion,
  submitTest,
  getResultAnalysis,
  getMyAttempts
} = require('../../controllers/Admin/adminTestAttemptController');

// Import admin auth middleware
const authenticateAdmin = require('../../middlewares/Admin/authMiddleware');

// Apply admin authentication to all routes
router.use(authenticateAdmin);

// Admin Test Attempt Routes
router.post('/:seriesId/:testId/start', startTest);
router.get('/:attemptId/questions', getLiveQuestions);
router.post('/:seriesId/:testId/submit-question', submitQuestion);
router.post('/:seriesId/:testId/visit-question', visitQuestion);
router.post('/:seriesId/:testId/submit', submitTest);
router.get('/:attemptId/result', getResultAnalysis);
router.get('/my-attempts', getMyAttempts);

module.exports = router;