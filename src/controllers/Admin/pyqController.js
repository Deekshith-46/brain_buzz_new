const PreviousQuestionPaper = require('../../models/Course/PreviousQuestionPaper');
const Category = require('../../models/Course/Category');
const SubCategory = require('../../models/Course/SubCategory');
const Language = require('../../models/Course/Language');
const Subject = require('../../models/Course/Subject');
const Exam = require('../../models/Course/Exam');
const cloudinary = require('../../config/cloudinary');

// ================= HELPERS =================
const uploadToCloudinary = (fileBuffer, folder, resourceType = 'image') => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(fileBuffer);
  });
};

// ================= CREATE PYQ =================
exports.createPYQ = async (req, res) => {
  try {
    // Parse JSON from form-data field
    let pyqData = {};
    
    // Check if req.body exists and has pyq field
    if (!req.body || !req.body.pyq) {
      return res.status(400).json({ 
        success: false, 
        message: 'Request body or pyq field is missing. Please send form-data with a "pyq" field containing JSON data.',
        debug: {
          hasBody: !!req.body,
          bodyKeys: req.body ? Object.keys(req.body) : [],
          hasFiles: !!req.files
        }
      });
    }
    
    try {
      pyqData = JSON.parse(req.body.pyq);
    } catch (parseError) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid JSON in pyq field',
        error: parseError.message 
      });
    }
    
    const {
      categoryId,
      subCategoryId,
      paperCategory,
      examId,
      subjectId,
      date,
      examDate,
      description,
      languages
    } = pyqData;

    if (!categoryId) return res.status(400).json({ success: false, message: 'Category ID is required' });
    if (!subCategoryId) return res.status(400).json({ success: false, message: 'SubCategory ID is required' });
    if (!paperCategory) return res.status(400).json({ success: false, message: 'Paper category is required' });
    if (!date) return res.status(400).json({ success: false, message: 'Admin added date is required' });
    if (!examDate) return res.status(400).json({ success: false, message: 'Exam date is required' });

    const examYear = new Date(examDate).getFullYear();

    if (languages) {
      const langIds = Array.isArray(languages) ? languages : [languages];
      for (const id of langIds) {
        const lang = await Language.findById(id);
        if (!lang) {
          return res.status(404).json({ success: false, message: `Language with ID ${id} not found` });
        }
      }
    }

    let thumbnailUrl;
    if (req.files?.thumbnail?.[0]) {
      const result = await uploadToCloudinary(
        req.files.thumbnail[0].buffer,
        'brainbuzz/pyq/thumbnails',
        'image'
      );
      thumbnailUrl = result.secure_url;
    }

    let fileUrl;
    if (req.files?.paper?.[0]) {
      const result = await uploadToCloudinary(
        req.files.paper[0].buffer,
        'brainbuzz/pyq/papers',
        'raw'
      );
      fileUrl = result.secure_url;
    } else {
      return res.status(400).json({ success: false, message: 'Paper file is required' });
    }

    const paper = await PreviousQuestionPaper.create({
      categoryId,
      subCategoryId,
      paperCategory,
      examId: examId || null,
      subjectId: subjectId || null,
      date,
      examDate,
      examYear,
      description,
      languages: languages ? (Array.isArray(languages) ? languages : [languages]) : [],
      thumbnailUrl,
      fileUrl
    });

    res.json({ success: true, message: 'Question paper added', data: paper });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= UPDATE PYQ =================
