const Purchase = require('../../models/Purchase/Purchase');
const Course = require('../../models/Course/Course');
const TestSeries = require('../../models/TestSeries/TestSeries');
const Publication = require('../../models/Publication/Publication');
const { PurchaseService } = require('../../../services');
const { checkCoursePurchase } = require('../../middlewares/checkCourseAccess');

// Helper function to validate purchase and add access information
const validateAndEnrichPurchase = async (userId, item, itemType) => {
  try {
    let hasAccess = false;
    let isValid = false;
    let expiryDate = null;
    let purchaseDate = null;
    
    // Use PurchaseService for unified access validation
    const accessResult = await PurchaseService.hasAccess(userId, itemType, item._id);
    hasAccess = accessResult;
    
    // Get detailed purchase information
    const purchase = await Purchase.findOne({
      user: userId,
      status: 'completed',
      'items.itemType': itemType,
      'items.itemId': item._id
    }).sort({ createdAt: -1 });
    
    if (purchase) {
      isValid = new Date() <= purchase.expiryDate;
      expiryDate = purchase.expiryDate;
      purchaseDate = purchase.purchaseDate;
    }
    
    return {
      ...item.toObject(),
      hasAccess,
      isValid,
      expiryDate,
      purchaseDate,
      purchaseStatus: isValid ? 'active' : (hasAccess ? 'expired' : 'not_purchased')
    };
  } catch (error) {
    console.error(`Error validating ${itemType} purchase:`, error);
    return {
      ...item.toObject(),
      hasAccess: false,
      isValid: false,
      expiryDate: null,
      purchaseDate: null,
      purchaseStatus: 'error'
    };
  }
};

// Get all purchased courses for the user
exports.getMyPurchasedCourses = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Find all completed purchases for courses
    const purchases = await Purchase.find({ 
      user: userId,
      status: 'completed',
      'items.itemType': 'online_course'
    });
    
    // Extract unique course IDs from purchases
    const courseIds = [...new Set(
      purchases.flatMap(purchase => 
        purchase.items
          .filter(item => item.itemType === 'online_course' && item.itemId)
          .map(item => item.itemId.toString())
      )
    )];
    
    // Get course details with proper population
    const courses = await Course.find({
      _id: { $in: courseIds },
      isActive: true
    })
    .populate('categories', 'name slug description thumbnailUrl')
    .populate('subCategories', 'name slug description thumbnailUrl')
    .populate('languages', 'name code');
    
    // Validate each course and add access information
    const enrichedCourses = await Promise.all(
      courses.map(course => validateAndEnrichPurchase(userId, course, 'online_course'))
    );
    
    // Filter to only include courses with valid purchases
    const purchasedCourses = enrichedCourses.filter(course => course.hasAccess);
    
    res.status(200).json({
      success: true,
      message: 'Purchased courses retrieved successfully',
      data: {
        courses: purchasedCourses,
        totalCount: purchasedCourses.length,
        summary: {
          active: purchasedCourses.filter(c => c.isValid).length,
          expired: purchasedCourses.filter(c => c.hasAccess && !c.isValid).length
        }
      }
    });
  } catch (error) {
    console.error('Error fetching purchased courses:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching purchased courses',
      error: error.message
    });
  }
};

// Get all purchased test series for the user
exports.getMyPurchasedTestSeries = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Find all completed purchases for test series
    const purchases = await Purchase.find({ 
      user: userId,
      status: 'completed',
      'items.itemType': 'test_series'
    });
    
    // Extract unique test series IDs from purchases
    const testSeriesIds = [...new Set(
      purchases.flatMap(purchase => 
        purchase.items
          .filter(item => item.itemType === 'test_series' && item.itemId)
          .map(item => item.itemId.toString())
      )
    )];
    
    // Get test series details with proper population
    const testSeriesList = await TestSeries.find({
      _id: { $in: testSeriesIds },
      isActive: true
    })
    .populate('categories', 'name slug description thumbnailUrl')
    .populate('subCategories', 'name slug description thumbnailUrl')
    .populate('languages', 'name code');
    
    // Validate each test series and add access information
    const enrichedTestSeries = await Promise.all(
      testSeriesList.map(series => validateAndEnrichPurchase(userId, series, 'test_series'))
    );
    
    // Filter to only include test series with valid purchases
    const purchasedTestSeries = enrichedTestSeries.filter(series => series.hasAccess);
    
    res.status(200).json({
      success: true,
      message: 'Purchased test series retrieved successfully',
      data: {
        testSeries: purchasedTestSeries,
        totalCount: purchasedTestSeries.length,
        summary: {
          active: purchasedTestSeries.filter(s => s.isValid).length,
          expired: purchasedTestSeries.filter(s => s.hasAccess && !s.isValid).length
        }
      }
    });
  } catch (error) {
    console.error('Error fetching purchased test series:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching purchased test series',
      error: error.message
    });
  }
};

