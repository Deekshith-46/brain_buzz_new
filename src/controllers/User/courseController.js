const Course = require('../../models/Course/Course');
const Language = require('../../models/Course/Language');
const Purchase = require('../../models/Purchase/Purchase');
const { PurchaseService } = require('../../../services');
const { checkCoursePurchase, checkClassAccess, getCourseAccessContext } = require('../../middlewares/checkCourseAccess');

// Helper function to handle database errors
const handleDatabaseError = (error) => {
  console.error('Database error:', error);
  
  // Check for specific error types and return appropriate status codes
  if (error.name === 'CastError') {
    return {
      statusCode: 400,
      message: 'Invalid ID format',
      error: error.message
    };
  }
  
  if (error.name === 'ValidationError') {
    return {
      statusCode: 400,
      message: 'Validation error',
      error: error.message
    };
  }
  
  if (error.code === 11000) {
    return {
      statusCode: 409,
      message: 'Duplicate entry error',
      error: error.message
    };
  }
  
  // Default error response
  return {
    statusCode: 500,
    message: 'Internal server error',
    error: error.message
  };
};

// Note: checkCoursePurchase is now imported from middleware and uses centralized access logic
// The old implementation using PurchaseService.hasAccess was replaced with getCourseAccessContext for better performance

// Helper function to calculate finalPrice from originalPrice and discountPrice
const calculateFinalPrice = (originalPrice, discountPrice) => {
  const discountAmount = typeof discountPrice === 'number' && discountPrice >= 0
    ? discountPrice
    : 0;
  return Math.max(0, originalPrice - discountAmount);
};

// Helper function to process classes based on access
const processClassesForUser = (classes, hasPurchasedAndValid, isAdmin = false) => {
  // Sort classes by order field if available, otherwise keep original order
  const sortedClasses = [...classes].sort((a, b) => {
    if (a.order !== undefined && b.order !== undefined) {
      return a.order - b.order;
    }
    if (a.order !== undefined) return -1;
    if (b.order !== undefined) return 1;
    return 0;
  });

  // Admin has full access to all classes
  if (isAdmin) {
    return sortedClasses.map(cls => ({
      ...cls.toObject ? cls.toObject() : cls,
      isLocked: false,
      hasAccess: true,
    }));
  }

  // Process classes: use isFree field, rest require purchase and valid expiry
  return sortedClasses.map((cls, index) => {
    // First 2 classes are free for users
    const isFreeClass = index < 2;
    const hasAccess = isFreeClass || (hasPurchasedAndValid === true);
    const isLocked = !hasAccess;

    const classObj = cls.toObject ? cls.toObject() : cls;
    
    // If locked, hide videoUrl but keep other metadata
    if (isLocked) {
      const { videoUrl, ...rest } = classObj;
      return {
        ...rest,
        isFree: isFreeClass,
        isLocked: true,
        hasAccess: false,
      };
    }

    return {
      ...classObj,
      isFree: isFreeClass,
      isLocked: false,
      hasAccess: true,
    };
  });
};

