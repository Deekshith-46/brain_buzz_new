const SubCategory = require('../../models/Course/SubCategory');
const Category = require('../../models/Course/Category');
const cloudinary = require('../../config/cloudinary');

const slugify = (text) =>
  text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

const uploadToCloudinary = (fileBuffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder }, (error, result) => {
      if (error) {
        return reject(error);
      }
      resolve(result);
    });

    stream.end(fileBuffer);
  });
};

exports.createSubCategory = async (req, res) => {
  try {
    const { category, name, description, isActive } = req.body;

    if (!category || !name) {
      return res.status(400).json({ message: 'Category and name are required' });
    }

    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({ message: 'Invalid category id' });
    }

    // Get the contentType from the parent category
    const contentType = categoryExists.contentType;

    const slug = slugify(name);

    const existing = await SubCategory.findOne({ category, slug, contentType });
    if (existing) {
      return res
        .status(400)
        .json({ message: 'Subcategory with this name already exists for this category and content type' });
    }

    let thumbnailUrl;
    if (req.file && req.file.buffer) {
      const uploadResult = await uploadToCloudinary(
        req.file.buffer,
        'brainbuzz/subcategories/thumbnails'
      );
      thumbnailUrl = uploadResult.secure_url;
    }

    const subCategory = await SubCategory.create({
      category,
      name,
      slug,
      description,
      isActive,
      contentType,
      thumbnailUrl,
    });

    return res.status(201).json({
      message: 'Subcategory created successfully',
      data: subCategory,
    });
  } catch (error) {
    console.error('Error creating subcategory:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getSubCategories = async (req, res) => {
  try {
    const { category, contentType } = req.query;
    
    // Require contentType parameter
    if (!contentType) {
      return res.status(400).json({
        message: 'contentType is required'
      });
    }
    
    const filter = { contentType };
    if (category) {
      filter.category = category;
    }

    const subCategories = await SubCategory.find(filter).populate('category', 'name slug');
    return res.status(200).json({ data: subCategories });
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getSubCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const subCategory = await SubCategory.findById(id).populate('category', 'name slug');
    if (!subCategory) {
      return res.status(404).json({ message: 'Subcategory not found' });
    }

    return res.status(200).json({ data: subCategory });
  } catch (error) {
    console.error('Error fetching subcategory:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateSubCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { category, name, description, isActive } = req.body;

    const updates = { description, isActive };

    let contentType = null;
    
    if (category) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return res.status(400).json({ message: 'Invalid category id' });
      }
      updates.category = category;
      contentType = categoryExists.contentType;
      updates.contentType = contentType;
    }

    if (name) {
      const slug = slugify(name);
      
      // Get the contentType if not already set
      if (!contentType) {
        const existingSubCategory = await SubCategory.findById(id);
        if (existingSubCategory) {
          contentType = existingSubCategory.contentType;
        }
      }
      
      const existing = await SubCategory.findOne({
        category: category || undefined,
        slug,
        contentType,
        _id: { $ne: id },
      });
      if (existing) {
        return res
          .status(400)
          .json({ message: 'Subcategory with this name already exists for this category and content type' });
      }
      updates.name = name;
      updates.slug = slug;
    }

    if (req.file && req.file.buffer) {
      const uploadResult = await uploadToCloudinary(
        req.file.buffer,
        'brainbuzz/subcategories/thumbnails'
      );
      updates.thumbnailUrl = uploadResult.secure_url;
    }

    const subCategory = await SubCategory.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).populate('category', 'name slug');

    if (!subCategory) {
      return res.status(404).json({ message: 'Subcategory not found' });
    }

    return res.status(200).json({
      message: 'Subcategory updated successfully',
      data: subCategory,
    });
  } catch (error) {
    console.error('Error updating subcategory:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteSubCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const subCategory = await SubCategory.findByIdAndDelete(id);
    if (!subCategory) {
      return res.status(404).json({ message: 'Subcategory not found' });
    }

    return res.status(200).json({ message: 'Subcategory deleted successfully' });
  } catch (error) {
    console.error('Error deleting subcategory:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.toggleSubCategoryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const subCategory = await SubCategory.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    );

    if (!subCategory) {
      return res.status(404).json({ message: 'Subcategory not found' });
    }

    return res.status(200).json({
      message: `Subcategory ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: subCategory,
    });
  } catch (error) {
    console.error('Error toggling subcategory status:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};