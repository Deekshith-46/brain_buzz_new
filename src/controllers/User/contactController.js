const Contact = require('../../models/Contact');

// Get contact config (public)
exports.getContact = async (req, res) => {
  try {
    const { siteType = 'FREE' } = req.query;
    
    // Validate siteType
    if (!['FREE', 'PAID'].includes(siteType)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid site type. Must be FREE or PAID' 
      });
    }

    const contact = await Contact.findOne({ siteType, isActive: true });
    
    if (!contact) {
      return res.status(404).json({ 
        success: false, 
        message: `${siteType} contact config not found` 
      });
    }

    res.json({
      success: true,
      data: {
        phone: contact.phone,
        email: contact.email,
        address: contact.address
      }
    });
  } catch (error) {
    console.error('Error fetching contact config:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch contact config',
      error: error.message 
    });
  }
};