const CurrentAffairWithCategory = require('../../models/CurrentAffairs/CurrentAffairWithCategory');
const CurrentAffairsCategory = require('../../models/CurrentAffairs/CurrentAffairsCategory');
const Category = require('../../models/Course/Category');
const SubCategory = require('../../models/Course/SubCategory');
const Language = require('../../models/Course/Language');

// Public: list all current affairs
exports.listCurrentAffairs = async (req, res) => {
  try {
    const { category, subCategory, language, date, categoryId } = req.query;

    const filter = {
      isActive: true,
    };

    if (category) filter.categories = category;
    if (subCategory) filter.subCategories = subCategory;
    if (language) filter.languages = language;
    if (date) filter.date = date;
    if (categoryId) filter.category = categoryId;

    const [docs, caCategories] = await Promise.all([
      CurrentAffairWithCategory.find(filter)
        .populate('category', 'categoryType slug')
        .populate('categories', 'name slug')
        .populate('subCategories', 'name slug')
        .populate('languages', 'name code')
        .sort({ createdAt: -1 }),

      CurrentAffairsCategory.find({ isActive: true })
        .select('categoryType')
    ]);

    const grouped = {};

    // Create empty buckets ONLY when no specific categoryId
    if (!categoryId) {
      caCategories.forEach(cat => {
        grouped[cat.categoryType] = [];
      });
    }

    docs.forEach(affair => {
      const type = affair.category?.categoryType;
      if (!type) return;

      if (!grouped[type]) grouped[type] = [];
      grouped[type].push(affair);
    });

    // If categoryId → remove empty keys
    if (categoryId) {
      Object.keys(grouped).forEach(k => {
        if (grouped[k].length === 0) delete grouped[k];
      });
    };

    return res.status(200).json({ data: grouped });
  } catch (error) {
    console.error('Error listing current affairs:', error);
    return res
      .status(500)
      .json({ message: 'Server error', error: error.message });
  }
};

// Public: get single current affair by id
exports.getCurrentAffairById = async (req, res) => {
  try {
    const { id } = req.params;

    const doc = await CurrentAffairWithCategory.findOne({
      _id: id,
      isActive: true,
    })
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code');

    if (!doc) {
      return res.status(404).json({ message: 'Current affair not found' });
    }

    return res.status(200).json({ data: doc });
  } catch (error) {
    console.error('Error fetching current affair:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// -------- Public Filter Helper APIs --------

// Step 1: Get all categories that have current affairs (Public)
exports.getCategoriesWithCurrentAffairs = async (req, res) => {
  try {
    // Get unique category IDs from all active current affairs
    const categoryIds = await CurrentAffairWithCategory.distinct('categories', { 
      isActive: true 
    });
    
    const categories = await Category.find({
      _id: { $in: categoryIds },
      contentType: 'CURRENT_AFFAIRS',
      isActive: true
    }).select('name slug thumbnailUrl');

    return res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories with current affairs:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
};

// Get available Current Affairs category types (Public)
exports.getCurrentAffairsCategoryTypes = async (req, res) => {
  try {
    const categoryTypes = await CurrentAffairsCategory.find({
      isActive: true
    }).select('categoryType slug description thumbnailUrl').sort({ categoryType: 1 });

    return res.status(200).json({
      success: true,
      data: categoryTypes
    });
  } catch (error) {
    console.error('Error fetching current affairs category types:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch category types',
      error: error.message
    });
  }
};

// Step 2: Get available languages for a category (Public)
exports.getLanguagesByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    // Get unique language IDs for this category
    const currentAffairsInCategory = await CurrentAffairWithCategory.find({
      categories: categoryId,
      isActive: true
    }).select('languages');

    const languageIds = new Set();
    currentAffairsInCategory.forEach(affair => {
      affair.languages.forEach(id => languageIds.add(id.toString()));
    });

    const languages = await Language.find({
      _id: { $in: Array.from(languageIds) },
      isActive: true
    }).select('name code');

    return res.status(200).json({
      success: true,
      data: languages
    });
  } catch (error) {
    console.error('Error fetching languages:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch languages',
      error: error.message
    });
  }
};

// Step 2b: Get subcategories for a category (defaults to English)
exports.getSubCategoriesByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    // Get English language ID (default)
    const englishLanguage = await Language.findOne({ code: 'en' }).select('_id');
    
    if (!englishLanguage) {
      return res.status(404).json({
        success: false,
        message: 'English language not found. Please create a language with code "en"'
      });
    }

    // Find current affairs matching category and English language
    const currentAffairsInCategoryAndLanguage = await CurrentAffairWithCategory.find({
      categories: categoryId,
      languages: englishLanguage._id,
      isActive: true
    }).select('subCategories');

    const subCategoryIds = new Set();
    currentAffairsInCategoryAndLanguage.forEach(affair => {
      affair.subCategories.forEach(id => subCategoryIds.add(id.toString()));
    });

    const subCategories = await SubCategory.find({
      _id: { $in: Array.from(subCategoryIds) },
      isActive: true
    }).select('name slug thumbnailUrl category');

    return res.status(200).json({
      success: true,
      data: subCategories,
      defaultLanguage: 'en'
    });
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch subcategories',
      error: error.message
    });
  }
};

