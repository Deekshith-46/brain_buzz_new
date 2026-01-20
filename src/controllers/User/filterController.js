const Course = require('../../models/Course/Course');
const Publication = require('../../models/Publication/Publication');
const EBook = require('../../models/EBook/EBook');
const DailyQuiz = require('../../models/Quiz/DailyQuiz');
const PreviousQuestionPaper = require('../../models/Course/PreviousQuestionPaper');
const TestSeries = require('../../models/TestSeries/TestSeries');
const Category = require('../../models/Course/Category');
const SubCategory = require('../../models/Course/SubCategory');
const Language = require('../../models/Course/Language');
const Exam = require('../../models/Course/Exam');
const Subject = require('../../models/Course/Subject');

// Helper function to handle database errors
const handleDatabaseError = (error) => {
  console.error('Database error:', error);
  
  // Check for specific error types and return appropriate status codes
  if (error.name === 'CastError') {
    return {
      statusCode: 400,
      message: 'Invalid ID format',
      error: error.message
    };
  }
  
  if (error.name === 'ValidationError') {
    return {
      statusCode: 400,
      message: 'Validation error',
      error: error.message
    };
  }
  
  if (error.code === 11000) {
    return {
      statusCode: 409,
      message: 'Duplicate entry error',
      error: error.message
    };
  }
  
  // Default error response
  return {
    statusCode: 500,
    message: 'Internal server error',
    error: error.message
  };
};

// Helper function to calculate finalPrice from originalPrice and discountPrice
const calculateFinalPrice = (originalPrice, discountPrice) => {
  const discountAmount = typeof discountPrice === 'number' && discountPrice >= 0
    ? discountPrice
    : 0;
  return Math.max(0, originalPrice - discountAmount);
};

// ============ PUBLICATION FILTERS ============

