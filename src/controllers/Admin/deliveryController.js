const Delivery = require('../../models/Purchase/Delivery');

// Get all deliveries (admin dashboard view)
exports.getAllDeliveries = async (req, res) => {
  try {
    const deliveries = await Delivery.find()
      .populate('user', 'firstName lastName email mobileNumber')
      .populate('publication', 'name')
      .populate('order', 'orderId status createdAt')
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: deliveries
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error fetching deliveries' });
  }
};

// Update delivery status
exports.updateDeliveryStatus = async (req, res) => {
  try {
    const { deliveryId } = req.params;
    const { status, trackingNumber } = req.body;

    const delivery = await Delivery.findByIdAndUpdate(
      deliveryId,
      {
        status,
        trackingNumber,
        ...(status === 'shipped' && { shippedAt: new Date() }),
        ...(status === 'delivered' && { deliveredAt: new Date() })
      },
      { new: true }
    );

    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }

    return res.json({
      success: true,
      message: 'Delivery updated',
      data: delivery
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error updating delivery' });
  }
};

// Delete delivery by ID (for testing purposes)
exports.deleteDelivery = async (req, res) => {
  try {
    const { deliveryId } = req.params;
    
    // Find and delete the delivery
    const delivery = await Delivery.findByIdAndDelete(deliveryId);
    
    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found'
      });
    }
    
    return res.json({
      success: true,
      message: 'Delivery deleted successfully',
      data: {
        deletedId: deliveryId,
        delivery: {
          _id: delivery._id,
          user: delivery.user,
          publication: delivery.publication,
          order: delivery.order,
          fullName: delivery.fullName,
          status: delivery.status
        }
      }
    });
  } catch (error) {
    console.error('Error deleting delivery:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting delivery',
      error: error.message
    });
  }
};