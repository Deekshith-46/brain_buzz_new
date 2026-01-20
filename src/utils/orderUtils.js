// src/utils/orderUtils.js
const Order = require('../models/Order/Order');
const TestSeries = require('../models/TestSeries/TestSeries');

exports.createOrder = async (userId, orderData) => {
  const {
    orderId,
    paymentId,
    amount,
    items,
    coupon,
    paymentMethod = 'razorpay',
    paymentDetails = {}
  } = orderData;

  // Create order document
  const order = new Order({
    user: userId,
    orderId,
    paymentId,
    amount,
    items,
    coupon,
    paymentMethod,
    paymentDetails,
    status: 'paid' // Assuming payment is already verified
  });

  // Save order
  await order.save();

  // Update user's purchased items
  for (const item of items) {
    if (item.itemType === 'testSeries') {
      await TestSeries.findByIdAndUpdate(item.itemId, {
        $addToSet: { enrolledUsers: userId }
      });
    }
  }

  return order;
};

exports.getUserOrders = async (userId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('items.itemId', 'name title')
      .lean(),
    Order.countDocuments({ user: userId })
  ]);

  return {
    orders,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
};