// Get distinct categories for active publications
exports.getPublicationCategories = async (req, res) => {
  try {
    const { language, lang } = req.query;
    
    const filter = {
      contentType: 'PUBLICATION',
      isActive: true,
    };

    // Handle language filter
    if (language) {
      filter.languages = language;
    } else if (lang) {
      const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const langDoc = await Language.findOne({
        $or: [
          { code: lang.toLowerCase() },
          { name: { $regex: `^${escapeRegex(lang)}$`, $options: 'i' } },
        ],
      });
      if (!langDoc) {
        return res.status(400).json({ message: 'Invalid language code or name' });
      }
      filter.languages = langDoc._id;
    }

    const publications = await Publication.find(filter).populate('categories', 'name slug description thumbnailUrl');

    // Extract unique categories
    const categories = [];
    const categoryIds = new Set();
    
    publications.forEach(pub => {
      if (pub.categories) {
        pub.categories.forEach(cat => {
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
    const errorResponse = handleDatabaseError(error);
    return res.status(errorResponse.statusCode).json({
      message: errorResponse.message,
      error: errorResponse.error
    });
  }
};

// Get distinct subcategories for active publications based on category and language
exports.getPublicationSubCategories = async (req, res) => {
  try {
    const { category, language, lang } = req.query;
    
    const filter = {
      contentType: 'PUBLICATION',
      isActive: true,
      categories: category
    };

    // Handle language filter
    if (language) {
      filter.languages = language;
    } else if (lang) {
      const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

    const publications = await Publication.find(filter).populate('subCategories', 'name slug description thumbnailUrl');

    // Extract unique subcategories
    const subCategories = [];
    const subCategoryIds = new Set();
    
    publications.forEach(pub => {
      if (pub.subCategories) {
        pub.subCategories.forEach(subCat => {
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
    const errorResponse = handleDatabaseError(error);
    return res.status(errorResponse.statusCode).json({
      message: errorResponse.message,
      error: errorResponse.error
    });
  }
};

// ============ EBOOK FILTERS ============

// Get distinct categories for active e-books
exports.getEBookCategories = async (req, res) => {
  try {
    const { language, lang } = req.query;
    
    const filter = {
      contentType: 'E_BOOK',
      isActive: true,
    };

    // Handle language filter
    if (language) {
      filter.languages = language;
    } else if (lang) {
      const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const langDoc = await Language.findOne({
        $or: [
          { code: lang.toLowerCase() },
          { name: { $regex: `^${escapeRegex(lang)}$`, $options: 'i' } },
        ],
      });
      if (!langDoc) {
        return res.status(400).json({ message: 'Invalid language code or name' });
      }
      filter.languages = langDoc._id;
    }

    const eBooks = await EBook.find(filter).populate('categories', 'name slug description thumbnailUrl');

    // Extract unique categories
    const categories = [];
    const categoryIds = new Set();
    
    eBooks.forEach(ebook => {
      if (ebook.categories) {
        ebook.categories.forEach(cat => {
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
    const errorResponse = handleDatabaseError(error);
    return res.status(errorResponse.statusCode).json({
      message: errorResponse.message,
      error: errorResponse.error
    });
  }
};

// Get distinct subcategories for active e-books based on category and language
exports.getEBookSubCategories = async (req, res) => {
  try {
    const { category, language, lang } = req.query;
    
    const filter = {
      contentType: 'E_BOOK',
      isActive: true,
      categories: category
    };

    // Handle language filter
    if (language) {
      filter.languages = language;
    } else if (lang) {
      const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

    const eBooks = await EBook.find(filter).populate('subCategories', 'name slug description thumbnailUrl');

    // Extract unique subcategories
    const subCategories = [];
    const subCategoryIds = new Set();
    
    eBooks.forEach(ebook => {
      if (ebook.subCategories) {
        ebook.subCategories.forEach(subCat => {
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
    const errorResponse = handleDatabaseError(error);
    return res.status(errorResponse.statusCode).json({
      message: errorResponse.message,
      error: errorResponse.error
    });
  }
};

// ============ DAILY QUIZ FILTERS ============

// Get distinct categories for active daily quizzes
exports.getDailyQuizCategories = async (req, res) => {
  try {
    const { language, lang } = req.query;
    
    const filter = {
      contentType: 'DAILY_QUIZ',
      isActive: true,
    };

    // Handle language filter
    if (language) {
      filter.languages = language;
    } else if (lang) {
      const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const langDoc = await Language.findOne({
        $or: [
          { code: lang.toLowerCase() },
          { name: { $regex: `^${escapeRegex(lang)}$`, $options: 'i' } },
        ],
      });
      if (!langDoc) {
        return res.status(400).json({ message: 'Invalid language code or name' });
      }
      filter.languages = langDoc._id;
    }

    const dailyQuizzes = await DailyQuiz.find(filter).populate('categories', 'name slug description thumbnailUrl');

    // Extract unique categories
    const categories = [];
    const categoryIds = new Set();
    
    dailyQuizzes.forEach(quiz => {
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
    const errorResponse = handleDatabaseError(error);
    return res.status(errorResponse.statusCode).json({
      message: errorResponse.message,
      error: errorResponse.error
    });
  }
};

// Get distinct subcategories for active daily quizzes based on category and language
exports.getDailyQuizSubCategories = async (req, res) => {
  try {
    const { category, language, lang } = req.query;
    
    const filter = {
      contentType: 'DAILY_QUIZ',
      isActive: true,
      categories: category
    };

    // Handle language filter
    if (language) {
      filter.languages = language;
    } else if (lang) {
      const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

    const dailyQuizzes = await DailyQuiz.find(filter).populate('subCategories', 'name slug description thumbnailUrl');

    // Extract unique subcategories
    const subCategories = [];
    const subCategoryIds = new Set();
    
    dailyQuizzes.forEach(quiz => {
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
    const errorResponse = handleDatabaseError(error);
    return res.status(errorResponse.statusCode).json({
      message: errorResponse.message,
      error: errorResponse.error
    });
  }
};

// ============ PREVIOUS QUESTION PAPER FILTERS ============

// Get distinct categories for active previous question papers
exports.getPreviousQuestionPaperCategories = async (req, res) => {
  try {
    const categories = await Category.find({
      contentType: 'PYQ_EBOOK',
      isActive: true
    }).select('name slug description thumbnailUrl');

    return res.status(200).json({ data: categories });
  } catch (error) {
    const errorResponse = handleDatabaseError(error);
    return res.status(errorResponse.statusCode).json({
      message: errorResponse.message,
      error: errorResponse.error
    });
  }
};

// Get distinct subcategories for active previous question papers based on category
exports.getPreviousQuestionPaperSubCategories = async (req, res) => {
  try {
    const { category } = req.query;
    
    const filter = {
      contentType: 'PYQ_EBOOK',
      isActive: true,
      categoryId: category
    };

    const subCategories = await SubCategory.find({
      _id: { $in: await PreviousQuestionPaper.distinct('subCategoryId', filter) }
    }).select('name slug description thumbnailUrl');

    return res.status(200).json({ data: subCategories });
  } catch (error) {
    const errorResponse = handleDatabaseError(error);
    return res.status(errorResponse.statusCode).json({
      message: errorResponse.message,
      error: errorResponse.error
    });
  }
};

// Get distinct exams for active previous question papers based on filters
exports.getPreviousQuestionPaperExams = async (req, res) => {
  try {
    const { category, subCategory } = req.query;
    
    const filter = {
      isActive: true,
      paperCategory: 'EXAM' // Only for EXAM type papers
    };

    if (category) filter.categoryId = category;
    if (subCategory) filter.subCategoryId = subCategory;

    const exams = await Exam.find({
      _id: { $in: await PreviousQuestionPaper.distinct('examId', filter) }
    }).select('name');

    return res.status(200).json({ data: exams });
  } catch (error) {
    const errorResponse = handleDatabaseError(error);
    return res.status(errorResponse.statusCode).json({
      message: errorResponse.message,
      error: errorResponse.error
    });
  }
};

// Get distinct subjects for active previous question papers based on filters
exports.getPreviousQuestionPaperSubjects = async (req, res) => {
  try {
    const { category, subCategory, exam } = req.query;
    
    const filter = {
      isActive: true
    };

    if (category) filter.categoryId = category;
    if (subCategory) filter.subCategoryId = subCategory;
    if (exam) filter.examId = exam;

    const subjects = await Subject.find({
      _id: { $in: await PreviousQuestionPaper.distinct('subjectId', filter) }
    }).select('name');

    return res.status(200).json({ data: subjects });
  } catch (error) {
    const errorResponse = handleDatabaseError(error);
    return res.status(errorResponse.statusCode).json({
      message: errorResponse.message,
      error: errorResponse.error
    });
  }
};

// ============ TEST SERIES FILTERS ============

// Get distinct categories for active test series
exports.getTestSeriesCategories = async (req, res) => {
  try {
    const { language, lang } = req.query;
    
    const filter = {
      contentType: 'TEST_SERIES',
      isActive: true,
    };

    // Handle language filter
    if (language) {
      filter.languages = language;
    } else if (lang) {
      const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const langDoc = await Language.findOne({
        $or: [
          { code: lang.toLowerCase() },
          { name: { $regex: `^${escapeRegex(lang)}$`, $options: 'i' } },
        ],
      });
      if (!langDoc) {
        return res.status(400).json({ message: 'Invalid language code or name' });
      }
      filter.languages = langDoc._id;
    }

    const testSeries = await TestSeries.find(filter).populate('categories', 'name slug description thumbnailUrl');

    // Extract unique categories
    const categories = [];
    const categoryIds = new Set();
    
    testSeries.forEach(ts => {
      if (ts.categories) {
        ts.categories.forEach(cat => {
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
    const errorResponse = handleDatabaseError(error);
    return res.status(errorResponse.statusCode).json({
      message: errorResponse.message,
      error: errorResponse.error
    });
  }
};

// Get distinct subcategories for active test series based on category and language
exports.getTestSeriesSubCategories = async (req, res) => {
  try {
    const { category, language, lang } = req.query;
    
    const filter = {
      contentType: 'TEST_SERIES',
      isActive: true,
      categories: category
    };

    // Handle language filter
    if (language) {
      filter.languages = language;
    } else if (lang) {
      const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

    const testSeries = await TestSeries.find(filter).populate('subCategories', 'name slug description thumbnailUrl');

    // Extract unique subcategories
    const subCategories = [];
    const subCategoryIds = new Set();
    
    testSeries.forEach(ts => {
      if (ts.subCategories) {
        ts.subCategories.forEach(subCat => {
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
    const errorResponse = handleDatabaseError(error);
    return res.status(errorResponse.statusCode).json({
      message: errorResponse.message,
      error: errorResponse.error
    });
  }
};


