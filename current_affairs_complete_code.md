# Complete Current Affairs Code Documentation

This document contains all the code related to current affairs functionality in the Brain Buzz Backend, including models, controllers, routes, and filter functionality.

## Table of Contents
1. [Models/Schemas](#modelschemas)
2. [Controllers](#controllers)
3. [Routes](#routes)
4. [Filter Steps](#filter-steps)

## Models/Schemas

### 1. CurrentAffairBase.js
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

### 2. CurrentAffairWithCategory.js
```javascript
const mongoose = require('mongoose');

const CurrentAffairWithCategorySchema = new mongoose.Schema(
  {
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CurrentAffairsCategory',
      required: true
    },

    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
      }
    ],

    subCategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubCategory',
        required: true
      }
    ],

    languages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Language',
        required: true
      }
    ],

    name: {
      type: String,
      required: true,
      trim: true
    },

    slug: {
      type: String,
      lowercase: true,
      trim: true
    },

    month: {
      type: String,
      enum: [
        'January', 'February', 'March', 'April',
        'May', 'June', 'July', 'August',
        'September', 'October', 'November', 'December'
      ],
      default: null
    },

    heading: {
      type: String,
      required: true,
      trim: true
    },

    thumbnailUrl: {
      type: String,
      required: true
    },

    description: {
      type: String,
      required: true
    },

    fullContent: {
      type: String,
      required: true
    },

    date: {
      type: Date,
      required: true
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

CurrentAffairWithCategorySchema.pre('save', async function (next) {
  try {
    const CurrentAffairsCategory = mongoose.model('CurrentAffairsCategory');
    const category = await CurrentAffairsCategory.findById(this.category).lean();

    if (!category) {
      return next(new Error('Invalid Current Affairs category'));
    }

    if (category.categoryType === 'monthly' && !this.month) {
      return next(new Error('Month is required for Monthly Current Affairs'));
    }

    if (category.categoryType !== 'monthly') {
      this.month = null;
    }

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
  } catch (err) {
    next(err);
  }
});

CurrentAffairWithCategorySchema.index(
  { slug: 1, category: 1, month: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  'CurrentAffairWithCategory',
  CurrentAffairWithCategorySchema
);
```

### 3. CurrentAffairsCategory.js
```javascript
const mongoose = require('mongoose');

const currentAffairsCategorySchema = new mongoose.Schema(
  {
    categoryType: {
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

// Pre-save hook to generate slug from categoryType
currentAffairsCategorySchema.pre('save', function (next) {
  if (this.isModified('categoryType') || this.isNew) {
    this.slug = this.categoryType
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

### 4. InternationalCurrentAffair.js
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

### 5. LatestCurrentAffair.js
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

### 6. LocalCurrentAffair.js
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

### 7. MonthlyCurrentAffair.js
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

### 8. PoliticsCurrentAffair.js
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

### 9. SportsCurrentAffair.js
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

### 10. StateCurrentAffair.js
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

### 11. Index.js (Exports)
```javascript
const CurrentAffair = require('./CurrentAffairBase');
const LatestCurrentAffair = require('./LatestCurrentAffair');
const MonthlyCurrentAffair = require('./MonthlyCurrentAffair');
const StateCurrentAffair = require('./StateCurrentAffair');
const SportsCurrentAffair = require('./SportsCurrentAffair');
const CurrentAffairsCategory = require('./CurrentAffairsCategory');

module.exports = {
  CurrentAffair,
  LatestCurrentAffair,
  MonthlyCurrentAffair,
  StateCurrentAffair,
  SportsCurrentAffair,
  CurrentAffairsCategory
};
```

## Controllers

### 1. Admin CurrentAffairsController.js
```javascript
const cloudinary = require('../../config/cloudinary');

const CurrentAffairWithCategory = require('../../models/CurrentAffairs/CurrentAffairWithCategory');
const Category = require('../../models/Course/Category');
const SubCategory = require('../../models/Course/SubCategory');
const Language = require('../../models/Course/Language');
const CurrentAffairsCategory = require('../../models/CurrentAffairs/CurrentAffairsCategory');

// -------------------- HELPERS --------------------
const uploadToCloudinary = (fileBuffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(fileBuffer);
  });
};

// -------------------- CREATE CURRENT AFFAIR --------------------
exports.createCurrentAffair = async (req, res) => {
  try {
    if (!req.body.affair) {
      return res.status(400).json({
        message: 'Affair data is required in form-data'
      });
    }

    let payload;
    try {
      payload = JSON.parse(req.body.affair);
    } catch {
      return res.status(400).json({
        message: 'Invalid JSON in affair field'
      });
    }

    const {
      currentAffairsCategoryId,
      categoryId,
      subCategoryId,
      languageId,
      name,
      heading,
      description,
      fullContent,
      date,
      month,
      isActive
    } = payload;

    if (
      !currentAffairsCategoryId ||
      !categoryId ||
      !subCategoryId ||
      !languageId
    ) {
      return res.status(400).json({
        message:
          'CurrentAffairsCategory, Category, SubCategory and Language are required'
      });
    }

    if (!name || !heading || !description || !fullContent || !date) {
      return res.status(400).json({
        message: 'Name, heading, description, fullContent and date are required'
      });
    }

    const caCategory = await CurrentAffairsCategory.findOne({
      _id: currentAffairsCategoryId,
      isActive: true
    });

    if (!caCategory) {
      return res.status(400).json({
        message: 'Invalid Current Affairs category'
      });
    }

    if (caCategory.categoryType === 'monthly' && !month) {
      return res.status(400).json({
        message: 'Month is required for Monthly Current Affairs'
      });
    }

    const category = await Category.findOne({
      _id: categoryId,
      contentType: 'CURRENT_AFFAIRS',
      isActive: true
    });

    if (!category) {
      return res.status(400).json({
        message: 'Invalid Category for Current Affairs'
      });
    }

    const subCategory = await SubCategory.findOne({
      _id: subCategoryId,
      category: categoryId,
      contentType: 'CURRENT_AFFAIRS',
      isActive: true
    });

    if (!subCategory) {
      return res.status(400).json({
        message: 'Invalid SubCategory for selected Category'
      });
    }

    const language = await Language.findOne({
      _id: languageId,
      isActive: true
    });

    if (!language) {
      return res.status(400).json({
        message: 'Invalid Language'
      });
    }

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        message: 'Thumbnail is required'
      });
    }

    const uploadResult = await uploadToCloudinary(
      req.file.buffer,
      'brainbuzz/current-affairs/thumbnails'
    );

    const affair = await CurrentAffairWithCategory.create({
      category: currentAffairsCategoryId,
      categories: [categoryId],
      subCategories: [subCategoryId],
      languages: [languageId],
      name: name.trim(),
      heading: heading.trim(),
      description,
      fullContent,
      date,
      month: caCategory.categoryType === 'monthly' ? month : null,
      thumbnailUrl: uploadResult.secure_url,
      isActive: isActive ?? true
    });

    const populatedAffair = await CurrentAffairWithCategory.findById(affair._id)
      .populate('category', 'name slug categoryType')
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code');

    return res.status(201).json({
      success: true,
      message: 'Current Affair created successfully',
      data: populatedAffair
    });
  } catch (error) {
    console.error('Create Current Affair Error:', error);
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};


