const express = require('express');
const {
  listDailyQuizzes,
  getDailyQuizById,
} = require('../../controllers/User/dailyQuizController');

const router = express.Router();

router.get('/daily-quizzes', listDailyQuizzes);
router.get('/daily-quizzes/:id', getDailyQuizById);

module.exports = router;
