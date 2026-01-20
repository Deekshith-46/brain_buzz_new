# Complete Current Affairs Code Documentation

This document contains all the code related to Current Affairs functionality in the Brain Buzz application, including schemas, controllers, routes, and filters.

## 1. Schemas

### 1.1 Base Schema - CurrentAffairBase

```javascript
const mongoose = require('mongoose');
const { Schema } = mongoose;

const currentAffairBaseSchema = new Schema(
  {
    contentType: {
      type: String,
      default: 'CURRENT_AFFAIRS',
      immutable: true,
    },
    accessType: {
      type: String,
      enum: ["FREE", "PAID"],
      default: "FREE"
    },
    date: {
      type: Date,
      required: true
    },
    categories: [{
      type: Schema.Types.ObjectId,
      ref: 'Category'
    }],
    subCategories: [{
      type: Schema.Types.ObjectId,
      ref: 'SubCategory'
    }],
    languages: [{
      type: Schema.Types.ObjectId,
      ref: 'Language'
    }],
    thumbnailUrl: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    fullContent: {
      type: String,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { 
    timestamps: true,
    discriminatorKey: 'affairType',
    collection: 'currentaffairs' // Explicitly set collection name
  }
);

// Add a pre-save hook to validate categories and subcategories match the content type
currentAffairBaseSchema.pre('save', async function(next) {
  if (this.categories && this.categories.length > 0) {
    const Category = require('../Course/Category');
    for (const categoryId of this.categories) {
      const category = await Category.findById(categoryId);
      if (category && category.contentType !== this.contentType) {
        return next(new Error(`Category ${category.name} does not match content type ${this.contentType}`));
      }
    }
  }
  
  if (this.subCategories && this.subCategories.length > 0) {
    const SubCategory = require('../Course/SubCategory');
    for (const subCategoryId of this.subCategories) {
      const subCategory = await SubCategory.findById(subCategoryId);
      if (subCategory && subCategory.contentType !== this.contentType) {
        return next(new Error(`SubCategory ${subCategory.name} does not match content type ${this.contentType}`));
      }
    }
  }
  
  next();
});

// Create a model that will be extended by specific types
const CurrentAffair = mongoose.model('CurrentAffair', currentAffairBaseSchema);

module.exports = CurrentAffair;
```

### 1.2 Latest Current Affair Schema

```javascript
const mongoose = require('mongoose');
const CurrentAffair = require('./CurrentAffairBase');

const latestSchema = new mongoose.Schema({
  heading: {
    type: String,
    required: true,
    trim: true
  },
  // caCategory is now handled by the discriminator
  caCategory: {
    type: String,
    default: 'LATEST',
    immutable: true
  }
}, { 
  discriminatorKey: 'affairType',
  collection: 'currentaffairs' // Must match the base collection
});

// Create discriminator
const LatestCurrentAffair = CurrentAffair.discriminator(
  'LatestCurrentAffair',
  latestSchema
);

module.exports = LatestCurrentAffair;
```

### 1.3 Monthly Current Affair Schema

```javascript
const mongoose = require('mongoose');
const { MONTHS } = require('../../constants/enums');
const CurrentAffair = require('./CurrentAffairBase');

const monthlySchema = new mongoose.Schema({
  month: {
    type: String,
    enum: MONTHS,
    required: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  // caCategory is now handled by the discriminator
  caCategory: {
    type: String,
    default: 'MONTHLY',
    immutable: true
  }
}, { 
  discriminatorKey: 'affairType',
  collection: 'currentaffairs' // Must match the base collection
});

// Create discriminator
const MonthlyCurrentAffair = CurrentAffair.discriminator(
  'MonthlyCurrentAffair',
  monthlySchema
);

module.exports = MonthlyCurrentAffair;
```

### 1.4 State Current Affair Schema

```javascript
const mongoose = require('mongoose');
const CurrentAffair = require('./CurrentAffairBase');

const stateSchema = new mongoose.Schema({
  state: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  // caCategory is now handled by the discriminator
  caCategory: {
    type: String,
    default: 'STATE',
    immutable: true
  }
}, { 
  discriminatorKey: 'affairType',
  collection: 'currentaffairs' // Must match the base collection
});

// Create discriminator
const StateCurrentAffair = CurrentAffair.discriminator(
  'StateCurrentAffair',
  stateSchema
);

module.exports = StateCurrentAffair;
```

