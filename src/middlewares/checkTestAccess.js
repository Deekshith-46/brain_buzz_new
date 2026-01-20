const TestSeries = require('../models/TestSeries/TestSeries');
const Purchase = require('../models/Purchase/Purchase');

module.exports = async (req, res, next) => {
  const userId = req.user?._id;
  const { seriesId, testId } = req.params;

  // 1️⃣ Fetch test series
  const testSeries = await TestSeries.findById(seriesId);
  
  if (!testSeries) {
    return res.status(404).json({
      success: false,
      message: "Test series not found"
    });
  }

  // 2️⃣ Find the specific test
  const test = testSeries.tests.id(testId);
  if (!test) {
    return res.status(404).json({
      success: false,
      message: "Test not found in this series"
    });
  }

  // 3️⃣ FREE test series → allow
  if (testSeries.accessType === "FREE") return next();

  // 4️⃣ FREE individual test → allow
  if (test.isFree) return next();

  // 5️⃣ Check purchase
  const purchased = await Purchase.exists({
    user: userId,
    "items.itemId": seriesId,
    "items.itemType": "test_series"
  });

  if (!purchased) {
    return res.status(403).json({
      success: false,
      message: "Please purchase this test series to access this test"
    });
  }

  next();
};