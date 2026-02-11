const Publication = require('../../models/Publication/Publication');
const Category = require('../../models/Course/Category');
const SubCategory = require('../../models/Course/SubCategory');
const Language = require('../../models/Course/Language');
const { VALIDITY_LABELS } = require('../../constants/validityMap');

// Helper function to escape regex special characters
const escapeRegex = (s) => s.replace(/[.*+?^${}()|\[\]\\]/g, '\\$&');
const cloudinary = require('../../config/cloudinary');

const fs = require('fs').promises;
const path = require('path');

const uploadToCloudinary = async (file, folder, resourceType = 'raw') => {
  try {
    // Handle both memory storage (buffer) and disk storage (path)
    if (file.buffer) {
      // Memory storage - upload buffer directly using stream
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: resourceType,
            use_filename: true,
            unique_filename: true,
            access_mode: 'public'
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        );
        
        uploadStream.end(file.buffer);
      });
    } else if (file.path) {
      // Disk storage - upload file path
      const result = await cloudinary.uploader.upload(file.path, {
        folder,
        resource_type: resourceType,
        use_filename: true,
        unique_filename: true,
        access_mode: 'public'
      });
      
      // Clean up temp file after upload
      await fs.unlink(file.path);
      
      return result;
    } else {
      throw new Error('Invalid file format: missing buffer or path');
    }
  } catch (error) {
    // Only try to clean up temp file if using disk storage
    if (file.path) {
      try {
        await fs.unlink(file.path);
      } catch (unlinkError) {
        console.error('Error deleting temp file:', unlinkError);
      }
    }
    throw error;
  }
};