### 1.5 Sports Current Affair Schema

```javascript
const mongoose = require('mongoose');
const CurrentAffair = require('./CurrentAffairBase');

const sportsSchema = new mongoose.Schema({
  sport: {
    type: String,
    required: true,
    trim: true
  },
  event: {
    type: String,
    required: true,
    trim: true
  },
  // caCategory is now handled by the discriminator
  caCategory: {
    type: String,
    default: 'SPORTS',
    immutable: true
  }
}, { 
  discriminatorKey: 'affairType',
  collection: 'currentaffairs' // Must match the base collection
});

// Create discriminator
const SportsCurrentAffair = CurrentAffair.discriminator(
  'SportsCurrentAffair',
  sportsSchema
);

module.exports = SportsCurrentAffair;
```

### 1.6 International Current Affair Schema

```javascript
// src/models/CurrentAffairs/InternationalCurrentAffair.js
const mongoose = require('mongoose');
const CurrentAffairBase = require('./CurrentAffairBase');

const internationalSchema = new mongoose.Schema({
  region: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  caCategory: {
    type: String,
    default: 'INTERNATIONAL',
    immutable: true
  }
}, { discriminatorKey: 'affairType' });

module.exports = CurrentAffairBase.discriminator('InternationalCurrentAffair', internationalSchema);
```

### 1.7 Politics Current Affair Schema

```javascript
// src/models/CurrentAffairs/PoliticsCurrentAffair.js
const mongoose = require('mongoose');
const CurrentAffairBase = require('./CurrentAffairBase');

const politicsSchema = new mongoose.Schema({
  politicalParty: {
    type: String,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  caCategory: {
    type: String,
    default: 'POLITICS',
    immutable: true
  }
}, { discriminatorKey: 'affairType' });

module.exports = CurrentAffairBase.discriminator('PoliticsCurrentAffair', politicsSchema);
```

### 1.8 Local Current Affair Schema

```javascript
// src/models/CurrentAffairs/LocalCurrentAffair.js
const mongoose = require('mongoose');
const CurrentAffairBase = require('./CurrentAffairBase');

const localSchema = new mongoose.Schema({
  location: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  caCategory: {
    type: String,
    default: 'LOCAL',
    immutable: true
  }
}, { discriminatorKey: 'affairType' });

module.exports = CurrentAffairBase.discriminator('LocalCurrentAffair', localSchema);
```

### 1.9 Current Affairs Category Schema

```javascript
const mongoose = require('mongoose');

const currentAffairsCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      trim: true,
    },
    thumbnailUrl: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create unique index for slug
currentAffairsCategorySchema.index(
  { slug: 1 },
  { unique: true }
);

// Pre-save hook to generate slug from name
currentAffairsCategorySchema.pre('save', function (next) {
  if (this.isModified('name') || this.isNew) {
    this.slug = this.name
      .toString()
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

module.exports = mongoose.model('CurrentAffairsCategory', currentAffairsCategorySchema);
```

## 2. Controllers

### 2.1 Admin Current Affairs Controller (Partial)

