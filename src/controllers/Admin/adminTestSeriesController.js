const TestSeries = require('../../models/TestSeries/TestSeries');

/**
 * Admin Get All Test Series - No access restrictions
 * GET /api/admin/test-series
 */
exports.getAllTestSeries = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, category, subCategory } = req.query;

    // Build query - Admin sees all test series
    let query = { isActive: true };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      query.categories = category;
    }

    if (subCategory) {
      query.subCategories = subCategory;
    }

    // Pagination
    const skip = (page - 1) * limit;

    // Get test series with pagination - LIGHT RESPONSE
    const testSeries = await TestSeries.find(query)
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    // Get total count for pagination
    const total = await TestSeries.countDocuments(query);

    // Transform for admin response (LIGHT - no tests[], sections, questions)
    const transformedSeries = testSeries.map(series => {
      return {
        _id: series._id,
        name: series.name,
        description: series.description,
        thumbnail: series.thumbnail,
        date: series.date,
        maxTests: series.maxTests,
        testsCount: series.tests.length,
        categories: series.categories,
        subCategories: series.subCategories,
        languages: series.languages,
        originalPrice: series.originalPrice,
        discount: series.discount,
        finalPrice: series.finalPrice,
        isActive: series.isActive,
        createdAt: series.createdAt,
        updatedAt: series.updatedAt
        // NO tests[], sections, questions, correct answers - LIGHT RESPONSE
      };
    });

    return res.status(200).json({
      success: true,
      message: 'Test series fetched successfully',
      data: {
        testSeries: transformedSeries,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching test series:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Admin Get Test Series by ID - No access checks
 * GET /api/admin/test-series/:seriesId
 */
exports.getTestSeriesById = async (req, res) => {
  try {
    const { seriesId } = req.params;

    // Find test series (admin can access any series)
    const testSeries = await TestSeries.findById(seriesId)
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code');

    if (!testSeries) {
      return res.status(404).json({
        success: false,
        message: 'Test series not found'
      });
    }

    // Transform for admin response
    const transformedSeries = {
      _id: testSeries._id,
      name: testSeries.name,
      description: testSeries.description,
      thumbnail: testSeries.thumbnail,
      date: testSeries.date,
      maxTests: testSeries.maxTests,
      testsCount: testSeries.tests.length,
      categories: testSeries.categories,
      subCategories: testSeries.subCategories,
      languages: testSeries.languages,
      originalPrice: testSeries.originalPrice,
      discount: testSeries.discount,
      finalPrice: testSeries.finalPrice,
      isActive: testSeries.isActive,
      createdAt: testSeries.createdAt,
      updatedAt: testSeries.updatedAt,
      tests: testSeries.tests.map(test => ({
        _id: test._id,
        testName: test.testName,
        durationInSeconds: test.durationInSeconds,
        positiveMarks: test.positiveMarks,
        negativeMarks: test.negativeMarks,
        isPublished: test.isPublished,
        startTime: test.startTime,
        endTime: test.endTime,
        totalQuestions: test.sections.reduce((total, section) => 
          total + (section.questions ? section.questions.length : 0), 0),
        sections: test.sections.length
      }))
    };

    return res.status(200).json({
      success: true,
      message: 'Test series fetched successfully',
      data: transformedSeries
    });

  } catch (error) {
    console.error('Error fetching test series:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Admin Get Test by ID - Lightweight response (same as user)
 * GET /api/admin/test-series/:seriesId/tests/:testId
 */
exports.getTestById = async (req, res) => {
  try {
    const { seriesId, testId } = req.params;

    // Find test series
    const testSeries = await TestSeries.findById(seriesId);

    if (!testSeries) {
      return res.status(404).json({
        success: false,
        message: 'Test series not found'
      });
    }

    // Find specific test
    const test = testSeries.tests.id(testId);

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found'
      });
    }

    // Calculate test state
    const now = new Date();
    const startTime = new Date(test.startTime);
    const endTime = new Date(test.endTime);
    let testState = 'upcoming';
    if (now >= startTime && now <= endTime) {
      testState = 'live';
    } else if (now > endTime) {
      testState = 'expired';
    }

    // Transform for admin response (lightweight - same as user)
    const transformedTest = {
      _id: test._id,
      testName: test.testName,
      totalMarks: test.sections.reduce((total, section) => {
        return total + section.questions.reduce((secTotal, question) => 
          secTotal + (question.marks || 1), 0);
      }, 0),
      positiveMarks: test.positiveMarks,
      negativeMarks: test.negativeMarks,
      date: test.date || testSeries.date,
      startTime: test.startTime,
      endTime: test.endTime,
      resultPublishTime: test.resultPublishTime,
      isFree: test.isFree || testSeries.isFree,
      testState: testState,
      hasAccess: true,  // Admin always has access
      sections: test.sections.map(section => ({
        _id: section._id,
        title: section.title,
        noOfQuestions: section.questions ? section.questions.length : 0
      }))
    };

    return res.status(200).json({
      success: true,
      message: 'Test fetched successfully',
      data: {
        testSeriesName: testSeries.name,
        test: transformedTest
      }
    });

  } catch (error) {
    console.error('Error fetching test:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};