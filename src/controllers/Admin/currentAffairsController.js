const cloudinary = require('../../config/cloudinary');

const CurrentAffairWithCategory = require('../../models/CurrentAffairs/CurrentAffairWithCategory');
const Category = require('../../models/Course/Category');
const SubCategory = require('../../models/Course/SubCategory');
const Language = require('../../models/Course/Language');
const CurrentAffairsCategory = require('../../models/CurrentAffairs/CurrentAffairsCategory');

// -------------------- HELPERS --------------------
const uploadToCloudinary = (fileBuffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(fileBuffer);
  });
};

// -------------------- CREATE CURRENT AFFAIR --------------------
exports.createCurrentAffair = async (req, res) => {
  try {
    if (!req.body.affair) {
      return res.status(400).json({
        message: 'Affair data is required in form-data'
      });
    }

    let payload;
    try {
      payload = JSON.parse(req.body.affair);
    } catch {
      return res.status(400).json({
        message: 'Invalid JSON in affair field'
      });
    }

    const {
      currentAffairsCategoryId,
      categoryId,
      subCategoryId,
      languageId,
      name,
      heading,
      description,
      fullContent,
      date,
      month,
      isActive
    } = payload;

    if (
      !currentAffairsCategoryId ||
      !categoryId ||
      !subCategoryId ||
      !languageId
    ) {
      return res.status(400).json({
        message:
          'CurrentAffairsCategory, Category, SubCategory and Language are required'
      });
    }

    if (!name || !heading || !description || !fullContent || !date) {
      return res.status(400).json({
        message: 'Name, heading, description, fullContent and date are required'
      });
    }

    const caCategory = await CurrentAffairsCategory.findOne({
      _id: currentAffairsCategoryId,
      isActive: true
    });

    if (!caCategory) {
      return res.status(400).json({
        message: 'Invalid Current Affairs category'
      });
    }

    if (caCategory.categoryType === 'monthly' && !month) {
      return res.status(400).json({
        message: 'Month is required for Monthly Current Affairs'
      });
    }

    const category = await Category.findOne({
      _id: categoryId,
      contentType: 'CURRENT_AFFAIRS',
      isActive: true
    });

    if (!category) {
      return res.status(400).json({
        message: 'Invalid Category for Current Affairs'
      });
    }

    const subCategory = await SubCategory.findOne({
      _id: subCategoryId,
      category: categoryId,
      contentType: 'CURRENT_AFFAIRS',
      isActive: true
    });

    if (!subCategory) {
      return res.status(400).json({
        message: 'Invalid SubCategory for selected Category'
      });
    }

    const language = await Language.findOne({
      _id: languageId,
      isActive: true
    });

    if (!language) {
      return res.status(400).json({
        message: 'Invalid Language'
      });
    }

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        message: 'Thumbnail is required'
      });
    }

    const uploadResult = await uploadToCloudinary(
      req.file.buffer,
      'brainbuzz/current-affairs/thumbnails'
    );

    const affair = await CurrentAffairWithCategory.create({
      category: currentAffairsCategoryId,
      categories: [categoryId],
      subCategories: [subCategoryId],
      languages: [languageId],
      name: name.trim(),
      heading: heading.trim(),
      description,
      fullContent,
      date,
      month: caCategory.categoryType === 'monthly' ? month : null,
      thumbnailUrl: uploadResult.secure_url,
      isActive: isActive ?? true
    });

    const populatedAffair = await CurrentAffairWithCategory.findById(affair._id)
      .populate('category', 'name slug categoryType')
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code');

    return res.status(201).json({
      success: true,
      message: 'Current Affair created successfully',
      data: populatedAffair
    });
  } catch (error) {
    console.error('Create Current Affair Error:', error);
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};