// Get all purchased publications for the user
exports.getMyPurchasedPublications = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Find all completed purchases for publications
    const purchases = await Purchase.find({ 
      user: userId,
      status: 'completed',
      'items.itemType': 'publication'
    });
    
    // Extract unique publication IDs from purchases
    const publicationIds = [...new Set(
      purchases.flatMap(purchase => 
        purchase.items
          .filter(item => item.itemType === 'publication' && item.itemId)
          .map(item => item.itemId.toString())
      )
    )];
    
    // Get publication details with proper population
    const publications = await Publication.find({
      _id: { $in: publicationIds },
      isActive: true
    })
    .populate('categories', 'name slug description thumbnailUrl')
    .populate('subCategories', 'name slug description thumbnailUrl')
    .populate('languages', 'name code');
    
    // Validate each publication and add access information
    const enrichedPublications = await Promise.all(
      publications.map(pub => validateAndEnrichPurchase(userId, pub, 'publication'))
    );
    
    // Filter to only include publications with valid purchases
    const purchasedPublications = enrichedPublications.filter(pub => pub.hasAccess);
    
    res.status(200).json({
      success: true,
      message: 'Purchased publications retrieved successfully',
      data: {
        publications: purchasedPublications,
        totalCount: purchasedPublications.length,
        summary: {
          active: purchasedPublications.filter(p => p.isValid).length,
          expired: purchasedPublications.filter(p => p.hasAccess && !p.isValid).length
        }
      }
    });
  } catch (error) {
    console.error('Error fetching purchased publications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching purchased publications',
      error: error.message
    });
  }
};

