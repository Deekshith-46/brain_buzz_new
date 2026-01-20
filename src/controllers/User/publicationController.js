const Publication = require('../../models/Publication/Publication');
const { PurchaseService } = require('../../../services');

// Helper function to handle database errors
const handleDatabaseError = (error) => {
  console.error('Database error:', error);
  
  // Check for specific error types and return appropriate status codes
  if (error.name === 'CastError') {
    return {
      statusCode: 400,
      message: 'Invalid ID format',
      error: error.message
    };
  }
  
  if (error.name === 'ValidationError') {
    return {
      statusCode: 400,
      message: 'Validation error',
      error: error.message
    };
  }
  
  if (error.code === 11000) {
    return {
      statusCode: 409,
      message: 'Duplicate entry error',
      error: error.message
    };
  }
  
  // Default error response
  return {
    statusCode: 500,
    message: 'Internal server error',
    error: error.message
  };
};

// Helper function to check if user has purchased a publication
const checkPublicationPurchase = async (userId, publicationId) => {
  if (!userId) return false;
  try {
    return await PurchaseService.hasAccess(userId, 'publication', publicationId);
  } catch (error) {
    console.error('Error checking publication purchase:', error);
    return false;
  }
};

// Helper function to calculate finalPrice from originalPrice and discountPrice
const calculateFinalPrice = (originalPrice, discountPrice) => {
  const discountAmount = typeof discountPrice === 'number' && discountPrice >= 0
    ? discountPrice
    : 0;
  return Math.max(0, originalPrice - discountAmount);
};

// Public: list publications with optional filters
exports.listPublications = async (req, res) => {
  try {
    const { category, subCategory, language } = req.query;

    const filter = {
      contentType: 'PUBLICATION',
      isActive: true,
    };

    if (category) filter.categories = category;
    if (subCategory) filter.subCategories = subCategory;
    if (language) filter.languages = language;

    const publications = await Publication.find(filter)
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code')
      .populate('validities', 'label durationInDays');
    
    // Process publications to return only specified fields and calculate finalPrice
    const userId = req.user?._id;
    const processedPublications = await Promise.all(
      publications.map(async (publication) => {
        const hasPurchased = await checkPublicationPurchase(userId, publication._id);
        const publicationObj = publication.toObject();
        
        // Calculate finalPrice
        const finalPrice = calculateFinalPrice(publicationObj.originalPrice, publicationObj.discountPrice);
        
        // Return only the requested fields
        const filteredPublication = {
          _id: publicationObj._id,
          name: publicationObj.name,
          thumbnailUrl: publicationObj.thumbnailUrl,
          originalPrice: publicationObj.originalPrice,
          discountPrice: publicationObj.discountPrice,
          finalPrice: finalPrice,
          languages: publicationObj.languages,
          validities: publicationObj.validities,
          hasPurchased: hasPurchased
        };
        
        return filteredPublication;
      })
    );

    return res.status(200).json({ data: processedPublications });
  } catch (error) {
    const errorResponse = handleDatabaseError(error);
    return res.status(errorResponse.statusCode).json({
      message: errorResponse.message,
      error: errorResponse.error
    });
  }
};

// Public: get single publication by id
exports.getPublicationById = async (req, res) => {
  try {
    const { id } = req.params;

    const publication = await Publication.findOne({
      _id: id,
      contentType: 'PUBLICATION',
      isActive: true,
    })
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code')
      .populate('validities', 'label durationInDays');

    if (!publication) {
      return res.status(404).json({ message: 'Publication not found' });
    }

    const hasPurchased = await checkPublicationPurchase(req.user?._id, publication._id);
    const publicationObj = publication.toObject();
    
    // Calculate finalPrice
    const finalPrice = calculateFinalPrice(publicationObj.originalPrice, publicationObj.discountPrice);
    
    // Return only the requested fields
    const filteredPublication = {
      _id: publicationObj._id,
      name: publicationObj.name,
      thumbnailUrl: publicationObj.thumbnailUrl,
      originalPrice: publicationObj.originalPrice,
      discountPrice: publicationObj.discountPrice,
      finalPrice: finalPrice,
      languages: publicationObj.languages,
      validities: publicationObj.validities,
      hasPurchased: hasPurchased,
      // Include other necessary fields
      startDate: publicationObj.startDate,
      categories: publicationObj.categories,
      subCategories: publicationObj.subCategories,
      availableIn: publicationObj.availableIn,
      shortDescription: publicationObj.shortDescription,
      detailedDescription: publicationObj.detailedDescription,
      authors: publicationObj.authors,
      galleryImages: publicationObj.galleryImages,
      bookFileUrl: publicationObj.bookFileUrl,
      isActive: publicationObj.isActive,
      createdAt: publicationObj.createdAt,
      updatedAt: publicationObj.updatedAt
    };
    
    return res.status(200).json({ data: filteredPublication });
  } catch (error) {
    const errorResponse = handleDatabaseError(error);
    return res.status(errorResponse.statusCode).json({
      message: errorResponse.message,
      error: errorResponse.error
    });
  }
};