exports.getCurrentAffairs = async (req, res) => {
  try {
    const {
      categoryId,
      month,
      isActive,
      fromDate,
      toDate,
      language,
      lang
    } = req.query;

    const filter = {};

    // Filter by main CA category
    if (categoryId) {
      filter.category = categoryId;
    }

    // Filter by active status
    if (typeof isActive !== 'undefined') {
      filter.isActive = isActive === 'true';
    }

    // Filter by month
    if (month) {
      filter.month = month;
    }

    // Filter by date range
    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) filter.createdAt.$gte = new Date(fromDate);
      if (toDate) filter.createdAt.$lte = new Date(toDate);
    }

    // ✅ LANGUAGE FILTER (FIX)
    if (language) {
      filter.languages = language;
    } 
    else if (lang) {
      const escapeRegex = (s) =>
        s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      const langDoc = await Language.findOne({
        $or: [
          { code: lang.toLowerCase() },
          { name: { $regex: `^${escapeRegex(lang)}$`, $options: 'i' } }
        ]
      });

      // If language not found → return empty
      if (!langDoc) {
        return res.status(200).json({
          success: true,
          count: 0,
          data: []
        });
      }

      filter.languages = langDoc._id;
    }

    const affairs = await CurrentAffairWithCategory.find(filter)
      .populate('category', 'name slug categoryType')
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: affairs.length,
      data: affairs
    });

  } catch (error) {
    console.error('Get Current Affairs Error:', error);
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};