exports.updatePYQ = async (req, res) => {
  try {
    // Parse JSON from form-data field
    let pyqData = {};
    if (req.body && req.body.pyq) {
      pyqData = JSON.parse(req.body.pyq);
    } else if (req.body) {
      pyqData = req.body;
    }
    
    const {
      categoryId,
      subCategoryId,
      paperCategory,
      examId,
      subjectId,
      date,
      examDate,
      description,
      languages
    } = pyqData;

    const updateData = {};

    if (categoryId) updateData.categoryId = categoryId;
    if (subCategoryId) updateData.subCategoryId = subCategoryId;
    if (paperCategory) updateData.paperCategory = paperCategory;
    if (examId) updateData.examId = examId;
    if (subjectId) updateData.subjectId = subjectId;
    if (date) updateData.date = date;

    if (examDate) {
      updateData.examDate = examDate;
      updateData.examYear = new Date(examDate).getFullYear();
    }

    if (description) updateData.description = description;
    if (languages) updateData.languages = Array.isArray(languages) ? languages : [languages];

    if (updateData.languages) {
      for (const id of updateData.languages) {
        const lang = await Language.findById(id);
        if (!lang) {
          return res.status(404).json({ success: false, message: `Language with ID ${id} not found` });
        }
      }
    }

    if (req.files?.thumbnail?.[0]) {
      const result = await uploadToCloudinary(
        req.files.thumbnail[0].buffer,
        'brainbuzz/pyq/thumbnails',
        'image'
      );
      updateData.thumbnailUrl = result.secure_url;
    }

    if (req.files?.paper?.[0]) {
      const result = await uploadToCloudinary(
        req.files.paper[0].buffer,
        'brainbuzz/pyq/papers',
        'raw'
      );
      updateData.fileUrl = result.secure_url;
    }

    const paper = await PreviousQuestionPaper.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!paper) return res.status(404).json({ success: false, message: 'Question paper not found' });

    res.json({ success: true, data: paper });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= DELETE PYQ =================
exports.deletePYQ = async (req, res) => {
  try {
    await PreviousQuestionPaper.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Question paper deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= LIST PYQ =================
exports.listPYQ = async (req, res) => {
  try {
    const { subject, exam, ...otherFilters } = req.query;
    const filters = { isActive: true, ...otherFilters };

    // Handle subject filter by name
    if (subject) {
      const subjectDoc = await Subject.findOne({ 
        name: { $regex: new RegExp(`^${subject}$`, 'i') } 
      });
      if (subjectDoc) {
        filters.subjectId = subjectDoc._id;
      } else {
        // If subject not found, return empty array
        return res.json({ success: true, data: [] });
      }
    }

    // Handle exam filter by name
    if (exam) {
      const examDoc = await Exam.findOne({ 
        name: { $regex: new RegExp(`^${exam}$`, 'i') } 
      });
      if (examDoc) {
        filters.examId = examDoc._id;
      } else {
        // If exam not found, return empty array
        return res.json({ success: true, data: [] });
      }
    }

    // Remove undefined/null/empty values
    Object.keys(filters).forEach(key => {
      if (filters[key] === '' || filters[key] === undefined || filters[key] === null) {
        delete filters[key];
      }
    });

    const papers = await PreviousQuestionPaper.find(filters)
      .populate('examId subjectId categoryId subCategoryId languages');

    res.json({ success: true, data: papers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= GET PYQ BY ID =================
exports.getPYQById = async (req, res) => {
  try {
    const paper = await PreviousQuestionPaper.findById(req.params.id)
      .populate('examId subjectId categoryId subCategoryId languages');

    if (!paper) return res.status(404).json({ success: false, message: 'Previous Question Paper not found' });

    res.json({ success: true, data: paper });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= GET PYQ CATEGORIES =================
exports.getPYQCategories = async (req, res) => {
  try {
    const papers = await PreviousQuestionPaper.find({}).populate('categoryId', 'name slug description thumbnailUrl');

    const categories = [];
    const categoryIds = new Set();
    
    papers.forEach(paper => {
      if (paper.categoryId && paper.categoryId._id) {
        if (!categoryIds.has(paper.categoryId._id.toString())) {
          categoryIds.add(paper.categoryId._id.toString());
          categories.push({
            _id: paper.categoryId._id,
            name: paper.categoryId.name,
            slug: paper.categoryId.slug,
            description: paper.categoryId.description,
            thumbnailUrl: paper.categoryId.thumbnailUrl
          });
        }
      }
    });

    return res.status(200).json({ data: categories });
  } catch (error) {
    console.error('Error fetching PYQ categories:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ================= GET PYQ SUBCATEGORIES =================
exports.getPYQSubCategories = async (req, res) => {
  try {
    const { category } = req.query;
    
    const filter = category ? { categoryId: category } : {};

    const papers = await PreviousQuestionPaper.find(filter).populate('subCategoryId', 'name slug description thumbnailUrl');

    const subCategories = [];
    const subCategoryIds = new Set();
    
    papers.forEach(paper => {
      if (paper.subCategoryId) {
        if (!subCategoryIds.has(paper.subCategoryId._id.toString())) {
          subCategoryIds.add(paper.subCategoryId._id.toString());
          subCategories.push({
            _id: paper.subCategoryId._id,
            name: paper.subCategoryId.name,
            slug: paper.subCategoryId.slug,
            description: paper.subCategoryId.description,
            thumbnailUrl: paper.subCategoryId.thumbnailUrl
          });
        }
      }
    });

    return res.status(200).json({ data: subCategories });
  } catch (error) {
    console.error('Error fetching PYQ subcategories:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};