exports.getCurrentAffairs = async (req, res) => {
  try {
    const {
      categoryId: caCategoryId, // CurrentAffairsCategory (International, State, Sports, etc.)
      category: examCategoryId, // Exam Category (UPSC, APPSC, etc.)
      subcategory: examSubCategoryId, // Exam Subcategory (Prelims, Mains, etc.)
      month,
      isActive,
      fromDate,
      toDate,
      language,
      lang
    } = req.query;
    
    const filter = {};
    
    // Filter by main CA category (current affairs type like International, State, etc.)
    if (caCategoryId) {
      filter.category = caCategoryId;
    }
    
    // Filter by exam category (UPSC, APPSC, etc.)
    if (examCategoryId) {
      filter.categories = examCategoryId;
    }
    
    // Filter by exam subcategory (Prelims, Mains, etc.)
    if (examSubCategoryId) {
      filter.subCategories = examSubCategoryId;
    }
    
    // Filter by active status
    if (typeof isActive !== 'undefined') {
      filter.isActive = isActive === 'true';
    }
    
    // Filter by month
    if (month) {
      filter.month = month;
    }
    
    // Filter by date range
    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) filter.createdAt.$gte = new Date(fromDate);
      if (toDate) filter.createdAt.$lte = new Date(toDate);
    }
    
    // ✅ LANGUAGE FILTER (FIX)
    if (language) {
      filter.languages = language;
    } 
    else if (lang) {
      const escapeRegex = (s) =>
        s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          
      const langDoc = await Language.findOne({
        $or: [
          { code: lang.toLowerCase() },
          { name: { $regex: `^${escapeRegex(lang)}$`, $options: 'i' } }
        ]
      });
          
      // If language not found → return empty
      if (!langDoc) {
        return res.status(200).json({
          success: true,
          count: 0,
          data: {}
        });
      }
          
      filter.languages = langDoc._id;
    }
        
    const [affairs, caCategories] = await Promise.all([
      CurrentAffairWithCategory.find(filter)
        .populate('category', 'name slug categoryType')
        .populate('categories', 'name slug')
        .populate('subCategories', 'name slug')
        .populate('languages', 'name code')
        .sort({ createdAt: -1 }),
    
      CurrentAffairsCategory.find({ isActive: true })
        .select('categoryType')
    ]);
    
    const groupedData = {};
    
    // Create empty buckets ONLY when no specific caCategoryId
    if (!caCategoryId) {
      caCategories.forEach(cat => {
        groupedData[cat.categoryType] = [];
      });
    }
    
    affairs.forEach(affair => {
      const type = affair.category?.categoryType || 'others';
      if (!type) return;
    
      if (!groupedData[type]) groupedData[type] = [];
      groupedData[type].push(affair);
    });
    
    // If caCategoryId → remove empty keys
    if (caCategoryId) {
      Object.keys(groupedData).forEach(k => {
        if (groupedData[k].length === 0) delete groupedData[k];
      });
    }
    
    return res.status(200).json({
      success: true,
      count: affairs.length,
      data: affairs.length > 0 ? groupedData : {}
    });

  } catch (error) {
    console.error('Get Current Affairs Error:', error);
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};