// Step 3: Get subcategories for a category filtered by language (Public)
exports.getSubCategoriesByLanguage = async (req, res) => {
  try {
    // Handle both route parameter (existing) and query parameter (new route)
    const { categoryId: routeCategoryId } = req.params;
    const { category: queryCategoryId, lang } = req.query; // Using 'category' query param and 'lang' query param
    
    const categoryId = routeCategoryId || queryCategoryId;

    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: 'Category ID is required (either as route parameter or query parameter "category")'
      });
    }

    if (!lang) {
      return res.status(400).json({
        success: false,
        message: 'Language code is required (e.g., lang=en, lang=te, lang=hi)'
      });
    }

    // Find language by code
    const language = await Language.findOne({ code: lang }).select('_id');
    
    if (!language) {
      return res.status(404).json({
        success: false,
        message: `Language with code "${lang}" not found`
      });
    }

    // Find current affairs matching category and language
    const currentAffairsInCategoryAndLanguage = await CurrentAffairWithCategory.find({
      categories: categoryId,
      languages: language._id,
      isActive: true
    }).select('subCategories');

    const subCategoryIds = new Set();
    currentAffairsInCategoryAndLanguage.forEach(affair => {
      affair.subCategories.forEach(id => subCategoryIds.add(id.toString()));
    });

    const subCategories = await SubCategory.find({
      _id: { $in: Array.from(subCategoryIds) },
      isActive: true
    }).select('name slug thumbnailUrl category');

    return res.status(200).json({
      success: true,
      data: subCategories,
      language: lang
    });
  } catch (error) {
    console.error('Error fetching subcategories by language:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch subcategories',
      error: error.message
    });
  }
};

// Step 4: Get current affairs with filters (Public)
exports.getFilteredCurrentAffairs = async (req, res) => {
  try {
    const { categoryId, subCategoryId, lang, affairType, page = 1, limit = 20 } = req.query;

    const filter = { 
      isActive: true 
    };

    if (categoryId) filter.categories = categoryId;
    if (subCategoryId) filter.subCategories = subCategoryId;
    
    if (affairType) {
      const caCategory = await CurrentAffairsCategory.findOne({
        categoryType: affairType
      }).select('_id');

      if (caCategory) {
        filter.category = caCategory._id;
      }
    }
    
    // If language code is provided, convert to language ID
    if (lang) {
      const language = await Language.findOne({ code: lang }).select('_id');
      if (!language) {
        return res.status(404).json({
          success: false,
          message: `Language with code "${lang}" not found`
        });
      }
      filter.languages = language._id;
    }

    const skip = (page - 1) * limit;

    const [affairs, total] = await Promise.all([
      CurrentAffairWithCategory.find(filter)
        .populate('category', 'categoryType slug')
        .populate('categories', 'name slug')
        .populate('subCategories', 'name slug')
        .populate('languages', 'name code')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      CurrentAffairWithCategory.countDocuments(filter)
    ]);

    return res.status(200).json({
      success: true,
      data: affairs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching filtered current affairs:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch current affairs',
      error: error.message
    });
  }
};

// Get available affair types for filters (Public)
exports.getAvailableAffairTypes = async (req, res) => {
  try {
    const { categoryId, subCategoryId, lang } = req.query;
    
    const filter = { 
      isActive: true 
    };
    if (categoryId) filter.categories = categoryId;
    if (subCategoryId) filter.subCategories = subCategoryId;
    
    // If language code is provided, convert to language ID
    if (lang) {
      const language = await Language.findOne({ code: lang }).select('_id');
      if (!language) {
        return res.status(404).json({
          success: false,
          message: `Language with code "${lang}" not found`
        });
      }
      filter.languages = language._id;
    }

    const categoryIds = await CurrentAffairWithCategory.distinct('category', filter);

    const categories = await CurrentAffairsCategory.find({
      _id: { $in: categoryIds }
    }).select('categoryType');

    const availableTypes = categories.map(cat => ({
      name: cat.categoryType.charAt(0).toUpperCase() + cat.categoryType.slice(1),
      value: cat.categoryType
    }));

    return res.status(200).json({
      success: true,
      data: availableTypes
    });
  } catch (error) {
    console.error('Error fetching affair types:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch affair types',
      error: error.message
    });
  }
};
