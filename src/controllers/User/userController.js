const User = require('../../models/User/User');
const bcrypt = require('bcryptjs');
const Purchase = require('../../models/Purchase/Purchase');
const Course = require('../../models/Course/Course');
const TestSeries = require('../../models/TestSeries/TestSeries');
const Publication = require('../../models/Publication/Publication');
const { PurchaseService } = require('../../../services');

// Create new user (registration via CRUD path)
exports.createUser = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      selectGender,
      email,
      mobileNumber,
      dateOfBirth,
      state,
      address,
      password,
      isActive,
    } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const existingByEmail = await User.findOne({ email });
    if (existingByEmail) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const existingByMobile = await User.findOne({ mobileNumber });
    if (existingByMobile) {
      return res.status(400).json({ message: 'Mobile number already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      firstName,
      lastName,
      selectGender,
      email,
      mobileNumber,
      dateOfBirth,
      state,
      address,
      password: hashedPassword,
      isActive,
    });

    const userObj = user.toObject();
    delete userObj.password;

    return res.status(201).json({
      message: 'User created successfully',
      data: userObj,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    return res.status(200).json({ data: users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get current user profile (from token)
exports.getUserProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ data: user });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update current user profile (from token)
exports.updateUserProfile = async (req, res) => {
  try {
    const updates = req.body;

    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (updates.email) {
      const existingByEmail = await User.findOne({ email: updates.email, _id: { $ne: req.user._id } });
      if (existingByEmail) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }

    if (updates.mobileNumber) {
      const existingByMobile = await User.findOne({ mobileNumber: updates.mobileNumber, _id: { $ne: req.user._id } });
      if (existingByMobile) {
        return res.status(400).json({ message: 'Mobile number already exists' });
      }
    }

    if (updates.password) {
      if (updates.password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long' });
      }
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userObj = user.toObject();
    delete userObj.password;

    return res.status(200).json({
      message: 'User updated successfully',
      data: userObj,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete current user (hard delete)
exports.deleteUserProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await User.findByIdAndDelete(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all user details (profile, purchases, courses, test series, publications, orders)
exports.getAllUserDetails = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Get user profile
    const userProfile = await User.findById(req.user._id).select('-password');
    if (!userProfile) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get all completed purchases for this user
    const purchases = await Purchase.find({ 
      user: req.user._id,
      status: 'completed'
    });
        
    // Extract item IDs by type from purchases
    const courseIds = [];
    const testSeriesIds = [];
    const publicationIds = [];
        
    purchases.forEach(purchase => {
      purchase.items.forEach(item => {
        if (item.itemType === 'online_course') {
          courseIds.push(item.itemId);
        } else if (item.itemType === 'test_series') {
          testSeriesIds.push(item.itemId);
        } else if (item.itemType === 'publication') {
          publicationIds.push(item.itemId);
        }
      });
    });
        
    // Fetch actual content based on extracted IDs
    const courses = await Course.find({ _id: { $in: courseIds } });
    const testSeries = await TestSeries.find({ _id: { $in: testSeriesIds } });
    const publications = await Publication.find({ _id: { $in: publicationIds } });

    // Get user's orders (completed purchases)
    const orders = await Purchase.find({ 
      user: req.user._id,
      status: 'completed'
    }).sort({ createdAt: -1 });

    // Prepare the response
    // Only include purchased items in the top-level arrays, not in the profile
    // to avoid data duplication
    const userDetails = {
      profile: userProfile,
      courses: courses,
      testSeries: testSeries,
      publications: publications,
      orders: orders
    };

    res.json({
      success: true,
      data: userDetails
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user details',
      error: error.message
    });
  }
};

// Get user's purchased courses (improved version)
exports.getMyCourses = async (req, res) => {
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
      courses.map(async (course) => {
        const hasAccess = await PurchaseService.hasAccess(userId, 'online_course', course._id);
        const purchase = purchases.find(p => 
          p.items.some(item => 
            item.itemType === 'online_course' && 
            item.itemId.toString() === course._id.toString()
          )
        );
        
        return {
          ...course.toObject(),
          hasAccess,
          isValid: purchase ? new Date() <= purchase.expiryDate : false,
          expiryDate: purchase ? purchase.expiryDate : null,
          purchaseDate: purchase ? purchase.purchaseDate : null,
          purchaseStatus: purchase ? 
            (new Date() <= purchase.expiryDate ? 'active' : 'expired') : 
            'not_purchased'
        };
      })
    );
    
    // Filter to only include courses with valid purchases
    const purchasedCourses = enrichedCourses.filter(course => course.hasAccess);
    
    res.json({
      success: true,
      data: purchasedCourses,
      summary: {
        total: purchasedCourses.length,
        active: purchasedCourses.filter(c => c.isValid).length,
        expired: purchasedCourses.filter(c => c.hasAccess && !c.isValid).length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching courses',
      error: error.message
    });
  }
};

// Get user's purchased test series (improved version)
exports.getMyTestSeries = async (req, res) => {
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
      testSeriesList.map(async (series) => {
        const hasAccess = await PurchaseService.hasAccess(userId, 'test_series', series._id);
        const purchase = purchases.find(p => 
          p.items.some(item => 
            item.itemType === 'test_series' && 
            item.itemId.toString() === series._id.toString()
          )
        );
        
        return {
          ...series.toObject(),
          hasAccess,
          isValid: purchase ? new Date() <= purchase.expiryDate : false,
          expiryDate: purchase ? purchase.expiryDate : null,
          purchaseDate: purchase ? purchase.purchaseDate : null,
          purchaseStatus: purchase ? 
            (new Date() <= purchase.expiryDate ? 'active' : 'expired') : 
            'not_purchased'
        };
      })
    );
    
    // Filter to only include test series with valid purchases
    const purchasedTestSeries = enrichedTestSeries.filter(series => series.hasAccess);
    
    res.json({
      success: true,
      data: purchasedTestSeries,
      summary: {
        total: purchasedTestSeries.length,
        active: purchasedTestSeries.filter(s => s.isValid).length,
        expired: purchasedTestSeries.filter(s => s.hasAccess && !s.isValid).length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching test series',
      error: error.message
    });
  }
};

// Get user's purchased publications (improved version)
exports.getMyPublications = async (req, res) => {
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
      publications.map(async (pub) => {
        const hasAccess = await PurchaseService.hasAccess(userId, 'publication', pub._id);
        const purchase = purchases.find(p => 
          p.items.some(item => 
            item.itemType === 'publication' && 
            item.itemId.toString() === pub._id.toString()
          )
        );
        
        return {
          ...pub.toObject(),
          hasAccess,
          isValid: purchase ? new Date() <= purchase.expiryDate : false,
          canDownload: hasAccess && pub.availableIn !== 'HARDCOPY',
          expiryDate: purchase ? purchase.expiryDate : null,
          purchaseDate: purchase ? purchase.purchaseDate : null,
          purchaseStatus: purchase ? 
            (new Date() <= purchase.expiryDate ? 'active' : 'expired') : 
            'not_purchased'
        };
      })
    );
    
    // Filter to only include publications with valid purchases
    const purchasedPublications = enrichedPublications.filter(pub => pub.hasAccess);
    
    res.json({
      success: true,
      data: purchasedPublications,
      summary: {
        total: purchasedPublications.length,
        active: purchasedPublications.filter(p => p.isValid).length,
        expired: purchasedPublications.filter(p => p.hasAccess && !p.isValid).length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching publications',
      error: error.message
    });
  }
};

// Get user's orders
exports.getMyOrders = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Find purchases for this user
    const orders = await Purchase.find({ user: userId })
      .populate('items.itemId')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message
    });
  }
};