```javascript
const LatestCurrentAffair = require('../../models/CurrentAffairs/LatestCurrentAffair');
const MonthlyCurrentAffair = require('../../models/CurrentAffairs/MonthlyCurrentAffair');
const cloudinary = require('../../config/cloudinary');
const SportsCurrentAffair = require('../../models/CurrentAffairs/SportsCurrentAffair');
const StateCurrentAffair = require('../../models/CurrentAffairs/StateCurrentAffair');
const InternationalCurrentAffair = require('../../models/CurrentAffairs/InternationalCurrentAffair');
const PoliticsCurrentAffair = require('../../models/CurrentAffairs/PoliticsCurrentAffair');
const LocalCurrentAffair = require('../../models/CurrentAffairs/LocalCurrentAffair');
const Category = require('../../models/Course/Category');
const SubCategory = require('../../models/Course/SubCategory');
const Language = require('../../models/Course/Language');
const CurrentAffair = require('../../models/CurrentAffairs/CurrentAffairBase');

const uploadToCloudinary = (fileBuffer, folder, resourceType = 'image') => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      }
    );

    stream.end(fileBuffer);
  });
};

// Helper function to parse affair payload from form data
const parseAffairPayload = (req) => {
  if (!req.body.affair) {
    throw new Error('Affair data is required in form-data');
  }
  
  let parsed;
  try {
    parsed = JSON.parse(req.body.affair);
  } catch (e) {
    throw new Error('Invalid JSON in affair field');
  }
  
  return parsed;
};

// Helper function to handle thumbnail upload
const handleThumbnailUpload = async (req, folder) => {
  // Handle both upload.single() and upload.fields() cases
  let fileBuffer = null;
  
  // Case 1: upload.single('thumbnail') puts file in req.file
  if (req.file && req.file.buffer) {
    fileBuffer = req.file.buffer;
  }
  // Case 2: upload.fields([{ name: 'thumbnail', maxCount: 1 }]) puts file in req.files.thumbnail[0]
  else if (req.files && req.files.thumbnail && req.files.thumbnail[0] && req.files.thumbnail[0].buffer) {
    fileBuffer = req.files.thumbnail[0].buffer;
  }
  
  if (fileBuffer) {
    try {
      const uploadResult = await uploadToCloudinary(fileBuffer, folder, 'image');
      return uploadResult.secure_url;
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
      throw new Error('Failed to upload thumbnail');
    }
  }
  return null;
};

// -------- Latest Current Affairs --------

exports.createLatestCurrentAffair = async (req, res) => {
  try {
    let parsed;
    try {
      parsed = parseAffairPayload(req);
    } catch (e) {
      return res.status(400).json({
        message: 'Invalid request data',
        error: e.message
      });
    }

    const {
      date,
      categoryIds = [],
      subCategoryIds = [],
      languageIds = [],
      heading,
      description,
      fullContent,
      isActive,
    } = parsed;

    // Validate required fields
    if (!heading) {
      return res.status(400).json({ message: 'CA heading is required' });
    }

    // Date is required for Latest Current Affairs
    if (!date) {
      return res.status(400).json({ message: 'Date is required for Latest Current Affairs' });
    }

    // Validate that only one language is selected (best practice)
    if (languageIds && languageIds.length > 1) {
      return res.status(400).json({ 
        message: 'Only one language should be selected per content entry (best practice)' 
      });
    }

    let thumbnailUrl;
    try {
      thumbnailUrl = await handleThumbnailUpload(
        req,
        'brainbuzz/current-affairs/latest/thumbnails'
      );
    } catch (error) {
      return res.status(500).json({ 
        message: 'Failed to upload thumbnail', 
        error: error.message 
      });
    }

    const doc = await LatestCurrentAffair.create({
      date,
      categories: categoryIds,
      subCategories: subCategoryIds,
      languages: languageIds,
      heading,
      thumbnailUrl,
      description,
      fullContent,
      isActive: typeof isActive !== 'undefined' ? isActive : true,
    });

    return res.status(201).json({
      message: 'Latest current affair created successfully',
      data: doc,
    });
  } catch (error) {
    console.error('Error creating latest current affair:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getLatestCurrentAffairs = async (req, res) => {
  try {
    const { category, subCategory, language, date, isActive } = req.query;

    const filter = {};
    if (category) filter.categories = category;
    if (subCategory) filter.subCategories = subCategory;
    if (language) filter.languages = language;
    if (date) filter.date = date;
    if (typeof isActive !== 'undefined') filter.isActive = isActive === 'true';

    const docs = await LatestCurrentAffair.find(filter)
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code');

    return res.status(200).json({ data: docs });
  } catch (error) {
    console.error('Error fetching latest current affairs:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Similar functions for update, delete, and other types of current affairs...
```

### 2.2 User Current Affairs Controller

