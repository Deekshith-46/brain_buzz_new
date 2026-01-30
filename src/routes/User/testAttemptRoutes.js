const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const userAuthMiddleware = require('../../middlewares/User/authMiddleware');
const checkContentAccess = require('../../middlewares/checkContentAccess');
const checkTestAccess = require('../../middlewares/checkTestAccess');

// Rate limiting for exam endpoints (CBT security)
const examRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // limit each user to 30 requests per windowMs
  message: {
    success: false,
    message: 'Too many exam requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const submitRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 15, // limit each user to 15 answer submissions per minute
  message: {
    success: false,
    message: 'Too many answer submissions, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
const {
  startTest,
  submitAnswer,
  submitTest,
  getResultAnalysis,
  getUserTestAttempts,
  getLeaderboard,
  getLiveQuestions,
  getQuestionPaper,
  markQuestionVisited
} = require('../../controllers/User/testAttemptController');

// Start Test
router.post('/:seriesId/:testId/start', userAuthMiddleware, checkTestAccess({ mode: 'START' }), startTest);

// Submit Answer (Rate limited)
router.post('/:seriesId/:testId/submit-question', userAuthMiddleware, checkTestAccess({ mode: 'SUBMIT' }), submitRateLimiter, submitAnswer);

// Submit Test (Finish Test)
router.post('/:seriesId/:testId/submit', userAuthMiddleware, checkTestAccess({ mode: 'SUBMIT' }), submitTest);

// Get Full Result Analysis
router.get('/:attemptId/result', userAuthMiddleware, getResultAnalysis);

// Get User's Test Attempts
router.get('/my-attempts', userAuthMiddleware, getUserTestAttempts);

// Get Live Questions for Active Attempt (Exam Mode) (Rate limited)
router.get('/:attemptId/questions', userAuthMiddleware, examRateLimiter, getLiveQuestions);

// Get Question Paper (Lightweight view) (Rate limited)
router.get('/:attemptId/question-paper', userAuthMiddleware, examRateLimiter, getQuestionPaper);

// Mark Question as Visited (Navigation tracking) (Rate limited)
router.post('/:seriesId/:testId/visit-question', userAuthMiddleware, examRateLimiter, markQuestionVisited);

// Get Leaderboard for a test
router.get('/:seriesId/:testId/leaderboard', userAuthMiddleware, checkTestAccess({ mode: 'LEADERBOARD' }), getLeaderboard);

module.exports = router;