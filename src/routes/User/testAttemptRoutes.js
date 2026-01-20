const express = require('express');
const router = express.Router();
const userAuthMiddleware = require('../../middlewares/User/authMiddleware');
const checkContentAccess = require('../../middlewares/checkContentAccess');
const checkTestAccess = require('../../middlewares/checkTestAccess');
const {
  startTest,
  submitAnswer,
  submitTest,
  getResultAnalysis,
  getUserTestAttempts
} = require('../../controllers/User/testAttemptController');

// Start Test
router.post('/:seriesId/:testId/start', userAuthMiddleware, checkContentAccess, startTest);

// Submit Answer
router.post('/:seriesId/:testId/submit-question', userAuthMiddleware, checkTestAccess, submitAnswer);

// Submit Test (Finish Test)
router.post('/:seriesId/:testId/submit', userAuthMiddleware, checkTestAccess, submitTest);

// Get Full Result Analysis
router.get('/:attemptId/result', userAuthMiddleware, getResultAnalysis);

// Get User's Test Attempts
router.get('/my-attempts', userAuthMiddleware, getUserTestAttempts);

module.exports = router;