// -------------------- GET CURRENT AFFAIR BY ID --------------------
exports.getCurrentAffairById = async (req, res) => {
  try {
    const affair = await CurrentAffairWithCategory.findById(req.params.id)
      .populate('category', 'name slug categoryType')
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code');

    if (!affair) {
      return res.status(404).json({
        success: false,
        message: 'Current Affair not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: affair
    });
  } catch (error) {
    console.error('Get Current Affair By ID Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// -------------------- UPDATE CURRENT AFFAIR --------------------
exports.updateCurrentAffair = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!id || id.length !== 24) {
      return res.status(400).json({
        message: 'Invalid Current Affair ID'
      });
    }

    const affair = await CurrentAffairWithCategory.findById(id);

    if (!affair) {
      return res.status(404).json({
        message: 'Current Affair not found'
      });
    }

    // Parse payload (supports form-data + JSON)
    let payload = {};
    if (req.body.affair) {
      try {
        payload = JSON.parse(req.body.affair);
      } catch {
        return res.status(400).json({
          message: 'Invalid JSON in affair field'
        });
      }
    } else {
      payload = req.body;
    }

    const {
      currentAffairsCategoryId,
      categoryId,
      subCategoryId,
      languageId,
      name,
      heading,
      description,
      fullContent,
      date,
      month,
      isActive
    } = payload;

    // ---------------- VALIDATIONS ----------------
    if (currentAffairsCategoryId) {
      const caCategory = await CurrentAffairsCategory.findOne({
        _id: currentAffairsCategoryId,
        isActive: true
      });

      if (!caCategory) {
        return res.status(400).json({
          message: 'Invalid Current Affairs category'
        });
      }

      if (caCategory.categoryType === 'monthly' && !month) {
        return res.status(400).json({
          message: 'Month is required for Monthly Current Affairs'
        });
      }

      affair.category = currentAffairsCategoryId;
      affair.month = caCategory.categoryType === 'monthly' ? month : null;
    }

    if (categoryId) {
      const category = await Category.findOne({
        _id: categoryId,
        contentType: 'CURRENT_AFFAIRS',
        isActive: true
      });

      if (!category) {
        return res.status(400).json({
          message: 'Invalid Category for Current Affairs'
        });
      }

      affair.categories = [categoryId];
    }

    if (subCategoryId) {
      const subCategory = await SubCategory.findOne({
        _id: subCategoryId,
        contentType: 'CURRENT_AFFAIRS',
        isActive: true
      });

      if (!subCategory) {
        return res.status(400).json({
          message: 'Invalid SubCategory'
        });
      }

      affair.subCategories = [subCategoryId];
    }

    if (languageId) {
      const language = await Language.findOne({
        _id: languageId,
        isActive: true
      });

      if (!language) {
        return res.status(400).json({
          message: 'Invalid Language'
        });
      }

      affair.languages = [languageId];
    }

    // ---------------- UPDATE FIELDS ----------------
    if (name) affair.name = name.trim();
    if (heading) affair.heading = heading.trim();
    if (description) affair.description = description;
    if (fullContent) affair.fullContent = fullContent;
    if (date) affair.date = date;
    if (typeof isActive !== 'undefined') affair.isActive = isActive;

    // ---------------- THUMBNAIL UPDATE ----------------
    if (req.file && req.file.buffer) {
      const uploadResult = await uploadToCloudinary(
        req.file.buffer,
        'brainbuzz/current-affairs/thumbnails'
      );

      affair.thumbnailUrl = uploadResult.secure_url;
    }

    await affair.save();

    const populatedAffair = await CurrentAffairWithCategory.findById(affair._id)
      .populate('category', 'name slug categoryType')
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code');

    return res.status(200).json({
      success: true,
      message: 'Current Affair updated successfully',
      data: populatedAffair
    });

  } catch (error) {
    console.error('Update Current Affair Error:', error);
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};


// -------------------- DELETE (HARD) CURRENT AFFAIR --------------------
exports.deleteCurrentAffair = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || id.length !== 24) {
      return res.status(400).json({
        message: 'Invalid Current Affair ID'
      });
    }

    const affair = await CurrentAffairWithCategory.findByIdAndDelete(id);

    if (!affair) {
      return res.status(404).json({
        message: 'Current Affair not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Current Affair permanently deleted'
    });

  } catch (error) {
    console.error('Delete Current Affair Error:', error);
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};


// -------------------- GET DISTINCT CATEGORIES FOR CURRENT AFFAIRS (ADMIN) --------------------
exports.getCurrentAffairsCategories = async (req, res) => {
  try {
    const affairs = await CurrentAffairWithCategory.find({})
      .populate('categories', 'name slug description thumbnailUrl');

    const categories = [];
    const categoryIds = new Set();

    affairs.forEach(affair => {
      if (affair.categories?.length) {
        affair.categories.forEach(cat => {
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
    console.error('Error fetching current affairs categories:', error);
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};



// -------------------- GET DISTINCT SUBCATEGORIES FOR CURRENT AFFAIRS (ADMIN) --------------------
exports.getCurrentAffairsSubCategories = async (req, res) => {
  try {
    const { category, language, lang } = req.query;

    if (!category) {
      return res.status(400).json({
        message: 'Category is required'
      });
    }

    // Base filter (NO contentType here)
    const filter = {
      categories: category
    };

    // Language filter
    if (language) {
      filter.languages = language;
    } 
    else if (lang) {
      const escapeRegex = (s) =>
        s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      const langDoc = await Language.findOne({
        $or: [
          { code: lang.toLowerCase() },
          { name: { $regex: `^${escapeRegex(lang)}$`, $options: 'i' } }
        ]
      });

      if (langDoc) {
        filter.languages = langDoc._id;
      }
    }

    // Fetch affairs
    const affairs = await CurrentAffairWithCategory.find(filter)
      .populate('subCategories', 'name slug description thumbnailUrl');

    // Extract unique subcategories
    const subCategories = [];
    const subCategoryIds = new Set();

    affairs.forEach(affair => {
      if (affair.subCategories?.length) {
        affair.subCategories.forEach(subCat => {
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

    return res.status(200).json({
      data: subCategories
    });

  } catch (error) {
    console.error('Error fetching current affairs subcategories:', error);
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

