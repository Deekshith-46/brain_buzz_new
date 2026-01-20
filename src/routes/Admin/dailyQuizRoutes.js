const express = require('express');
const {
  createDailyQuiz,
  getDailyQuizzes,
  getDailyQuizById,
  updateDailyQuiz,
  deleteDailyQuiz,
  updateQuestion,
  addQuestion,
  deleteQuestion,
} = require('../../controllers/Admin/dailyQuizController');
const adminAuthMiddleware = require('../../middlewares/Admin/authMiddleware');

const router = express.Router();

router.use(adminAuthMiddleware);

router.post('/', createDailyQuiz);
router.get('/', getDailyQuizzes);
router.get('/:id', getDailyQuizById);
router.patch('/:id', updateDailyQuiz);
router.delete('/:id', deleteDailyQuiz);

// Granular question APIs
router.patch('/:quizId/questions/:questionId', updateQuestion);
router.post('/:quizId/questions', addQuestion);
router.delete('/:quizId/questions/:questionId', deleteQuestion);

module.exports = router;