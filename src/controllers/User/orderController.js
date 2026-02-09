// src/controllers/User/orderController.js
const Order = require('../../models/Order/Order');
const TestSeries = require('../../models/TestSeries/TestSeries');
// Get order details
exports.getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user._id;

    const order = await Order.findOne({
      _id: orderId,
      user: userId
    }).lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Manually populate items
    const TestSeries = require('../../models/TestSeries/TestSeries');
    const Course = require('../../models/Course/Course');
    
    for (const item of order.items) {
      let model;
      if (item.itemType === 'TestSeries' || item.itemType === 'testSeries') {
        model = TestSeries;
      } else if (item.itemType === 'Course' || item.itemType === 'course') {
        model = Course;
      }
      
      if (model && item.itemId) {
        try {
          const populated = await model.findById(item.itemId).select('name description').lean();
          item.itemDetails = populated;
        } catch (err) {
          console.error(`Error populating item ${item.itemId}:`, err.message);
          item.itemDetails = null;
        }
      }
    }

    res.status(200).json({
      success: true,
      data: {
        ...order,
        // Add originalAmount and discountAmount with safe fallback logic
        originalAmount: typeof order.originalAmount === 'number' 
          ? order.originalAmount 
          : typeof order.pricing?.baseTotal === 'number' 
          ? order.pricing.baseTotal 
          : null,
        discountAmount: typeof order.discountAmount === 'number' 
          ? order.discountAmount 
          : typeof order.pricing?.couponDiscount === 'number' || typeof order.pricing?.productDiscount === 'number'
          ? (order.pricing.couponDiscount || 0) + (order.pricing.productDiscount || 0)
          : 0,
        amount: Number(order.amount),
        // Normalize itemType to snake_case
        items: order.items.map(item => ({
          ...item,
          itemType: item.itemType.toLowerCase().includes('test') ? 'test_series' : 
                   item.itemType.toLowerCase().includes('course') ? 'online_course' : 
                   item.itemType,
          price: Number(item.price)
        })),
        // Add invoiceId and refundable fields
        invoiceId: `INV-${order._id.toString().substring(0, 8).toUpperCase()}-${new Date(order.createdAt).getFullYear()}`,
        refundable: order.status === 'completed' && new Date() - new Date(order.createdAt) < 30 * 24 * 60 * 60 * 1000 // 30 days refund window
      }
    });

  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order details',
      error: error.message
    });
  }
};

// Get user's order history
exports.getOrderHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const userId = req.user._id;

    const [orders, total] = await Promise.all([
      Order.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .lean(),
      Order.countDocuments({ user: userId })
    ]);

    // Manually populate items
    const TestSeries = require('../../models/TestSeries/TestSeries');
    const Course = require('../../models/Course/Course');
    
    for (const order of orders) {
      for (const item of order.items) {
        let model;
        if (item.itemType === 'TestSeries' || item.itemType === 'testSeries') {
          model = TestSeries;
        } else if (item.itemType === 'Course' || item.itemType === 'course') {
          model = Course;
        }
        
        if (model && item.itemId) {
          try {
            const populated = await model.findById(item.itemId).select('name description').lean();
            item.itemDetails = populated;
          } catch (err) {
            console.error(`Error populating item ${item.itemId}:`, err.message);
            item.itemDetails = null;
          }
        }
      }
    }

    res.status(200).json({
      success: true,
      data: {
        orders: orders.map(order => ({
          ...order,
          // Add originalAmount and discountAmount with safe fallback logic
          originalAmount: typeof order.originalAmount === 'number' 
            ? order.originalAmount 
            : typeof order.pricing?.baseTotal === 'number' 
            ? order.pricing.baseTotal 
            : null,
          discountAmount: typeof order.discountAmount === 'number' 
            ? order.discountAmount 
            : typeof order.pricing?.couponDiscount === 'number' || typeof order.pricing?.productDiscount === 'number'
            ? (order.pricing.couponDiscount || 0) + (order.pricing.productDiscount || 0)
            : 0,
          amount: Number(order.amount),
          // Normalize itemType to snake_case
          items: order.items.map(item => ({
            ...item,
            itemType: item.itemType.toLowerCase().includes('test') ? 'test_series' : 
                     item.itemType.toLowerCase().includes('course') ? 'online_course' : 
                     item.itemType,
            price: Number(item.price)
          })),
          // Add invoiceId and refundable fields
          invoiceId: `INV-${order._id.toString().substring(0, 8).toUpperCase()}-${new Date(order.createdAt).getFullYear()}`,
          refundable: order.status === 'completed' && new Date() - new Date(order.createdAt) < 30 * 24 * 60 * 60 * 1000 // 30 days refund window
        })),
        total,
        page: Number(page),
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching order history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order history',
      error: error.message
    });
  }
};