// Create a new publication
exports.createPublication = async (req, res) => {
  try {
    if (!req.body.publication) {
      return res
        .status(400)
        .json({ message: 'Publication data (publication) is required in form-data' });
    }

    const parsed = JSON.parse(req.body.publication);

    const {
      name,
      startDate,
      categoryIds = [],
      subCategoryIds = [],
      languageIds = [],
      validity,
      originalPrice,
      discountPrice,
      availableIn,
      pricingNote,
      shortDescription,
      detailedDescription,
      authors = [],
      isActive,
    } = parsed;

    if (!name) {
      return res.status(400).json({ message: 'Publication name is required' });
    }

    if (!originalPrice && originalPrice !== 0) {
      return res.status(400).json({ message: 'Original price is required' });
    }

    // Calculate discount percent automatically
    let discountPercent = 0;
    if (originalPrice > 0 && discountPrice !== undefined) {
      discountPercent = ((originalPrice - discountPrice) / originalPrice) * 100;
    }

    // Thumbnail
    let thumbnailUrl;
    if (req.files && req.files.thumbnail && req.files.thumbnail[0]) {
      const thumbFile = req.files.thumbnail[0];
      const uploadResult = await uploadToCloudinary(
        thumbFile.buffer,
        'brainbuzz/publications/thumbnails',
        'image'
      );
      thumbnailUrl = uploadResult.secure_url;
    }

    // Authors images mapped by index
    const authorImages = (req.files && req.files.authorImages) || [];
    const finalAuthors = authors.map((author, index) => {
      const a = { ...author };
      if (authorImages[index]) {
        a._fileBuffer = authorImages[index].buffer;
      }
      return a;
    });

    for (const author of finalAuthors) {
      if (author._fileBuffer) {
        const uploadResult = await uploadToCloudinary(
          author._fileBuffer,
          'brainbuzz/publications/authors',
          'image'
        );
        author.photoUrl = uploadResult.secure_url;
        delete author._fileBuffer;
      }
    }

    // Extra gallery images
    const galleryImagesFiles = (req.files && req.files.galleryImages) || [];
    const galleryImages = [];
    for (const img of galleryImagesFiles) {
      const uploadResult = await uploadToCloudinary(
        img.buffer,
        'brainbuzz/publications/images',
        'image'
      );
      galleryImages.push(uploadResult.secure_url);
    }

    // Book file (pdf/doc)
    let bookFileUrl;
    if (req.files && req.files.bookFile && req.files.bookFile[0]) {
      const bookFile = req.files.bookFile[0];
      // Only upload book file if availableIn is not HARDCOPY
      if (availableIn !== 'HARDCOPY') {
        const uploadResult = await uploadToCloudinary(
          bookFile,
          'brainbuzz/publications/books',
          'raw'
        );
        bookFileUrl = uploadResult.secure_url;
      }
    }

    const publication = await Publication.create({
      name,
      startDate,
      categories: categoryIds,
      subCategories: subCategoryIds,
      languages: languageIds,
      validity: validity && validity !== 'null' && validity !== 'undefined' ? validity : undefined,
      thumbnailUrl,
      originalPrice,
      discountPrice,
      discountPercent,
      availableIn,
      pricingNote,
      shortDescription,
      detailedDescription,
      authors: finalAuthors,
      galleryImages,
      bookFileUrl,
      isActive,
    });

    return res.status(201).json({
      message: 'Publication created successfully',
      data: publication,
    });
  } catch (error) {
    console.error('Error creating publication:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all publications (admin, with optional filters)
exports.getPublications = async (req, res) => {
  try {
    const { category, subCategory, language, isActive } = req.query;

    const filter = {};
    if (category) filter.categories = category;
    if (subCategory) filter.subCategories = subCategory;
    if (language) filter.languages = language;
    if (typeof isActive !== 'undefined') filter.isActive = isActive === 'true';

    const publications = await Publication.find(filter)
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code')
      // validity is now a string enum, no populate needed

    return res.status(200).json({ data: publications });
  } catch (error) {
    console.error('Error fetching publications:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get single publication by ID
exports.getPublicationById = async (req, res) => {
  try {
    const { id } = req.params;

    const publication = await Publication.findById(id)
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code')
      // validity is now a string enum, no populate needed

    if (!publication) {
      return res.status(404).json({ message: 'Publication not found' });
    }

    return res.status(200).json({ data: publication });
  } catch (error) {
    console.error('Error fetching publication:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Main PATCH route for simple fields only
const ALLOWED_FIELDS = [
  'name',
  'startDate',
  'originalPrice',
  'discountPrice',
  'availableIn',
  'shortDescription',
  'detailedDescription',
  'isActive',
  'validity',
  'pricingNote'
];

exports.updatePublication = async (req, res) => {
  try {
    const updates = {};

    for (const field of ALLOWED_FIELDS) {
      if (req.body[field] !== undefined) {
        // Special handling for startDate to ensure proper Date conversion
        if (field === 'startDate' && req.body[field]) {
          // Handle different date formats
          let dateValue;
          if (req.body[field].includes('T')) {
            // ISO format already
            dateValue = new Date(req.body[field]);
          } else {
            // For YYYY-MM-DD format from frontend date pickers
            dateValue = new Date(req.body[field]);
          }
          
          // Normalize to UTC midnight for date-only fields
          // This ensures consistent date handling regardless of client timezone
          // and prevents date shifting when converting between timezones
          if (!isNaN(dateValue.getTime())) {
            dateValue.setUTCHours(0, 0, 0, 0);
            updates[field] = dateValue;
          }
        } else {
          updates[field] = req.body[field];
        }
      }
    }

    // Validate validity enum if provided
    if (updates.validity && !VALIDITY_LABELS.includes(updates.validity)) {
      return res.status(400).json({ 
        success: false,
        message: `Invalid validity. Must be one of: ${VALIDITY_LABELS.join(', ')}` 
      });
    }

    // Check if we have any updates
    if (Object.keys(updates).length === 0) {
      const publication = await Publication.findById(req.params.id)
        .populate('categories subCategories languages');
      
      if (!publication) {
        return res.status(404).json({ message: 'Publication not found' });
      }
      
      return res.json({
        message: 'No changes detected',
        data: publication
      });
    }

    // Calculate discount percent automatically if both prices are provided
    if (updates.originalPrice !== undefined && updates.discountPrice !== undefined) {
      if (updates.originalPrice > 0) {
        updates.discountPercent = ((updates.originalPrice - updates.discountPrice) / updates.originalPrice) * 100;
      } else {
        updates.discountPercent = 0;
      }
    } else if (updates.originalPrice !== undefined || updates.discountPrice !== undefined) {
      // If only one price is updated, we need to fetch the publication to calculate the discount
      const publication = await Publication.findById(req.params.id);
      if (publication) {
        const originalPrice = updates.originalPrice !== undefined ? updates.originalPrice : publication.originalPrice;
        const discountPrice = updates.discountPrice !== undefined ? updates.discountPrice : publication.discountPrice;
        
        if (originalPrice > 0) {
          updates.discountPercent = ((originalPrice - discountPrice) / originalPrice) * 100;
        } else {
          updates.discountPercent = 0;
        }
      }
    }

    const publication = await Publication.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('categories subCategories languages');

    if (!publication) {
      return res.status(404).json({ message: 'Publication not found' });
    }

    return res.json({
      message: 'Publication updated successfully',
      data: publication
    });
  } catch (error) {
    console.error('Error updating publication:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add author
exports.addAuthor = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, qualification, subject } = req.body;

    if (!name || !qualification || !subject) {
      return res.status(400).json({ message: 'Name, qualification, and subject are required' });
    }

    const publication = await Publication.findById(id);
    if (!publication) {
      return res.status(404).json({ message: 'Publication not found' });
    }

    // Handle author image upload
    let photoUrl;
    if (req.file && req.file.buffer) {
      const uploadResult = await uploadToCloudinary(
        req.file.buffer,
        'brainbuzz/publications/authors',
        'image'
      );
      photoUrl = uploadResult.secure_url;
    }

    publication.authors.push({
      name,
      qualification,
      subject,
      photoUrl
    });

    await publication.save();

    // Populate the updated publication
    const updatedPublication = await Publication.findById(id)
      .populate('categories subCategories languages validities');

    return res.json({
      message: 'Author added successfully',
      data: updatedPublication
    });
  } catch (error) {
    console.error('Error adding author:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update ONE author
exports.updateAuthor = async (req, res) => {
  try {
    const { id, authorId } = req.params;
    const { name, qualification, subject } = req.body;

    const publication = await Publication.findById(id);
    if (!publication) {
      return res.status(404).json({ message: 'Publication not found' });
    }

    const author = publication.authors.id(authorId);
    if (!author) {
      return res.status(404).json({ message: 'Author not found' });
    }

    // Update fields if provided
    if (name !== undefined) author.name = name;
    if (qualification !== undefined) author.qualification = qualification;
    if (subject !== undefined) author.subject = subject;

    // Handle author image upload if provided
    if (req.file && req.file.buffer) {
      const uploadResult = await uploadToCloudinary(
        req.file.buffer,
        'brainbuzz/publications/authors',
        'image'
      );
      author.photoUrl = uploadResult.secure_url;
    }

    await publication.save();

    // Populate the updated publication
    const updatedPublication = await Publication.findById(id)
      .populate('categories subCategories languages validities');

    return res.json({
      message: 'Author updated successfully',
      data: updatedPublication
    });
  } catch (error) {
    console.error('Error updating author:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete author
exports.deleteAuthor = async (req, res) => {
  try {
    const { id, authorId } = req.params;

    const publication = await Publication.findByIdAndUpdate(
      id,
      { $pull: { authors: { _id: authorId } } },
      { new: true }
    ).populate('categories subCategories languages validities');

    if (!publication) {
      return res.status(404).json({ message: 'Publication not found' });
    }

    return res.json({
      message: 'Author removed successfully',
      data: publication
    });
  } catch (error) {
    console.error('Error deleting author:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add image to gallery
exports.addImage = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ message: 'Image file is required' });
    }

    const uploadResult = await uploadToCloudinary(
      req.file.buffer,
      'brainbuzz/publications/images',
      'image'
    );

    const publication = await Publication.findByIdAndUpdate(
      id,
      { $push: { galleryImages: uploadResult.secure_url } },
      { new: true }
    ).populate('categories subCategories languages validities');

    if (!publication) {
      return res.status(404).json({ message: 'Publication not found' });
    }

    return res.json({
      message: 'Image added successfully',
      data: publication
    });
  } catch (error) {
    console.error('Error adding image:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Remove image from gallery
exports.removeImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ message: 'Image URL is required' });
    }

    const publication = await Publication.findByIdAndUpdate(
      id,
      { $pull: { galleryImages: imageUrl } },
      { new: true }
    ).populate('categories subCategories languages validities');

    if (!publication) {
      return res.status(404).json({ message: 'Publication not found' });
    }

    return res.json({
      message: 'Image removed successfully',
      data: publication
    });
  } catch (error) {
    console.error('Error removing image:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update book file
exports.updateBook = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ message: 'Book file is required' });
    }

    // Check publication type to ensure book file is allowed
    const publication = await Publication.findById(id);
    if (!publication) {
      return res.status(404).json({ message: 'Publication not found' });
    }

    // Only allow book file update if availableIn is not HARDCOPY
    if (publication.availableIn === 'HARDCOPY') {
      return res.status(400).json({ message: 'Cannot upload book file for HARDCOPY publications' });
    }

    const uploadResult = await uploadToCloudinary(
      req.file,
      'brainbuzz/publications/books',
      'raw'
    );

    const updatedPublication = await Publication.findByIdAndUpdate(
      id,
      { bookFileUrl: uploadResult.secure_url },
      { new: true }
    ).populate('categories subCategories languages validities');

    if (!updatedPublication) {
      return res.status(404).json({ message: 'Publication not found' });
    }

    return res.json({
      message: 'Book updated successfully',
      data: updatedPublication
    });
  } catch (error) {
    console.error('Error updating book:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update thumbnail
exports.updateThumbnail = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ message: 'Thumbnail file is required' });
    }

    const uploadResult = await uploadToCloudinary(
      req.file.buffer,
      'brainbuzz/publications/thumbnails',
      'image'
    );

    const publication = await Publication.findByIdAndUpdate(
      id,
      { thumbnailUrl: uploadResult.secure_url },
      { new: true }
    ).populate('categories subCategories languages validities');

    if (!publication) {
      return res.status(404).json({ message: 'Publication not found' });
    }

    return res.json({
      message: 'Thumbnail updated successfully',
      data: publication
    });
  } catch (error) {
    console.error('Error updating thumbnail:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update categories and subcategories
exports.updateCategories = async (req, res) => {
  try {
    const { id } = req.params;
    const { categories, subCategories } = req.body;

    const updates = {};
    if (categories !== undefined) updates.categories = categories;
    if (subCategories !== undefined) updates.subCategories = subCategories;

    const publication = await Publication.findByIdAndUpdate(
      id,
      updates,
      { new: true }
    ).populate('categories subCategories languages validities');

    if (!publication) {
      return res.status(404).json({ message: 'Publication not found' });
    }

    return res.json({
      message: 'Categories updated successfully',
      data: publication
    });
  } catch (error) {
    console.error('Error updating categories:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete publication
exports.deletePublication = async (req, res) => {
  try {
    const { id } = req.params;

    const publication = await Publication.findByIdAndDelete(id);
    if (!publication) {
      return res.status(404).json({ message: 'Publication not found' });
    }

    return res.status(200).json({ message: 'Publication deleted successfully' });
  } catch (error) {
    console.error('Error deleting publication:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ✅ NEW: Update preview settings
exports.updatePreviewSettings = async (req, res) => {
  try {
    const { id } = req.params;
    const { isPreviewEnabled, previewPages } = req.body;
    
    // Validate input
    if (isPreviewEnabled !== undefined && typeof isPreviewEnabled !== 'boolean') {
      return res.status(400).json({ 
        success: false, 
        message: 'isPreviewEnabled must be a boolean' 
      });
    }
    
    if (previewPages !== undefined) {
      const pages = parseInt(previewPages);
      if (isNaN(pages) || pages < 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'previewPages must be a non-negative number' 
        });
      }
    }
    
    const updates = {};
    if (isPreviewEnabled !== undefined) updates.isPreviewEnabled = isPreviewEnabled;
    if (previewPages !== undefined) updates.previewPages = parseInt(previewPages);
    
    const publication = await Publication.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('categories subCategories languages validities');
    
    if (!publication) {
      return res.status(404).json({ 
        success: false, 
        message: 'Publication not found' 
      });
    }
    
    return res.json({
      success: true,
      message: 'Preview settings updated successfully',
      data: publication
    });
    
  } catch (error) {
    console.error('Error updating preview settings:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// ✅ NEW: Toggle digital lock


// Get distinct categories for publications (admin - shows all publications regardless of active status)
exports.getPublicationCategories = async (req, res) => {
  try {
    const { contentType } = req.query;
    
    // Default to PUBLICATION
    const type = contentType || 'PUBLICATION';
    
    // Find publications (including inactive) and get distinct categories
    const publications = await Publication.find({ 
      contentType: type 
    }).populate('categories', 'name slug description thumbnailUrl');

    // Extract unique categories
    const categories = [];
    const categoryIds = new Set();
    
    publications.forEach(pub => {
      if (pub.categories) {
        pub.categories.forEach(cat => {
          if (!categoryIds.has(cat._id.toString())) {
            categoryIds.add(cat._id.toString());
            categories.push({
              _id: cat._id,
              name: cat.name,
              slug: cat.slug,
              description: cat.description,
              thumbnailUrl: cat.thumbnailUrl
            });
          }
        });
      }
    });

    return res.status(200).json({ data: categories });
  } catch (error) {
    console.error('Error fetching publication categories:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get distinct subcategories for publications based on category and language (admin - shows all publications regardless of active status)
exports.getPublicationSubCategories = async (req, res) => {
  try {
    const { category, language, lang } = req.query;
    
    const filter = {
      contentType: 'PUBLICATION',
      categories: category
    };

    // Handle language filter
    if (language) {
      filter.languages = language;
    } else if (lang) {
      const langDoc = await Language.findOne({
        $or: [
          { code: lang.toLowerCase() },
          { name: { $regex: `^${escapeRegex(lang)}$`, $options: 'i' } },
        ],
      });
      if (langDoc) {
        filter.languages = langDoc._id;
      }
    }

    const publications = await Publication.find(filter).populate('subCategories', 'name slug description thumbnailUrl');

    // Extract unique subcategories
    const subCategories = [];
    const subCategoryIds = new Set();
    
    publications.forEach(pub => {
      if (pub.subCategories) {
        pub.subCategories.forEach(subCat => {
          if (!subCategoryIds.has(subCat._id.toString())) {
            subCategoryIds.add(subCat._id.toString());
            subCategories.push({
              _id: subCat._id,
              name: subCat.name,
              slug: subCat.slug,
              description: subCat.description,
              thumbnailUrl: subCat.thumbnailUrl
            });
          }
        });
      }
    });

    return res.status(200).json({ data: subCategories });
  } catch (error) {
    console.error('Error fetching publication subcategories:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};