// Get comprehensive dashboard of all purchased content
exports.getMyPurchasedContent = async (req, res) => {
  try {
    const userId = req.user._id;
    const { contentType } = req.query; // Optional filter: 'courses', 'test-series', 'publications'
    
    const response = {
      success: true,
      message: 'Purchased content retrieved successfully',
      data: {}
    };
    
    // Fetch all content types if no specific filter
    const fetchAll = !contentType;
    
    if (fetchAll || contentType === 'courses') {
      const purchases = await Purchase.find({ 
        user: userId,
        status: 'completed',
        'items.itemType': 'online_course'
      });
      
      const courseIds = [...new Set(purchases.flatMap(p => 
        p.items.filter(i => i.itemType === 'online_course' && i.itemId)
         .map(i => i.itemId.toString())
      ))];
      
      const courses = await Course.find({
        _id: { $in: courseIds },
        isActive: true
      }).populate('categories subCategories languages');
      
      const enriched = await Promise.all(
        courses.map(c => validateAndEnrichPurchase(userId, c, 'online_course'))
      );
      
      response.data.courses = {
        items: enriched.filter(c => c.hasAccess),
        count: 0,
        active: 0,
        expired: 0
      };
      response.data.courses.count = response.data.courses.items.length;
      response.data.courses.active = response.data.courses.items.filter(c => c.isValid).length;
      response.data.courses.expired = response.data.courses.items.filter(c => c.hasAccess && !c.isValid).length;
    }
    
    if (fetchAll || contentType === 'test-series') {
      const purchases = await Purchase.find({ 
        user: userId,
        status: 'completed',
        'items.itemType': 'test_series'
      });
      
      const testSeriesIds = [...new Set(purchases.flatMap(p => 
        p.items.filter(i => i.itemType === 'test_series' && i.itemId)
         .map(i => i.itemId.toString())
      ))];
      
      const testSeries = await TestSeries.find({
        _id: { $in: testSeriesIds },
        isActive: true
      }).populate('categories subCategories languages');
      
      const enriched = await Promise.all(
        testSeries.map(s => validateAndEnrichPurchase(userId, s, 'test_series'))
      );
      
      response.data.testSeries = {
        items: enriched.filter(s => s.hasAccess),
        count: 0,
        active: 0,
        expired: 0
      };
      response.data.testSeries.count = response.data.testSeries.items.length;
      response.data.testSeries.active = response.data.testSeries.items.filter(s => s.isValid).length;
      response.data.testSeries.expired = response.data.testSeries.items.filter(s => s.hasAccess && !s.isValid).length;
    }
    
    if (fetchAll || contentType === 'publications') {
      const purchases = await Purchase.find({ 
        user: userId,
        status: 'completed',
        'items.itemType': 'publication'
      });
      
      const publicationIds = [...new Set(purchases.flatMap(p => 
        p.items.filter(i => i.itemType === 'publication' && i.itemId)
         .map(i => i.itemId.toString())
      ))];
      
      const publications = await Publication.find({
        _id: { $in: publicationIds },
        isActive: true
      }).populate('categories subCategories languages');
      
      const enriched = await Promise.all(
        publications.map(p => validateAndEnrichPurchase(userId, p, 'publication'))
      );
      
      response.data.publications = {
        items: enriched.filter(p => p.hasAccess),
        count: 0,
        active: 0,
        expired: 0
      };
      response.data.publications.count = response.data.publications.items.length;
      response.data.publications.active = response.data.publications.items.filter(p => p.isValid).length;
      response.data.publications.expired = response.data.publications.items.filter(p => p.hasAccess && !p.isValid).length;
    }
    
    // Add summary statistics
    response.data.summary = {
      totalItems: (
        (response.data.courses?.count || 0) +
        (response.data.testSeries?.count || 0) +
        (response.data.publications?.count || 0)
      ),
      totalActive: (
        (response.data.courses?.active || 0) +
        (response.data.testSeries?.active || 0) +
        (response.data.publications?.active || 0)
      ),
      totalExpired: (
        (response.data.courses?.expired || 0) +
        (response.data.testSeries?.expired || 0) +
        (response.data.publications?.expired || 0)
      )
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching purchased content dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching purchased content',
      error: error.message
    });
  }
};

// Get detailed purchase history with content details
exports.getPurchaseHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { limit = 20, page = 1 } = req.query;
    
    const skip = (page - 1) * limit;
    
    // Get purchase history
    const purchases = await Purchase.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const totalPurchases = await Purchase.countDocuments({ user: userId });
    
    // Enrich purchase data with content details and access status
    const enrichedPurchases = await Promise.all(
      purchases.map(async (purchase) => {
        const enrichedItems = await Promise.all(
          purchase.items.map(async (item) => {
            let contentDetails = null;
            let modelName = '';
            
            switch(item.itemType) {
              case 'online_course':
                modelName = 'Course';
                contentDetails = await Course.findById(item.itemId)
                  .populate('categories subCategories languages');
                break;
              case 'test_series':
                modelName = 'TestSeries';
                contentDetails = await TestSeries.findById(item.itemId)
                  .populate('categories subCategories languages');
                break;
              case 'publication':
                modelName = 'Publication';
                contentDetails = await Publication.findById(item.itemId)
                  .populate('categories subCategories languages');
                break;
            }
            
            const hasAccess = await PurchaseService.hasAccess(userId, item.itemType, item.itemId);
            const isValid = purchase.status === 'completed' && new Date() <= purchase.expiryDate;
            
            return {
              ...item.toObject(),
              content: contentDetails ? {
                ...contentDetails.toObject(),
                hasAccess,
                isValid,
                expiryDate: purchase.expiryDate,
                purchaseDate: purchase.purchaseDate
              } : null
            };
          })
        );
        
        return {
          ...purchase.toObject(),
          items: enrichedItems
        };
      })
    );
    
    res.status(200).json({
      success: true,
      message: 'Purchase history retrieved successfully',
      data: {
        purchases: enrichedPurchases,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalPurchases / limit),
          totalItems: totalPurchases,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching purchase history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching purchase history',
      error: error.message
    });
  }
};