```javascript
const CurrentAffair = require('../../models/CurrentAffairs/CurrentAffairBase');
const Category = require('../../models/Course/Category');
const SubCategory = require('../../models/Course/SubCategory');
const Language = require('../../models/Course/Language');

// Public: list all current affairs
exports.listCurrentAffairs = async (req, res) => {
  try {
    const { category, subCategory, language, date, affairType } = req.query;

    const filter = {
      contentType: 'CURRENT_AFFAIRS',
      isActive: true,
    };

    if (category) filter.categories = category;
    if (subCategory) filter.subCategories = subCategory;
    if (language) filter.languages = language;
    if (date) filter.date = date;
    if (affairType) filter.affairType = affairType;

    const docs = await CurrentAffair.find(filter)
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code')
      .sort({ createdAt: -1 });

    const grouped = {
      latest: [],
      monthly: [],
      sports: [],
      state: [],
      international: [],
      politics: [],
      local: [],
    };

    docs.forEach((affair) => {
      switch (affair.affairType) {
        case 'LatestCurrentAffair':
          grouped.latest.push(affair);
          break;
        case 'MonthlyCurrentAffair':
          grouped.monthly.push(affair);
          break;
        case 'SportsCurrentAffair':
          grouped.sports.push(affair);
          break;
        case 'StateCurrentAffair':
          grouped.state.push(affair);
          break;
        case 'InternationalCurrentAffair':
          grouped.international.push(affair);
          break;
        case 'PoliticsCurrentAffair':
          grouped.politics.push(affair);
          break;
        case 'LocalCurrentAffair':
          grouped.local.push(affair);
          break;
        default:
          break;
      }
    });

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

    const doc = await CurrentAffair.findOne({
      _id: id,
      contentType: 'CURRENT_AFFAIRS',
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
    const categoryIds = await CurrentAffair.distinct('categories', { 
      contentType: 'CURRENT_AFFAIRS',
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

// Step 2: Get available languages for a category (Public)
exports.getLanguagesByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    // Get unique language IDs for this category
    const currentAffairsInCategory = await CurrentAffair.find({
      contentType: 'CURRENT_AFFAIRS',
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
    const currentAffairsInCategoryAndLanguage = await CurrentAffair.find({
      contentType: 'CURRENT_AFFAIRS',
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

// Step 3: Get current affairs with filters (Public)
exports.getFilteredCurrentAffairs = async (req, res) => {
  try {
    const { categoryId, subCategoryId, lang, affairType, page = 1, limit = 20 } = req.query;

    const filter = { 
      contentType: 'CURRENT_AFFAIRS',
      isActive: true 
    };

    if (categoryId) filter.categories = categoryId;
    if (subCategoryId) filter.subCategories = subCategoryId;
    if (affairType) filter.affairType = affairType;
    
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
      CurrentAffair.find(filter)
        .populate('categories', 'name slug')
        .populate('subCategories', 'name slug')
        .populate('languages', 'name code')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      CurrentAffair.countDocuments(filter)
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
      contentType: 'CURRENT_AFFAIRS',
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

    const affairTypes = await CurrentAffair.distinct('affairType', filter);

    const typeMapping = {
      'LatestCurrentAffair': { name: 'Latest', value: 'LatestCurrentAffair' },
      'MonthlyCurrentAffair': { name: 'Monthly', value: 'MonthlyCurrentAffair' },
      'SportsCurrentAffair': { name: 'Sports', value: 'SportsCurrentAffair' },
      'StateCurrentAffair': { name: 'State', value: 'StateCurrentAffair' },
      'InternationalCurrentAffair': { name: 'International', value: 'InternationalCurrentAffair' },
      'PoliticsCurrentAffair': { name: 'Politics', value: 'PoliticsCurrentAffair' },
      'LocalCurrentAffair': { name: 'Local', value: 'LocalCurrentAffair' }
    };

    const availableTypes = affairTypes
      .filter(type => typeMapping[type])
      .map(type => typeMapping[type]);

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
```

### 2.3 Current Affairs Category Controller

