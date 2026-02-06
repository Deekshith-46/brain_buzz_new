const TestSeries = require('../../models/TestSeries/TestSeries');
const Category = require('../../models/Course/Category');
const SubCategory = require('../../models/Course/SubCategory');
const Language = require('../../models/Course/Language');

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

// Get distinct categories for test series (admin - no access restrictions)
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

// Get distinct subcategories for test series based on category and language (admin - no access restrictions)
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
      if (!langDoc) {
        return res.status(400).json({ message: 'Invalid language code or name' });
      }
      filter.languages = langDoc._id;
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
