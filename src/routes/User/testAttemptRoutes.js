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
  getUserTestAttempts,
  getLeaderboard
} = require('../../controllers/User/testAttemptController');

// Start Test
router.post('/:seriesId/:testId/start', userAuthMiddleware, checkTestAccess({ mode: 'START' }), startTest);

// Submit Answer
router.post('/:seriesId/:testId/submit-question', userAuthMiddleware, checkTestAccess({ mode: 'SUBMIT' }), submitAnswer);

// Submit Test (Finish Test)
router.post('/:seriesId/:testId/submit', userAuthMiddleware, checkTestAccess({ mode: 'SUBMIT' }), submitTest);

// Get Full Result Analysis
router.get('/:attemptId/result', userAuthMiddleware, getResultAnalysis);

// Get User's Test Attempts
router.get('/my-attempts', userAuthMiddleware, getUserTestAttempts);

// Get Leaderboard for a test
router.get('/:seriesId/:testId/leaderboard', userAuthMiddleware, checkTestAccess({ mode: 'LEADERBOARD' }), getLeaderboard);

module.exports = router;