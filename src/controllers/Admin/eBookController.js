const EBook = require('../../models/EBook/EBook');
const Category = require('../../models/Course/Category');
const SubCategory = require('../../models/Course/SubCategory');
const Language = require('../../models/Course/Language');
const cloudinary = require('../../config/cloudinary');

// Helper function to escape regex special characters
const escapeRegex = (s) => s.replace(/[.*+?^${}()|\[\]\\]/g, '\\$&');

const uploadToCloudinary = (fileBuffer, folder, resourceType = 'image') => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      }
    );

    stream.end(fileBuffer);
  });
};

// Create E-Book
exports.createEBook = async (req, res) => {
  try {
    if (!req.body.ebook) {
      return res
        .status(400)
        .json({ message: 'E-Book data (ebook) is required in form-data' });
    }

    const parsed = JSON.parse(req.body.ebook);

    const {
      name,
      startDate,
      categoryIds = [],
      subCategoryIds = [],
      languageIds = [],
      description,
      isActive,
    } = parsed;

    if (!name) {
      return res.status(400).json({ message: 'E-Book name is required' });
    }

    // Thumbnail
    let thumbnailUrl;
    if (req.files && req.files.thumbnail && req.files.thumbnail[0]) {
      const thumbFile = req.files.thumbnail[0];
      const uploadResult = await uploadToCloudinary(
        thumbFile.buffer,
        'brainbuzz/ebooks/thumbnails',
        'image'
      );
      thumbnailUrl = uploadResult.secure_url;
    }

    // Book file
    let bookFileUrl;
    if (req.files && req.files.bookFile && req.files.bookFile[0]) {
      const bookFile = req.files.bookFile[0];
      const uploadResult = await uploadToCloudinary(
        bookFile.buffer,
        'brainbuzz/ebooks/books',
        'raw'
      );
      bookFileUrl = uploadResult.secure_url;
    }

    const ebook = await EBook.create({
      name,
      startDate,
      categories: categoryIds,
      subCategories: subCategoryIds,
      languages: languageIds,
      thumbnailUrl,
      description,
      bookFileUrl,
      isActive,
    });

    return res.status(201).json({
      message: 'E-Book created successfully',
      data: ebook,
    });
  } catch (error) {
    console.error('Error creating E-Book:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Admin: get all e-books
exports.getEBooks = async (req, res) => {
  try {
    const { category, subCategory, language, isActive } = req.query;

    const filter = {};
    if (category) filter.categories = category;
    if (subCategory) filter.subCategories = subCategory;
    if (language) filter.languages = language;
    if (typeof isActive !== 'undefined') filter.isActive = isActive === 'true';

    const ebooks = await EBook.find(filter)
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code');

    return res.status(200).json({ data: ebooks });
  } catch (error) {
    console.error('Error fetching E-Books:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Admin: get single e-book
exports.getEBookById = async (req, res) => {
  try {
    const { id } = req.params;

    const ebook = await EBook.findById(id)
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code');

    if (!ebook) {
      return res.status(404).json({ message: 'E-Book not found' });
    }

    return res.status(200).json({ data: ebook });
  } catch (error) {
    console.error('Error fetching E-Book:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Main PATCH route for simple fields only
const ALLOWED_FIELDS = [
  'name',
  'startDate',
  'description',
  'isActive'
];

exports.updateEBook = async (req, res) => {
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

    // Check if we have any updates
    if (Object.keys(updates).length === 0) {
      const ebook = await EBook.findById(req.params.id)
        .populate('categories subCategories languages');
      
      if (!ebook) {
        return res.status(404).json({ message: 'E-Book not found' });
      }
      
      return res.json({
        message: 'No changes detected',
        data: ebook
      });
    }

    const ebook = await EBook.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('categories subCategories languages');

    if (!ebook) {
      return res.status(404).json({ message: 'E-Book not found' });
    }

    return res.json({
      message: 'E-Book updated successfully',
      data: ebook
    });
  } catch (error) {
    console.error('Error updating E-Book:', error);
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

    const uploadResult = await uploadToCloudinary(
      req.file.buffer,
      'brainbuzz/ebooks/books',
      'raw'
    );

    const ebook = await EBook.findByIdAndUpdate(
      id,
      { bookFileUrl: uploadResult.secure_url },
      { new: true }
    ).populate('categories subCategories languages');

    if (!ebook) {
      return res.status(404).json({ message: 'E-Book not found' });
    }

    return res.json({
      message: 'Book updated successfully',
      data: ebook
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
      'brainbuzz/ebooks/thumbnails',
      'image'
    );

    const ebook = await EBook.findByIdAndUpdate(
      id,
      { thumbnailUrl: uploadResult.secure_url },
      { new: true }
    ).populate('categories subCategories languages');

    if (!ebook) {
      return res.status(404).json({ message: 'E-Book not found' });
    }

    return res.json({
      message: 'Thumbnail updated successfully',
      data: ebook
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

    const ebook = await EBook.findByIdAndUpdate(
      id,
      updates,
      { new: true }
    ).populate('categories subCategories languages');

    if (!ebook) {
      return res.status(404).json({ message: 'E-Book not found' });
    }

    return res.json({
      message: 'Categories updated successfully',
      data: ebook
    });
  } catch (error) {
    console.error('Error updating categories:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Admin: delete e-book
exports.deleteEBook = async (req, res) => {
  try {
    const { id } = req.params;

    const ebook = await EBook.findByIdAndDelete(id);
    if (!ebook) {
      return res.status(404).json({ message: 'E-Book not found' });
    }

    return res.status(200).json({ message: 'E-Book deleted successfully' });
  } catch (error) {
    console.error('Error deleting E-Book:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get distinct categories for e-books (admin - shows all e-books regardless of active status)
exports.getEBookCategories = async (req, res) => {
  try {
    // Find e-books (including inactive) and get distinct categories
    const ebooks = await EBook.find({}).populate('categories', 'name slug description thumbnailUrl');

    // Extract unique categories
    const categories = [];
    const categoryIds = new Set();
    
    ebooks.forEach(ebook => {
      if (ebook.categories) {
        ebook.categories.forEach(cat => {
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
    console.error('Error fetching e-book categories:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get distinct subcategories for e-books based on category and language (admin - shows all e-books regardless of active status)
exports.getEBookSubCategories = async (req, res) => {
  try {
    const { category, language, lang } = req.query;
    
    const filter = {
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

    const ebooks = await EBook.find(filter).populate('subCategories', 'name slug description thumbnailUrl');

    // Extract unique subcategories
    const subCategories = [];
    const subCategoryIds = new Set();
    
    ebooks.forEach(ebook => {
      if (ebook.subCategories) {
        ebook.subCategories.forEach(subCat => {
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
    console.error('Error fetching e-book subcategories:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};
