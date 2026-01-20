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
