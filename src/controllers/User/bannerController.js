const Banner = require('../../models/Banner');
const { SITE_TYPES } = require('../../constants/bannerConstants');

// Get home banner (public)
exports.getHomeBanner = async (req, res) => {
  try {
    const { siteType = 'FREE' } = req.query;
    
    // Validate siteType
    if (!SITE_TYPES.includes(siteType)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid site type. Must be FREE or PAID' 
      });
    }

    const banner = await Banner.findOne({ pageType: 'HOME', siteType, isActive: true });
    
    if (!banner) {
      return res.status(404).json({ 
        success: false, 
        message: `Home ${siteType} banner not found` 
      });
    }

    // Return structured response for home banner
    res.json({
      success: true,
      siteType,
      pageType: 'HOME',
      images: banner.images.map(image => image.url)
    });
  } catch (error) {
    console.error('Error fetching home banner:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch home banner',
      error: error.message 
    });
  }
};

// Get about banner (public)
exports.getAboutBanner = async (req, res) => {
  try {
    const { siteType = 'FREE' } = req.query;
    
    // Validate siteType
    if (!SITE_TYPES.includes(siteType)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid site type. Must be FREE or PAID' 
      });
    }

    const banner = await Banner.findOne({ pageType: 'ABOUT', siteType, isActive: true });
    
    if (!banner) {
      return res.status(404).json({ 
        success: false, 
        message: `About ${siteType} banner not found` 
      });
    }

    // Return structured response for about banner
    res.json({
      success: true,
      siteType,
      pageType: 'ABOUT',
      about: banner.about
    });
  } catch (error) {
    console.error('Error fetching about banner:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch about banner',
      error: error.message 
    });
  }
};