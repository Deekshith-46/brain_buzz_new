const PreviousQuestionPaper = require('../../models/Course/PreviousQuestionPaper');
const Subject = require('../../models/Course/Subject');
const Exam = require('../../models/Course/Exam');

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

// Get single PYQ by ID
exports.getPYQById = async (req, res) => {
  try {
    const paper = await PreviousQuestionPaper.findById(req.params.id)
      .populate('examId subjectId categoryId subCategoryId languages');

    if (!paper) {
      return res.status(404).json({ 
        success: false, 
        message: 'Previous Question Paper not found' 
      });
    }

    if (!paper.isActive) {
      return res.status(404).json({ 
        success: false, 
        message: 'Previous Question Paper not available' 
      });
    }

    res.json({ success: true, data: paper });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};