// Public: list courses (primarily ONLINE_COURSE) with optional filters
exports.listCourses = async (req, res) => {
  try {
    const { contentType, category, subCategory, language, lang } = req.query;
    const userId = req.user?._id;

    const filter = {
      isActive: true,
    };

    // default to ONLINE_COURSE when not provided
    filter.contentType = contentType || 'ONLINE_COURSE';

    if (category) filter.categories = category;
    if (subCategory) filter.subCategories = subCategory;
    if (language) filter.languages = language;
    if (lang) {
      const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const langDoc = await Language.findOne({
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

    const courses = await Course.find(filter)
      .populate('categories', 'name slug description thumbnailUrl')
      .populate('subCategories', 'name slug description thumbnailUrl')
      .populate('languages', 'name code')
      .populate('validities', 'label durationInDays');

    // Process courses to return only specified fields
    const processedCourses = await Promise.all(
      courses.map(async (course) => {
        // Use centralized access context to check course-level purchase validity
        const accessContext = await getCourseAccessContext(userId, course._id);
        const hasPurchased = accessContext.hasPurchase;
        const isValid = accessContext.isValid;
        const courseObj = course.toObject();
        
        // Calculate finalPrice
        const finalPrice = calculateFinalPrice(courseObj.originalPrice, courseObj.discountPrice);
        
        // Return only the requested fields
        const filteredCourse = {
          _id: courseObj._id,
          name: courseObj.name,
          thumbnailUrl: courseObj.thumbnailUrl,
          originalPrice: courseObj.originalPrice,
          discountPrice: courseObj.discountPrice,
          finalPrice: finalPrice,
          languages: courseObj.languages,
          validities: courseObj.validities,
          hasPurchased: hasPurchased,
          isValid: isValid
        };
        
        return filteredCourse;
      })
    );

    return res.status(200).json({ data: processedCourses });
  } catch (error) {
    const errorResponse = handleDatabaseError(error);
    return res.status(errorResponse.statusCode).json({
      message: errorResponse.message,
      error: errorResponse.error
    });
  }
};

// Public: get single course by id
exports.getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;
    const userRole = req.user?.role;

    const course = await Course.findOne({
      _id: id,
      isActive: true,
    })
      .populate('categories', 'name slug description thumbnailUrl')
      .populate('subCategories', 'name slug description thumbnailUrl')
      .populate('languages', 'name code')
      .populate('validities', 'label durationInDays');

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check access based on role
    let hasPurchased = false;
    let isValid = false;
    let accessInfo = { hasPurchased: false, isValid: false };

    // Admin has full access to all classes
    if (userRole === 'ADMIN') {
      // Admin bypass - no purchase needed
    } else {
      // Use centralized access context to avoid multiple DB calls
      const accessContext = await getCourseAccessContext(userId, id);
      hasPurchased = accessContext.hasPurchase;
      isValid = accessContext.isValid;
      accessInfo = {
        hasPurchased: accessContext.hasPurchase,
        isValid: accessContext.isValid,
        expiryDate: accessContext.expiryDate
      };
    }

    // Process classes based on access (admin has full access)
    const courseObj = course.toObject();
    const isAdmin = userRole === 'ADMIN';
    
    // For non-admin users, use centralized access context to determine class access
    if (!isAdmin && userId) {
      // Fetch access context once to avoid multiple DB calls
      const accessContext = await getCourseAccessContext(userId, id);
      
      // Process classes using the centralized access context
      courseObj.classes = course.classes.map((cls, index) => {
        const canAccessClass = accessContext.canAccessClass(index);
        
        if (canAccessClass) {
          return {
            ...cls.toObject(),
            isFree: index < 2,
            isLocked: false,
            hasAccess: true,
          };
        } else {
          // If locked, hide videoUrl but keep other metadata
          const { videoUrl, ...rest } = cls.toObject();
          return {
            ...rest,
            isFree: index < 2,
            isLocked: true,
            hasAccess: false,
          };
        }
      });
    } else {
      // Admin has full access to all classes
      courseObj.classes = processClassesForUser(course.classes, true, isAdmin);
    }
    
    courseObj.hasPurchased = isAdmin ? true : hasPurchased;
    courseObj.isPurchaseValid = isAdmin ? true : isValid;
    courseObj.expiryDate = isAdmin ? null : accessInfo.expiryDate;
    
    // Calculate and add finalPrice
    if (courseObj.originalPrice !== undefined) {
      courseObj.finalPrice = calculateFinalPrice(courseObj.originalPrice, courseObj.discountPrice);
    }

    return res.status(200).json({ data: courseObj });
  } catch (error) {
    const errorResponse = handleDatabaseError(error);
    return res.status(errorResponse.statusCode).json({
      message: errorResponse.message,
      error: errorResponse.error
    });
  }
};

// Get a specific course class/video
exports.getCourseClass = async (req, res) => {
  try {
    const { courseId, classId } = req.params;
    const userId = req.user?._id;

    const course = await Course.findOne({
      _id: courseId,
      isActive: true,
    })
      .populate('categories', 'name slug description thumbnailUrl')
      .populate('subCategories', 'name slug description thumbnailUrl')
      .populate('languages', 'name code')
      .populate('validities', 'label durationInDays');

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Validate that course has classes array
    if (!course.classes || !Array.isArray(course.classes)) {
      return res.status(404).json({ message: 'Course has no classes' });
    }

    // Find the specific class
    const classObj = course.classes.id(classId);
    if (!classObj) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Use centralized access context
    const accessContext = await getCourseAccessContext(userId, courseId);
    const classIndex = course.classes.findIndex(c => c._id && c._id.toString() === classId);
    const canAccessClass = accessContext.canAccessClass(classIndex >= 0 ? classIndex : 0);

    if (!canAccessClass) {
      return res.status(403).json({ 
        success: false, 
        message: 'Please purchase this course to access this content',
        requiresPurchase: true
      });
    }

    return res.status(200).json({ 
      success: true,
      data: classObj 
    });
  } catch (error) {
    console.error('Error in getCourseClass:', {
      error: error.message,
      stack: error.stack,
      courseId: req.params.courseId,
      classId: req.params.classId,
      userId: req.user?._id
    });
    const errorResponse = handleDatabaseError(error);
    return res.status(errorResponse.statusCode).json({
      success: false,
      message: errorResponse.message,
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};



// Get distinct categories for active courses
exports.getCourseCategories = async (req, res) => {
  try {
    const { contentType } = req.query;
    
    // Default to ONLINE_COURSE
    const type = contentType || 'ONLINE_COURSE';
    
    // Find active courses and get distinct categories
    const courses = await Course.find({ 
      contentType: type, 
      isActive: true 
    }).populate('categories', 'name slug description thumbnailUrl');

    // Extract unique categories
    const categories = [];
    const categoryIds = new Set();
    
    courses.forEach(course => {
      if (course.categories) {
        course.categories.forEach(cat => {
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
    console.error('Error fetching course categories:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get distinct subcategories for active courses based on category and language
exports.getCourseSubCategories = async (req, res) => {
  try {
    const { category, language, lang } = req.query;
    
    const filter = {
      contentType: 'ONLINE_COURSE',
      isActive: true,
      categories: category
    };

    // Handle language filter
    if (language) {
      filter.languages = language;
    } else if (lang) {
      const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

    const courses = await Course.find(filter).populate('subCategories', 'name slug description thumbnailUrl');

    // Extract unique subcategories
    const subCategories = [];
    const subCategoryIds = new Set();
    
    courses.forEach(course => {
      if (course.subCategories) {
        course.subCategories.forEach(subCat => {
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
    const errorResponse = handleDatabaseError(error);
    return res.status(errorResponse.statusCode).json({
      message: errorResponse.message,
      error: errorResponse.error
    });
  }
};