const Banner = require('../../models/Banner');

// Get home banner (public)
exports.getHomeBanner = async (req, res) => {
  try {
    const banner = await Banner.findOne({ pageType: 'HOME', isActive: true });
    
    if (!banner) {
      return res.status(404).json({ 
        success: false, 
        message: 'Home banner not found' 
      });
    }

    // Return only image URLs for home banner
    const imageUrls = banner.images.map(image => image.url);
    res.json({
      success: true,
      images: imageUrls
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
    const banner = await Banner.findOne({ pageType: 'ABOUT', isActive: true });
    
    if (!banner) {
      return res.status(404).json({ 
        success: false, 
        message: 'About banner not found' 
      });
    }

    // Return heading, description, and image URLs for about banner
    const imageUrls = banner.images.map(image => image.url);
    res.json({
      success: true,
      heading: banner.heading,
      description: banner.description,
      images: imageUrls
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