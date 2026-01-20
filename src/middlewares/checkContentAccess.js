const Course = require('../models/Course/Course');
const TestSeries = require('../models/TestSeries/TestSeries');
const DailyQuiz = require('../models/Quiz/DailyQuiz');
const LiveClass = require('../models/LiveClass');
const Publication = require('../models/Publication/Publication');
const EBook = require('../models/EBook/EBook');
const CurrentAffair = require('../models/CurrentAffairs/CurrentAffairBase');
const Purchase = require('../models/Purchase/Purchase');

// Map content types to models
const contentModels = {
  'ONLINE_COURSE': Course,
  'TEST_SERIES': TestSeries,
  'DAILY_QUIZ': DailyQuiz,
  'LIVE_CLASS': LiveClass,
  'PUBLICATION': Publication,
  'E_BOOK': EBook,
  'CURRENT_AFFAIRS': CurrentAffair
};

module.exports = async (req, res, next) => {
  const userId = req.user?._id;
  const { contentType, itemId, subItemId } = req.params;

  // Validate content type
  if (!contentModels[contentType]) {
    return res.status(400).json({
      success: false,
      message: "Invalid content type"
    });
  }

  // 1️⃣ Fetch main content
  const ContentModel = contentModels[contentType];
  const item = await ContentModel.findById(itemId);
  
  if (!item) {
    return res.status(404).json({
      success: false,
      message: "Content not found"
    });
  }

  // 2️⃣ FREE module → allow
  if (item.accessType === "FREE") return next();

  // 3️⃣ PAID module + FREE sub-item → allow
  if (subItemId) {
    let subItem = null;
    
    // Handle different sub-item types
    if (contentType === 'ONLINE_COURSE' && item.classes) {
      subItem = item.classes.id(subItemId);
    } else if (contentType === 'TEST_SERIES' && item.tests) {
      subItem = item.tests.id(subItemId);
    }
    
    if (subItem?.isFree) return next();
  }

  // 4️⃣ Check purchase
  const purchased = await Purchase.exists({
    user: userId,
    "items.itemId": itemId,
    "items.contentType": contentType
  });

  if (!purchased) {
    return res.status(403).json({
      success: false,
      message: "Please purchase to access this content"
    });
  }

  next();
};