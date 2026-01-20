const LiveClass = require('../../models/LiveClass');
const Category = require('../../models/Course/Category');
const SubCategory = require('../../models/Course/SubCategory');
const Language = require('../../models/Course/Language');

// Get all Categories for Live Classes
exports.getLiveClassCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true, contentType: 'LIVE_CLASS' }).select('name slug');

    return res.status(200).json({
      success: true,
      message: 'Categories fetched successfully',
      data: categories,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// Get Languages for a specific Category
exports.getLanguagesByCategory = async (req, res) => {
  try {
    const { categoryId } = req.query;

    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: 'Category ID is required',
      });
    }

    // Validate category exists and is for LIVE_CLASS
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    if (category.contentType !== 'LIVE_CLASS') {
      return res.status(400).json({
        success: false,
        message: 'Invalid category for Live Classes',
      });
    }

    // Find all live classes for this category and get unique languages
    const liveClasses = await LiveClass.find({
      categoryId: categoryId,
      isActive: true,
    }).select('languageId');

    // Get unique language IDs
    const languageIds = [...new Set(liveClasses.map(lc => lc.languageId.toString()))];

    // Get language details
    const languages = await Language.find({
      _id: { $in: languageIds },
      isActive: true,
    }).select('name code');

    return res.status(200).json({
      success: true,
      message: 'Languages fetched successfully',
      data: languages,
    });
  } catch (error) {
    console.error('Error fetching languages:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// Get SubCategories for a specific Category and Language
exports.getSubCategoriesByCategoryAndLanguage = async (req, res) => {
  try {
    const { categoryId, languageId } = req.query;

    if (!categoryId || !languageId) {
      return res.status(400).json({
        success: false,
        message: 'Category ID and Language ID are required',
      });
    }

    // Validate category exists and is for LIVE_CLASS
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    if (category.contentType !== 'LIVE_CLASS') {
      return res.status(400).json({
        success: false,
        message: 'Invalid category for Live Classes',
      });
    }

    // Validate language exists
    const language = await Language.findById(languageId);
    if (!language) {
      return res.status(404).json({
        success: false,
        message: 'Language not found',
      });
    }

    // Find all live classes for this category and language and get unique subcategories
    const liveClasses = await LiveClass.find({
      categoryId: categoryId,
      languageId: languageId,
      isActive: true,
    }).select('subCategoryId');

    // Get unique subcategory IDs
    const subCategoryIds = [...new Set(liveClasses.map(lc => lc.subCategoryId.toString()))];

    // Get subcategory details
    const subCategories = await SubCategory.find({
      _id: { $in: subCategoryIds },
      category: categoryId,
      contentType: 'LIVE_CLASS',
      isActive: true,
    }).select('name slug');

    return res.status(200).json({
      success: true,
      message: 'SubCategories fetched successfully',
      data: subCategories,
    });
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// Get Live Classes with filtering
exports.getLiveClasses = async (req, res) => {
  try {
    const { categoryId, languageId, subCategoryId } = req.query;

    // Build filter object
    const filter = {
      isActive: true,
    };

    if (categoryId) {
      // Validate category exists and is for LIVE_CLASS
      const category = await Category.findById(categoryId);
      if (!category || category.contentType !== 'LIVE_CLASS') {
        return res.status(400).json({
          success: false,
          message: 'Invalid category for Live Classes',
        });
      }
      filter.categoryId = categoryId;
    }
    
    if (languageId) filter.languageId = languageId;
    
    if (subCategoryId) {
      // Validate subcategory exists and is for LIVE_CLASS
      const subCategory = await SubCategory.findById(subCategoryId);
      if (!subCategory || subCategory.contentType !== 'LIVE_CLASS') {
        return res.status(400).json({
          success: false,
          message: 'Invalid subcategory for Live Classes',
        });
      }
      filter.subCategoryId = subCategoryId;
    }

    const liveClasses = await LiveClass.find(filter)
      .populate('categoryId', 'name slug')
      .populate('subCategoryId', 'name slug')
      .populate('languageId', 'name code')
      .sort({ dateTime: 1 });

    // Add computed status (upcoming, live, completed)
    const now = new Date();
    const liveClassesWithStatus = liveClasses.map(liveClass => {
      const classDateTime = new Date(liveClass.dateTime);
      let status = 'upcoming';

      if (classDateTime < now) {
        status = 'completed';
      } else if (
        classDateTime <= new Date(now.getTime() + 30 * 60000) && // 30 minutes before
        classDateTime >= now
      ) {
        status = 'live';
      }

      return {
        ...liveClass.toObject(),
        status,
      };
    });

    return res.status(200).json({
      success: true,
      message: 'Live classes fetched successfully',
      data: liveClassesWithStatus,
    });
  } catch (error) {
    console.error('Error fetching live classes:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// Get a single Live Class by ID
exports.getLiveClassById = async (req, res) => {
  try {
    const { id } = req.params;

    const liveClass = await LiveClass.findById(id)
      .populate('categoryId', 'name slug')
      .populate('subCategoryId', 'name slug')
      .populate('languageId', 'name code');

    if (!liveClass) {
      return res.status(404).json({
        success: false,
        message: 'Live class not found',
      });
    }

    if (!liveClass.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Live class is not active',
      });
    }

    // Validate category exists and is for LIVE_CLASS
    if (liveClass.categoryId && liveClass.categoryId.contentType !== 'LIVE_CLASS') {
      return res.status(400).json({
        success: false,
        message: 'Invalid category for Live Classes',
      });
    }

    // Validate subcategory exists and is for LIVE_CLASS
    if (liveClass.subCategoryId && liveClass.subCategoryId.contentType !== 'LIVE_CLASS') {
      return res.status(400).json({
        success: false,
        message: 'Invalid subcategory for Live Classes',
      });
    }

    // Add computed status
    const now = new Date();
    const classDateTime = new Date(liveClass.dateTime);
    let status = 'upcoming';

    if (classDateTime < now) {
      status = 'completed';
    } else if (
      classDateTime <= new Date(now.getTime() + 30 * 60000) && // 30 minutes before
      classDateTime >= now
    ) {
      status = 'live';
    }

    const liveClassWithStatus = {
      ...liveClass.toObject(),
      status,
    };

    return res.status(200).json({
      success: true,
      message: 'Live class fetched successfully',
      data: liveClassWithStatus,
    });
  } catch (error) {
    console.error('Error fetching live class:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// Search Live Classes
exports.searchLiveClasses = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    // Search in name, description
    const searchRegex = new RegExp(query, 'i');
    const liveClasses = await LiveClass.find({
      $or: [
        { name: searchRegex },
        { description: searchRegex },
      ],
      isActive: true,
    })
      .populate('categoryId', 'name slug')
      .populate('subCategoryId', 'name slug')
      .populate('languageId', 'name code')
      .sort({ dateTime: 1 });

    // Add computed status
    const now = new Date();
    const liveClassesWithStatus = liveClasses.map(liveClass => {
      const classDateTime = new Date(liveClass.dateTime);
      let status = 'upcoming';

      if (classDateTime < now) {
        status = 'completed';
      } else if (
        classDateTime <= new Date(now.getTime() + 30 * 60000) && // 30 minutes before
        classDateTime >= now
      ) {
        status = 'live';
      }

      return {
        ...liveClass.toObject(),
        status,
      };
    });

    return res.status(200).json({
      success: true,
      message: 'Live classes searched successfully',
      data: liveClassesWithStatus,
    });
  } catch (error) {
    console.error('Error searching live classes:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};