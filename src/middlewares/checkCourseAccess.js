const Purchase = require('../models/Purchase/Purchase');
const Course = require('../models/Course/Course');

/**
 * Middleware to check if user has access to a course
 */
const checkCourseAccess = async (req, res, next) => {
  try {
    // Validate required parameters
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const userId = req.user._id;
    const courseId = req.params.courseId || req.body.courseId || req.query.courseId || req.params.id;
    const classId = req.params.classId;
    
    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Course ID is required'
      });
    }

    // Find the course to check if it's active
    const course = await Course.findById(courseId);
    if (!course || !course.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or inactive'
      });
    }

    // Derive classIndex safely
    let classIndex = -1;

    if (classId && Array.isArray(course.classes)) {
      classIndex = course.classes.findIndex(
        c => c._id && c._id.toString() === classId
      );
    }

    // If still not found, default safely
    if (classIndex < 0) {
      classIndex = 0;
    }

    // If it's a free course, allow access
    if (course.accessType === 'FREE') {
      req.courseAccess = {
        hasAccess: true,
        isFree: true,
        isPurchased: false,
        classIndex
      };
      return next();
    }

    // Check if it's one of the first 2 classes (free preview)
    if (classIndex < 2) {
      req.courseAccess = {
        hasAccess: true,
        isFree: true,
        isPurchased: false,
        classIndex
      };
      return next();
    }

    // Check if user has purchased the course
    const purchase = await Purchase.findOne({
      user: userId,
      'items.itemType': 'online_course',
      'items.itemId': courseId,
      status: 'completed',
      expiryDate: { $gt: new Date() } // Check if purchase is still valid
    });

    if (!purchase) {
      return res.status(403).json({
        success: false,
        message: 'You need to purchase this course to access this content',
        requiresPurchase: true
      });
    }

    // User has purchased and course is still valid
    req.courseAccess = {
      hasAccess: true,
      isFree: false,
      isPurchased: true,
      classIndex,
      purchase: purchase
    };

    next();
  } catch (error) {
    console.error('Error in checkCourseAccess middleware:', {
      error: error.message,
      stack: error.stack,
      courseId: req.params.courseId || req.params.id,
      classId: req.params.classId,
      userId: req.user?._id
    });
    res.status(500).json({
      success: false,
      message: 'Error checking course access',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Helper function to check course access without middleware
 */
// Helper function to check course purchase validity (course-level access)
const checkCoursePurchase = async (userId, courseId) => {
  try {
    if (!userId || !courseId) {
      return {
        hasPurchase: false,
        isValid: false,
        purchase: null
      };
    }

    const purchase = await Purchase.findOne({
      user: userId,
      'items.itemType': 'online_course',
      'items.itemId': courseId,
      status: 'completed',
      expiryDate: { $gt: new Date() } // Check if purchase is still valid
    });

    return {
      hasPurchase: !!purchase,
      isValid: !!purchase,
      purchase: purchase
    };
  } catch (error) {
    console.error('Error in checkCoursePurchase:', error);
    return {
      hasPurchase: false,
      isValid: false,
      purchase: null,
      error: error.message
    };
  }
};

// Helper function to check class access based on purchase and index (class-level access)
const checkClassAccess = (index, courseAccess) => {
  // If it's a free course, allow access
  if (courseAccess.isFree) {
    return {
      hasAccess: true,
      isFree: true,
      isPurchased: false,
      canWatchVideo: true
    };
  }

  // Check if it's one of the first 2 classes (free preview)
  if (parseInt(index) < 2) {
    return {
      hasAccess: true,
      isFree: true,
      isPurchased: false,
      canWatchVideo: true
    };
  }

  // Check if user has valid purchase
  if (courseAccess.hasPurchase && courseAccess.isValid) {
    return {
      hasAccess: true,
      isFree: false,
      isPurchased: true,
      canWatchVideo: true
    };
  }

  // No access
  return {
    hasAccess: false,
    isFree: false,
    isPurchased: false,
    canWatchVideo: false,
    requiresPurchase: true
  };
};

// Get comprehensive course access context (centralized logic)
const getCourseAccessContext = async (userId, courseId) => {
  try {
    if (!userId || !courseId) {
      return {
        hasPurchase: false,
        isValid: false,
        isFree: false,
        purchase: null,
        expiryDate: null,
        canAccessClass: (index) => false
      };
    }

    // Find the course to check if it's active and access type
    const course = await Course.findById(courseId);
    if (!course || !course.isActive) {
      return {
        hasPurchase: false,
        isValid: false,
        isFree: false,
        purchase: null,
        expiryDate: null,
        canAccessClass: (index) => false,
        reason: 'Course not found or inactive'
      };
    }

    // If it's a free course, allow all access
    if (course.accessType === 'FREE') {
      return {
        hasPurchase: true, // Consider free courses as having "purchase"
        isValid: true,
        isFree: true,
        purchase: null,
        expiryDate: null,
        canAccessClass: (index) => true
      };
    }

    // Check purchase details
    const purchaseCheck = await checkCoursePurchase(userId, courseId);

    return {
      hasPurchase: purchaseCheck.hasPurchase,
      isValid: purchaseCheck.isValid,
      isFree: false,
      purchase: purchaseCheck.purchase,
      expiryDate: purchaseCheck.purchase?.expiryDate || null,
      canAccessClass: (index) => {
        // First 2 classes are always accessible
        if (parseInt(index) < 2) {
          return true;
        }
        // For other classes, check if purchase is valid
        return purchaseCheck.isValid;
      }
    };
  } catch (error) {
    console.error('Error in getCourseAccessContext:', error);
    return {
      hasPurchase: false,
      isValid: false,
      isFree: false,
      purchase: null,
      expiryDate: null,
      canAccessClass: (index) => false,
      error: error.message
    };
  }
};

module.exports = { 
  checkCourseAccess, 
  checkCoursePurchase,
  checkClassAccess,
  getCourseAccessContext
};