const DailyQuiz = require('../../models/Quiz/DailyQuiz');

// Public: list daily quizzes
exports.listDailyQuizzes = async (req, res) => {
  try {
    const { category, subCategory, language, month } = req.query;

    const filter = {
      contentType: 'DAILY_QUIZ',
      isActive: true,
    };

    if (category) filter.categories = category;
    if (subCategory) filter.subCategories = subCategory;
    if (language) filter.languages = language;
    if (month) filter.month = month;

    const quizzes = await DailyQuiz.find(filter)
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code');

    return res.status(200).json({ data: quizzes });
  } catch (error) {
    console.error('Error listing Daily Quizzes:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Public: get single daily quiz
exports.getDailyQuizById = async (req, res) => {
  try {
    const { id } = req.params;

    const quiz = await DailyQuiz.findOne({
      _id: id,
      contentType: 'DAILY_QUIZ',
      isActive: true,
    })
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code');

    if (!quiz) {
      return res.status(404).json({ message: 'Daily Quiz not found' });
    }

    return res.status(200).json({ data: quiz });
  } catch (error) {
    console.error('Error fetching Daily Quiz:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};