// -------------------- GET CURRENT AFFAIR BY ID --------------------
exports.getCurrentAffairById = async (req, res) => {
  try {
    const affair = await CurrentAffairWithCategory.findById(req.params.id)
      .populate('category', 'name slug categoryType')
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code');

    if (!affair) {
      return res.status(404).json({
        success: false,
        message: 'Current Affair not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: affair
    });
  } catch (error) {
    console.error('Get Current Affair By ID Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// -------------------- UPDATE CURRENT AFFAIR --------------------
exports.updateCurrentAffair = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!id || id.length !== 24) {
      return res.status(400).json({
        message: 'Invalid Current Affair ID'
      });
    }

    const affair = await CurrentAffairWithCategory.findById(id);

    if (!affair) {
      return res.status(404).json({
        message: 'Current Affair not found'
      });
    }

    // Parse payload (supports form-data + JSON)
    let payload = {};
    if (req.body.affair) {
      try {
        payload = JSON.parse(req.body.affair);
      } catch {
        return res.status(400).json({
          message: 'Invalid JSON in affair field'
        });
      }
    } else {
      payload = req.body;
    }

    const {
      currentAffairsCategoryId,
      categoryId,
      subCategoryId,
      languageId,
      name,
      heading,
      description,
      fullContent,
      date,
      month,
      isActive
    } = payload;

    // ---------------- VALIDATIONS ----------------
    if (currentAffairsCategoryId) {
      const caCategory = await CurrentAffairsCategory.findOne({
        _id: currentAffairsCategoryId,
        isActive: true
      });

      if (!caCategory) {
        return res.status(400).json({
          message: 'Invalid Current Affairs category'
        });
      }

      if (caCategory.categoryType === 'monthly' && !month) {
        return res.status(400).json({
          message: 'Month is required for Monthly Current Affairs'
        });
      }

      affair.category = currentAffairsCategoryId;
      affair.month = caCategory.categoryType === 'monthly' ? month : null;
    }

    if (categoryId) {
      const category = await Category.findOne({
        _id: categoryId,
        contentType: 'CURRENT_AFFAIRS',
        isActive: true
      });

      if (!category) {
        return res.status(400).json({
          message: 'Invalid Category for Current Affairs'
        });
      }

      affair.categories = [categoryId];
    }

    if (subCategoryId) {
      const subCategory = await SubCategory.findOne({
        _id: subCategoryId,
        contentType: 'CURRENT_AFFAIRS',
        isActive: true
      });

      if (!subCategory) {
        return res.status(400).json({
          message: 'Invalid SubCategory'
        });
      }

      affair.subCategories = [subCategoryId];
    }

    if (languageId) {
      const language = await Language.findOne({
        _id: languageId,
        isActive: true
      });

      if (!language) {
        return res.status(400).json({
          message: 'Invalid Language'
        });
      }

      affair.languages = [languageId];
    }

    // ---------------- UPDATE FIELDS ----------------
    if (name) affair.name = name.trim();
    if (heading) affair.heading = heading.trim();
    if (description) affair.description = description;
    if (fullContent) affair.fullContent = fullContent;
    if (date) affair.date = date;
    if (typeof isActive !== 'undefined') affair.isActive = isActive;

    // ---------------- THUMBNAIL UPDATE ----------------
    if (req.file && req.file.buffer) {
      const uploadResult = await uploadToCloudinary(
        req.file.buffer,
        'brainbuzz/current-affairs/thumbnails'
      );

      affair.thumbnailUrl = uploadResult.secure_url;
    }

    await affair.save();

    const populatedAffair = await CurrentAffairWithCategory.findById(affair._id)
      .populate('category', 'name slug categoryType')
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code');

    return res.status(200).json({
      success: true,
      message: 'Current Affair updated successfully',
      data: populatedAffair
    });

  } catch (error) {
    console.error('Update Current Affair Error:', error);
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};


// -------------------- DELETE (HARD) CURRENT AFFAIR --------------------
exports.deleteCurrentAffair = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || id.length !== 24) {
      return res.status(400).json({
        message: 'Invalid Current Affair ID'
      });
    }

    const affair = await CurrentAffairWithCategory.findByIdAndDelete(id);

    if (!affair) {
      return res.status(404).json({
        message: 'Current Affair not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Current Affair permanently deleted'
    });

  } catch (error) {
    console.error('Delete Current Affair Error:', error);
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};


// -------------------- GET DISTINCT CATEGORIES FOR CURRENT AFFAIRS (ADMIN) --------------------
exports.getCurrentAffairsCategories = async (req, res) => {
  try {
    const affairs = await CurrentAffairWithCategory.find({})
      .populate('categories', 'name slug description thumbnailUrl');

    const categories = [];
    const categoryIds = new Set();

    affairs.forEach(affair => {
      if (affair.categories?.length) {
        affair.categories.forEach(cat => {
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
    console.error('Error fetching current affairs categories:', error);
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};


// -------------------- GET DISTINCT SUBCATEGORIES FOR CURRENT AFFAIRS (ADMIN) --------------------
exports.getCurrentAffairsSubCategories = async (req, res) => {
  try {
    const { category, language, lang } = req.query;

    if (!category) {
      return res.status(400).json({
        message: 'Category is required'
      });
    }

    // Base filter (NO contentType here)
    const filter = {
      categories: category
    };

    // Language filter
    if (language) {
      filter.languages = language;
    } 
    else if (lang) {
      const escapeRegex = (s) =>
        s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      const langDoc = await Language.findOne({
        $or: [
          { code: lang.toLowerCase() },
          { name: { $regex: `^${escapeRegex(lang)}$`, $options: 'i' } }
        ]
      });

      if (langDoc) {
        filter.languages = langDoc._id;
      }
    }

    // Fetch affairs
    const affairs = await CurrentAffairWithCategory.find(filter)
      .populate('subCategories', 'name slug description thumbnailUrl');

    // Extract unique subcategories
    const subCategories = [];
    const subCategoryIds = new Set();

    affairs.forEach(affair => {
      if (affair.subCategories?.length) {
        affair.subCategories.forEach(subCat => {
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

    return res.status(200).json({
      data: subCategories
    });

  } catch (error) {
    console.error('Error fetching current affairs subcategories:', error);
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};
```

### 2. User CurrentAffairsController.js
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

// Step 3: Get subcategories for a category filtered by language (Public)
exports.getSubCategoriesByLanguage = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { lang } = req.query; // Using 'lang' query param with language code

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
    const currentAffairsInCategoryAndLanguage = await CurrentAffair.find({
      contentType: 'CURRENT_AFFAIRS',
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

### 3. Admin CurrentAffairsCategoryController.js
```javascript
const CurrentAffairsCategory = require('../../models/CurrentAffairs/CurrentAffairsCategory');
const cloudinary = require('../../config/cloudinary');

const uploadToCloudinary = (fileBuffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(fileBuffer);
  });
};

// Create a new Current Affairs Category
exports.createCategory = async (req, res) => {
  try {
    const { categoryType, description, isActive } = req.body;

    if (!categoryType || typeof categoryType !== 'string') {
      return res.status(400).json({
        message: 'categoryType is required and must be a string'
      });
    }

    // Normalize categoryType (recommended)
    const normalizedCategoryType = categoryType.trim().toLowerCase();

    // Prevent duplicates (admin-defined uniqueness)
    const existing = await CurrentAffairsCategory.findOne({
      categoryType: normalizedCategoryType
    });

    if (existing) {
      return res.status(400).json({
        message: `Category '${categoryType}' already exists`
      });
    }

    let thumbnailUrl;
    if (req.file?.buffer) {
      const uploadResult = await uploadToCloudinary(
        req.file.buffer,
        'brainbuzz/current-affairs/categories/thumbnails'
      );
      thumbnailUrl = uploadResult.secure_url;
    }

    const category = await CurrentAffairsCategory.create({
      categoryType: normalizedCategoryType,
      description,
      isActive: typeof isActive !== 'undefined' ? isActive : true,
      thumbnailUrl,
    });

    return res.status(201).json({
      message: 'Current Affairs Category created successfully',
      data: category,
    });
  } catch (error) {
    console.error('Error creating Current Affairs category:', error);
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
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

    const categories = await CurrentAffairsCategory
      .find(filter)
      .sort({ order: 1, createdAt: -1 });

    return res.status(200).json({ data: categories });
  } catch (error) {
    console.error('Error fetching Current Affairs categories:', error);
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

// Get Current Affairs Category by ID
exports.getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await CurrentAffairsCategory.findById(id);
    if (!category) {
      return res.status(404).json({
        message: 'Current Affairs Category not found'
      });
    }

    return res.status(200).json({ data: category });
  } catch (error) {
    console.error('Error fetching Current Affairs category:', error);
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

// Update Current Affairs Category
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { categoryType, description, order, isActive } = req.body;

    const updates = {};

    if (typeof categoryType !== 'undefined') {
      const normalizedCategoryType = categoryType.trim().toLowerCase();
      
      // Check if categoryType already exists (excluding current category)
      const existing = await CurrentAffairsCategory.findOne({
        categoryType: normalizedCategoryType,
        _id: { $ne: id }
      });

      if (existing) {
        return res.status(400).json({
          message: `Category '${categoryType}' already exists`
        });
      }

      updates.categoryType = normalizedCategoryType;
    }
    if (typeof description !== 'undefined') updates.description = description;
    if (typeof order !== 'undefined') updates.order = order;
    if (typeof isActive !== 'undefined') updates.isActive = isActive;

    if (req.file?.buffer) {
      const uploadResult = await uploadToCloudinary(
        req.file.buffer,
        'brainbuzz/current-affairs/categories/thumbnails'
      );
      updates.thumbnailUrl = uploadResult.secure_url;
    }

    const category = await CurrentAffairsCategory.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({
        message: 'Current Affairs Category not found'
      });
    }

    return res.status(200).json({
      message: 'Current Affairs Category updated successfully',
      data: category,
    });
  } catch (error) {
    console.error('Error updating Current Affairs category:', error);
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

// Delete Current Affairs Category (soft delete)
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await CurrentAffairsCategory.findByIdAndDelete(
      id,
      { isActive: false },
      { new: true }
    );

    if (!category) {
      return res.status(404).json({
        message: 'Current Affairs Category not found'
      });
    }

    return res.status(200).json({
      message: 'Current Affairs Category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting Current Affair deleted category:', error);
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
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
      return res.status(404).json({
        message: 'Current Affairs Category not found'
      });
    }

    return res.status(200).json({
      message: `Current Affairs Category ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: category,
    });
  } catch (error) {
    console.error('Error toggling Current Affairs category status:', error);
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};
```

## Routes

### 1. Admin CurrentAffairsRoutes.js
```javascript
const express = require('express');
const router = express.Router();

const adminAuthMiddleware = require('../../middlewares/Admin/authMiddleware');
const upload = require('../../middlewares/uploadMiddleware');

const {
  createCurrentAffair,
  getCurrentAffairs,
  getCurrentAffairById,
  updateCurrentAffair,
  deleteCurrentAffair,
  getCurrentAffairsCategories
} = require('../../controllers/Admin/currentAffairsController');

// --------------------------------------------------
// TEST ROUTE (NO AUTH – FOR QUICK CHECK)
// --------------------------------------------------
router.get('/test', (req, res) => {
  return res.json({
    success: true,
    message: 'Current Affairs route is working ✅'
  });
});

router.use(adminAuthMiddleware);
router.get('/', getCurrentAffairs);
router.get('/categories', getCurrentAffairsCategories);
router.get('/:id', getCurrentAffairById);
router.post('/',upload.single('thumbnail'),createCurrentAffair);
router.put('/:id',upload.single('thumbnail'),updateCurrentAffair);
router.delete('/:id', deleteCurrentAffair);

module.exports = router;
```

### 2. Admin CurrentAffairsCategoryRoutes.js
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

### 3. User CurrentAffairsRoutes.js
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

### 4. Admin CurrentAffairsFilterRoutes.js
```javascript
const express = require('express');
const router = express.Router();

const {
  getCurrentAffairsCategories,
  getCurrentAffairsSubCategories
} = require('../../controllers/Admin/currentAffairsController');

const adminAuthMiddleware = require('../../middlewares/Admin/authMiddleware');

// Require authentication for all filter routes
router.use(adminAuthMiddleware);

// Get distinct categories for current affairs
router.get('/categories', getCurrentAffairsCategories);

// Get distinct subcategories for current affairs based on category and language
router.get('/subcategories', getCurrentAffairsSubCategories);

module.exports = router;
```

## Filter Steps

The current affairs filter functionality follows a step-by-step approach to help users find the content they're looking for:

### Step 1: Get Available Categories
**Endpoint:** `GET /api/v1/current-affairs/categories`
- Fetches all categories that have current affairs associated with them
- Returns only active categories with current affairs
- Provides category names and slugs for UI display

### Step 2: Get Languages for a Category
**Endpoint:** `GET /api/v1/current-affairs/categories/:categoryId/languages`
- Fetches all languages available for a specific category
- Helps users filter content by their preferred language

### Step 2b: Get Subcategories (Default Language)
**Endpoint:** `GET /api/v1/current-affairs/categories/:categoryId/subcategories-default`
- Fetches subcategories for a specific category (defaults to English)
- Provides subcategory names and slugs

### Step 3: Get Subcategories Filtered by Language
**Endpoint:** `GET /api/v1/current-affairs/categories/:categoryId/subcategories?lang=en`
- Fetches subcategories filtered by selected language
- Uses `lang` query parameter to specify language code (e.g., en, te, hi)

### Step 4: Get Filtered Current Affairs
**Endpoint:** `GET /api/v1/current-affairs/affairs?categoryId=&subCategoryId=&lang=&affairType=`
- Fetches current affairs based on selected filters
- Supports pagination with `page` and `limit` parameters
- Returns paginated response with total count

### Step 5: Get Available Affair Types
**Endpoint:** `GET /api/v1/current-affairs/types?categoryId=&subCategoryId=&lang=`
- Fetches available affair types (Latest, Monthly, Sports, State, International, Politics, Local)
- Filters based on other selected criteria
- Helps users narrow down content type

### Admin Filter Endpoints:
- `GET /api/admin/current-affairs/filters/categories` - Get distinct categories from current affairs
- `GET /api/admin/current-affairs/filters/subcategories` - Get distinct subcategories from current affairs

This filter system provides a structured way for users to navigate and find current affairs content based on their preferences.

## API Testing Steps

This section provides comprehensive step-by-step testing instructions for all current affairs functionality.

### 1. Admin Current Affairs API Testing

#### 1.1 Create Current Affairs Category
**Endpoint:** `POST /api/admin/current-affairs-categories`

**Headers:**
- Content-Type: multipart/form-data
- Authorization: Bearer <admin_token>

**Form Data:**
- categoryType: "sports" (or "international", "state", "monthly", etc.)
- description: "Sports related current affairs"
- isActive: true
- thumbnail: [image file]

**Test Steps:**
1. Create a new current affairs category with a unique name
2. Verify the response contains success: true
3. Verify the created category has the correct categoryType
4. Try creating a duplicate category and verify it returns an error

#### 1.2 Get All Current Affairs Categories
**Endpoint:** `GET /api/admin/current-affairs-categories`

**Headers:**
- Authorization: Bearer <admin_token>

**Query Parameters (Optional):**
- isActive: true/false

**Test Steps:**
1. Verify the response contains an array of categories
2. Check that each category has required fields (name, slug, etc.)
3. Test with isActive filter

#### 1.3 Get Current Affairs by ID
**Endpoint:** `GET /api/admin/current-affairs/:id`

**Headers:**
- Authorization: Bearer <admin_token>

**Test Steps:**
1. Use a valid current affairs ID
2. Verify the response contains the full current affair object
3. Verify all populated fields (category, categories, subCategories, languages)
4. Try with an invalid ID and verify 404 response

#### 1.4 Create Current Affairs
**Endpoint:** `POST /api/admin/current-affairs`

**Headers:**
- Content-Type: multipart/form-data
- Authorization: Bearer <admin_token>

**Form Data (affair field as JSON string):**
```json
{
  "currentAffairsCategoryId": "<valid_current_affairs_category_id>",
  "categoryId": "<valid_exam_category_id>",
  "subCategoryId": "<valid_exam_subcategory_id>",
  "languageId": "<valid_language_id>",
  "name": "Sports Current Affairs",
  "heading": "Sports News",
  "description": "Brief description",
  "fullContent": "Full content here...",
  "date": "2023-12-01",
  "month": "December",
  "isActive": true
}
```
**Additional Form Data:**
- thumbnail: [image file]

**Test Steps:**
1. Create a current affair with all required fields
2. Verify the response contains success: true
3. Verify the created object has all expected fields populated
4. Test with missing required fields and verify 400 error

#### 1.5 Get All Current Affairs with Filters
**Endpoint:** `GET /api/admin/current-affairs`

**Headers:**
- Authorization: Bearer <admin_token>

**Query Parameters:**
- caCategoryId: CurrentAffairsCategory ID (e.g., International, State)
- examCategoryId: Exam Category ID (e.g., UPSC, APPSC)
- examSubCategoryId: Exam Subcategory ID (e.g., Prelims, Mains)
- language: Language ID
- lang: Language code (e.g., en, te, hi)
- month: Month name
- isActive: true/false
- fromDate: Start date (YYYY-MM-DD)
- toDate: End date (YYYY-MM-DD)

**Test Steps:**
1. Call without filters to get all current affairs
2. Test with caCategoryId filter
3. Test with examCategoryId filter
4. Test with examSubCategoryId filter
5. Test with language filter
6. Test with lang filter
7. Test with combination of filters
8. Verify the response is grouped by categoryType in the data object
9. Verify count field shows total number of records
10. Verify empty results return empty object `{}` for data field

#### 1.6 Update Current Affairs
**Endpoint:** `PUT /api/admin/current-affairs/:id`

**Headers:**
- Content-Type: multipart/form-data
- Authorization: Bearer <admin_token>

**Form Data:**
- affair: JSON string with fields to update
- thumbnail: [image file] (optional)

**Test Steps:**
1. Update an existing current affair
2. Verify the updated fields are correct
3. Test with invalid ID and verify 404 response

#### 1.7 Delete Current Affairs
**Endpoint:** `DELETE /api/admin/current-affairs/:id`

**Headers:**
- Authorization: Bearer <admin_token>

**Test Steps:**
1. Delete an existing current affair
2. Verify the response confirms deletion
3. Try to get the deleted item and verify it's not found

#### 1.8 Get Current Affairs Categories (Admin Filter)
**Endpoint:** `GET /api/admin/current-affairs/filters/categories`

**Headers:**
- Authorization: Bearer <admin_token>

**Test Steps:**
1. Verify the response contains distinct categories from current affairs
2. Check that each category has _id, name, slug, description, and thumbnailUrl

#### 1.9 Get Current Affairs Subcategories (Admin Filter)
**Endpoint:** `GET /api/admin/current-affairs/filters/subcategories`

**Headers:**
- Authorization: Bearer <admin_token>

**Query Parameters:**
- category: Category ID
- language: Language ID
- lang: Language code

**Test Steps:**
1. Call with a valid category ID
2. Verify the response contains distinct subcategories
3. Test with language filters

### 2. User Current Affairs API Testing

#### 2.1 Get All Current Affairs (Grouped by Type)
**Endpoint:** `GET /api/v1/current-affairs/current-affairs`

**Query Parameters:**
- category: Exam Category ID
- subCategory: Exam Subcategory ID
- language: Language ID
- date: Specific date
- affairType: Specific affair type

**Test Steps:**
1. Call without filters to get all current affairs grouped by type
2. Test with category filter
3. Verify the response has grouped structure (latest, monthly, sports, state, international, politics, local)

#### 2.2 Get Current Affairs by ID
**Endpoint:** `GET /api/v1/current-affairs/current-affairs/:id`

**Test Steps:**
1. Use a valid current affairs ID
2. Verify the response contains the current affair data
3. Try with invalid ID and verify 404 response

#### 2.3 Get Categories with Current Affairs
**Endpoint:** `GET /api/v1/current-affairs/categories`

**Test Steps:**
1. Verify the response contains categories that have current affairs
2. Check that each category has name, slug, and thumbnailUrl

#### 2.4 Get Languages by Category
**Endpoint:** `GET /api/v1/current-affairs/categories/:categoryId/languages`

**Test Steps:**
1. Use a valid category ID
2. Verify the response contains available languages for that category

#### 2.5 Get Subcategories by Category (Default Language)
**Endpoint:** `GET /api/v1/current-affairs/categories/:categoryId/subcategories-default`

**Test Steps:**
1. Use a valid category ID
2. Verify the response contains subcategories for that category with English language

#### 2.6 Get Subcategories by Language
**Endpoint:** `GET /api/v1/current-affairs/categories/:categoryId/subcategories?lang=en`

**Query Parameters:**
- lang: Language code (e.g., en, te, hi)

**Test Steps:**
1. Use a valid category ID and language code
2. Verify the response contains subcategories for that category and language

#### 2.7 Get Filtered Current Affairs
**Endpoint:** `GET /api/v1/current-affairs/affairs`

**Query Parameters:**
- categoryId: Exam Category ID
- subCategoryId: Exam Subcategory ID
- lang: Language code
- affairType: Affair type
- page: Page number (default: 1)
- limit: Items per page (default: 20)

**Test Steps:**
1. Call without filters to get all current affairs
2. Test with various filter combinations
3. Verify pagination works correctly
4. Check that the response includes pagination metadata

#### 2.8 Get Available Affair Types
**Endpoint:** `GET /api/v1/current-affairs/types`

**Query Parameters:**
- categoryId: Exam Category ID
- subCategoryId: Exam Subcategory ID
- lang: Language code

**Test Steps:**
1. Use various filter combinations
2. Verify the response contains available affair types based on filters
3. Check that types are properly formatted with name and value

### 3. Comprehensive Filter Stacking Tests

#### 3.1 Multi-Dimensional Filter Stacking
**Scenario:** User selects exam category → subcategory → language → current affairs type

**Test Steps:**
1. First, get exam categories: `GET /api/v1/current-affairs/categories`
2. Select an exam category and get subcategories: `GET /api/v1/current-affairs/categories/:categoryId/subcategories-default`
3. Select language and get filtered subcategories: `GET /api/v1/current-affairs/categories/:categoryId/subcategories?lang=en`
4. Finally, get current affairs with all filters: `GET /api/v1/current-affairs/affairs?categoryId=<exam_cat_id>&subCategoryId=<exam_subcat_id>&lang=en&affairType=InternationalCurrentAffair`
5. Verify the results match all applied filters

#### 3.2 Admin Multi-Dimensional Filter Stacking
**Test Steps:**
1. Call admin endpoint with all available filters:
   `GET /api/admin/current-affairs?caCategoryId=<ca_cat_id>&examCategoryId=<exam_cat_id>&examSubCategoryId=<exam_subcat_id>&language=<lang_id>`
2. Verify all filters are applied simultaneously
3. Verify the response is grouped by categoryType
4. Test different combinations of filters

### 4. Response Format Verification

#### 4.1 Grouped Response Format
**Expected Format:**
```json
{
  "success": true,
  "count": 10,
  "data": {
    "sports": [
      { /* current affair objects */ }
    ],
    "international": [
      { /* current affair objects */ }
    ],
    "monthly": [
      { /* current affair objects */ }
    ]
  }
}
```

#### 4.2 Empty Results Format
**Expected Format:**
```json
{
  "success": true,
  "count": 0,
  "data": {}
}
```

### 5. Error Handling Tests

#### 5.1 Invalid ObjectId Tests
**Test Steps:**
1. Call any endpoint with invalid ObjectId (e.g., "invalid_id")
2. Verify appropriate 400 or 404 error response

#### 5.2 Missing Required Fields
**Test Steps:**
1. Try to create/update with missing required fields
2. Verify 400 error with appropriate message

#### 5.3 Unauthorized Access
**Test Steps:**
1. Call admin endpoints without token
2. Verify 401 Unauthorized response

### 6. Performance Tests

#### 6.1 Large Dataset Handling
**Test Steps:**
1. Create multiple current affairs entries
2. Test filtering endpoints with large datasets
3. Verify response times are acceptable

#### 6.2 Pagination Performance
**Test Steps:**
1. Create a large number of current affairs
2. Test pagination with different page and limit values
3. Verify performance remains consistent

### 7. Parameter Naming Clarity Tests

#### 7.1 Verify New Parameter Names
The API now uses these clarified parameter names:
- `caCategoryId`: Refers to CurrentAffairsCategory (International, State, Sports, etc.)
- `examCategoryId`: Refers to Exam Category (UPSC, APPSC, etc.)
- `examSubCategoryId`: Refers to Exam Subcategory (Prelims, Mains, etc.)

**Test Steps:**
1. Verify that the admin controller uses the new parameter names
2. Test that all filter combinations work with the new parameter names
3. Confirm backward compatibility is maintained where applicable

These comprehensive testing steps ensure all current affairs functionality works correctly with proper filter stacking, response formatting, and error handling.