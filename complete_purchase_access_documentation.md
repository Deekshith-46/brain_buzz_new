# Complete Purchase and Access Control Documentation

## Table of Contents
1. [Overview](#overview)
2. [Test Series Implementation](#test-series-implementation)
3. [Online Courses Implementation](#online-courses-implementation)
4. [Publications Implementation](#publications-implementation)
5. [Purchase Service](#purchase-service)
6. [Access Control Middleware](#access-control-middleware)
7. [Payment Integration](#payment-integration)
8. [Validation and Access Flags](#validation-and-access-flags)

## Overview

This documentation covers the complete implementation of purchase and access control for Test Series, Online Courses, and Publications in the Brain Buzz Backend system. The system implements a centralized access control mechanism using PurchaseService with proper validation and access flags.

## Test Series Implementation

### Admin Side (src/controllers/Admin/testSeriesController.js)

```javascript
// Admin controller for managing test series
const TestSeries = require('../../models/TestSeries/TestSeries');

// Create Test Series (admin)
exports.createTestSeries = async (req, res) => {
  try {
    // Implementation for admin to create test series
    // Includes validation, file uploads, and content management
  } catch (error) {
    // Error handling
  }
};

// Update Test Series (admin)
exports.updateTestSeries = async (req, res) => {
  try {
    // Implementation for admin to update test series
  } catch (error) {
    // Error handling
  }
};
```

### User Side (src/controllers/User/testSeriesPublicController.js)

```javascript
// User controller for accessing test series
const TestSeries = require('../../models/TestSeries/TestSeries');
const { PurchaseService } = require('../../../services');

// Helper to check if user has access to a test series
const checkTestSeriesAccess = async (userId, seriesId) => {
  if (!userId) return false;
  
  // Use the unified PurchaseService for centralized access control
  const { PurchaseService } = require('../../../services');
  const hasAccess = await PurchaseService.hasAccess(userId, 'TEST_SERIES', seriesId);
  
  return hasAccess;
};

// List all test series (public)
exports.listPublicTestSeries = async (req, res) => {
  try {
    const { category, subCategory, lang } = req.query;
    const userId = req.user?._id;
    const userRole = req.user?.role;

    const filter = {
      contentType: 'TEST_SERIES',
      $or: [
        { isActive: true },
        { isActive: { $exists: false } }
      ]
    };
    
    if (category) filter.categories = category;
    if (subCategory) filter.subCategories = subCategory;
    
    const seriesList = await TestSeries.find(filter)
      .select('name description thumbnail date noOfTests tests categories subCategories isActive languages validity originalPrice discount')
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code')
      .populate('validity', 'label durationInDays');

    // For each series, check if user has access
    const seriesWithAccess = await Promise.all(seriesList.map(async (series) => {
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
      data: seriesWithAccess
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
      const isFree = index < (series.freeQuota || 2);
      const testHasAccess = userRole === 'ADMIN' || hasAccess || isFree;
      
      return {
        _id: test._id,
        testName: test.testName,
        noOfQuestions: test.noOfQuestions,
        totalMarks: test.totalMarks,
        positiveMarks: test.positiveMarks,
        negativeMarks: test.negativeMarks,
        date: test.date,
        startTime: test.startTime,
        endTime: test.endTime,
        testState: getTestState(test),
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
        finalPrice: calculateFinalPrice(series.originalPrice, series.discount),
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

// Purchase initiation for test series
exports.initiatePurchase = async (req, res) => {
  try {
    const { seriesId } = req.params;
    const { couponCode } = req.body;
    const userId = req.user._id;

    // Check if already purchased using centralized access control
    const hasAccess = await require('../../../services').PurchaseService.hasAccess(userId, 'TEST_SERIES', seriesId);
    if (hasAccess) {
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
      [{ itemType: 'TEST_SERIES', itemId: seriesId }],
      paymentId,
      couponCode
    );

    res.status(200).json({
      success: true,
      data: {
        paymentId: purchase.paymentId,
        amount: purchase.finalAmount,
        currency: 'INR',
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
```

## Online Courses Implementation

### Admin Side (src/controllers/Admin/courseController.js)

```javascript
// Admin controller for managing courses
const Course = require('../../models/Course/Course');

// Create Course (admin)
exports.createCourse = async (req, res) => {
  try {
    // Implementation for admin to create courses
    // Includes validation, file uploads, and content management
  } catch (error) {
    // Error handling
  }
};

// Update Course (admin)
exports.updateCourse = async (req, res) => {
  try {
    // Implementation for admin to update courses
  } catch (error) {
    // Error handling
  }
};
```

### User Side (src/controllers/User/courseController.js)

```javascript
// User controller for accessing courses
const Course = require('../../models/Course/Course');
const Purchase = require('../../models/Purchase/Purchase');
const { PurchaseService } = require('../../../services');
const { checkCoursePurchase, checkClassAccess, getCourseAccessContext } = require('../../middlewares/checkCourseAccess');

// Helper function to calculate finalPrice from originalPrice and discountPrice
const calculateFinalPrice = (originalPrice, discountPrice) => {
  const discountAmount = typeof discountPrice === 'number' && discountPrice >= 0
    ? discountPrice
    : 0;
  return Math.max(0, originalPrice - discountAmount);
};

// List courses (public)
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

// Get single course by id
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
      
      // Add purchase-related flags
      courseObj.hasPurchased = accessContext.hasPurchase;
      courseObj.isPurchaseValid = accessContext.isValid;
      courseObj.expiryDate = accessContext.expiryDate || null;
    } else {
      // Admin has full access to all classes
      courseObj.classes = processClassesForUser(course.classes, true, isAdmin);
      
      // Add admin flags
      courseObj.hasPurchased = true;
      courseObj.isPurchaseValid = true;
      courseObj.expiryDate = null;
    }

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
```

## Publications Implementation

### Admin Side (src/controllers/Admin/eBookController.js)

```javascript
// Admin controller for managing publications
const Publication = require('../../models/Publication/Publication');

// Create Publication (admin)
exports.createPublication = async (req, res) => {
  try {
    // Implementation for admin to create publications
    // Includes validation, file uploads, and content management
  } catch (error) {
    // Error handling
  }
};

// Update Publication (admin)
exports.updatePublication = async (req, res) => {
  try {
    // Implementation for admin to update publications
  } catch (error) {
    // Error handling
  }
};
```

### User Side (src/controllers/User/publicationController.js)

```javascript
// User controller for accessing publications
const Publication = require('../../models/Publication/Publication');
const { PurchaseService } = require('../../../services');

// Helper function to check if user has purchased a publication
const checkPublicationPurchase = async (userId, publicationId) => {
  if (!userId) return false;
  try {
    return await PurchaseService.hasAccess(userId, 'PUBLICATION', publicationId);
  } catch (error) {
    console.error('Error checking publication purchase:', error);
    return false;
  }
};

// Helper function to calculate finalPrice from originalPrice and discountPrice
const calculateFinalPrice = (originalPrice, discountPrice) => {
  const discountAmount = typeof discountPrice === 'number' && discountPrice >= 0
    ? discountPrice
    : 0;
  return Math.max(0, originalPrice - discountAmount);
};

// Public: list publications with optional filters
exports.listPublications = async (req, res) => {
  try {
    const { category, subCategory, language } = req.query;

    const filter = {
      contentType: 'PUBLICATION',
      isActive: true,
    };

    if (category) filter.categories = category;
    if (subCategory) filter.subCategories = subCategory;
    if (language) filter.languages = language;

    const publications = await Publication.find(filter)
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code')
      .populate('validities', 'label durationInDays');
    
    // Process publications to return only specified fields and calculate finalPrice
    const userId = req.user?._id;
    const processedPublications = await Promise.all(
      publications.map(async (publication) => {
        const hasPurchased = await checkPublicationPurchase(userId, publication._id);
        const publicationObj = publication.toObject();
        
        // Calculate finalPrice
        const finalPrice = calculateFinalPrice(publicationObj.originalPrice, publicationObj.discountPrice);
        
        // Return only the requested fields (security: NEVER expose bookFileUrl directly)
        const filteredPublication = {
          _id: publicationObj._id,
          name: publicationObj.name,
          thumbnailUrl: publicationObj.thumbnailUrl,
          originalPrice: publicationObj.originalPrice,
          discountPrice: publicationObj.discountPrice,
          finalPrice: finalPrice,
          languages: publicationObj.languages,
          validities: publicationObj.validities,
          hasPurchased: hasPurchased,
          // ✅ NEW: Access control fields instead of direct URL
          availableIn: publicationObj.availableIn,
          isPreviewEnabled: publicationObj.isPreviewEnabled,
          previewPages: publicationObj.previewPages,
          canDownload: hasPurchased && publicationObj.availableIn !== 'HARDCOPY'
        };
        
        return filteredPublication;
      })
    );

    return res.status(200).json({ data: processedPublications });
  } catch (error) {
    const errorResponse = handleDatabaseError(error);
    return res.status(errorResponse.statusCode).json({
      message: errorResponse.message,
      error: errorResponse.error
    });
  }
};

// Public: get single publication by id
exports.getPublicationById = async (req, res) => {
  try {
    const { id } = req.params;

    const publication = await Publication.findOne({
      _id: id,
      contentType: 'PUBLICATION',
      isActive: true,
    })
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code')
      .populate('validities', 'label durationInDays');

    if (!publication) {
      return res.status(404).json({ message: 'Publication not found' });
    }

    const hasPurchased = await checkPublicationPurchase(req.user?._id, publication._id);
    const publicationObj = publication.toObject();
    
    // Calculate finalPrice
    const finalPrice = calculateFinalPrice(publicationObj.originalPrice, publicationObj.discountPrice);
    
    // Return only the requested fields (security: NEVER expose bookFileUrl directly)
    const filteredPublication = {
      _id: publicationObj._id,
      name: publicationObj.name,
      thumbnailUrl: publicationObj.thumbnailUrl,
      originalPrice: publicationObj.originalPrice,
      discountPrice: publicationObj.discountPrice,
      finalPrice: finalPrice,
      languages: publicationObj.languages,
      validities: publicationObj.validities,
      hasPurchased: hasPurchased,
      // Include other necessary fields
      startDate: publicationObj.startDate,
      categories: publicationObj.categories,
      subCategories: publicationObj.subCategories,
      availableIn: publicationObj.availableIn,
      shortDescription: publicationObj.shortDescription,
      detailedDescription: publicationObj.detailedDescription,
      authors: publicationObj.authors,
      galleryImages: publicationObj.galleryImages,
      // ✅ NEW: Access control fields instead of direct URL
      isPreviewEnabled: publicationObj.isPreviewEnabled,
      previewPages: publicationObj.previewPages,
      canDownload: hasPurchased && publicationObj.availableIn !== 'HARDCOPY',
      isActive: publicationObj.isActive,
      createdAt: publicationObj.createdAt,
      updatedAt: publicationObj.updatedAt
    };
    
    return res.status(200).json({ data: filteredPublication });
  } catch (error) {
    const errorResponse = handleDatabaseError(error);
    return res.status(errorResponse.statusCode).json({
      message: errorResponse.message,
      error: errorResponse.error
    });
  }
};

// ✅ NEW: Secure book file access - NEVER expose Cloudinary URLs directly
exports.getBookFile = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    const publication = await Publication.findById(id);
    if (!publication) {
      return res.status(404).json({ message: 'Publication not found' });
    }

    // ❌ Hardcopy has no digital file
    if (publication.availableIn === 'HARDCOPY') {
      return res.status(403).json({
        message: 'This publication is available as hardcopy only'
      });
    }

    // ✅ Admin always allowed
    if (req.user?.role === 'ADMIN') {
      return res.redirect(publication.bookFileUrl);
    }

    // ✅ User must have purchased
    const hasPurchased = await checkPublicationPurchase(userId, id);

    if (!hasPurchased) {
      return res.status(403).json({
        message: 'Please purchase to access this publication'
      });
    }

    // ✅ Purchased users can access
    return res.redirect(publication.bookFileUrl);

  } catch (error) {
    console.error('Error accessing book file:', error);
    return res.status(500).json({ message: 'Error accessing book file' });
  }
};
```

## Purchase Service

### (services/purchaseService.js)

```javascript
// services/purchaseService.js
const mongoose = require('mongoose');
const Purchase = require('../src/models/Purchase/Purchase');
const Coupon = require('../src/models/Coupon/Coupon');

class PurchaseService {
  // Get applicable coupons for items
  static async getApplicableCoupons(items, userId) {
    // Implementation for coupon management
  }

  // Validate coupon and calculate discount
  static async validateCoupon(code, items, userId) {
    // Implementation for coupon validation
  }

  // Create a purchase record
  static async createPurchase(userId, items, paymentId, couponCode = null) {
    // Normalize item types to uppercase to match enum values
    const normalizedItems = items.map(item => ({
      ...item,
      itemType: item.itemType.toUpperCase()
    }));
    
    // Calculate total amount
    let totalAmount = 0;
    const itemPrices = {};
    
    const { getOriginalPrice } = require('../src/utils/pricingUtils');

    for (const item of normalizedItems) {
      const price = await getOriginalPrice(item);
      itemPrices[item.itemId] = price;
      totalAmount += price;
    }

    let discountAmount = 0;
    let finalAmount = totalAmount;
    let couponData = null;

    // Apply coupon if provided
    if (couponCode) {
      // Use centralized coupon utility to resolve and validate coupon
      let coupon;
      try {
        coupon = await require('../src/utils/couponUtils').resolveCoupon(couponCode, normalizedItems, userId);
      } catch (error) {
        throw new Error(error.message);
      }
      
      // Calculate discount
      const { calculateCouponDiscount } = require('../src/utils/couponUtils');
      discountAmount = calculateCouponDiscount(coupon, totalAmount);
      
      finalAmount = Math.max(0, totalAmount - discountAmount);
      couponData = {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue
      };
    }

    // Set expiry date based on validity from the purchased items
    const expiryDate = await this.calculateExpiryDateFromItems(normalizedItems);

    // Create purchase record
    const purchase = new Purchase({
      user: userId,
      items: normalizedItems,  // Use normalized items
      amount: totalAmount,
      discountAmount,
      finalAmount,
      coupon: couponData,
      paymentId,
      status: 'pending',
      expiryDate
    });

    await purchase.save();
    return purchase;
  }

  // Helper method to calculate expiry date based on purchased items
  static async calculateExpiryDateFromItems(items) {
    // Check if any item has lifetime access (e.g., ebooks)
    for (const item of items) {
      if (item.itemType === 'PUBLICATION') {
        const Publication = mongoose.model('Publication');
        const publication = await Publication.findById(item.itemId);
        if (publication && (publication.availableIn === 'EBOOK' || publication.availableIn === 'BOTH')) {
          return null; // Return null for lifetime access
        }
      }
    }
    
    // If no lifetime access items, calculate based on validity
    // Default to 1 year if no specific validity is found
    let maxValidityInDays = 365;
    
    for (const item of items) {
      let validityInDays = 365; // Default to 1 year
      
      if (item.itemType === 'ONLINE_COURSE') {
        const Course = mongoose.model('Course');
        const course = await Course.findById(item.itemId);
        if (course && course.validities && course.validities.length > 0) {
          // Get the first validity option and use its duration
          const validityOption = await mongoose.model('ValidityOption').findById(course.validities[0]);
          if (validityOption && validityOption.durationInDays) {
            validityInDays = validityOption.durationInDays;
          }
        }
      } else if (item.itemType === 'TEST_SERIES') {
        const TestSeries = mongoose.model('TestSeries');
        const testSeries = await TestSeries.findById(item.itemId);
        if (testSeries && testSeries.validity) {
          const validityOption = await mongoose.model('ValidityOption').findById(testSeries.validity);
          if (validityOption && validityOption.durationInDays) {
            validityInDays = validityOption.durationInDays;
          }
        }
      } else if (item.itemType === 'PUBLICATION') {
        // Handle publication validity for hardcopy-only publications
        const Publication = mongoose.model('Publication');
        const publication = await Publication.findById(item.itemId);
        if (publication && publication.validity) {
          const validityOption = await mongoose.model('ValidityOption').findById(publication.validity);
          if (validityOption && validityOption.durationInDays) {
            validityInDays = validityOption.durationInDays;
          }
        }
      }
      
      // Use the maximum validity period among all items
      maxValidityInDays = Math.max(maxValidityInDays, validityInDays);
    }
    
    // Create expiry date based on validity in days
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + maxValidityInDays);
    return expiryDate;
  }
  
  // Helper method to verify payment with payment gateway
  static async verifyWithPaymentGateway(paymentId, amount) {
    // Implement actual payment gateway verification
    // This is a mock implementation
    return new Promise(resolve => {
      setTimeout(() => {
        // In a real implementation, verify with your payment gateway
        resolve(true);
      }, 1000);
    });
  }

  // Check if user has access to an item
  static async hasAccess(userId, itemType, itemId) {
    if (!userId || !itemId || !itemType) return false;

    const normalizedType = itemType.toUpperCase();

    const purchase = await Purchase.findOne({
      user: userId,
      status: 'completed',
      'items.itemId': itemId,
      'items.itemType': normalizedType,
      $or: [
        { expiryDate: { $gt: new Date() } },
        { expiryDate: null }
      ]
    }).lean();

    return !!purchase;
  }
}

module.exports = PurchaseService;
```

## Access Control Middleware

### (src/middlewares/checkContentAccess.js)

```javascript
const Course = require('../models/Course/Course');
const TestSeries = require('../models/TestSeries/TestSeries');
const DailyQuiz = require('../models/Quiz/DailyQuiz');
const LiveClass = require('../models/LiveClass');
const Publication = require('../models/Publication/Publication');
const EBook = require('../models/EBook/EBook');
const CurrentAffair = require('../models/CurrentAffairs/CurrentAffairBase');
const Purchase = require('../models/Purchase/Purchase');
const PurchaseService = require('../../services/purchaseService');

// Map content types to models
const contentModels = {
  'ONLINE_COURSE': Course,
  'TEST_SERIES': TestSeries,
  'DAILY_QUIZ': DailyQuiz,
  'LIVE_CLASS': LiveClass,
  'PUBLICATION': Publication,
  'E_BOOK': EBook,
  'CURRENT_AFFAIRS': CurrentAffair
};

module.exports = async (req, res, next) => {
  const userId = req.user?._id;
  const { contentType, itemId, subItemId } = req.params;

  // Validate content type
  if (!contentModels[contentType]) {
    return res.status(400).json({
      success: false,
      message: "Invalid content type"
    });
  }

  // 1️⃣ Fetch main content
  const ContentModel = contentModels[contentType];
  const item = await ContentModel.findById(itemId);
  
  if (!item) {
    return res.status(404).json({
      success: false,
      message: "Content not found"
    });
  }

  // 2️⃣ FREE module → allow
  if (item.accessType === "FREE") return next();

  // 3️⃣ PAID module + FREE sub-item → allow
  if (subItemId) {
    let subItem = null;
    
    // Handle different sub-item types
    if (contentType === 'ONLINE_COURSE' && item.classes) {
      subItem = item.classes.id(subItemId);
    } else if (contentType === 'TEST_SERIES' && item.tests) {
      subItem = item.tests.id(subItemId);
    }
    
    if (subItem?.isFree) return next();
  }

  // 4️⃣ Check purchase using PurchaseService for single source of truth
  // Map content type to item type for purchase lookup
  const contentTypeToItemTypeMap = {
    'ONLINE_COURSE': 'ONLINE_COURSE',
    'TEST_SERIES': 'TEST_SERIES',
    'PUBLICATION': 'PUBLICATION',
    'DAILY_QUIZ': 'DAILY_QUIZ',
    'LIVE_CLASS': 'LIVE_CLASS',
    'E_BOOK': 'E_BOOK',
    'CURRENT_AFFAIRS': 'CURRENT_AFFAIRS'
  };
  
  const itemType = contentTypeToItemTypeMap[contentType];
  
  if (!itemType) {
    return res.status(400).json({
      success: false,
      message: "Invalid content type for purchase check"
    });
  }
  
  const hasAccess = await PurchaseService.hasAccess(userId, itemType, itemId);

  if (!hasAccess) {
    return res.status(403).json({
      success: false,
      message: "Please purchase to access this content"
    });
  }

  next();
};
```

## Payment Integration

### (src/controllers/User/paymentController.js)

```javascript
// Payment verification controller
const crypto = require('crypto');
const Razorpay = require('razorpay');
const TestSeries = require('../../models/TestSeries/TestSeries');
const Course = require('../../models/Course/Course');
const User = require('../../models/User/User');
const Coupon = require('../../models/Coupon/Coupon');
const Publication = require('../../models/Publication/Publication');
const { createOrder } = require('../../utils/orderUtils');
const Order = require('../../models/Order/Order');
const Purchase = require('../../models/Purchase/Purchase');
const Delivery = require('../../models/Purchase/Delivery');
const { PurchaseService } = require('../../../services');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_RPLRzNCjuNmGdU",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "4GFnyum9JNsGTWCHJHYTqiA6"
});

// Verify payment (unified)
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Verify signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || "4GFnyum9JNsGTWCHJHYTqiA6")
      .update(text)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid signature'
      });
    }

    // Get order details from Razorpay
    const order = await razorpay.orders.fetch(razorpay_order_id);
    const { items: itemsStr, userId, couponCode } = order.notes;
    const items = JSON.parse(itemsStr || '[]');

    // Recompute pricing using correct final prices
    const baseTotal = await calculateBaseTotal(items);
    const originalTotal = await calculateOriginalTotal(items);
    const productDiscountTotal = await calculateProductDiscountTotal(items);
    
    // Resolve coupon using centralized utility (should match createOrder validation)
    let coupon = null;
    if (couponCode) {
      try {
        coupon = await resolveCouponUtil(couponCode, items, userId);
      } catch (err) {
        console.warn(`Coupon validation failed during verification: ${err.message}`);
        // Continue without coupon if validation fails during verification
      }
    }
    // Calculate discount using centralized utility
    const discountAmount = coupon ? calculateCouponDiscount(coupon, baseTotal) : 0;
    const finalAmount = Math.max(0, baseTotal - discountAmount);
    
    // Calculate coupon-only discount (separate from product discount)
    const couponOnlyDiscount = discountAmount;

    // Build Order items mapping with proper per-item pricing
    const orderItems = [];
    
    for (const item of items) {
      const originalPrice = await getOriginalPrice(item);
      const finalPrice = await getFinalPrice(item);
      orderItems.push({
        itemType: mapOrderItemType(item.itemType),
        itemId: item.itemId,
        price: finalPrice,         // ✅ REQUIRED FIELD for Order schema (after product discounts)
        originalPrice,             // Original price before any discounts
        finalPrice,                // Final price after product discounts (before coupon)
      });
    }

    const savedOrder = await Order.create({
      user: userId,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      amount: finalAmount,
      originalAmount: originalTotal, // Store the true original MRP before any discounts
      discountAmount: discountAmount, // Store total discount amount
      currency: 'INR',
      status: 'completed',
      items: orderItems,
      coupon: coupon
        ? {
            code: coupon.code,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
          }
        : null,
      paymentDetails: {
        ...order,
        amountInRupees: finalAmount,
      },
      pricing: { // Store detailed pricing information
        baseTotal,
        productDiscount: productDiscountTotal,
        couponDiscount: couponOnlyDiscount,
        finalAmount
      }
    });

    // First, ensure the purchase record exists with all items (avoiding upsert issues)
    // Find or create purchase record with paymentId
    let existingPurchase = await Purchase.findOne({ paymentId: razorpay_payment_id });
    
    if (!existingPurchase) {
      // Create the initial purchase record with all items
      const purchaseItems = items.map(item => ({
        itemType: item.itemType.toUpperCase(),
        itemId: item.itemId
      }));
      
      // Calculate expiry date for the purchase during creation
      let purchaseExpiryDate = null;
      
      // Calculate expiry based on items - for now, use a default
      if (items.length > 0) {
        // Calculate based on first item as default, will be updated later with actual validity
        const firstItem = items[0];
        if (firstItem.itemType === 'publication') {
          // Publications typically have longer validity
          purchaseExpiryDate = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000); // 10 years
        } else {
          // Default to 1 year for other items
          purchaseExpiryDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year
        }
      }
      
      existingPurchase = await Purchase.create({
        user: userId,
        items: purchaseItems,
        amount: originalTotal,
        discountAmount,
        finalAmount,
        coupon: coupon
          ? {
              code: coupon.code,
              discountType: coupon.discountType,
              discountValue: coupon.discountValue,
            }
          : null,
        paymentId: razorpay_payment_id,
        status: 'pending', // Will be updated below
        purchaseDate: new Date(),
        expiryDate: purchaseExpiryDate, // Required field
      });
    }
    
    // Grant access per item - update expiry date based on validity duration
    for (const it of items) {
      // Fetch the validity duration from the course or test series
      let validityDurationInDays = 365; // Default to 1 year if no validity found
      
      const normalizedItemType = it.itemType.toUpperCase();
      
      if (it.itemType === 'test_series') {
        const testSeries = await TestSeries.findById(it.itemId);
        if (testSeries && testSeries.validity && testSeries.validity.length > 0) {
          // Assuming validity is an array and we take the first one
          const validityOption = testSeries.validity[0];
          if (validityOption && validityOption.durationInDays) {
            validityDurationInDays = validityOption.durationInDays;
          }
        }

        // Debug logging
        console.log(`Test Series Purchase - Item ID: ${it.itemId}, Validity Days: ${validityDurationInDays}`);

        // Update the purchase record's expiry date
        await Purchase.updateOne(
          { paymentId: razorpay_payment_id },
          {
            $set: {
              status: 'completed',
              expiryDate: new Date(Date.now() + validityDurationInDays * 24 * 60 * 60 * 1000), // Use actual validity
            }
          }
        );
      } else if (it.itemType === 'online_course') {
        const course = await Course.findById(it.itemId);
        if (course && course.validities && course.validities.length > 0) {
          // Assuming validities is an array and we take the first one
          const validityOption = course.validities[0];
          if (validityOption && validityOption.durationInDays) {
            validityDurationInDays = validityOption.durationInDays;
          }
        }

        // Debug logging
        console.log(`Course Purchase - Item ID: ${it.itemId}, Validity Days: ${validityDurationInDays}`);

        // Update the purchase record's expiry date
        await Purchase.updateOne(
          { paymentId: razorpay_payment_id },
          {
            $set: {
              status: 'completed',
              expiryDate: new Date(Date.now() + validityDurationInDays * 24 * 60 * 60 * 1000), // Use actual validity
            }
          }
        );
      } else if (it.itemType === 'publication') {
        const publication = await Publication.findById(it.itemId);
        if (publication) {
          // Grant access to publication
          await Purchase.updateOne(
            { paymentId: razorpay_payment_id },
            {
              $set: {
                status: 'completed',
                // Publications don't expire by default, but we can set a long expiry if needed
                expiryDate: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000), // 10 years
              }
            }
          );
          
          // ✅ NEW: Create delivery record for hardcopy publications
          if (publication.availableIn === 'HARDCOPY' || publication.availableIn === 'BOTH') {
            if (req.body.deliveryAddress) {
              try {
                await Delivery.create({
                  order: savedOrder._id,
                  user: userId,
                  publication: it.itemId,
                  ...req.body.deliveryAddress
                });
              } catch (deliveryError) {
                console.error('Error creating delivery record:', deliveryError);
              }
            }
          }
        }
      }
    }

    res.json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        amount: finalAmount,
        originalAmount: originalTotal,
        productDiscount: productDiscountTotal,
        couponDiscount: couponOnlyDiscount,
        discountAmount: discountAmount,
        currency: 'INR'
      }
    });

  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying payment',
      error: error.message
    });
  }
};
```

## Validation and Access Flags

### Course Access Context (src/middlewares/checkCourseAccess.js)

```javascript
const Purchase = require('../models/Purchase/Purchase');
const Course = require('../models/Course/Course');

/**
 * Get comprehensive course access context (centralized logic)
 */
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

    // Check purchase details using centralized access control
    const hasAccess = await require('../../services/purchaseService').hasAccess(
      userId,
      'ONLINE_COURSE',
      courseId
    );

    const purchase = hasAccess 
      ? await Purchase.findOne({
          user: userId,
          'items.itemType': 'ONLINE_COURSE',
          'items.itemId': courseId,
          status: 'completed'
        })
      : null;

    return {
      hasPurchase: hasAccess,
      isValid: hasAccess,
      isFree: false,
      purchase: purchase,
      expiryDate: purchase?.expiryDate || null,
      canAccessClass: (index) => {
        if (course.accessType === 'FREE') return true;
        if (hasAccess) return true;
        return parseInt(index) < 2; // preview only
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
```

### Test Series Access Service (services/testSeriesAccessService.js)

```javascript
const TestSeries = require('../src/models/TestSeries/TestSeries');
const Purchase = require('../src/models/Purchase/Purchase');
const TestAttempt = require('../src/models/TestSeries/TestAttempt');

class TestSeriesAccessService {
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

      // Check if user has purchased the test series using centralized access control
      const hasAccess = await require('./purchaseService').hasAccess(userId, 'TEST_SERIES', seriesId);
      return hasAccess;
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

      // Check if user has purchased the series using centralized access control
      const hasAccess = await require('./purchaseService').hasAccess(userId, 'TEST_SERIES', seriesId);
      return hasAccess;
    } catch (error) {
      console.error('Error checking series access:', error);
      return false;
    }
  }
}

module.exports = TestSeriesAccessService;
```

## Key Features Summary

### 1. Centralized Access Control
- Single source of truth for access validation via `PurchaseService.hasAccess()`
- Consistent access logic across all content types
- Unified validation rules

### 2. Item Type Normalization
- All item types stored as uppercase in database
- Consistent enum values: `TEST_SERIES`, `ONLINE_COURSE`, `PUBLICATION`
- Backward compatibility for legacy data

### 3. Dynamic Access Flag Computation
- `hasAccess`, `hasPurchased`, `canDownload` computed at response time
- No static DB storage that can become stale
- Real-time validation based on purchase status and expiry

### 4. Purchase Lifecycle Management
- Initial purchase creation with proper validation
- Payment verification updates status and expiry
- No duplicate purchase records created

### 5. Security Features
- Secure file access for publications
- Proper access control middleware
- Input validation and sanitization

### 6. Validation Rules
- Purchase status must be `completed`
- Expiry date validation (or null for lifetime access)
- Proper coupon and discount handling
- Content-specific access rules (free quotas, previews)

This implementation provides a robust, scalable, and secure purchase and access control system that handles all content types consistently while maintaining proper validation and security measures.