```javascript
const CurrentAffairsCategory = require('../../models/CurrentAffairs/CurrentAffairsCategory');
const cloudinary = require('../../config/cloudinary');

const uploadToCloudinary = (fileBuffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder }, (error, result) => {
      if (error) {
        return reject(error);
      }
      resolve(result);
    });

    stream.end(fileBuffer);
  });
};

// Create a new Current Affairs Category
exports.createCategory = async (req, res) => {
  try {
    const { name, description, order, isActive } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    // Check if category with this name already exists
    const existing = await CurrentAffairsCategory.findOne({ 
      slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-+|-+$/g, '')
    });
    
    if (existing) {
      return res.status(400).json({ message: 'Category with this name already exists' });
    }

    let thumbnailUrl;
    if (req.file && req.file.buffer) {
      const uploadResult = await uploadToCloudinary(
        req.file.buffer,
        'brainbuzz/current-affairs/categories/thumbnails'
      );
      thumbnailUrl = uploadResult.secure_url;
    }

    const category = await CurrentAffairsCategory.create({
      name,
      description,
      order: order || 0,
      isActive: typeof isActive !== 'undefined' ? isActive : true,
      thumbnailUrl,
    });

    return res.status(201).json({
      message: 'Current Affairs Category created successfully',
      data: category,
    });
  } catch (error) {
    console.error('Error creating Current Affairs category:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all Current Affairs Categories
exports.getCategories = async (req, res) => {
  try {
    const { isActive } = req.query;
    
    const filter = {};
    
    if (typeof isActive !== 'undefined') {
      filter.isActive = isActive === 'true';
    }
    
    const categories = await CurrentAffairsCategory.find(filter).sort({ order: 1, createdAt: -1 });
    return res.status(200).json({ data: categories });
  } catch (error) {
    console.error('Error fetching Current Affairs categories:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get Current Affairs Category by ID
exports.getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await CurrentAffairsCategory.findById(id);
    if (!category) {
      return res.status(404).json({ message: 'Current Affairs Category not found' });
    }

    return res.status(200).json({ data: category });
  } catch (error) {
    console.error('Error fetching Current Affairs category:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update Current Affairs Category
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, order, isActive } = req.body;

    const updates = {};

    if (name) {
      // Check if another category with same name exists
      const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-+|-+$/g, '');
      const existing = await CurrentAffairsCategory.findOne({ slug, _id: { $ne: id } });
      if (existing) {
        return res.status(400).json({ message: 'Category with this name already exists' });
      }
      updates.name = name;
    }

    if (typeof description !== 'undefined') updates.description = description;
    if (typeof order !== 'undefined') updates.order = order;
    if (typeof isActive !== 'undefined') updates.isActive = isActive;

    if (req.file && req.file.buffer) {
      const uploadResult = await uploadToCloudinary(
        req.file.buffer,
        'brainbuzz/current-affairs/categories/thumbnails'
      );
      updates.thumbnailUrl = uploadResult.secure_url;
    }

    const category = await CurrentAffairsCategory.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!category) {
      return res.status(404).json({ message: 'Current Affairs Category not found' });
    }

    return res.status(200).json({
      message: 'Current Affairs Category updated successfully',
      data: category,
    });
  } catch (error) {
    console.error('Error updating Current Affairs category:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete Current Affairs Category (soft delete)
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await CurrentAffairsCategory.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );
    
    if (!category) {
      return res.status(404).json({ message: 'Current Affairs Category not found' });
    }

    return res.status(200).json({ message: 'Current Affairs Category deactivated successfully' });
  } catch (error) {
    console.error('Error deleting Current Affairs category:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Toggle Current Affairs Category status
exports.toggleCategoryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const category = await CurrentAffairsCategory.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    );

    if (!category) {
      return res.status(404).json({ message: 'Current Affairs Category not found' });
    }

    return res.status(200).json({
      message: `Current Affairs Category ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: category,
    });
  } catch (error) {
    console.error('Error toggling Current Affairs category status:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};
```

## 3. Routes

### 3.1 Admin Current Affairs Routes

```javascript
const express = require('express');
const {
  createLatestCurrentAffair,
  getLatestCurrentAffairs,
  getLatestCurrentAffairById,
  updateLatestCurrentAffair,
  deleteLatestCurrentAffair,
  createMonthlyCurrentAffair,
  getMonthlyCurrentAffairs,
  getMonthlyCurrentAffairById,
  updateMonthlyCurrentAffair,
  deleteMonthlyCurrentAffair,
  createSportsCurrentAffair,
  listSportsCurrentAffairs,
  getSportsCurrentAffairById,
  updateSportsCurrentAffair,
  deleteSportsCurrentAffair,
  createStateCurrentAffair,
  listStateCurrentAffairs,
  getStateCurrentAffairById,
  updateStateCurrentAffair,
  deleteStateCurrentAffair,
  createInternationalCurrentAffair,
  listInternationalCurrentAffairs,
  getInternationalCurrentAffairById,
  updateInternationalCurrentAffair,
  deleteInternationalCurrentAffair,
  createPoliticsCurrentAffair,
  listPoliticsCurrentAffairs,
  getPoliticsCurrentAffairById,
  updatePoliticsCurrentAffair,
  deletePoliticsCurrentAffair,
  createLocalCurrentAffair,
  listLocalCurrentAffairs,
  getLocalCurrentAffairById,
  updateLocalCurrentAffair,
  deleteLocalCurrentAffair,
  // Filter helpers
  getCategoriesWithCurrentAffairs,
  getSubCategoriesAndLanguagesByCategory,
  getSubCategoriesByCategory,
  getSubCategoriesByLanguage,
  getFilteredCurrentAffairs,
  getAvailableAffairTypes
} = require('../../controllers/Admin/currentAffairsController');
const adminAuthMiddleware = require('../../middlewares/Admin/authMiddleware');
const upload = require('../../middlewares/uploadMiddleware');

const router = express.Router();

// Test endpoint - no auth required
router.get('/test', (req, res) => {
  console.log('Test endpoint hit');
  res.json({ message: 'Current Affairs API is working!' });
});

// Apply auth middleware to all routes except test
router.use(adminAuthMiddleware);

// Latest Current Affairs
router.post(
  '/latest',
  upload.fields([{ name: 'thumbnail', maxCount: 1 }]),
  createLatestCurrentAffair
);
router.get('/latest', getLatestCurrentAffairs);
router.get('/latest/:id', getLatestCurrentAffairById);
router.put(
  '/latest/:id',
  upload.fields([{ name: 'thumbnail', maxCount: 1 }]),
  updateLatestCurrentAffair
);
router.delete('/latest/:id', deleteLatestCurrentAffair);

// Monthly Current Affairs
router.post(
  '/monthly',
  upload.fields([{ name: 'thumbnail', maxCount: 1 }]),
  createMonthlyCurrentAffair
);
router.get('/monthly', getMonthlyCurrentAffairs);
router.get('/monthly/:id', getMonthlyCurrentAffairById);
router.put(
  '/monthly/:id',
  upload.fields([{ name: 'thumbnail', maxCount: 1 }]),
  updateMonthlyCurrentAffair
);
router.delete('/monthly/:id', deleteMonthlyCurrentAffair);

// Sports Current Affairs
router.post(
  '/sports',
  upload.single('thumbnail'),
  createSportsCurrentAffair
);
router.get('/sports', listSportsCurrentAffairs);
router.get('/sports/:id', getSportsCurrentAffairById);
router.put(
  '/sports/:id',
  upload.single('thumbnail'),
  updateSportsCurrentAffair
);
router.delete('/sports/:id', deleteSportsCurrentAffair);

// State Current Affairs
router.post(
  '/state',
  upload.single('thumbnail'),
  createStateCurrentAffair
);
router.get('/state', listStateCurrentAffairs);
router.get('/state/:id', getStateCurrentAffairById);
router.put(
  '/state/:id',
  upload.single('thumbnail'),
  updateStateCurrentAffair
);
router.delete('/state/:id', deleteStateCurrentAffair);

// International Current Affairs
router.post(
  '/international',
  upload.single('thumbnail'),
  createInternationalCurrentAffair
);
router.get('/international', listInternationalCurrentAffairs);
router.get('/international/:id', getInternationalCurrentAffairById);
router.put(
  '/international/:id',
  upload.single('thumbnail'),
  updateInternationalCurrentAffair
);
router.delete('/international/:id', deleteInternationalCurrentAffair);

// Politics Current Affairs
router.post(
  '/politics',
  upload.single('thumbnail'),
  createPoliticsCurrentAffair
);
router.get('/politics', listPoliticsCurrentAffairs);
router.get('/politics/:id', getPoliticsCurrentAffairById);
router.put(
  '/politics/:id',
  upload.single('thumbnail'),
  updatePoliticsCurrentAffair
);
router.delete('/politics/:id', deletePoliticsCurrentAffair);

// Local Current Affairs
router.post(
  '/local',
  upload.single('thumbnail'),
  createLocalCurrentAffair
);
router.get('/local', listLocalCurrentAffairs);
router.get('/local/:id', getLocalCurrentAffairById);
router.put(
  '/local/:id',
  upload.single('thumbnail'),
  updateLocalCurrentAffair
);
router.delete('/local/:id', deleteLocalCurrentAffair);

// -------- Filter Helper Routes --------
// Step 1: Get all categories with current affairs
router.get('/categories', getCategoriesWithCurrentAffairs);

// Step 2: Get subcategories and languages by category
router.get('/categories/:categoryId/details', getSubCategoriesAndLanguagesByCategory);

// Step 2b: Get subcategories for a category (defaults to English)
router.get('/categories/:categoryId/subcategories-default', getSubCategoriesByCategory);

// Step 2c: Get subcategories filtered by selected language
router.get('/categories/:categoryId/subcategories', getSubCategoriesByLanguage);

// Step 3: Get filtered current affairs
router.get('/affairs', getFilteredCurrentAffairs);

// Get available affair types
router.get('/types', getAvailableAffairTypes);

module.exports = router;
```

### 3.2 User Current Affairs Routes

```javascript
const express = require('express');
const {
  listCurrentAffairs,
  getCurrentAffairById,
  // Filter helpers
  getCategoriesWithCurrentAffairs,
  getLanguagesByCategory,
  getSubCategoriesByCategory,
  getSubCategoriesByLanguage,
  getFilteredCurrentAffairs,
  getAvailableAffairTypes
} = require('../../controllers/User/currentAffairsController');

const router = express.Router();

// -------- Public Filter Helper Routes (MUST come before :id route) --------
// Step 1: Get all categories with current affairs
router.get('/current-affairs/categories', getCategoriesWithCurrentAffairs);

// Step 2a: Get available languages for a category
router.get('/current-affairs/categories/:categoryId/languages', getLanguagesByCategory);

// Step 2b: Get subcategories for a category (defaults to English)
router.get('/current-affairs/categories/:categoryId/subcategories-default', getSubCategoriesByCategory);

// Step 3: Get subcategories filtered by selected language
router.get('/current-affairs/categories/:categoryId/subcategories', getSubCategoriesByLanguage);

// Step 4: Get filtered current affairs
router.get('/current-affairs/affairs', getFilteredCurrentAffairs);

// Get available affair types
router.get('/current-affairs/types', getAvailableAffairTypes);

// -------- General Current Affairs Routes --------
// Get all current affairs
router.get('/current-affairs', listCurrentAffairs);

// Get single current affair by ID (MUST be last to avoid conflicts)
router.get('/current-affairs/:id', getCurrentAffairById);

module.exports = router;
```

### 3.3 Current Affairs Category Routes

```javascript
const express = require('express');
const {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus
} = require('../../controllers/Admin/currentAffairsCategoryController');
const adminAuthMiddleware = require('../../middlewares/Admin/authMiddleware');
const upload = require('../../middlewares/uploadMiddleware');

const router = express.Router();

router.use(adminAuthMiddleware);

router.post('/', upload.single('thumbnail'), createCategory);
router.get('/', getCategories);
router.get('/:id', getCategoryById);
router.put('/:id', upload.single('thumbnail'), updateCategory);
router.delete('/:id', deleteCategory);
router.patch('/:id/toggle-status', toggleCategoryStatus);

module.exports = router;
```

## 4. Filter and Helper Functions

The current affairs system includes comprehensive filtering and helper functions that allow users to:

1. Get categories that have current affairs
2. Get subcategories and languages by category
3. Get filtered current affairs by various criteria
4. Get available affair types
5. Support for multiple languages and content types

The system uses a discriminator pattern in Mongoose to handle different types of current affairs (Latest, Monthly, Sports, State, International, Politics, Local) while maintaining a consistent base schema. This allows for efficient querying and filtering of different types of content while maintaining data consistency.

The architecture supports:
- Multiple content types with different fields
- Category and subcategory organization
- Language support
- Thumbnail images with Cloudinary integration
- Active/inactive status management
- Comprehensive filtering and search capabilities
- Admin and user access controls