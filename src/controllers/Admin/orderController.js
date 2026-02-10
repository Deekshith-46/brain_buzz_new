// src/controllers/Admin/orderController.js
const Order = require('../../models/Order/Order');
const User = require('../../models/User/User');
const TestSeries = require('../../models/TestSeries/TestSeries');
const Publication = require('../../models/Publication/Publication');

// Get all orders with user and item details
exports.getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, userId, status } = req.query;
    const query = {};
    
    if (userId) {
      query.user = userId;
    }
    
    if (status) {
      query.status = status;
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: {
        path: 'user',
        select: 'firstName lastName email mobileNumber'
      }
    };

    // Use the paginate method provided by mongoose-paginate-v2
    const orders = await Order.paginate(query, options);

    // Manually populate items based on itemType
    for (const order of orders.docs) {
      for (const item of order.items) {
        let model;
        if (item.itemType === 'TestSeries' || item.itemType === 'testSeries') {
          model = TestSeries;
        } else if (item.itemType === 'Course' || item.itemType === 'course') {
          model = require('../../models/Course/Course');
        } else if (item.itemType === 'Publication' || item.itemType === 'publication') {
          model = Publication;
        }
        
        if (model && item.itemId) {
          try {
            const populated = await model.findById(item.itemId).select('name description price finalPrice').lean();
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
        orders: orders.docs.map(order => ({
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
          // Normalize itemType to snake_case
          items: order.items.map(item => ({
            ...item,
            itemType: item.itemType.toLowerCase().includes('test') ? 'test_series' : 
                     item.itemType.toLowerCase().includes('course') ? 'online_course' : 
                     item.itemType,
          })),
          // Add invoiceId and refundable fields
          invoiceId: `INV-${order._id.toString().substring(0, 8).toUpperCase()}-${new Date(order.createdAt).getFullYear()}`,
          refundable: order.status === 'completed' && new Date() - new Date(order.createdAt) < 30 * 24 * 60 * 60 * 1000, // 30 days refund window
        })),
        total: orders.totalDocs,
        page: orders.page,
        totalPages: orders.totalPages,
        hasNextPage: orders.hasNextPage,
        hasPrevPage: orders.hasPrevPage
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message
    });
  }
};

// Get order details by ID
exports.getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate({
        path: 'user',
        select: 'firstName lastName email mobileNumber'
      });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Manually populate items
    for (const item of order.items) {
      let model;
      if (item.itemType === 'TestSeries' || item.itemType === 'testSeries') {
        model = TestSeries;
      } else if (item.itemType === 'Course' || item.itemType === 'course') {
        model = require('../../models/Course/Course');
      } else if (item.itemType === 'publication' || item.itemType === 'Publication') {
        model = Publication;
      }
      
      if (model && item.itemId) {
        try {
          const populated = await model.findById(item.itemId).select('name description price finalPrice availableIn').lean();
          item.itemDetails = populated;
        } catch (err) {
          console.error(`Error populating item ${item.itemId}:`, err.message);
          item.itemDetails = null;
        }
      }
    }

    // 🔥 Fetch delivery records linked to this order
    const Delivery = require('../../models/Purchase/Delivery');
    const deliveries = await Delivery.find({ order: orderId })
      .populate('publication', 'name availableIn')
      .populate('user', 'firstName lastName email')
      .lean();

    res.status(200).json({
      success: true,
      data: {
        ...order,
        deliveries, // ✅ HARD COPY DELIVERY DETAILS
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
        // Normalize itemType to snake_case
        items: order.items.map(item => ({
          ...item,
          itemType: item.itemType.toLowerCase().includes('test') ? 'test_series' : 
                   item.itemType.toLowerCase().includes('course') ? 'online_course' : 
                   item.itemType.toLowerCase().includes('publication') ? 'publication' : 
                   item.itemType,
        })),
        // Add invoiceId and refundable fields
        invoiceId: `INV-${order._id.toString().substring(0, 8).toUpperCase()}-${new Date(order.createdAt).getFullYear()}`,
        refundable: order.status === 'completed' && new Date() - new Date(order.createdAt) < 30 * 24 * 60 * 60 * 1000, // 30 days refund window
      }
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order',
      error: error.message
    });
  }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'processing', 'completed', 'cancelled', 'refunded'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
      });
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true, runValidators: true }
    ).populate('user', 'name email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating order status',
      error: error.message
    });
  }
};

// Get orders by user ID
exports.getOrdersByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, status } = req.query;
    
    const query = { user: userId };
    if (status) {
      query.status = status;
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 }
    };

    const orders = await Order.paginate(query, options);

    // Manually populate items
    for (const order of orders.docs) {
      for (const item of order.items) {
        let model;
        if (item.itemType === 'TestSeries' || item.itemType === 'testSeries') {
          model = TestSeries;
        } else if (item.itemType === 'Course' || item.itemType === 'course') {
          model = require('../../models/Course/Course');
        }
        
        if (model && item.itemId) {
          try {
            const populated = await model.findById(item.itemId).select('name description price finalPrice').lean();
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
        orders: orders.docs.map(order => ({
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
          // Normalize itemType to snake_case
          items: order.items.map(item => ({
            ...item,
            itemType: item.itemType.toLowerCase().includes('test') ? 'test_series' : 
                     item.itemType.toLowerCase().includes('course') ? 'online_course' : 
                     item.itemType,
          })),
          // Add invoiceId and refundable fields
          invoiceId: `INV-${order._id.toString().substring(0, 8).toUpperCase()}-${new Date(order.createdAt).getFullYear()}`,
          refundable: order.status === 'completed' && new Date() - new Date(order.createdAt) < 30 * 24 * 60 * 60 * 1000, // 30 days refund window
        })),
        total: orders.totalDocs,
        page: orders.page,
        totalPages: orders.totalPages,
        hasNextPage: orders.hasNextPage,
        hasPrevPage: orders.hasPrevPage
      }
    });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user orders',
      error: error.message
    });
  }
};