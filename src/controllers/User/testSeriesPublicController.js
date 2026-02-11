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
      // validity is now a string enum, no populate needed

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
      // validity is now a string enum, no populate needed

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

    // Use pre-calculated finalPrice from the model
    const finalPrice = series.finalPrice ?? calculateFinalPrice(series.originalPrice, series.discount);
    
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
        finalPrice: finalPrice,
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
      data: {
        testSeriesName: testSeries.name,
        test: testData
      }
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
      data: {
        testSeriesName: testSeries.name,
        test: testData
      }
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
      // validity is now a string enum, no populate needed

    // Process test series to return only specified fields
    const processedTestSeries = await Promise.all(
      testSeries.map(async (series) => {
        const hasPurchased = await checkTestSeriesAccess(userId, series._id);
        const seriesObj = series.toObject();
        
        // Use pre-calculated finalPrice from the model
        const finalPrice = seriesObj.finalPrice ?? calculateFinalPrice(seriesObj.originalPrice, seriesObj.discount);
        
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