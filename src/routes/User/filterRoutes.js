const express = require('express');
const router = express.Router();
const { 
  getPublicationCategories,
  getPublicationSubCategories,
  getEBookCategories,
  getEBookSubCategories,
  getDailyQuizCategories,
  getDailyQuizSubCategories,
  getPreviousQuestionPaperCategories,
  getPreviousQuestionPaperSubCategories,
  getPreviousQuestionPaperExams,
  getPreviousQuestionPaperSubjects,
  getTestSeriesCategories,
  getTestSeriesSubCategories
} = require('../../controllers/User/filterController');
const userAuthMiddleware = require('../../middlewares/User/authMiddleware');

// Require authentication for all filter routes
router.use(userAuthMiddleware);

// Publication filter routes
router.get('/publications/categories', getPublicationCategories);
router.get('/publications/subcategories', getPublicationSubCategories);

// EBook filter routes
router.get('/ebooks/categories', getEBookCategories);
router.get('/ebooks/subcategories', getEBookSubCategories);

// Daily Quiz filter routes
router.get('/daily-quizzes/categories', getDailyQuizCategories);
router.get('/daily-quizzes/subcategories', getDailyQuizSubCategories);

// Previous Question Paper filter routes
router.get('/previous-question-papers/categories', getPreviousQuestionPaperCategories);
router.get('/previous-question-papers/subcategories', getPreviousQuestionPaperSubCategories);
router.get('/previous-question-papers/exams', getPreviousQuestionPaperExams);
router.get('/previous-question-papers/subjects', getPreviousQuestionPaperSubjects);

// Test Series filter routes
router.get('/test-series/categories', getTestSeriesCategories);
router.get('/test-series/subcategories', getTestSeriesSubCategories);

module.exports = router;