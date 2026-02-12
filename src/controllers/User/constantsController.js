const { VALIDITY_LABELS, VALIDITY_MAP } = require('../../constants/validityMap');

// Get all validity options for frontend dropdown
exports.getValidities = async (req, res) => {
  try {
    const validityOptions = VALIDITY_LABELS.map(label => ({
      label: label,
      display: label.replace(/_/g, ' ').toLowerCase()
        .replace(/\b\w/g, l => l.toUpperCase()),
      days: VALIDITY_MAP[label]
    }));

    res.json({
      success: true,
      data: validityOptions
    });
  } catch (error) {
    console.error('Error fetching validity options:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch validity options'
    });
  }
};

// Get specific validity info
exports.getValidityInfo = async (req, res) => {
  try {
    const { label } = req.params;
    
    if (!VALIDITY_LABELS.includes(label)) {
      return res.status(400).json({
        success: false,
        message: `Invalid validity label: ${label}`
      });
    }

    res.json({
      success: true,
      data: {
        label: label,
        display: label.replace(/_/g, ' ').toLowerCase()
          .replace(/\b\w/g, l => l.toUpperCase()),
        days: VALIDITY_MAP[label]
      }
    });
  } catch (error) {
    console.error('Error fetching validity info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch validity info'
    });
  }
};