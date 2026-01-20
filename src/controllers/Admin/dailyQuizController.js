const DailyQuiz = require('../../models/Quiz/DailyQuiz');
const Category = require('../../models/Course/Category');
const SubCategory = require('../../models/Course/SubCategory');
const Language = require('../../models/Course/Language');

// Helper function to escape regex special characters
const escapeRegex = (s) => s.replace(/[.*+?^${}()|\[\]\\]/g, '\\$&');

// Helper function to calculate totals from sections
function calculateTotals(sections) {
  let totalQuestions = 0;
  let totalMarks = 0;

  if (Array.isArray(sections)) {
    for (const section of sections) {
      if (Array.isArray(section.questions)) {
        for (const question of section.questions) {
          totalQuestions += 1;
          totalMarks += question.marks || 0;
        }
      }
    }
  }

  return { totalQuestions, totalMarks };
}

// Create Daily Quiz
exports.createDailyQuiz = async (req, res) => {
  try {
    if (!req.body.quiz) {
      return res
        .status(400)
        .json({ message: 'Quiz data (quiz) is required in JSON body' });
    }

    const {
      name,
      month,
      examDate,
      categoryIds = [],
      subCategoryIds = [],
      languageIds = [],
      freeMockLinks,
      instructions,
      sections = [],
      isActive,
    } = req.body.quiz;

    if (!name) {
      return res.status(400).json({ message: 'Quiz name is required' });
    }

    // Auto-calculate totals from questions
    const { totalQuestions, totalMarks } = calculateTotals(sections);

    const quiz = await DailyQuiz.create({
      name,
      month,
      examDate,
      categories: categoryIds,
      subCategories: subCategoryIds,
      languages: languageIds,
      totalMarks,
      totalQuestions,
      freeMockLinks,
      instructions,
      sections,
      isActive,
    });

    return res.status(201).json({
      message: 'Daily Quiz created successfully',
      data: quiz,
    });
  } catch (error) {
    console.error('Error creating Daily Quiz:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all Daily Quizzes (admin)
exports.getDailyQuizzes = async (req, res) => {
  try {
    const { category, subCategory, language, month, isActive } = req.query;

    const filter = {};
    if (category) filter.categories = category;
    if (subCategory) filter.subCategories = subCategory;
    if (language) filter.languages = language;
    if (month) filter.month = month;
    if (typeof isActive !== 'undefined') filter.isActive = isActive === 'true';

    const quizzes = await DailyQuiz.find(filter)
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code');

    return res.status(200).json({ data: quizzes });
  } catch (error) {
    console.error('Error fetching Daily Quizzes:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get single quiz (admin)
exports.getDailyQuizById = async (req, res) => {
  try {
    const { id } = req.params;

    const quiz = await DailyQuiz.findById(id)
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

// Update Daily Quiz (PATCH implementation)
exports.updateDailyQuiz = async (req, res) => {
  try {
    const { id } = req.params;

    const updates = {};
    
    // Handle quiz object updates
    if (req.body.quiz) {
      const {
        name,
        month,
        examDate,
        categoryIds,
        subCategoryIds,
        languageIds,
        freeMockLinks,
        instructions,
        sections,
        isActive,
      } = req.body.quiz;

      if (name) updates.name = name;
      if (month) updates.month = month;
      if (examDate) updates.examDate = examDate;
      if (categoryIds) updates.categories = categoryIds;
      if (subCategoryIds) updates.subCategories = subCategoryIds;
      if (languageIds) updates.languages = languageIds;
      if (typeof freeMockLinks !== 'undefined') updates.freeMockLinks = freeMockLinks;
      if (typeof instructions !== 'undefined') updates.instructions = instructions;
      if (typeof isActive !== 'undefined') updates.isActive = isActive;
      
      // Handle sections - auto-calculate totals if sections are provided
      if (Array.isArray(sections)) {
        updates.sections = sections;
        const { totalQuestions, totalMarks } = calculateTotals(sections);
        updates.totalQuestions = totalQuestions;
        updates.totalMarks = totalMarks;
      }
    }
    
    // Handle sections updates (if sent directly)
    if (Array.isArray(req.body.sections)) {
      updates.sections = req.body.sections;
      const { totalQuestions, totalMarks } = calculateTotals(req.body.sections);
      updates.totalQuestions = totalQuestions;
      updates.totalMarks = totalMarks;
    }

    const quiz = await DailyQuiz.findByIdAndUpdate(id, { $set: updates }, {
      new: true,
      runValidators: true,
    })
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code');

    if (!quiz) {
      return res.status(404).json({ message: 'Daily Quiz not found' });
    }

    return res.status(200).json({
      message: 'Daily Quiz updated successfully',
      data: quiz,
    });
  } catch (error) {
    console.error('Error updating Daily Quiz:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add a new question to a quiz
exports.addQuestion = async (req, res) => {
  try {
    const { quizId } = req.params;
    
    const {
      sectionId,
      questionNumber,
      questionText,
      questionType,
      options,
      correctOptionIndex,
      explanation,
      marks,
      negativeMarks,
    } = req.body;

    // Validate required fields
    if (!questionText) {
      return res.status(400).json({ message: 'Question text is required' });
    }

    if (!sectionId) {
      return res.status(400).json({ message: 'Section ID is required' });
    }

    // Validate marks
    if (marks !== undefined && marks <= 0) {
      return res.status(400).json({ message: 'Marks must be greater than 0' });
    }

    if (negativeMarks !== undefined && negativeMarks < 0) {
      return res.status(400).json({ message: 'Negative marks cannot be negative' });
    }

    const quiz = await DailyQuiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Daily Quiz not found' });
    }

    // Find the specified section
    const section = quiz.sections.id(sectionId);
    if (!section) {
      return res.status(404).json({ message: 'Section not found' });
    }

    // Determine the next question number if not provided
    let nextQuestionNumber = questionNumber;
    if (nextQuestionNumber === undefined) {
      // Find the highest question number in the entire quiz and increment by 1
      let maxQuestionNumber = 0;
      for (const sec of quiz.sections) {
        for (const q of sec.questions) {
          if (q.questionNumber && q.questionNumber > maxQuestionNumber) {
            maxQuestionNumber = q.questionNumber;
          }
        }
      }
      nextQuestionNumber = maxQuestionNumber + 1;
    }

    // Create new question object with questionNumber
    const newQuestion = {
      questionNumber: nextQuestionNumber,
      questionText,
      questionType: questionType || 'MCQ',
      options: options || [],
      correctOptionIndex: correctOptionIndex !== undefined ? correctOptionIndex : null,
      explanation: explanation || '',
      marks: marks || 1,
      negativeMarks: negativeMarks || 0,
    };

    // Add to the specified section
    section.questions.push(newQuestion);
    
    // Recalculate totals
    const { totalQuestions, totalMarks } = calculateTotals(quiz.sections);
    quiz.totalQuestions = totalQuestions;
    quiz.totalMarks = totalMarks;

    // Save the quiz
    const updatedQuiz = await quiz.save();
    
    // Populate the references
    await updatedQuiz.populate('categories', 'name slug');
    await updatedQuiz.populate('subCategories', 'name slug');
    await updatedQuiz.populate('languages', 'name code');

    // Get the newly added question
    const addedSection = updatedQuiz.sections.id(sectionId);
    const addedQuestion = addedSection.questions[addedSection.questions.length - 1];

    return res.status(201).json({
      message: 'Question added successfully',
      data: addedQuestion,
    });
  } catch (error) {
    console.error('Error adding question:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update a single question within a quiz
exports.updateQuestion = async (req, res) => {
  try {
    const { quizId, questionId } = req.params;
    
    const {
      questionText,
      questionType,
      options,
      correctOptionIndex,
      explanation,
      marks,
      negativeMarks,
    } = req.body;

    // Validate marks if provided
    if (marks !== undefined && marks <= 0) {
      return res.status(400).json({ message: 'Marks must be greater than 0' });
    }

    if (negativeMarks !== undefined && negativeMarks < 0) {
      return res.status(400).json({ message: 'Negative marks cannot be negative' });
    }

    const updateFields = {};
    if (questionText !== undefined) updateFields['sections.$[].questions.$[question].questionText'] = questionText;
    if (questionType !== undefined) updateFields['sections.$[].questions.$[question].questionType'] = questionType;
    if (options !== undefined) updateFields['sections.$[].questions.$[question].options'] = options;
    if (correctOptionIndex !== undefined) updateFields['sections.$[].questions.$[question].correctOptionIndex'] = correctOptionIndex;
    if (explanation !== undefined) updateFields['sections.$[].questions.$[question].explanation'] = explanation;
    if (marks !== undefined) updateFields['sections.$[].questions.$[question].marks'] = marks;
    if (negativeMarks !== undefined) updateFields['sections.$[].questions.$[question].negativeMarks'] = negativeMarks;

    const quiz = await DailyQuiz.findByIdAndUpdate(
      quizId,
      { $set: updateFields },
      {
        new: true,
        runValidators: true,
        arrayFilters: [{ 'question._id': questionId }]
      }
    );

    if (!quiz) {
      return res.status(404).json({ message: 'Daily Quiz not found' });
    }

    // Recalculate totals after update
    const { totalQuestions, totalMarks } = calculateTotals(quiz.sections);
    quiz.totalQuestions = totalQuestions;
    quiz.totalMarks = totalMarks;
    
    // Save the updated totals
    await quiz.save();

    // Find the updated question to return
    let updatedQuestion = null;
    for (const section of quiz.sections) {
      const question = section.questions.find(q => q._id.toString() === questionId);
      if (question) {
        updatedQuestion = question;
        break;
      }
    }

    if (!updatedQuestion) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Repopulate for response
    const populatedQuiz = await DailyQuiz.findById(quizId)
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code');

    return res.status(200).json({
      message: 'Question updated successfully',
      data: updatedQuestion,
    });
  } catch (error) {
    console.error('Error updating question:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a question from a quiz
exports.deleteQuestion = async (req, res) => {
  try {
    const { quizId, questionId } = req.params;

    const quiz = await DailyQuiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Daily Quiz not found' });
    }

    let questionToDelete = null;
    
    // Find and remove the question
    for (const section of quiz.sections) {
      const questionIndex = section.questions.findIndex(q => q._id.toString() === questionId);
      if (questionIndex !== -1) {
        questionToDelete = section.questions.splice(questionIndex, 1)[0];
        break;
      }
    }

    if (!questionToDelete) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Recalculate totals after deletion
    const { totalQuestions, totalMarks } = calculateTotals(quiz.sections);
    quiz.totalQuestions = totalQuestions;
    quiz.totalMarks = totalMarks;

    await quiz.save();

    return res.status(200).json({
      message: 'Question deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting question:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete Daily Quiz
exports.deleteDailyQuiz = async (req, res) => {
  try {
    const { id } = req.params;

    const quiz = await DailyQuiz.findByIdAndDelete(id);
    if (!quiz) {
      return res.status(404).json({ message: 'Daily Quiz not found' });
    }

    return res.status(200).json({ message: 'Daily Quiz deleted successfully' });
  } catch (error) {
    console.error('Error deleting Daily Quiz:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get distinct categories for daily quizzes (admin - shows all quizzes regardless of active status)
exports.getDailyQuizCategories = async (req, res) => {
  try {
    // Find daily quizzes (including inactive) and get distinct categories
    const quizzes = await DailyQuiz.find({}).populate('categories', 'name slug description thumbnailUrl');

    // Extract unique categories
    const categories = [];
    const categoryIds = new Set();
    
    quizzes.forEach(quiz => {
      if (quiz.categories) {
        quiz.categories.forEach(cat => {
          if (!categoryIds.has(cat._id.toString())) {
            categoryIds.add(cat._id.toString());
            categories.push({
              _id: cat._id,
              name: cat.name,
              slug: cat.slug,
              description: cat.description,
              thumbnailUrl: cat.thumbnailUrl
            });
          }
        });
      }
    });

    return res.status(200).json({ data: categories });
  } catch (error) {
    console.error('Error fetching daily quiz categories:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get distinct subcategories for daily quizzes based on category and language (admin - shows all quizzes regardless of active status)
exports.getDailyQuizSubCategories = async (req, res) => {
  try {
    const { category, language, lang } = req.query;
    
    const filter = {
      categories: category
    };

    // Handle language filter
    if (language) {
      filter.languages = language;
    } else if (lang) {
      const langDoc = await Language.findOne({
        $or: [
          { code: lang.toLowerCase() },
          { name: { $regex: `^${escapeRegex(lang)}$`, $options: 'i' } },
        ],
      });
      if (langDoc) {
        filter.languages = langDoc._id;
      }
    }

    const quizzes = await DailyQuiz.find(filter).populate('subCategories', 'name slug description thumbnailUrl');

    // Extract unique subcategories
    const subCategories = [];
    const subCategoryIds = new Set();
    
    quizzes.forEach(quiz => {
      if (quiz.subCategories) {
        quiz.subCategories.forEach(subCat => {
          if (!subCategoryIds.has(subCat._id.toString())) {
            subCategoryIds.add(subCat._id.toString());
            subCategories.push({
              _id: subCat._id,
              name: subCat.name,
              slug: subCat.slug,
              description: subCat.description,
              thumbnailUrl: subCat.thumbnailUrl
            });
          }
        });
      }
    });

    return res.status(200).json({ data: subCategories });
  } catch (error) {
    console.error('Error fetching daily quiz subcategories:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};
