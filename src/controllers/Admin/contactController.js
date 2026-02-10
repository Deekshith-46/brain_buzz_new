const Contact = require('../../models/Contact');
const { SITE_TYPES } = require('../../constants/bannerConstants');

// Create or update contact config (upsert)
exports.upsertContact = async (req, res) => {
  try {
    const { siteType, phone, email, address } = req.body;
    
    // Validate required fields
    if (!siteType) {
      return res.status(400).json({ 
        success: false, 
        message: 'Site type is required' 
      });
    }

    // Validate siteType is one of allowed values
    if (!SITE_TYPES.includes(siteType)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid site type. Must be FREE or PAID' 
      });
    }

    // Prepare update data
    const updateData = {
      siteType,
      phone: phone || '',
      email: email || '',
      address: address || '',
      isActive: true
    };

    // Upsert contact config (create or update)
    const contact = await Contact.findOneAndUpdate(
      { siteType },
      updateData,
      { upsert: true, new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: `${siteType} contact config saved successfully`,
      data: contact
    });
  } catch (error) {
    console.error('Error saving contact config:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to save contact config',
      error: error.message 
    });
  }
};

// Get contact config by site type (Admin)
exports.getContact = async (req, res) => {
  try {
    const { siteType } = req.params;
    
    // Validate siteType
    if (!SITE_TYPES.includes(siteType)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid site type. Must be FREE or PAID' 
      });
    }

    const contact = await Contact.findOne({ siteType });
    
    if (!contact) {
      return res.status(404).json({ 
        success: false, 
        message: `${siteType} contact config not found` 
      });
    }

    res.json({
      success: true,
      data: contact
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

// Delete contact config by site type (Optional - soft delete)
exports.deleteContact = async (req, res) => {
  try {
    const { siteType } = req.params;
    
    // Validate siteType
    if (!SITE_TYPES.includes(siteType)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid site type. Must be FREE or PAID' 
      });
    }

    const contact = await Contact.findOneAndUpdate({ siteType }, { isActive: false }, { new: true });
    
    if (!contact) {
      return res.status(404).json({ 
        success: false, 
        message: `${siteType} contact config not found` 
      });
    }

    res.json({
      success: true,
      message: `${siteType} contact config deactivated successfully`
    });
  } catch (error) {
    console.error('Error deleting contact config:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete contact config',
      error: error.message 
    });
  }
};