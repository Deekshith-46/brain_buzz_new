# Test Series Complete Documentation

## Table of Contents
1. [Overview](#overview)
2. [Database Models](#database-models)
3. [API Routes](#api-routes)
4. [Controllers](#controllers)
5. [Complete Exam Flow - Step by Step](#complete-exam-flow---step-by-step)
6. [API Testing](#api-testing)
7. [Access Control](#access-control)
8. [Ranking System](#ranking-system)

## Overview

The Test Series module is a comprehensive system for creating, managing, and taking online tests. It includes features for:
- Test series creation and management
- Test scheduling and timing
- Question management with sections
- Test attempt tracking
- Real-time answer submission
- Automatic scoring and ranking
- Result analysis and leaderboard
- **Complete step-by-step exam flow** (see [Complete Exam Flow - Step by Step](#complete-exam-flow---step-by-step))

## Database Models

### 1. TestSeries Model

**File:** `src/models/TestSeries/TestSeries.js`

```javascript
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Question Schema
const questionSchema = new mongoose.Schema({
  questionNumber: Number,
  questionText: {
    type: String,
    required: true,
    trim: true
  },
  options: [String],
  correctOptionIndex: Number,
  explanation: String,
  marks: {
    type: Number,
    default: 1
  },
  negativeMarks: {
    type: Number,
    default: 0
  }
}, { _id: true });

// Section Schema
const sectionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  order: Number,
  noOfQuestions: Number,
  questions: [questionSchema]
}, { _id: true });

// Test Schema
const testSchema = new mongoose.Schema({
  testName: {
    type: String,
    required: true,
    trim: true
  },
  noOfQuestions: Number,
  totalMarks: Number,
  positiveMarks: Number,
  negativeMarks: Number,
  date: Date,
  startTime: Date,
  endTime: Date,
  instructionsPage1: String,
  instructionsPage2: String,
  instructionsPage3: String,
  totalExplanationVideoUrl: String,
  resultPublishTime: Date,
  sections: [sectionSchema]
}, { _id: true });

// Test Series Schema
const testSeriesSchema = new Schema({
  contentType: {
    type: String,
    default: 'TEST_SERIES',
    immutable: true
  },
  accessType: {
    type: String,
    enum: ["FREE", "PAID"],
    default: "PAID"
  },
  date: Date,
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  subCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubCategory'
  }],
  thumbnail: String,
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  originalPrice: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  finalPrice: {
    type: Number,
    default: 0
  },
  discount: {
    type: {
      type: String,
      enum: ['percentage', 'fixed', null],
      default: null
    },
    value: {
      type: Number,
      min: 0,
      default: 0
    },
    validUntil: {
      type: Date,
      default: null
    }
  },
  languages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Language'
  }],
  validity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ValidityOption'
  },
  noOfTests: {
    type: Number,
    required: true
  },
  freeQuota: {
    type: Number,
    default: 2,
    min: 0
  },
  tests: [testSchema],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Pre-save hooks for validation and price calculation
testSeriesSchema.pre('save', async function(next) {
  // Validate categories and subcategories match content type
  // Auto-calculate finalPrice based on originalPrice and discount
  next();
});

// Export model with explicit collection name
const TestSeriesModel = mongoose.model('TestSeries', testSeriesSchema, 'testseries');
module.exports = TestSeriesModel;
```

### 2. TestAttempt Model

**File:** `src/models/TestSeries/TestAttempt.js`

```javascript
const mongoose = require('mongoose');

// Response Schema
const responseSchema = new mongoose.Schema({
  sectionId: String,
  questionId: String,
  selectedOption: Number, // 0-3 (can be null for cleared responses)
  isCorrect: Boolean,
  timeTaken: Number,  // seconds spent on this question
  markedForReview: { 
    type: Boolean, 
    default: false 
  }
});

// Test Attempt Schema
const testAttemptSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  testSeries: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "TestSeries", 
    required: true 
  },
  testId: { 
    type: String, 
    required: true 
  }, // _id of the test inside series

  startedAt: Date,
  submittedAt: Date, // When user submitted the test

  responses: [responseSchema],

  score: Number,
  correct: Number,
  incorrect: Number,
  unattempted: Number,

  accuracy: Number,    // (correct / total_attempt) * 100
  speed: Number,       // questions answered per minute
  percentage: Number,
  rank: Number,        // User's rank in this test

  resultGenerated: { 
    type: Boolean, 
    default: false 
  },
  
  status: { 
    type: String, 
    enum: ['IN_PROGRESS', 'SUBMITTED'], 
    default: 'IN_PROGRESS' 
  }
}, { timestamps: true });

// Compound unique index to prevent duplicate attempts
testAttemptSchema.index({ user: 1, testSeries: 1, testId: 1 }, { unique: true });

module.exports = mongoose.model('TestAttempt', testAttemptSchema);
```

### 3. TestRanking Model

**File:** `src/models/TestSeries/TestRanking.js`

```javascript
const mongoose = require('mongoose');

const testRankingSchema = new mongoose.Schema({
  testId: String,
  testSeries: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "TestSeries" 
  },
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User" 
  },
  score: Number,
  rank: Number,
  accuracy: Number,
  totalParticipants: Number
}, { timestamps: true });

module.exports = mongoose.model('TestRanking', testRankingSchema);
```

### 4. TestSeriesPurchase Model (Legacy)

**File:** `src/models/TestSeries/TestSeriesPurchase.js`

```javascript
const mongoose = require('mongoose');

const testSeriesPurchaseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  testSeries: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TestSeries',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  paymentId: {
    type: String,
    required: true,
    unique: true
  },
  purchaseDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  coupon: {
    code: String,
    discountAmount: Number
  }
}, { timestamps: true });

// Compound index for unique active purchases
testSeriesPurchaseSchema.index(
  { user: 1, testSeries: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'completed' } }
);

module.exports = mongoose.model('TestSeriesPurchase', testSeriesPurchaseSchema);
```

## API Routes

### Admin Routes

**File:** `src/routes/Admin/testSeriesRoutes.js`

```javascript
const express = require('express');
const router = express.Router();

// Base URL: /api/admin/test-series

// Test Series CRUD
router.post('/', createTestSeries);                    // Create new test series
router.get('/', getTestSeriesList);                    // List all test series
router.get('/:id', getTestSeriesById);                 // Get single test series
router.get('/:id/full', getFullTestSeries);            // Get full details with tests
router.put('/:id', updateTestSeries);                  // Update test series
router.delete('/:id', deleteTestSeries);               // Delete test series

// Tests within a series
router.post('/:seriesId/tests', addTestToSeries);                           // Add single test
router.post('/:seriesId/tests/bulk', bulkAddTestsToSeries);                 // Add multiple tests
router.get('/:seriesId/tests/:testId', getTestInSeries);                    // Get specific test
router.put('/:seriesId/tests/:testId', updateTestInSeries);                 // Update test
router.delete('/:seriesId/tests/:testId', deleteTestFromSeries);            // Delete test

// Test instructions
router.put('/:seriesId/tests/:testId/instructions', updateTestInstructions); // Update instructions

// Test explanation video
router.post('/:seriesId/tests/:testId/explanation-video', updateTestExplanationVideo); // Add video

// Sections within a test
router.post('/:seriesId/tests/:testId/sections', addSectionToTest);                     // Add section
router.put('/:seriesId/tests/:testId/sections/:sectionId', updateSectionInTest);        // Update section
router.delete('/:seriesId/tests/:testId/sections/:sectionId', deleteSectionFromTest);   // Delete section

// Questions within a section
router.post('/:seriesId/tests/:testId/sections/:sectionId/questions', addQuestionToSection); // Add questions
router.put('/:seriesId/tests/:testId/sections/:sectionId/questions/:questionId', updateQuestionInSection); // Update question
router.delete('/:seriesId/tests/:testId/sections/:sectionId/questions/:questionId', deleteQuestionFromSection); // Delete question

// Cutoff management
router.post('/:seriesId/tests/:testId/cutoff', setCutoff);        // Set cutoff
router.get('/:seriesId/tests/:testId/cutoff', getCutoff);         // Get cutoff
router.put('/:seriesId/tests/:testId/cutoff', updateCutoff);      // Update cutoff
router.delete('/:seriesId/tests/:testId/cutoff', deleteCutoff);   // Delete cutoff

// Participants data
router.get('/:seriesId/tests/:testId/participants', getParticipants); // Get all participants

module.exports = router;
```

### User Routes

**File:** `src/routes/User/testSeriesRoutes.js`

```javascript
const express = require('express');
const router = express.Router();

// Base URL: /api/v1/test-series

// Public access routes
router.get('/filters', listTestSeries);                                  // List with filters
router.get('/public/:seriesId/tests/:testId', getPublicTestInSeriesPublic); // Public test access

// Authenticated routes
router.get('/', listPublicTestSeries);                                   // List test series
router.get('/:seriesId', getPublicTestSeriesById);                       // Get series details
router.get('/:seriesId/tests/:testId', getPublicTestInSeries);           // Get test details

module.exports = router;
```

### Test Attempt Routes

**File:** `src/routes/User/testAttemptRoutes.js`

```javascript
const express = require('express');
const router = express.Router();

// Base URL: /api/v1/test-attempts

// Test attempt operations
router.post('/:seriesId/:testId/start', startTest);                            // Start test
router.post('/:seriesId/:testId/submit-question', submitAnswer);               // Submit answer
router.post('/:seriesId/:testId/submit', submitTest);                          // Submit test
router.get('/:attemptId/questions', getLiveQuestions);                         // Get live questions (NEW)
router.get('/:attemptId/question-paper', getQuestionPaper);                    // Get question paper (NEW)
router.get('/:attemptId/result', getResultAnalysis);                           // Get result analysis
router.get('/my-attempts', getUserTestAttempts);                               // Get user attempts
router.get('/:seriesId/:testId/leaderboard', getLeaderboard);                  // Get leaderboard

module.exports = router;
```

## Controllers

### Admin TestSeries Controller

**File:** `src/controllers/Admin/testSeriesController.js`

#### Key Functions:

1. **createTestSeries** - Creates a new test series with validation
2. **getTestSeriesList** - Lists all test series with filtering
3. **getTestSeriesById** - Gets detailed information for a single test series
4. **updateTestSeries** - Updates test series details
5. **deleteTestSeries** - Deletes a test series
6. **addTestToSeries** - Adds a single test to a series
7. **bulkAddTestsToSeries** - Adds multiple tests at once
8. **updateTestInSeries** - Updates test details
9. **deleteTestFromSeries** - Removes a test from series
10. **updateTestInstructions** - Updates test instructions
11. **updateTestExplanationVideo** - Adds/updates explanation video
12. **addSectionToTest** - Adds a section to a test
13. **updateSectionInTest** - Updates section details
14. **deleteSectionFromTest** - Removes a section
15. **addQuestionToSection** - Adds questions to a section
16. **updateQuestionInSection** - Updates question details
17. **deleteQuestionFromSection** - Removes a question

### User TestSeries Controller

**File:** `src/controllers/User/testSeriesPublicController.js`

#### Key Functions:

1. **listPublicTestSeries** - Lists available test series for users
2. **getPublicTestSeriesById** - Gets public test series details
3. **getPublicTestInSeries** - Gets test details for authenticated users
4. **getPublicTestInSeriesPublic** - Gets test details for public access
5. **listTestSeries** - Lists test series with filtering (matches course format)

### Test Attempt Controller

**File:** `src/controllers/User/testAttemptController.js`

#### Key Functions:

1. **startTest** - Starts a new test attempt
   - Validates user access
   - Checks test timing
   - Prevents duplicate attempts
   - Creates new attempt record

2. **submitAnswer** - Submits an answer to a question (ENHANCED)
   - Validates question existence
   - Computes correctness
   - Updates response atomically
   - Handles time tracking
   - Supports marking for review
   - Allows clearing responses

3. **submitTest** - Submits the complete test
   - Validates all answers
   - Calculates score and accuracy
   - Updates ranking asynchronously
   - Marks result as generated

4. **getLiveQuestions** - Gets exam-safe questions for active attempt (NEW)
   - Returns questions without correct answers
   - Includes attempt status (ANSWERED/MARKED/UNVISITED)
   - Provides real-time remaining time
   - Generates question palette statistics

5. **getQuestionPaper** - Gets lightweight question list (NEW)
   - Returns question numbers and basic info
   - Supports section filtering
   - Optimized for question paper view

6. **getResultAnalysis** - Gets detailed result analysis
   - Section-wise performance
   - Question-wise report
   - Strength/weakness analysis
   - Cutoff comparison

7. **getUserTestAttempts** - Gets user's test history
8. **getLeaderboard** - Gets test leaderboard

### Test Attempt Admin Controller

**File:** `src/controllers/Admin/testAttemptController.js`

const TestSeries = require('../../models/TestSeries/TestSeries');
const Category = require('../../models/Course/Category');
const SubCategory = require('../../models/Course/SubCategory');
const Language = require('../../models/Course/Language');
const cloudinary = require('../../config/cloudinary');

// Helper function to escape regex special characters
const escapeRegex = (s) => s.replace(/[.*+?^${}()|\[\]\\]/g, '\\$&');

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

// Create Test Series (basic info + noOfTests)
exports.createTestSeries = async (req, res) => {
  try {
    let {
      date,
      categoryIds = [],
      subCategoryIds = [],
      name,
      noOfTests,
      description,
      originalPrice = 0,
      discountType,
      discountValue,
      discountValidUntil,
      language,
      validity
    } = req.body;

    // Parse categoryIds if it's a JSON string
    if (typeof categoryIds === 'string') {
      try {
        categoryIds = JSON.parse(categoryIds);
      } catch (e) {
        // If parsing fails, treat as a single ID
        categoryIds = [categoryIds];
      }
    }

    // Parse subCategoryIds if it's a JSON string
    if (typeof subCategoryIds === 'string') {
      try {
        subCategoryIds = JSON.parse(subCategoryIds);
      } catch (e) {
        // If parsing fails, treat as a single ID
        subCategoryIds = [subCategoryIds];
      }
    }

    // Ensure categoryIds and subCategoryIds are arrays
    if (!Array.isArray(categoryIds)) {
      categoryIds = [categoryIds];
    }
    
    if (!Array.isArray(subCategoryIds)) {
      subCategoryIds = [subCategoryIds];
    }

    // Parse languages if it's a JSON string
    if (typeof language === 'string') {
      try {
        language = JSON.parse(language);
      } catch (e) {
        // If parsing fails, treat as a single ID
        language = [language];
      }
    }
    
    // Ensure languages is an array
    if (language && !Array.isArray(language)) {
      language = [language];
    }

    // Parse validity if it's a JSON string
    if (typeof validity === 'string') {
      try {
        validity = JSON.parse(validity);
      } catch (e) {
        // Keep as is if parsing fails
      }
    }

    if (!name) {
      return res.status(400).json({ 
        success: false,
        message: 'Test Series name is required' 
      });
    }

    if (typeof noOfTests === 'undefined' || noOfTests <= 0) {
      return res.status(400).json({ 
        success: false,
        message: 'noOfTests (number of tests) must be greater than 0' 
      });
    }

    // Validate price
    if (originalPrice < 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Price cannot be negative' 
      });
    }

    // Process and validate discount if provided
    let discountData = {
      type: null,
      value: 0,
      validUntil: null
    };

    // In createTestSeries function
if (discountType !== undefined && discountType !== '') {
  try {
    if (discountType === null || discountType === '') {
      // Keep default empty discount
    } else {
      if (!['percentage', 'fixed'].includes(discountType)) {
        throw new Error('Invalid discount type. Must be "percentage" or "fixed"');
      }
      
      // Ensure value is properly converted to a number
      const value = discountValue !== undefined ? Number(discountValue) : 0;
      if (isNaN(value) || value < 0) {
        throw new Error('Discount value must be a positive number');
      }

      if (discountType === 'percentage' && value > 100) {
        throw new Error('Percentage discount cannot exceed 100%');
      }

      const validUntil = discountValidUntil ? new Date(discountValidUntil) : null;
      if (validUntil && validUntil < new Date()) {
        throw new Error('Discount expiry date must be in the future');
      }

      discountData = {
        type: discountType,
        value: value,  // This is now guaranteed to be a number
        validUntil: validUntil
      };
    }
  } catch (error) {
    return res.status(400).json({ 
      success: false,
      message: `Invalid discount: ${error.message}` 
    });
  }
}

    const thumbnail = req.file ? req.file.path : undefined;

    const series = await TestSeries.create({
      date,
      categories: Array.isArray(categoryIds) ? categoryIds.filter(id => id && id !== 'null' && id !== 'undefined') : [categoryIds].filter(Boolean),
      subCategories: Array.isArray(subCategoryIds) ? subCategoryIds.filter(id => id && id !== 'null' && id !== 'undefined') : [subCategoryIds].filter(Boolean),
      name,
      noOfTests,
      description,
      thumbnail,
      originalPrice: Number(originalPrice),
      discount: discountData,
      languages: language && language !== 'null' && language !== 'undefined' ? language : undefined,
      validity: validity && validity !== 'null' && validity !== 'undefined' ? validity : undefined,
      accessType: "PAID"
    });

    return res.status(201).json({
      success: true,
      message: 'Test Series created successfully',
      data: series,
    });
  } catch (error) {
    console.error('Error creating Test Series:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get full Test Series with all tests, sections, and questions (admin overview)
exports.getFullTestSeries = async (req, res) => {
  try {
    const { id } = req.params;

    const series = await TestSeries.findById(id)
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code')
      .populate('validity', 'label durationInDays');

    if (!series) {
      return res.status(404).json({ message: 'Test Series not found' });
    }

    return res.status(200).json({ data: series });
  } catch (error) {
    console.error('Error fetching full Test Series:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get a single Test (with sections and questions) from a Test Series
exports.getTestInSeries = async (req, res) => {
  try {
    const { seriesId, testId } = req.params;

    const series = await TestSeries.findById(seriesId);
    if (!series) {
      return res.status(404).json({ message: 'Test Series not found' });
    }

    const test = series.tests.id(testId);
    if (!test) {
      return res.status(404).json({ message: 'Test not found in this series' });
    }

    return res.status(200).json({ data: test });
  } catch (error) {
    console.error('Error fetching Test from Series:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all Test Series (admin)
exports.getTestSeriesList = async (req, res) => {
  try {
    const { category, subCategory, isActive, minPrice, maxPrice } = req.query;

    const filter = {};
    if (category) filter.categories = category;
    if (subCategory) filter.subCategories = subCategory;
    // Only filter by isActive if explicitly requested
    // If not provided, show all test series (no filter)
    if (typeof isActive !== 'undefined') {
      if (isActive === 'true') {
        // Show active OR documents without isActive field (backward compatibility)
        filter.$or = [
          { isActive: true },
          { isActive: { $exists: false } }
        ];
      } else if (isActive === 'false') {
        filter.isActive = false;
      }
    }
    
    // Add price range filtering if provided
    if (minPrice || maxPrice) {
      filter.originalPrice = {};
      if (minPrice) filter.originalPrice.$gte = Number(minPrice);
      if (maxPrice) filter.originalPrice.$lte = Number(maxPrice);
    }

    console.log('Admin Test Series filter:', JSON.stringify(filter, null, 2));
    
    // Check total count for debugging
    const totalCount = await TestSeries.countDocuments({});
    const filterCount = await TestSeries.countDocuments(filter);
    console.log(`Admin - Total test series in DB: ${totalCount}, Matching filter: ${filterCount}`);

    const seriesList = await TestSeries.find(filter)
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code')
      .populate('validity', 'label durationInDays');

    console.log(`Admin - Found ${seriesList.length} test series`);

    return res.status(200).json({ 
      success: true,
      data: seriesList,
      meta: {
        total: seriesList.length,
        totalInDatabase: totalCount,
        matchingFilter: filterCount
      }
    });
  } catch (error) {
    console.error('Error fetching Test Series list:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get single Test Series
exports.getTestSeriesById = async (req, res) => {
  try {
    const { id } = req.params;

    const series = await TestSeries.findById(id)
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code')
      .populate('validity', 'label durationInDays');

    if (!series) {
      return res.status(404).json({ message: 'Test Series not found' });
    }

    return res.status(200).json({ 
      data: series 
    });
  } catch (error) {
    console.error('Error fetching Test Series:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update Test Series basic details
exports.updateTestSeries = async (req, res) => {
  try {
    const { id } = req.params;
    let {
      date,
      categoryIds,
      subCategoryIds,
      name,
      noOfTests,
      description,
      isActive,
      originalPrice,
      discountType,
      discountValue,
      discountValidUntil,
      language,
      validity
    } = req.body;

    // Parse categoryIds if provided and it's a JSON string
    if (categoryIds && typeof categoryIds === 'string') {
      try {
        categoryIds = JSON.parse(categoryIds);
      } catch (e) {
        // If parsing fails, treat as a single ID
        categoryIds = [categoryIds];
      }
    }

    // Parse subCategoryIds if provided and it's a JSON string
    if (subCategoryIds && typeof subCategoryIds === 'string') {
      try {
        subCategoryIds = JSON.parse(subCategoryIds);
      } catch (e) {
        // If parsing fails, treat as a single ID
        subCategoryIds = [subCategoryIds];
      }
    }

    // Ensure categoryIds and subCategoryIds are arrays if provided
    if (categoryIds && !Array.isArray(categoryIds)) {
      categoryIds = [categoryIds];
    }
    
    if (subCategoryIds && !Array.isArray(subCategoryIds)) {
      subCategoryIds = [subCategoryIds];
    }

    // Parse languages if provided and it's a JSON string
    if (language && typeof language === 'string') {
      try {
        language = JSON.parse(language);
      } catch (e) {
        // If parsing fails, treat as a single ID
        language = [language];
      }
    }
    
    // Ensure languages is an array
    if (language && !Array.isArray(language)) {
      language = [language];
    }

    // Parse validity if provided and it's a JSON string
    if (validity && typeof validity === 'string') {
      try {
        validity = JSON.parse(validity);
      } catch (e) {
        // Keep as is if parsing fails
      }
    }

    const updates = {};

    if (date) updates.date = date;
    if (categoryIds) updates.categories = Array.isArray(categoryIds) ? categoryIds.filter(id => id && id !== 'null' && id !== 'undefined') : [categoryIds].filter(Boolean);
    if (subCategoryIds) updates.subCategories = Array.isArray(subCategoryIds) ? subCategoryIds.filter(id => id && id !== 'null' && id !== 'undefined') : [subCategoryIds].filter(Boolean);
    if (name) updates.name = name;
    if (typeof noOfTests !== 'undefined') updates.noOfTests = noOfTests;
    if (typeof description !== 'undefined') updates.description = description;
    if (typeof isActive !== 'undefined') updates.isActive = isActive;
    if (typeof accessType !== 'undefined') updates.accessType = accessType;
    if (typeof language !== 'undefined') updates.languages = language && language !== 'null' && language !== 'undefined' ? language : undefined;
    if (typeof validity !== 'undefined') updates.validity = validity && validity !== 'null' && validity !== 'undefined' ? validity : undefined;
    
    // Handle price update
    if (typeof originalPrice !== 'undefined') {
      if (originalPrice < 0) {
        return res.status(400).json({ 
          success: false,
          message: 'Price cannot be negative' 
        });
      }
      updates.originalPrice = Number(originalPrice);
    }

    // Process and validate discount if provided
    // In updateTestSeries function
if (discountType !== undefined) {
  try {
    // Handle case when discount should be removed
    if (discountType === '' || discountType === null) {
      updates.discount = {
        type: null,
        value: 0,
        validUntil: null
      };
    } else {
      // Validate discount type
      if (!['percentage', 'fixed'].includes(discountType)) {
        throw new Error('Invalid discount type. Must be "percentage" or "fixed"');
      }
      
      // Ensure value is properly converted to a number
      const value = discountValue !== undefined ? Number(discountValue) : 0;
      if (isNaN(value) || value < 0) {
        throw new Error('Discount value must be a positive number');
      }

      if (discountType === 'percentage' && value > 100) {
        throw new Error('Percentage discount cannot exceed 100%');
      }

      // Parse and validate validUntil date
      const validUntil = discountValidUntil ? new Date(discountValidUntil) : null;
      if (validUntil && validUntil < new Date()) {
        throw new Error('Discount expiry date must be in the future');
      }

      updates.discount = {
        type: discountType,
        value: value,  // This is now guaranteed to be a number
        validUntil: validUntil
      };
    }
  } catch (error) {
    return res.status(400).json({ 
      success: false,
      message: `Invalid discount: ${error.message}` 
    });
  }
}

    if (req.file) {
      updates.thumbnail = req.file.path;
    }

    const series = await TestSeries.findById(id);
    if (!series) {
      return res.status(404).json({ 
        success: false,
        message: 'Test Series not found' 
      });
    }

    // Apply updates to the document
    Object.keys(updates).forEach(key => {
      series[key] = updates[key];
    });

    // Save the document to trigger the pre-save hook for finalPrice calculation
    await series.save();

    // Populate the references
    await series.populate([
      { path: 'categories', select: 'name slug' },
      { path: 'subCategories', select: 'name slug' },
      { path: 'languages', select: 'name code' },
      { path: 'validity', select: 'label durationInDays' }
    ]);

    if (!series) {
      return res.status(404).json({ 
        success: false,
        message: 'Test Series not found' 
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Test Series updated successfully',
      data: series,
    });
  } catch (error) {
    console.error('Error updating Test Series:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Delete Test Series
exports.deleteTestSeries = async (req, res) => {
  try {
    const { id } = req.params;

    const series = await TestSeries.findByIdAndDelete(id);
    if (!series) {
      return res.status(404).json({ message: 'Test Series not found' });
    }

    return res.status(200).json({ message: 'Test Series deleted successfully' });
  } catch (error) {
    console.error('Error deleting Test Series:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add a Test to a Test Series
exports.addTestToSeries = async (req, res) => {
  try {
    const { seriesId } = req.params;
    const {
      testName,
      noOfQuestions,
      totalMarks,
      positiveMarks,
      negativeMarks,
      date,
      startTime,
      endTime,
    } = req.body;

    const series = await TestSeries.findById(seriesId);

    if (!series) {
      return res.status(404).json({ message: 'Test Series not found' });
    }

    if (series.tests.length >= series.noOfTests) {
      return res.status(400).json({
        message:
          'Cannot add more tests. You have reached the maximum number of tests for this series.',
      });
    }

    // Set isFree to true for the first two tests, false for others
    // The new test will be at position series.tests.length (0-indexed)
    const isFree = series.tests.length < 2;
    
    const newTest = {
      testName,
      noOfQuestions,
      totalMarks,
      positiveMarks,
      negativeMarks,
      date,
      startTime,
      endTime,
      isFree
    };

    series.tests.push(newTest);
    
    await series.save();

    return res.status(201).json({
      message: 'Test added to series successfully',
      data: series,
    });
  } catch (error) {
    console.error('Error adding Test to Series:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add multiple Tests to a Test Series (Bulk Upload)
exports.bulkAddTestsToSeries = async (req, res) => {
  try {
    const { seriesId } = req.params;
    const { tests } = req.body;

    const series = await TestSeries.findById(seriesId);

    if (!series) {
      return res.status(404).json({ message: 'Test Series not found' });
    }

    // Validate tests array
    if (!Array.isArray(tests) || tests.length === 0) {
      return res.status(400).json({
        message: 'Tests array is required and cannot be empty'
      });
    }

    // Check if adding these tests would exceed noOfTests limit
    if (series.tests.length + tests.length > series.noOfTests) {
      return res.status(400).json({
        message: `Cannot add ${tests.length} tests. You would exceed the maximum number of tests (${series.noOfTests}) for this series.`
      });
    }

    // Add all tests
    for (let i = 0; i < tests.length; i++) {
      const test = tests[i];
      
      // Skip isFree field to prevent manual override
      const { isFree: originalIsFree, ...testData } = test;
      
      // Set isFree to true for the first two tests, false for others
      const calculatedIsFree = series.tests.length < 2;
      
      const newTest = {
        ...testData,
        isFree: calculatedIsFree
      };
      
      series.tests.push(newTest);
    }

    await series.save();

    return res.status(201).json({
      message: `${tests.length} tests added to series successfully`,
      data: series,
    });
  } catch (error) {
    console.error('Error adding Tests to Series:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update a Test inside a Test Series
exports.updateTestInSeries = async (req, res) => {
  try {
    const { seriesId, testId } = req.params;
    const updates = req.body || {};

    const series = await TestSeries.findById(seriesId);
    if (!series) {
      return res.status(404).json({ message: 'Test Series not found' });
    }

    const test = series.tests.id(testId);
    if (!test) {
      return res.status(404).json({ message: 'Test not found in this series' });
    }

    // Remove isFree from updates to prevent manual override
    const { isFree, ...allowedUpdates } = updates;
    
    Object.keys(allowedUpdates).forEach((key) => {
      test[key] = allowedUpdates[key];
    });

    await series.save();

    return res.status(200).json({
      message: 'Test updated successfully',
      data: series,
    });
  } catch (error) {
    console.error('Error updating Test in Series:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a Test from a Test Series
exports.deleteTestFromSeries = async (req, res) => {
  try {
    const { seriesId, testId } = req.params;

    const series = await TestSeries.findById(seriesId);
    if (!series) {
      return res.status(404).json({ message: 'Test Series not found' });
    }

    const test = series.tests.id(testId);
    if (!test) {
      return res.status(404).json({ message: 'Test not found in this series' });
    }

    test.remove();
    await series.save();

    return res.status(200).json({
      message: 'Test removed from series successfully',
      data: series,
    });
  } catch (error) {
    console.error('Error deleting Test from Series:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update Instructions for a Test
exports.updateTestInstructions = async (req, res) => {
  try {
    const { seriesId, testId } = req.params;
    const { instructionsPage1, instructionsPage2, instructionsPage3 } = req.body;

    const series = await TestSeries.findById(seriesId);
    if (!series) {
      return res.status(404).json({ message: 'Test Series not found' });
    }

    const test = series.tests.id(testId);
    if (!test) {
      return res.status(404).json({ message: 'Test not found in this series' });
    }

    if (typeof instructionsPage1 !== 'undefined') {
      test.instructionsPage1 = instructionsPage1;
    }
    if (typeof instructionsPage2 !== 'undefined') {
      test.instructionsPage2 = instructionsPage2;
    }
    if (typeof instructionsPage3 !== 'undefined') {
      test.instructionsPage3 = instructionsPage3;
    }

    await series.save();

    return res.status(200).json({
      message: 'Test instructions updated successfully',
      data: series,
    });
  } catch (error) {
    console.error('Error updating Test instructions:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add / Update Explanation Video for a Test
exports.updateTestExplanationVideo = async (req, res) => {
  try {
    const { seriesId, testId } = req.params;

    const series = await TestSeries.findById(seriesId);
    if (!series) {
      return res.status(404).json({ message: 'Test Series not found' });
    }

    const test = series.tests.id(testId);
    if (!test) {
      return res.status(404).json({ message: 'Test not found in this series' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Explanation video file is required' });
    }

    // Upload video buffer to Cloudinary
    const uploadResult = await uploadToCloudinary(
      req.file.buffer,
      'brainbuzz/test-series/explanations',
      'video'
    );

    test.totalExplanationVideoUrl = uploadResult.secure_url;

    // Ensure Mongoose persists nested change
    series.markModified('tests');

    await series.save();

    return res.status(200).json({
      message: 'Test explanation video updated successfully',
      data: series,
    });
  } catch (error) {
    console.error('Error updating Test explanation video:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add Section to a Test
exports.addSectionToTest = async (req, res) => {
  try {
    const { seriesId, testId } = req.params;
    const { title, order, noOfQuestions } = req.body;

    const series = await TestSeries.findById(seriesId);
    if (!series) {
      return res.status(404).json({ message: 'Test Series not found' });
    }

    const test = series.tests.id(testId);
    if (!test) {
      return res.status(404).json({ message: 'Test not found in this series' });
    }

    const newSection = {
      title,
      order,
      noOfQuestions,
    };

    test.sections.push(newSection);
    await series.save();

    return res.status(201).json({
      message: 'Section added to test successfully',
      data: series,
    });
  } catch (error) {
    console.error('Error adding Section to Test:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update Section in a Test
exports.updateSectionInTest = async (req, res) => {
  try {
    const { seriesId, testId, sectionId } = req.params;
    const updates = req.body || {};

    const series = await TestSeries.findById(seriesId);
    if (!series) {
      return res.status(404).json({ message: 'Test Series not found' });
    }

    const test = series.tests.id(testId);
    if (!test) {
      return res.status(404).json({ message: 'Test not found in this series' });
    }

    const section = test.sections.id(sectionId);
    if (!section) {
      return res.status(404).json({ message: 'Section not found in this test' });
    }

    Object.keys(updates).forEach((key) => {
      section[key] = updates[key];
    });

    await series.save();

    return res.status(200).json({
      message: 'Section updated successfully',
      data: series,
    });
  } catch (error) {
    console.error('Error updating Section in Test:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete Section from a Test
exports.deleteSectionFromTest = async (req, res) => {
  try {
    const { seriesId, testId, sectionId } = req.params;

    const series = await TestSeries.findById(seriesId);
    if (!series) {
      return res.status(404).json({ message: 'Test Series not found' });
    }

    const test = series.tests.id(testId);
    if (!test) {
      return res.status(404).json({ message: 'Test not found in this series' });
    }

    const section = test.sections.id(sectionId);
    if (!section) {
      return res.status(404).json({ message: 'Section not found in this test' });
    }

    section.remove();
    await series.save();

    return res.status(200).json({
      message: 'Section removed from test successfully',
      data: series,
    });
  } catch (error) {
    console.error('Error deleting Section from Test:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add Question(s) to a Section
exports.addQuestionToSection = async (req, res) => {
  try {
    const { seriesId, testId, sectionId } = req.params;

    const series = await TestSeries.findById(seriesId);
    if (!series) {
      return res.status(404).json({ message: 'Test Series not found' });
    }

    const test = series.tests.id(testId);
    if (!test) {
      return res.status(404).json({ message: 'Test not found in this series' });
    }

    const section = test.sections.id(sectionId);
    if (!section) {
      return res.status(404).json({ message: 'Section not found in this test' });
    }

    // Support both single question payload and an array of questions
    let questionsPayload = [];

    if (Array.isArray(req.body.questions)) {
      questionsPayload = req.body.questions;
    } else {
      const {
        questionNumber,
        questionText,
        options = [],
        correctOptionIndex,
        explanation,
        marks,
        negativeMarks,
      } = req.body;

      if (!questionText) {
        return res
          .status(400)
          .json({ message: 'questionText is required when adding a question' });
      }

      questionsPayload = [
        {
          questionNumber,
          questionText,
          options,
          correctOptionIndex,
          explanation,
          marks,
          negativeMarks,
        },
      ];
    }

    // Enforce noOfQuestions limit for the section if set
    const currentCount = section.questions.length;
    const incomingCount = questionsPayload.length;

    if (
      typeof section.noOfQuestions === 'number' &&
      section.noOfQuestions > 0 &&
      currentCount + incomingCount > section.noOfQuestions
    ) {
      return res.status(400).json({
        message:
          'Cannot add questions: total questions would exceed the configured noOfQuestions for this section.',
        details: {
          noOfQuestions: section.noOfQuestions,
          currentCount,
          incomingCount,
        },
      });
    }

    // Check for duplicate question numbers
    const existingQuestionNumbers = section.questions.map(q => q.questionNumber);
    const newQuestionNumbers = questionsPayload.map(q => q.questionNumber);
    
    // Check if any new question numbers already exist
    const duplicates = newQuestionNumbers.filter(num => existingQuestionNumbers.includes(num));
    if (duplicates.length > 0) {
      return res.status(400).json({
        message: 'Duplicate question numbers found in section',
        duplicates
      });
    }
    
    // Check if new question numbers have duplicates among themselves
    const duplicateInNew = newQuestionNumbers.filter((num, index) => newQuestionNumbers.indexOf(num) !== index);
    if (duplicateInNew.length > 0) {
      return res.status(400).json({
        message: 'Duplicate question numbers found in the new questions',
        duplicates: duplicateInNew
      });
    }

    questionsPayload.forEach((q) => {
      section.questions.push({
        questionNumber: q.questionNumber,
        questionText: q.questionText,
        options: q.options || [],
        correctOptionIndex: q.correctOptionIndex,
        explanation: q.explanation,
        marks: q.marks,
        negativeMarks: q.negativeMarks,
      });
    });

    await series.save();

    return res.status(201).json({
      message: 'Question(s) added to section successfully',
      data: series,
    });
  } catch (error) {
    console.error('Error adding Question to Section:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update Question in a Section
exports.updateQuestionInSection = async (req, res) => {
  try {
    const { seriesId, testId, sectionId, questionId } = req.params;
    const updates = req.body || {};

    const series = await TestSeries.findById(seriesId);
    if (!series) {
      return res.status(404).json({ message: 'Test Series not found' });
    }

    const test = series.tests.id(testId);
    if (!test) {
      return res.status(404).json({ message: 'Test not found in this series' });
    }

    const section = test.sections.id(sectionId);
    if (!section) {
      return res.status(404).json({ message: 'Section not found in this test' });
    }

    const question = section.questions.id(questionId);
    if (!question) {
      return res.status(404).json({ message: 'Question not found in this section' });
    }

    Object.keys(updates).forEach((key) => {
      question[key] = updates[key];
    });

    await series.save();

    return res.status(200).json({
      message: 'Question updated successfully',
      data: series,
    });
  } catch (error) {
    console.error('Error updating Question in Section:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete Question from a Section
exports.deleteQuestionFromSection = async (req, res) => {
  try {
    const { seriesId, testId, sectionId, questionId } = req.params;

    const series = await TestSeries.findById(seriesId);
    if (!series) {
      return res.status(404).json({ message: 'Test Series not found' });
    }

    const test = series.tests.id(testId);
    if (!test) {
      return res.status(404).json({ message: 'Test not found in this series' });
    }

    const section = test.sections.id(sectionId);
    if (!section) {
      return res.status(404).json({ message: 'Section not found in this test' });
    }

    // Use pull method to remove the question by its ID
    section.questions.pull(questionId);
    await series.save();

    return res.status(200).json({
      message: 'Question removed from section successfully',
      data: series,
    });
  } catch (error) {
    console.error('Error deleting Question from Section:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get distinct categories for test series (admin - shows all test series regardless of active status)
exports.getTestSeriesCategories = async (req, res) => {
  try {
    // Find test series (including inactive) and get distinct categories
    const testSeries = await TestSeries.find({}).populate('categories', 'name slug description thumbnailUrl');

    // Extract unique categories
    const categories = [];
    const categoryIds = new Set();
    
    testSeries.forEach(series => {
      if (series.categories) {
        series.categories.forEach(cat => {
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
    console.error('Error fetching test series categories:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get distinct subcategories for test series based on category and language (admin - shows all test series regardless of active status)
exports.getTestSeriesSubCategories = async (req, res) => {
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

    const testSeries = await TestSeries.find(filter).populate('subCategories', 'name slug description thumbnailUrl');

    // Extract unique subcategories
    const subCategories = [];
    const subCategoryIds = new Set();
    
    testSeries.forEach(series => {
      if (series.subCategories) {
        series.subCategories.forEach(subCat => {
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
    console.error('Error fetching test series subcategories:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};



// Test function to debug course isActive updates
exports.testUpdateCourseActiveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    console.log('Received update request for course:', id);
    console.log('Requested isActive value:', isActive);
    console.log('Type of isActive:', typeof isActive);
    
    // Validate input
    if (typeof isActive === 'undefined') {
      return res.status(400).json({ 
        message: 'isActive field is required', 
        received: req.body 
      });
    }
    
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ 
        message: 'isActive must be a boolean value (true or false)', 
        received: isActive,
        type: typeof isActive
      });
    }
    
    // Find the course
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    console.log('Current course isActive value:', course.isActive);
    
    // Update the course
    course.isActive = isActive;
    const savedCourse = await course.save();
    
    console.log('Updated course isActive value:', savedCourse.isActive);
    
    const populatedCourse = await Course.findById(id)
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code')
      .populate('validities', 'label durationInDays');
    
    return res.status(200).json({
      message: `Course isActive status updated to ${isActive}`,
      data: populatedCourse,
      debug: {
        requestedValue: isActive,
        previousValue: course.isActive,
        updatedValue: savedCourse.isActive
      }
    });
  } catch (error) {
    console.error('Error updating course isActive status:', error);
    return res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};



const Cutoff = require('../../models/TestSeries/Cutoff');
const TestRanking = require('../../models/TestSeries/TestRanking');
const TestAttempt = require('../../models/TestSeries/TestAttempt');
const TestSeries = require('../../models/TestSeries/TestSeries');

// Set Cutoff for Test
exports.setCutoff = async (req, res) => {
  try {
    const { seriesId, testId } = req.params;
    const { general, obc, sc, st } = req.body;

    // Validate that the test series and test exist
    const testSeries = await TestSeries.findById(seriesId);
    if (!testSeries) {
      return res.status(404).json({
        success: false,
        message: 'Test series not found'
      });
    }

    const test = testSeries.tests.id(testId);
    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found in this series'
      });
    }

    // Create or update cutoff
    const cutoff = await Cutoff.findOneAndUpdate(
      { testSeries: seriesId, testId: testId },
      {
        testSeries: seriesId,
        testId: testId,
        cutoff: {
          general: general || 0,
          obc: obc || 0,
          sc: sc || 0,
          st: st || 0
        }
      },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Cutoff set successfully',
      data: cutoff
    });
  } catch (error) {
    console.error('Error setting cutoff:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get Cutoff for Test
exports.getCutoff = async (req, res) => {
  try {
    const { seriesId, testId } = req.params;

    // Validate that the test series and test exist
    const testSeries = await TestSeries.findById(seriesId);
    if (!testSeries) {
      return res.status(404).json({
        success: false,
        message: 'Test series not found'
      });
    }

    const test = testSeries.tests.id(testId);
    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found in this series'
      });
    }

    // Find cutoff
    const cutoff = await Cutoff.findOne({ testSeries: seriesId, testId: testId });
    
    if (!cutoff) {
      return res.status(404).json({
        success: false,
        message: 'Cutoff not found for this test'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Cutoff fetched successfully',
      data: cutoff
    });
  } catch (error) {
    console.error('Error getting cutoff:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Update Cutoff for Test
exports.updateCutoff = async (req, res) => {
  try {
    const { seriesId, testId } = req.params;
    const { general, obc, sc, st } = req.body;

    // Validate that the test series and test exist
    const testSeries = await TestSeries.findById(seriesId);
    if (!testSeries) {
      return res.status(404).json({
        success: false,
        message: 'Test series not found'
      });
    }

    const test = testSeries.tests.id(testId);
    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found in this series'
      });
    }

    // Get existing cutoff to preserve unspecified values
    const existingCutoff = await Cutoff.findOne({ testSeries: seriesId, testId: testId });
    
    if (!existingCutoff) {
      return res.status(404).json({
        success: false,
        message: 'Cutoff not found for this test'
      });
    }

    // Build update object with only provided values
    const updateFields = {};
    if (general !== undefined) updateFields['cutoff.general'] = general;
    if (obc !== undefined) updateFields['cutoff.obc'] = obc;
    if (sc !== undefined) updateFields['cutoff.sc'] = sc;
    if (st !== undefined) updateFields['cutoff.st'] = st;

    // Update cutoff with only provided fields
    const cutoff = await Cutoff.findOneAndUpdate(
      { testSeries: seriesId, testId: testId },
      { $set: updateFields },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Cutoff updated successfully',
      data: cutoff
    });
  } catch (error) {
    console.error('Error updating cutoff:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Delete Cutoff for Test
exports.deleteCutoff = async (req, res) => {
  try {
    const { seriesId, testId } = req.params;

    // Validate that the test series and test exist
    const testSeries = await TestSeries.findById(seriesId);
    if (!testSeries) {
      return res.status(404).json({
        success: false,
        message: 'Test series not found'
      });
    }

    const test = testSeries.tests.id(testId);
    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found in this series'
      });
    }

    // Delete cutoff
    const cutoff = await Cutoff.findOneAndDelete({ testSeries: seriesId, testId: testId });
    
    if (!cutoff) {
      return res.status(404).json({
        success: false,
        message: 'Cutoff not found for this test'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Cutoff deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting cutoff:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// View all participants score, rank, accuracy
exports.getParticipants = async (req, res) => {
  try {
    const { seriesId, testId } = req.params;
    
    // Validate that the test series and test exist
    const testSeries = await TestSeries.findById(seriesId);
    if (!testSeries) {
      return res.status(404).json({
        success: false,
        message: 'Test series not found'
      });
    }

    const test = testSeries.tests.id(testId);
    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found in this series'
      });
    }

    // Check if result publish time has passed
    if (test.resultPublishTime && new Date() < new Date(test.resultPublishTime)) {
      return res.status(400).json({
        success: false,
        message: 'Test result not yet published'
      });
    }

    // Get all rankings for this test
    const rankings = await TestRanking.find({ testId: testId })
      .populate('user', 'name email')
      .sort({ rank: 1 });

    // Get additional details for each participant
    const participants = await Promise.all(rankings.map(async (ranking) => {
      // Get the test attempt for additional details
      const attempt = await TestAttempt.findOne({
        user: ranking.user._id,
        testSeries: seriesId,
        testId: testId
      });

      return {
        userId: ranking.user._id,
        userName: ranking.user.name,
        userEmail: ranking.user.email,
        score: ranking.score,
        rank: ranking.rank,
        accuracy: ranking.accuracy,
        totalParticipants: ranking.totalParticipants,
        correct: attempt ? attempt.correct : 0,
        incorrect: attempt ? attempt.incorrect : 0,
        unattempted: attempt ? attempt.unattempted : 0,
        speed: attempt ? attempt.speed : 0
      };
    }));

    return res.status(200).json({
      success: true,
      message: 'Participants fetched successfully',
      data: participants
    });
  } catch (error) {
    console.error('Error getting participants:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};



const TestSeries = require('../src/models/TestSeries/TestSeries');
const Purchase = require('../src/models/Purchase/Purchase');
const TestAttempt = require('../src/models/TestSeries/TestAttempt');

class TestSeriesAccessService {
  /**
   * Get comprehensive access information for a user and test series
   */
  static async getAccessInfo(userId, testSeriesId) {
    if (!userId || !testSeriesId) {
      return {
        hasAccess: false,
        isValid: false,
        purchase: null,
        expiryDate: null
      };
    }

    try {
      // Check newer Purchase model first
      const purchase = await Purchase.findOne({
        user: userId,
        "items.itemId": testSeriesId,
        "items.itemType": "test_series"
      });

      if (purchase) {
        // Check if purchase is valid based on validity period
        const isValid = this.validatePurchase(purchase, testSeriesId);
        const expiryDate = this.calculateExpiryDate(purchase, testSeriesId);

        return {
          hasAccess: true,
          isValid,
          purchase,
          expiryDate
        };
      }

      // Fallback to legacy TestSeriesPurchase model if newer model doesn't have it
      const LegacyTestSeriesPurchase = require('../src/models/TestSeries/TestSeriesPurchase');
      const legacyPurchase = await LegacyTestSeriesPurchase.findOne({
        user: userId,
        testSeries: testSeriesId
      });

      if (legacyPurchase) {
        // Check if legacy purchase is valid
        const isValid = this.validateLegacyPurchase(legacyPurchase);
        const expiryDate = legacyPurchase.expiryDate;

        return {
          hasAccess: true,
          isValid,
          purchase: legacyPurchase,
          expiryDate
        };
      }

      // No purchase found
      return {
        hasAccess: false,
        isValid: false,
        purchase: null,
        expiryDate: null
      };
    } catch (error) {
      console.error('Error checking Test Series access:', error);
      return {
        hasAccess: false,
        isValid: false,
        purchase: null,
        expiryDate: null
      };
    }
  }

  /**
   * Check if user has access to a specific test within a series
   */
  static async hasTestAccess(userId, seriesId, testId) {
    if (!userId || !seriesId || !testId) {
      return false;
    }

    try {
      // Get the test series to check free quota
      const testSeries = await TestSeries.findById(seriesId);
      if (!testSeries) {
        return false;
      }

      // Find the test index to check if it's within free quota
      const testIndex = testSeries.tests.findIndex(t => t._id.toString() === testId);
      const isTestFree = testIndex < (testSeries.freeQuota || 2);

      // If it's a free test, grant access
      if (isTestFree) {
        return true;
      }

      // Check if user has purchased the test series
      const accessInfo = await this.getAccessInfo(userId, seriesId);
      return accessInfo.hasAccess && accessInfo.isValid;
    } catch (error) {
      console.error('Error checking test access:', error);
      return false;
    }
  }

  /**
   * Check if user has access to a test series (simplified method)
   */
  static async hasSeriesAccess(userId, seriesId) {
    if (!userId || !seriesId) {
      return false;
    }

    try {
      // Check if it's a free series
      const testSeries = await TestSeries.findById(seriesId);
      if (!testSeries) {
        return false;
      }

      if (testSeries.accessType === "FREE") {
        return true;
      }

      // Check if user has purchased the series
      const accessInfo = await this.getAccessInfo(userId, seriesId);
      return accessInfo.hasAccess && accessInfo.isValid;
    } catch (error) {
      console.error('Error checking series access:', error);
      return false;
    }
  }

  /**
   * Check if user has an active attempt for a specific test
   */
  static async hasActiveAttempt(userId, seriesId, testId) {
    if (!userId || !seriesId || !testId) {
      return false;
    }

    try {
      const activeAttempt = await TestAttempt.findOne({
        user: userId,
        testSeries: seriesId,
        testId: testId,
        resultGenerated: { $ne: true }  // Only check for non-completed attempts
      });

      return !!activeAttempt;
    } catch (error) {
      console.error('Error checking active attempt:', error);
      return false;
    }
  }

  /**
   * Check if user has completed a specific test
   */
  static async hasCompletedTest(userId, seriesId, testId) {
    if (!userId || !seriesId || !testId) {
      return false;
    }

    try {
      const completedAttempt = await TestAttempt.findOne({
        user: userId,
        testSeries: seriesId,
        testId: testId,
        resultGenerated: true
      });

      return !!completedAttempt;
    } catch (error) {
      console.error('Error checking completed test:', error);
      return false;
    }
  }

  /**
   * Validate a purchase based on validity period
   */
  static validatePurchase(purchase, testSeriesId) {
    if (!purchase) return false;

    // Check if purchase is for the correct test series
    const item = purchase.items.find(item => 
      item.itemId.toString() === testSeriesId.toString() && 
      item.itemType === 'test_series'
    );
    
    if (!item) return false;

    // If there's no validity period, assume it's always valid
    if (!purchase.validityPeriod) {
      return true;
    }

    // Check if purchase is still within validity period
    const purchaseDate = new Date(purchase.createdAt);
    const validityDays = purchase.validityPeriod.durationInDays;
    const expiryDate = new Date(purchaseDate.getTime() + (validityDays * 24 * 60 * 60 * 1000));

    return new Date() <= expiryDate;
  }

  /**
   * Calculate expiry date for a purchase
   */
  static calculateExpiryDate(purchase, testSeriesId) {
    if (!purchase) return null;

    // Check if purchase is for the correct test series
    const item = purchase.items.find(item => 
      item.itemId.toString() === testSeriesId.toString() && 
      item.itemType === 'test_series'
    );
    
    if (!item) return null;

    if (!purchase.validityPeriod) {
      return null; // No expiry
    }

    const purchaseDate = new Date(purchase.createdAt);
    const validityDays = purchase.validityPeriod.durationInDays;
    return new Date(purchaseDate.getTime() + (validityDays * 24 * 60 * 60 * 1000));
  }

  /**
   * Validate legacy purchase
   */
  static validateLegacyPurchase(legacyPurchase) {
    if (!legacyPurchase) return false;

    // Check if legacy purchase has expired
    if (legacyPurchase.expiryDate && new Date() > new Date(legacyPurchase.expiryDate)) {
      return false;
    }

    return true;
  }
}

module.exports = TestSeriesAccessService;


user Controllers Code : 
// controllers/User/testSeriesPublicController.js
const TestSeries = require('../../models/TestSeries/TestSeries');
const TestSeriesPurchase = require('../../models/TestSeries/TestSeriesPurchase');
const User = require('../../models/User/User');
const { PurchaseService } = require('../../../services');


// Helper to check if user has access to a test series
const checkTestSeriesAccess = async (userId, seriesId) => {
  if (!userId) return false;
  
  // Use the unified TestSeriesAccessService
  const { TestSeriesAccessService } = require('../../../services');
  const accessInfo = await TestSeriesAccessService.getAccessInfo(userId, seriesId);
  
  return accessInfo.hasAccess && accessInfo.isValid;
};

// Helper function to calculate finalPrice from originalPrice and discount
const calculateFinalPrice = (originalPrice, discount) => {
  if (!discount || !discount.type) return originalPrice;
  
  let finalPrice = originalPrice;
  
  if (discount.type === 'percentage') {
    finalPrice = originalPrice - (originalPrice * discount.value) / 100;
  } else if (discount.type === 'fixed') {
    finalPrice = originalPrice - discount.value;
  }
  
  return Math.max(finalPrice, 0);
};

// Helper to determine test state based on timing
const getTestState = (test) => {
  const now = new Date();
  
  // If no timing information, return unknown state
  if (!test.startTime || !test.endTime) {
    return 'unknown';
  }
  
  const startTime = new Date(test.startTime);
  const endTime = new Date(test.endTime);
  const resultPublishTime = test.resultPublishTime ? new Date(test.resultPublishTime) : null;
  
  // Before startTime
  if (now < startTime) {
    return 'upcoming';
  }
  
  // During test
  if (now >= startTime && now <= endTime) {
    return 'live';
  }
  
  // After endTime but before resultPublishTime
  if (resultPublishTime && now > endTime && now < resultPublishTime) {
    return 'result_pending';
  }
  
  // After resultPublishTime or if no resultPublishTime, after endTime
  if (!resultPublishTime || now >= resultPublishTime) {
    return 'results_available';
  }
  
  return 'unknown';
};

// List all test series (public)
exports.listPublicTestSeries = async (req, res) => {
  try {
    const { category, subCategory, lang } = req.query;
    const userId = req.user?._id;
    const userRole = req.user?.role;

    // Filter: include documents where isActive is true OR isActive doesn't exist (for backward compatibility)
    // Also filter by contentType to ensure proper isolation
    const filter = {
      contentType: 'TEST_SERIES',
      $or: [
        { isActive: true },
        { isActive: { $exists: false } }
      ]
    };
    if (category) filter.categories = category;
    if (subCategory) filter.subCategories = subCategory;
    
    // Handle language filtering by finding Language documents with the specified code
    if (lang) {
      // We'll handle language filtering after fetching the documents since languages is an array of ObjectIds
      // and we need to match against the code field in the Language model
    }

    console.log('Test Series filter:', JSON.stringify(filter, null, 2));
    
    // First, check total count of test series (for debugging)
    const totalCount = await TestSeries.countDocuments({ contentType: 'TEST_SERIES' });
    const activeCount = await TestSeries.countDocuments({ 
      contentType: 'TEST_SERIES',
      $or: [
        { isActive: true },
        { isActive: { $exists: false } }
      ]
    });
    const inactiveCount = await TestSeries.countDocuments({ 
      contentType: 'TEST_SERIES',
      isActive: false 
    });
    console.log(`Total test series in DB: ${totalCount}, Active/Missing isActive: ${activeCount}, Inactive: ${inactiveCount}`);
    
    const seriesList = await TestSeries.find(filter)
      .select('name description thumbnail date noOfTests tests categories subCategories isActive languages validity originalPrice discount')
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code')
      .populate('validity', 'label durationInDays');

    console.log(`Found ${seriesList.length} test series matching filter`);
    
    // Apply language filtering after fetching documents
    let filteredSeriesList = seriesList;
    if (lang) {
      filteredSeriesList = seriesList.filter(series => {
        return series.languages && series.languages.some(language => language.code === lang);
      });
    }

    // For each series, check if user has access
    const seriesWithAccess = await Promise.all(filteredSeriesList.map(async (series) => {
      const hasAccess = userRole === 'ADMIN' ? true : (userId ? await checkTestSeriesAccess(userId, series._id) : false);
      
      return {
        _id: series._id,
        name: series.name,
        description: series.description,
        thumbnail: series.thumbnail,
        date: series.date,
        maxTests: series.noOfTests,
        testsCount: series.tests?.length || 0,
        categories: series.categories,
        subCategories: series.subCategories,
        languages: series.languages,
        validity: series.validity,
        originalPrice: series.originalPrice,
        discount: series.discount,
        hasAccess
      };
    }));

    return res.status(200).json({ 
      success: true,
      data: seriesWithAccess,
      meta: {
        total: seriesWithAccess.length,
        totalInDatabase: totalCount,
        activeInDatabase: activeCount
      }
    });
  } catch (error) {
    console.error('Error listing public Test Series:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get test series details
exports.getPublicTestSeriesById = async (req, res) => {
  try {
    const { seriesId } = req.params;
    const userId = req.user?._id;
    const userRole = req.user?.role;

    const series = await TestSeries.findOne({ _id: seriesId, contentType: 'TEST_SERIES', isActive: true })
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code')
      .populate('validity', 'label durationInDays');

    if (!series) {
      return res.status(404).json({ 
        success: false,
        message: 'Test Series not found' 
      });
    }

    const hasAccess = userRole === 'ADMIN' ? true : (userId ? await checkTestSeriesAccess(userId, seriesId) : false);

    // Prepare test list with access control
    const tests = series.tests.map((test, index) => {
      // Use freeQuota from the test series instead of hardcoded position
      const isFree = index < (series.freeQuota || 2);
      const testHasAccess = userRole === 'ADMIN' || hasAccess || isFree;
      
      // Calculate total number of questions from all sections
      let totalQuestions = 0;
      if (test.sections && Array.isArray(test.sections)) {
        totalQuestions = test.sections.reduce((sum, section) => {
          return sum + (section.questions ? section.questions.length : 0);
        }, 0);
      }
      
      // Determine test state
      const testState = getTestState(test);
      
      return {
        _id: test._id,
        testName: test.testName,
        noOfQuestions: totalQuestions,
        totalMarks: test.totalMarks,
        positiveMarks: test.positiveMarks,
        negativeMarks: test.negativeMarks,
        date: test.date,
        startTime: test.startTime,
        endTime: test.endTime,
        testState, // Add test state
        accessType: isFree ? 'FREE' : 'PAID',
        hasAccess: testHasAccess,
        resultPublishTime: test.resultPublishTime
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        _id: series._id,
        name: series.name,
        description: series.description,
        thumbnail: series.thumbnail,
        date: series.date,
        maxTests: series.noOfTests,
        categories: series.categories,
        subCategories: series.subCategories,
        languages: series.languages,
        validity: series.validity,
        originalPrice: series.originalPrice,
        discount: series.discount,
        tests,
        hasAccess
      }
    });
  } catch (error) {
    console.error('Error fetching public Test Series details:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get test details (with access control for videos)
exports.getPublicTestInSeries = async (req, res) => {
  try {
    const { seriesId, testId } = req.params;
    const userId = req.user?._id;
    const userRole = req.user?.role;
    let hasAccess = false;

    // First, check if the test series exists
    const testSeries = await TestSeries.findOne({ 
      _id: seriesId, 
      contentType: 'TEST_SERIES',
      isActive: true 
    }).lean();

    if (!testSeries) {
      return res.status(404).json({ 
        success: false,
        message: 'Test Series not found' 
      });
    }

    // Find the specific test in the series
    const testIndex = testSeries.tests.findIndex(t => t._id.toString() === testId);
    const test = testSeries.tests[testIndex];
    if (!test) {
      return res.status(404).json({ 
        success: false,
        message: 'Test not found in this series' 
      });
    }

    // Check if user has access to this test series
    if (userRole === 'ADMIN') {
      hasAccess = true; // Admin has full access
    } else if (userId) {
      // Check if user has purchased the test series with valid expiry
      hasAccess = await checkTestSeriesAccess(userId, seriesId);
    }

    // Determine test state
    const testState = getTestState(test);
    
    // Prepare basic test data (available to everyone)
    const testData = {
      _id: test._id,
      testName: test.testName,
      description: test.description,
      instructions: test.instructions,
      duration: test.duration,
      totalMarks: test.totalMarks,
      positiveMarks: test.positiveMarks,
      negativeMarks: test.negativeMarks,
      date: test.date,
      startTime: test.startTime,
      endTime: test.endTime,
      resultPublishTime: test.resultPublishTime,
      // Use freeQuota from the test series instead of hardcoded position
      isFree: testIndex < (testSeries.freeQuota || 2) && userRole !== 'ADMIN',
      testState, // Add test state
      hasAccess
    };

    // Only include these fields if user has access
    if (hasAccess) {
      // Calculate total questions and sections
      let totalQuestions = 0;
      const sections = (test.sections || []).map(section => {
        const sectionQuestions = section.questions?.length || 0;
        totalQuestions += sectionQuestions;
        
        return {
          _id: section._id,
          title: section.title,
          order: section.order,
          noOfQuestions: sectionQuestions,
          marks: section.questions?.reduce((sum, q) => sum + (q.marks || 0), 0) || 0,
          questions: section.questions?.map(q => ({
            _id: q._id,
            questionNumber: q.questionNumber,
            questionText: q.questionText,
            options: q.options,
            marks: q.marks,
            negativeMarks: q.negativeMarks,
          }))
        };
      });

      // Add protected fields
      Object.assign(testData, {
        totalQuestions,
        sections,
        totalExplanationVideoUrl: test.totalExplanationVideoUrl
      });

      // Include explanation videos if they exist
      if (test.explanationVideos) {
        testData.explanationVideos = test.explanationVideos;
      }
    } else {
      // For users without access, show section names only
      testData.sections = (test.sections || []).map(section => ({
        _id: section._id,
        title: section.title,
        noOfQuestions: section.questions?.length || 0
      }));
    }

    return res.status(200).json({
      success: true,
      data: testData
    });

  } catch (error) {
    console.error('Error fetching test details:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Public access version (no auth required)
exports.getPublicTestInSeriesPublic = async (req, res) => {
  try {
    const { seriesId, testId } = req.params;

    // Find the test series
    const testSeries = await TestSeries.findOne({ 
      _id: seriesId, 
      isActive: true 
    }).lean();

    if (!testSeries) {
      return res.status(404).json({ 
        success: false,
        message: 'Test Series not found' 
      });
    }

    // Find the specific test in the series
    const testIndex = testSeries.tests.findIndex(t => t._id.toString() === testId);
    const test = testSeries.tests[testIndex];
    if (!test) {
      return res.status(404).json({ 
        success: false,
        message: 'Test not found in this series' 
      });
    }

    // Determine test state
    const testState = getTestState(test);
    
    // Prepare basic test data (no authentication required)
    const testData = {
      _id: test._id,
      testName: test.testName,
      totalMarks: test.totalMarks,
      positiveMarks: test.positiveMarks,
      negativeMarks: test.negativeMarks,
      date: test.date,
      startTime: test.startTime,
      endTime: test.endTime,
      resultPublishTime: test.resultPublishTime,
      // Use freeQuota from the test series instead of hardcoded position
      isFree: testIndex < (testSeries.freeQuota || 2),
      testState, // Add test state
      hasAccess: false, // Always false for public access
      sections: (test.sections || []).map(section => ({
        _id: section._id,
        title: section.title,
        noOfQuestions: section.questions?.length || 0
      }))
    };

    return res.status(200).json({
      success: true,
      data: testData
    });

  } catch (error) {
    console.error('Error fetching public test details:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Add this new method
exports.initiatePurchase = async (req, res) => {
  try {
    const { seriesId } = req.params;
    const { couponCode } = req.body;
    const userId = req.user._id;

    // Check if already purchased
    const { TestSeriesAccessService } = require('../../../services');
    const accessInfo = await TestSeriesAccessService.getAccessInfo(userId, seriesId);
    if (accessInfo.hasAccess && accessInfo.isValid) {
      return res.status(400).json({
        success: false,
        message: 'You have already purchased this test series'
      });
    }

    // Create purchase record using the unified PurchaseService
    const { PurchaseService } = require('../../../services');
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const purchase = await PurchaseService.createPurchase(
      userId,
      [{ itemType: 'test_series', itemId: seriesId }],
      paymentId,
      couponCode
    );

    // In a real app, you would redirect to payment gateway here
    // For now, we'll return the payment details
    res.status(200).json({
      success: true,
      data: {
        paymentId: purchase.paymentId,
        amount: purchase.finalAmount,
        currency: 'INR', // Update as per your currency
        couponApplied: !!purchase.coupon,
        discountAmount: purchase.discountAmount
      }
    });
  } catch (error) {
    console.error('Error initiating purchase:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to initiate purchase',
      error: error.message
    });
  }
};

// Public: list test series with optional filters (matches Online Course format)
exports.listTestSeries = async (req, res) => {
  try {
    const { category, subCategory, language, lang } = req.query;
    const userId = req.user?._id;

    const filter = {
      contentType: 'TEST_SERIES',
      isActive: true,
    };

    if (category) filter.categories = category;
    if (subCategory) filter.subCategories = subCategory;
    if (language) filter.languages = language;
    if (lang) {
      const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const LanguageModel = require('../../models/Course/Language');
      const langDoc = await LanguageModel.findOne({
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

    const testSeries = await TestSeries.find(filter)
      .populate('categories', 'name slug description thumbnailUrl')
      .populate('subCategories', 'name slug description thumbnailUrl')
      .populate('languages', 'name code')
      .populate('validity', 'label durationInDays');

    // Process test series to return only specified fields
    const processedTestSeries = await Promise.all(
      testSeries.map(async (series) => {
        const hasPurchased = await checkTestSeriesAccess(userId, series._id);
        const seriesObj = series.toObject();
        
        // Calculate finalPrice
        const finalPrice = calculateFinalPrice(seriesObj.originalPrice, seriesObj.discount);
        
        // Return only the requested fields
        const filteredSeries = {
          _id: seriesObj._id,
          name: seriesObj.name,
          thumbnailUrl: seriesObj.thumbnail,
          originalPrice: seriesObj.originalPrice,
          discountPrice: seriesObj.discount?.value || 0,
          finalPrice: finalPrice,
          languages: seriesObj.languages,
          validities: seriesObj.validity ? [seriesObj.validity] : [],
          hasPurchased: hasPurchased,
          isValid: hasPurchased // Assuming validity is tied to purchase
        };
        
        return filteredSeries;
      })
    );

    return res.status(200).json({ data: processedTestSeries });
  } catch (error) {
    console.error('Error listing test series:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};



const TestSeries = require('../../models/TestSeries/TestSeries');
const TestAttempt = require('../../models/TestSeries/TestAttempt');
const TestRanking = require('../../models/TestSeries/TestRanking');
const Cutoff = require('../../models/TestSeries/Cutoff');
const User = require('../../models/User/User');

// Import TestSeriesAccessService
const TestSeriesAccessService = require('../../../services/testSeriesAccessService');

// Helper to determine test state based on timing
const getTestState = (test) => {
  const now = new Date();
  
  // If no timing information, return unknown state
  if (!test.startTime || !test.endTime) {
    return 'unknown';
  }
  
  const startTime = new Date(test.startTime);
  const endTime = new Date(test.endTime);
  
  // Before startTime
  if (now < startTime) {
    return 'upcoming';
  }
  
  // During test
  if (now >= startTime && now <= endTime) {
    return 'live';
  }
  
  // After endTime - results available immediately
  if (now > endTime) {
    return 'results_available';
  }
  
  return 'unknown';
};

// Start Test
exports.startTest = async (req, res) => {
  try {
    const { seriesId, testId } = req.params;
    const userId = req.user._id;

    // Find the test series and the specific test
    const testSeries = await TestSeries.findById(seriesId);
    if (!testSeries) {
      return res.status(404).json({
        success: false,
        message: 'Test series not found'
      });
    }

    const test = testSeries.tests.id(testId);
    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found in this series'
      });
    }

    // Check if user already has an attempt for this test (active or completed)
    // The unique index will prevent duplicate attempts at DB level
    const userAttempt = await TestAttempt.findOne({
      user: userId,
      testSeries: seriesId,
      testId: testId
    });

    if (userAttempt) {
      if (userAttempt.status === 'IN_PROGRESS' && !userAttempt.resultGenerated) {
        return res.status(200).json({
          success: true,
          message: 'Test attempt resumed',
          data: userAttempt
        });
      }
      
      if (userAttempt.resultGenerated || userAttempt.status === 'SUBMITTED') {
        return res.status(400).json({
          success: false,
          message: 'You have already completed this test'
        });
      }
    }

    // Determine if test is free based on freeQuota
    const testIndex = testSeries.tests.findIndex(t => t._id.toString() === testId);
    const isTestFree = testIndex < (testSeries.freeQuota || 2);

    // Check if user has access to this test series
    let hasAccess = false;
    if (isTestFree) {
      hasAccess = true; // Free test based on quota
    } else {
      hasAccess = await TestSeriesAccessService.hasTestAccess(userId, seriesId, testId);
    }

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this test series'
      });
    }

    // Check test state - only allow starting live tests
    const testState = getTestState(test);
    if (testState !== 'live') {
      return res.status(400).json({
        success: false,
        message: `Test is not available. Current state: ${testState}`
      });
    }

    // All attempt checking is already done above with userAttempt
    // If we reach here, userAttempt is null (no existing attempt)
    // So we can safely create a new attempt

    // Create new test attempt atomically
    try {
      const testAttempt = await TestAttempt.create({
        user: userId,
        testSeries: seriesId,
        testId: testId,
        startedAt: new Date(),
        responses: [],
        status: 'IN_PROGRESS'
      });

      return res.status(201).json({
        success: true,
        message: 'Test started successfully',
        data: testAttempt
      });
    } catch (error) {
      // Handle duplicate key error (11000)
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'Test already started'
        });
      }
      
      // Re-throw other errors
      throw error;
    }
  } catch (error) {
    console.error('Error starting test:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}

// Submit Answer
exports.submitAnswer = async (req, res) => {
  try {
    const { seriesId, testId } = req.params;
    const { sectionId, questionId, selectedOption, timeTaken } = req.body;
    const userId = req.user._id;

    // VALIDATION PHASE - Do all validation BEFORE any DB updates
    
    // 1. Validate test series and test exist and get question data
    const testSeries = await TestSeries.findById(seriesId);
    if (!testSeries) {
      return res.status(404).json({
        success: false,
        message: 'Test series not found'
      });
    }

    const test = testSeries.tests.id(testId);
    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found in this series'
      });
    }

    // 2. Find the section and question
    let question = null;
    let section = null;
    for (const sec of test.sections) {
      const q = sec.questions.id(questionId);
      if (q) {
        question = q;
        section = sec;
        break;
      }
    }

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // 3. Validate selected option BEFORE any DB operations
    if (selectedOption < 0 || selectedOption >= question.options.length) {
      return res.status(400).json({
        success: false,
        message: 'Invalid option selected'
      });
    }

    // 4. Compute correctness BEFORE any DB operations
    const isCorrect = question.correctOptionIndex === selectedOption;

    // 5. Validate user access
    const testIndex = testSeries.tests.findIndex(t => t._id.toString() === testId);
    const isTestFree = testIndex < (testSeries.freeQuota || 2);
    
    let hasAccess = false;
    if (isTestFree) {
      hasAccess = true;
    } else {
      hasAccess = await TestSeriesAccessService.hasTestAccess(userId, seriesId, testId);
    }

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this test series'
      });
    }

    // 6. Validate test state
    const testState = getTestState(test);
    if (!['live', 'results_available'].includes(testState)) {
      return res.status(400).json({
        success: false,
        message: `Test cannot be submitted. Current state: ${testState}`
      });
    }

    // 7. Validate test attempt exists and is active
    const existingAttempt = await TestAttempt.findOne({
      user: userId,
      testSeries: seriesId,
      testId: testId
    });

    if (!existingAttempt) {
      return res.status(404).json({
        success: false,
        message: 'Test attempt not found'
      });
    }

    // Extra guard: prevent answering after submission
    if (existingAttempt.status !== 'IN_PROGRESS' || existingAttempt.resultGenerated) {
      return res.status(400).json({
        success: false,
        message: 'Test already submitted'
      });
    }

    // Create the response object with validated data
    const newResponse = {
      sectionId,
      questionId,
      selectedOption,
      isCorrect,
      timeTaken
    };

    // Use atomic update to handle response submission
    const updatedAttempt = await TestAttempt.findOneAndUpdate(
      {
        user: userId,
        testSeries: seriesId,
        testId: testId,
        resultGenerated: { $ne: true },
        status: 'IN_PROGRESS',
        'responses.questionId': { $ne: questionId } // Response doesn't exist yet
      },
      {
        $push: { responses: newResponse }
      },
      { new: true }
    );

    // If the first update didn't work (response already exists), update existing
    if (!updatedAttempt) {
      await TestAttempt.updateOne(
        {
          user: userId,
          testSeries: seriesId,
          testId: testId,
          resultGenerated: { $ne: true },
          status: 'IN_PROGRESS',
          'responses.questionId': questionId
        },
        {
          $set: { 
            'responses.$[elem].selectedOption': selectedOption,
            'responses.$[elem].isCorrect': isCorrect,
            'responses.$[elem].timeTaken': timeTaken
          }
        },
        {
          arrayFilters: [{ 'elem.questionId': questionId }],
          new: true
        }
      );
    }

    // All validation completed above - proceed with atomic update

    return res.status(200).json({
      success: true,
      message: 'Answer submitted successfully',
      data: {
        isCorrect
        // NOTE: Do NOT return correctOption immediately to prevent cheating
      }
    });
  } catch (error) {
    console.error('Error submitting answer:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Submit Test (Finish Test)
exports.submitTest = async (req, res) => {
  try {
    const { seriesId, testId } = req.params;
    const userId = req.user._id;

    // STEP 1: Lock the attempt (find without modifying)
    const testAttempt = await TestAttempt.findOne({
      user: userId,
      testSeries: seriesId,
      testId: testId,
      resultGenerated: { $ne: true },
      status: 'IN_PROGRESS'
    });

    if (!testAttempt) {
      // Check if test was already submitted
      const submittedAttempt = await TestAttempt.findOne({
        user: userId,
        testSeries: seriesId,
        testId: testId,
        resultGenerated: true
      });
      
      if (submittedAttempt) {
        return res.status(400).json({
          success: false,
          message: 'Test has already been submitted'
        });
      }
      
      return res.status(404).json({
        success: false,
        message: 'Test attempt not found or already submitted'
      });
    }

    // STEP 2: Perform all validations BEFORE state change
    
    // Find the test series and the specific test
    const testSeries = await TestSeries.findById(seriesId);
    if (!testSeries) {
      return res.status(404).json({
        success: false,
        message: 'Test series not found'
      });
    }

    const test = testSeries.tests.id(testId);
    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found in this series'
      });
    }

    // Check access
    const testIndex = testSeries.tests.findIndex(t => t._id.toString() === testId);
    const isTestFree = testIndex < (testSeries.freeQuota || 2);
    
    let hasAccess = false;
    if (isTestFree) {
      hasAccess = true;
    } else {
      hasAccess = await TestSeriesAccessService.hasTestAccess(userId, seriesId, testId);
    }

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this test series'
      });
    }

    // Check test state
    const testState = getTestState(test);
    if (!['live', 'results_available'].includes(testState)) {
      return res.status(400).json({
        success: false,
        message: `Test cannot be submitted. Current state: ${testState}`
      });
    }

    // STEP 3: Atomically submit the test AFTER all validations pass
    const updatedAttempt = await TestAttempt.findOneAndUpdate(
      {
        _id: testAttempt._id,
        user: userId,
        testSeries: seriesId,
        testId: testId,
        resultGenerated: { $ne: true },
        status: 'IN_PROGRESS'
      },
      { 
        $set: { 
          resultGenerated: true, 
          submittedAt: new Date(),
          status: 'SUBMITTED'
        }
      },
      { new: true }
    );

    // If update failed, someone else submitted it
    if (!updatedAttempt) {
      return res.status(400).json({
        success: false,
        message: 'Test submission failed - attempt may have been submitted by another request'
      });
    }

    // Use the updated attempt for scoring
    const finalTestAttempt = updatedAttempt;

    // All validations completed above

    // Calculate results
    const totalQuestions = test.sections.reduce((total, section) => {
      return total + (section.questions ? section.questions.length : 0);
    }, 0);

    const correct = finalTestAttempt.responses.filter(r => r.isCorrect).length;
    const incorrect = finalTestAttempt.responses.filter(r => r.isCorrect === false).length;
    const unattempted = totalQuestions - (correct + incorrect);

    // Calculate score
    let score = 0;
    for (const response of finalTestAttempt.responses) {
      // Find the question to get its marks
      let question = null;
      for (const section of test.sections) {
        const q = section.questions.id(response.questionId);
        if (q) {
          question = q;
          break;
        }
      }

      if (question) {
        if (response.isCorrect) {
          score += question.marks || test.positiveMarks || 1;
        } else {
          score -= Math.abs(question.negativeMarks || test.negativeMarks || 0);
        }
      }
    }

    // Calculate accuracy
    const accuracy = correct + incorrect > 0 ? (correct / (correct + incorrect)) * 100 : 0;

    // Calculate time taken and speed
    const timeTakenMs = finalTestAttempt.submittedAt ? 
      new Date(finalTestAttempt.submittedAt).getTime() - new Date(finalTestAttempt.startedAt).getTime() :
      new Date().getTime() - new Date(finalTestAttempt.startedAt).getTime();
    
    const timeTakenMinutes = timeTakenMs / (1000 * 60);
    const speed = timeTakenMinutes > 0 ? (correct + incorrect) / timeTakenMinutes : 0;

    // Update test attempt with calculated results (don't overwrite atomic fields)
    finalTestAttempt.score = score;
    finalTestAttempt.correct = correct;
    finalTestAttempt.incorrect = incorrect;
    finalTestAttempt.unattempted = unattempted;
    finalTestAttempt.accuracy = accuracy;
    finalTestAttempt.speed = speed;
    finalTestAttempt.percentage = totalQuestions > 0 ? (correct / totalQuestions) * 100 : 0;
    // submittedAt and resultGenerated already set by atomic update

    await finalTestAttempt.save();

    // Return response immediately for better UX
    const response = res.status(200).json({
      success: true,
      message: 'Test submitted successfully',
      data: finalTestAttempt
    });

    // Update ranking asynchronously to improve performance
    setImmediate(async () => {
      try {
        await updateRanking(seriesId, testId, userId, score, accuracy);
      } catch (error) {
        console.error('Error updating ranking:', error);
        // Don't fail the main submission if ranking fails
      }
    });

    return response;
  } catch (error) {
    console.error('Error submitting test:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Helper function to update ranking
const updateRanking = async (seriesId, testId, userId, score, accuracy) => {
  try {
    // Save or update user's ranking
    await TestRanking.findOneAndUpdate(
      { testId, user: userId },
      { 
        testSeries: seriesId,
        score,
        accuracy,
        rank: 0 // Will be updated when recalculating
      },
      { upsert: true, new: true }
    );

    // Get all rankings for this test sorted by score (descending), then accuracy, then submission time
    const allRankings = await TestRanking.find({ testId })
      .sort({ score: -1, accuracy: -1, createdAt: 1 });

    // Calculate ranks in memory to reduce database operations
    const updates = allRankings.map((ranking, index) => ({
      updateOne: {
        filter: { _id: ranking._id },
        update: { 
          $set: { 
            rank: index + 1,
            totalParticipants: allRankings.length
          }
        }
      }
    }));

    // Execute all updates in a single bulk operation
    if (updates.length > 0) {
      await TestRanking.bulkWrite(updates);
    }
    
    // Return the user's ranking
    const userRanking = await TestRanking.findOne({ testId, user: userId });
    return userRanking;
  } catch (error) {
    console.error('Error updating ranking:', error);
    return null;
  }
};

// Get Full Result Analysis
exports.getResultAnalysis = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const userId = req.user._id;

    // Find the test attempt
    const testAttempt = await TestAttempt.findById(attemptId)
      .populate('user', 'name email category')
      .populate('testSeries', 'name');

    if (!testAttempt) {
      return res.status(404).json({
        success: false,
        message: 'Test attempt not found'
      });
    }

    // Check if user owns this attempt
    if (testAttempt.user._id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this result'
      });
    }

    // Find the test series and the specific test
    const testSeries = await TestSeries.findById(testAttempt.testSeries);
    if (!testSeries) {
      return res.status(404).json({
        success: false,
        message: 'Test series not found'
      });
    }

    const test = testSeries.tests.id(testAttempt.testId);
    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found in this series'
      });
    }

    // Check if result is generated
    if (!testAttempt.resultGenerated) {
      return res.status(400).json({
        success: false,
        message: 'Test result not yet generated'
      });
    }

    // With simplified state logic, results are available immediately after submission
    // No additional checks needed for result publish time

    // Get user ranking
    const userRanking = await TestRanking.findOne({
      testId: testAttempt.testId,
      user: userId
    });

    // Get cutoff if exists
    const cutoff = await Cutoff.findOne({ testId: testAttempt.testId });

    // Section-wise analysis
    const sectionAnalysis = [];
    const sectionAccuracy = {};

    for (const section of test.sections) {
      const sectionResponses = testAttempt.responses.filter(
        r => r.sectionId === section._id.toString()
      );

      const sectionCorrect = sectionResponses.filter(r => r.isCorrect).length;
      const sectionIncorrect = sectionResponses.filter(r => r.isCorrect === false).length;
      const sectionTotal = section.questions ? section.questions.length : 0;
      const sectionUnattempted = sectionTotal - (sectionCorrect + sectionIncorrect);
      const sectionAccuracyVal = sectionCorrect + sectionIncorrect > 0 ? 
        (sectionCorrect / (sectionCorrect + sectionIncorrect)) * 100 : 0;

      sectionAccuracy[section.title] = sectionAccuracyVal;

      sectionAnalysis.push({
        sectionName: section.title,
        correct: sectionCorrect,
        incorrect: sectionIncorrect,
        unattempted: sectionUnattempted,
        accuracy: sectionAccuracyVal,
        total: sectionTotal
      });
    }

    // Find strongest and weakest sections
    let strongestArea = '';
    let weakestArea = '';
    let maxAccuracy = -1;
    let minAccuracy = 101;

    for (const [sectionName, accuracy] of Object.entries(sectionAccuracy)) {
      if (accuracy > maxAccuracy) {
        maxAccuracy = accuracy;
        strongestArea = sectionName;
      }
      if (accuracy < minAccuracy) {
        minAccuracy = accuracy;
        weakestArea = sectionName;
      }
    }

    // Question-wise report
    const questionReports = [];
    for (const response of testAttempt.responses) {
      // Find the section and question
      let question = null;
      let section = null;
      for (const sec of test.sections) {
        const q = sec.questions.id(response.questionId);
        if (q) {
          question = q;
          section = sec;
          break;
        }
      }

      if (question) {
        questionReports.push({
          questionText: question.questionText,
          userAnswer: response.selectedOption,
          correctAnswer: question.correctOptionIndex,
          status: response.isCorrect ? 'Correct' : 'Incorrect',
          explanation: question.explanation,
          section: section ? section.title : 'Unknown'
        });
      }
    }

    // Cutoff analysis
    let cutoffStatus = 'Not Available';
    if (cutoff && testAttempt.user.category) {
      const userCategory = testAttempt.user.category.toLowerCase();
      let categoryCutoff = 0;
      
      switch(userCategory) {
        case 'gen':
        case 'general':
          categoryCutoff = cutoff.cutoff.general;
          break;
        case 'obc':
          categoryCutoff = cutoff.cutoff.obc;
          break;
        case 'sc':
          categoryCutoff = cutoff.cutoff.sc;
          break;
        case 'st':
          categoryCutoff = cutoff.cutoff.st;
          break;
      }
      
      if (categoryCutoff > 0) {
        cutoffStatus = testAttempt.score >= categoryCutoff ? 'Passed' : 'Failed';
      }
    }

    // Calculate percentile
    let percentile = 0;
    if (userRanking && userRanking.totalParticipants > 1) {
      percentile = ((userRanking.totalParticipants - userRanking.rank) / 
                   (userRanking.totalParticipants - 1)) * 100;
    }

    const result = {
      // User Summary
      userSummary: {
        userName: testAttempt.user.name,
        userEmail: testAttempt.user.email,
        testName: test.testName,
        testSeriesName: testAttempt.testSeries.name,
        score: testAttempt.score,
        correct: testAttempt.correct,
        incorrect: testAttempt.incorrect,
        unattempted: testAttempt.unattempted,
        accuracy: testAttempt.accuracy,
        speed: testAttempt.speed,
        percentage: testAttempt.percentage,
        rank: userRanking ? userRanking.rank : null,
        totalParticipants: userRanking ? userRanking.totalParticipants : null,
        percentile: percentile
      },
      
      // Cutoff Analysis
      cutoffAnalysis: {
        status: cutoffStatus,
        userCategory: testAttempt.user.category,
        cutoffs: cutoff ? cutoff.cutoff : null
      },
      
      // Section-wise Report
      sectionReport: sectionAnalysis,
      
      // Strength/Weakness Areas
      performanceAnalysis: {
        strongestArea: strongestArea,
        weakestArea: weakestArea
      },
      
      // Question-wise Report
      questionReport: questionReports
    };

    return res.status(200).json({
      success: true,
      message: 'Result analysis fetched successfully',
      data: result
    });
  } catch (error) {
    console.error('Error getting result analysis:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get user's test attempts/history
exports.getUserTestAttempts = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get all test attempts for this user
    const attempts = await TestAttempt.find({ user: userId })
      .populate('testSeries', 'name')
      .sort({ createdAt: -1 });
    
    // With simplified state logic, all completed attempts are available
    // Since results are available immediately after submission, show all completed attempts
    const filteredAttempts = attempts.filter(attempt => attempt.resultGenerated);
    
    return res.status(200).json({
      success: true,
      data: filteredAttempts
    });
  } catch (error) {
    console.error('Error fetching user test attempts:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}

// Get Leaderboard for a specific test
exports.getLeaderboard = async (req, res) => {
  try {
    const { seriesId, testId } = req.params;
    
    // Find the test series and the specific test to verify they exist
    const testSeries = await TestSeries.findById(seriesId);
    if (!testSeries) {
      return res.status(404).json({
        success: false,
        message: 'Test series not found'
      });
    }

    const test = testSeries.tests.id(testId);
    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found in this series'
      });
    }

    // Get rankings for this test sorted by rank (single source of truth)
    const rankings = await TestRanking.find({ testId })
      .populate('user', 'name email')
      .sort({ rank: 1 }); // Sort by pre-calculated rank

    // Get total participants count
    const totalParticipants = await TestRanking.countDocuments({ testId });

    // Prepare leaderboard data using rank as position
    const leaderboard = rankings.map((ranking) => ({
      position: ranking.rank,
      user: {
        name: ranking.user?.name,
        email: ranking.user?.email
      },
      score: ranking.score,
      accuracy: ranking.accuracy,
      totalParticipants: totalParticipants
    }));

    return res.status(200).json({
      success: true,
      data: {
        testId,
        testName: test.testName,
        totalParticipants,
        leaderboard
      }
    });
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

#### Key Functions:

1. **getParticipants** - Gets all participants' data for a test
2. **setCutoff** - Sets cutoff marks for different categories
3. **getCutoff** - Gets cutoff information
4. **updateCutoff** - Updates existing cutoff
5. **deleteCutoff** - Removes cutoff

## Complete Exam Flow - Step by Step

This section details the complete process a user goes through to take a test, from starting to submitting, with all the necessary API calls.

### Prerequisites
- User must be authenticated
- User must have purchased/access to the test series
- Test must be active (within start and end time)

### Step 1: Start Test Attempt

**Endpoint:** `POST /api/v1/test-attempts/start`

**Purpose:** Creates a new test attempt and initializes the exam timer

**Request Body:**
```json
{
  "seriesId": "67890abcdef1234567890abc",
  "testId": "67890abcdef1234567890def"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Test started successfully",
  "data": {
    "attemptId": "67890abcdef1234567890123",
    "testName": "Mock Test 1",
    "duration": 1800,
    "totalQuestions": 100,
    "sections": [
      {
        "_id": "67890abcdef1234567890456",
        "title": "Quantitative Aptitude",
        "questions": [
          {
            "_id": "67890abcdef1234567890789",
            "questionNumber": 1,
            "questionText": "What is 2+2?",
            "options": ["1", "2", "3", "4"],
            "marks": 1,
            "negativeMarks": 0.25
          }
        ]
      }
    ]
  }
}
```

### Step 2: Get Live Questions (During Exam)

**Endpoint:** `GET /api/v1/test-attempts/:attemptId/questions`

**Purpose:** Get current exam state with live timer and question status

**Query Parameters:**
- `sectionId` (optional): Filter by section

**Response:**
```json
{
  "success": true,
  "message": "Questions retrieved successfully",
  "data": {
    "attemptId": "67890abcdef1234567890123",
    "timeLeft": 1740, // seconds remaining
    "totalTime": 1800,
    "questions": [
      {
        "questionId": "67890abcdef1234567890789",
        "questionNumber": 1,
        "questionText": "What is 2+2?",
        "options": ["1", "2", "3", "4"],
        "status": "UNANSWERED", // UNVISITED, UNANSWERED, ANSWERED, MARKED, ANSWERED_MARKED
        "selectedOption": null,
        "markedForReview": false,
        "visited": true,
        "attempted": false
      }
    ],
    "sectionSummary": [
      {
        "sectionId": "67890abcdef1234567890456",
        "title": "Quantitative Aptitude",
        "totalQuestions": 50,
        "answered": 5,
        "marked": 2,
        "unanswered": 43
      }
    ]
  }
}
```

### Step 3: Submit Answer

**Endpoint:** `POST /api/v1/test-attempts/:attemptId/submit-answer`

**Purpose:** Submit answer for a specific question

**Request Body:**
```json
{
  "sectionId": "67890abcdef1234567890456",
  "questionId": "67890abcdef1234567890789",
  "selectedOption": 3, // 0-indexed
  "timeTaken": 45, // seconds spent on this question
  "markedForReview": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Answer submitted successfully",
  "data": {
    "questionId": "67890abcdef1234567890789",
    "status": "ANSWERED",
    "selectedOption": 3,
    "markedForReview": false
  }
}
```

### Step 4: Mark Question for Review

**Endpoint:** `POST /api/v1/test-attempts/:attemptId/submit-answer`

**Request Body:**
```json
{
  "sectionId": "67890abcdef1234567890456",
  "questionId": "67890abcdef1234567890789",
  "selectedOption": null, // Optional - can mark without answering
  "timeTaken": 30,
  "markedForReview": true
}
```

### Step 5: Visit Question (Navigation)

**Endpoint:** `POST /api/v1/test-attempts/:seriesId/:testId/visit-question`

**Purpose:** Mark a question as visited (for palette tracking)

**Request Body:**
```json
{
  "sectionId": "67890abcdef1234567890456",
  "questionId": "67890abcdef1234567890789"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Question marked as visited"
}
```

### Step 6: Get Question Paper (Lightweight View)

**Endpoint:** `GET /api/v1/test-attempts/:attemptId/question-paper`

**Purpose:** Get all questions without status information (for review)

**Response:**
```json
{
  "success": true,
  "message": "Question paper retrieved successfully",
  "data": {
    "sections": [
      {
        "sectionId": "67890abcdef1234567890456",
        "title": "Quantitative Aptitude",
        "questions": [
          {
            "questionId": "67890abcdef1234567890789",
            "questionNumber": 1,
            "questionText": "What is 2+2?",
            "options": ["1", "2", "3", "4"]
          }
        ]
      }
    ]
  }
}
```

### Step 7: Submit Test (Final Submission)

**Endpoint:** `POST /api/v1/test-attempts/:attemptId/submit`

**Purpose:** Submit the entire test for evaluation

**Request Body:**
```json
{
  "timeTaken": 1800 // Optional: override auto-calculated time
}
```

**Response:**
```json
{
  "success": true,
  "message": "Test submitted successfully",
  "data": {
    "attemptId": "67890abcdef1234567890123",
    "score": 85,
    "correct": 85,
    "incorrect": 10,
    "unattempted": 5,
    "accuracy": 89.47,
    "percentage": 85.0,
    "speed": 2.83, // questions per minute
    "timeTaken": 1800
  }
}
```

### Step 8: Get Result Analysis

**Endpoint:** `GET /api/v1/test-attempts/:attemptId/result-analysis`

**Purpose:** Get detailed result analysis after submission

**Response:**
```json
{
  "success": true,
  "message": "Result analysis retrieved successfully",
  "data": {
    "userSummary": {
      "userName": "John Doe",
      "userEmail": "john@example.com",
      "testName": "Mock Test 1",
      "testSeriesName": "UPSC Prelims 2024",
      "score": 85,
      "correct": 85,
      "incorrect": 10,
      "unattempted": 5,
      "accuracy": 89.47,
      "percentage": 85.0,
      "speed": 2.83,
      "timeTaken": 1800
    },
    "sectionAnalysis": [
      {
        "sectionName": "Quantitative Aptitude",
        "correct": 25,
        "incorrect": 3,
        "unattempted": 2,
        "accuracy": 89.29,
        "score": 23.25
      }
    ],
    "questionReports": [
      {
        "questionText": "What is 2+2?",
        "userAnswer": 3,
        "correctAnswer": 3,
        "status": "Correct", // Correct, Incorrect, Unattempted
        "explanation": "2+2 equals 4, which is option D (index 3)",
        "section": "Quantitative Aptitude"
      }
    ],
    "performanceMetrics": {
      "strongestArea": "Quantitative Aptitude",
      "weakestArea": "General Studies",
      "cutoffStatus": "Passed",
      "percentile": 92.5
    }
  }
}
```

### Step 9: Get Leaderboard

**Endpoint:** `GET /api/v1/test-series/:seriesId/tests/:testId/rankings`

**Purpose:** View ranking and compare with other participants

**Query Parameters:**
- `limit` (optional): Number of top rankings to fetch (default: 10)
- `page` (optional): Page number for pagination

**Response:**
```json
{
  "success": true,
  "message": "Rankings fetched successfully",
  "data": {
    "testName": "Mock Test 1",
    "totalParticipants": 1250,
    "userRanking": {
      "rank": 95,
      "score": 85,
      "accuracy": 89.47,
      "percentile": 92.4
    },
    "topRankings": [
      {
        "rank": 1,
        "userName": "Top Performer",
        "score": 98,
        "accuracy": 98.0
      }
    ]
  }
}
```

## API Testing

### Test Series Management (Admin)

#### 1. Create Test Series
```bash
curl -X POST "http://localhost:5000/api/admin/test-series" \
  -H "Authorization: Bearer <admin_jwt_token>" \
  -H "Content-Type: multipart/form-data" \
  -F "name=UPSC Prelims Test Series" \
  -F "noOfTests=20" \
  -F "description=Complete test series for UPSC Prelims" \
  -F "originalPrice=499" \
  -F "categoryIds=[\"category_id_1\"]" \
  -F "subCategoryIds=[\"subcategory_id_1\"]" \
  -F "language=[\"language_id_1\"]" \
  -F "thumbnail=@/path/to/thumbnail.jpg"
```

#### 2. List All Test Series
```bash
curl -X GET "http://localhost:5000/api/admin/test-series" \
  -H "Authorization: Bearer <admin_jwt_token>"
```

#### 3. Get Single Test Series
```bash
curl -X GET "http://localhost:5000/api/admin/test-series/:id" \
  -H "Authorization: Bearer <admin_jwt_token>"
```

#### 4. Add Test to Series
```bash
curl -X POST "http://localhost:5000/api/admin/test-series/:seriesId/tests" \
  -H "Authorization: Bearer <admin_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "testName": "Test-1",
    "noOfQuestions": 100,
    "totalMarks": 200,
    "positiveMarks": 2,
    "negativeMarks": 0.66,
    "date": "2024-06-15",
    "startTime": "2024-06-15T09:00:00Z",
    "endTime": "2024-06-15T12:00:00Z"
  }'
```

#### 5. Add Section to Test
```bash
curl -X POST "http://localhost:5000/api/admin/test-series/:seriesId/tests/:testId/sections" \
  -H "Authorization: Bearer <admin_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "General Studies",
    "order": 1,
    "noOfQuestions": 50
  }'
```

#### 6. Add Questions to Section
```bash
curl -X POST "http://localhost:5000/api/admin/test-series/:seriesId/tests/:testId/sections/:sectionId/questions" \
  -H "Authorization: Bearer <admin_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "questionText": "What is the capital of India?",
    "options": ["Mumbai", "Delhi", "Kolkata", "Chennai"],
    "correctOptionIndex": 1,
    "explanation": "Delhi is the capital of India",
    "marks": 2,
    "negativeMarks": 0.66
  }'
```

### User Test Series Access

#### 1. List Test Series (User)
```bash
curl -X GET "http://localhost:5000/api/v1/test-series" \
  -H "Authorization: Bearer <user_jwt_token>"
```

#### 2. Get Test Series Details
```bash
curl -X GET "http://localhost:5000/api/v1/test-series/:seriesId" \
  -H "Authorization: Bearer <user_jwt_token>"
```

### Test Attempt Operations (User)

#### 1. Start Test
```bash
curl -X POST "http://localhost:5000/api/v1/test-attempts/:seriesId/:testId/start" \
  -H "Authorization: Bearer <user_jwt_token>" \
  -H "Content-Type: application/json"
```

#### 2. Submit Answer
```bash
curl -X POST "http://localhost:5000/api/v1/test-attempts/:seriesId/:testId/submit-question" \
  -H "Authorization: Bearer <user_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "sectionId": "section_id",
    "questionId": "question_id",
    "selectedOption": 0,
    "timeTaken": 45
  }'
```

#### 3. Submit Test
```bash
curl -X POST "http://localhost:5000/api/v1/test-attempts/:seriesId/:testId/submit" \
  -H "Authorization: Bearer <user_jwt_token>" \
  -H "Content-Type: application/json"
```

#### 4. Get Result Analysis
```bash
curl -X GET "http://localhost:5000/api/v1/test-attempts/:attemptId/result" \
  -H "Authorization: Bearer <user_jwt_token>"
```

#### 5. Get Leaderboard
```bash
curl -X GET "http://localhost:5000/api/v1/test-attempts/:seriesId/:testId/leaderboard" \
  -H "Authorization: Bearer <user_jwt_token>"
```

## Access Control

### Test Access Service

**File:** `services/testSeriesAccessService.js`

```javascript
class TestSeriesAccessService {
  // Check if user has access to a specific test within a series
  static async hasTestAccess(userId, seriesId, testId) {
    // Check if it's a free test (within free quota)
    // Check if user has purchased the series
    // Validate purchase validity
  }

  // Check if user has access to entire series
  static async hasSeriesAccess(userId, seriesId) {
    // Check if series is free
    // Check if user has valid purchase
  }

  // Check if user has an active attempt
  static async hasActiveAttempt(userId, seriesId, testId) {
    // Check for non-completed attempts
  }

  // Check if user has completed a test
  static async hasCompletedTest(userId, seriesId, testId) {
    // Check for completed attempts
  }

  // Get comprehensive access information
  static async getAccessInfo(userId, testSeriesId) {
    // Return detailed access status including validity
  }
}

module.exports = TestSeriesAccessService;
```

### Middleware

**File:** `src/middlewares/checkTestAccess.js`

```javascript
const { TestSeriesAccessService } = require('../../services');

const checkTestAccess = (options = {}) => {
  return async (req, res, next) => {
    const { seriesId, testId } = req.params;
    const userId = req.user._id;
    
    // Check access based on mode (START, SUBMIT, LEADERBOARD)
    const hasAccess = await TestSeriesAccessService.hasTestAccess(userId, seriesId, testId);
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this test'
      });
    }
    
    next();
  };
};

module.exports = checkTestAccess;
```

## Ranking System

### Ranking Logic

The ranking system automatically calculates and updates user rankings:

1. **Score-based ranking**: Higher scores get better ranks
2. **Tie-breaking**: Accuracy is used as tie-breaker
3. **Submission time**: Earlier submissions get preference in ties
4. **Asynchronous updates**: Rankings are updated after test submission

### Ranking Update Process

```javascript
const updateRanking = async (seriesId, testId, userId, score, accuracy) => {
  try {
    // Save or update user's ranking
    await TestRanking.findOneAndUpdate(
      { testId, user: userId },
      { 
        testSeries: seriesId,
        score,
        accuracy,
        rank: 0 // Will be updated when recalculating
      },
      { upsert: true, new: true }
    );

    // Get all rankings for this test sorted by score (descending)
    const allRankings = await TestRanking.find({ testId })
      .sort({ score: -1, accuracy: -1, createdAt: 1 });

    // Calculate ranks in memory
    const updates = allRankings.map((ranking, index) => ({
      updateOne: {
        filter: { _id: ranking._id },
        update: { 
          $set: { 
            rank: index + 1,
            totalParticipants: allRankings.length
          }
        }
      }
    }));

    // Execute all updates in a single bulk operation
    if (updates.length > 0) {
      await TestRanking.bulkWrite(updates);
    }
    
    return await TestRanking.findOne({ testId, user: userId });
  } catch (error) {
    console.error('Error updating ranking:', error);
    return null;
  }
};
```

### Leaderboard Features

- **Real-time ranking**: Updated immediately after test submission
- **Performance metrics**: Score, accuracy, speed
- **Filtering**: By test, series, or category
- **Pagination**: For large participant lists

## Key Features Summary

### Test Series Management
- ✅ Create and manage multiple test series
- ✅ Add/remove tests from series
- ✅ Configure test timing and instructions
- ✅ Add sections and questions
- ✅ Set pricing and discounts
- ✅ Manage categories and languages

### Test Taking Experience
- ✅ Real-time answer submission
- ✅ Time tracking per question
- ✅ Test state management (upcoming, live, results_available)
- ✅ Prevent duplicate attempts
- ✅ Resume interrupted tests

### Results and Analytics
- ✅ Automatic scoring with negative marking
- ✅ Detailed result analysis
- ✅ Section-wise performance
- ✅ Strength/weakness identification
- ✅ Cutoff comparison

### Ranking and Leaderboard
- ✅ Real-time ranking calculation
- ✅ Leaderboard generation
- ✅ Performance comparison
- ✅ Category-based cutoffs

### Access Control
- ✅ Free/Paid test series support
- ✅ Purchase validation
- ✅ Time-based access control
- ✅ Quota-based free access

This comprehensive system provides a full-featured online testing platform suitable for educational institutions, competitive exam preparation, and skill assessment scenarios.