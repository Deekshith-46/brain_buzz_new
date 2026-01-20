const Cutoff = require('../../models/TestSeries/Cutoff');
const TestRanking = require('../../models/TestSeries/TestRanking');
const TestAttempt = require('../../models/TestSeries/TestAttempt');
const TestSeries = require('../../models/TestSeries/TestSeries');

// Set Cutoff for Test
exports.setCutoff = async (req, res) => {
  try {
    const { seriesId, testId } = req.params;
    const { general, obc, sc, st } = req.body;

    // Validate that the test series and test exist
    const testSeries = await TestSeries.findById(seriesId);
    if (!testSeries) {
      return res.status(404).json({
        success: false,
        message: 'Test series not found'
      });
    }

    const test = testSeries.tests.id(testId);
    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found in this series'
      });
    }

    // Create or update cutoff
    const cutoff = await Cutoff.findOneAndUpdate(
      { testSeries: seriesId, testId: testId },
      {
        testSeries: seriesId,
        testId: testId,
        cutoff: {
          general: general || 0,
          obc: obc || 0,
          sc: sc || 0,
          st: st || 0
        }
      },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Cutoff set successfully',
      data: cutoff
    });
  } catch (error) {
    console.error('Error setting cutoff:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get Cutoff for Test
exports.getCutoff = async (req, res) => {
  try {
    const { seriesId, testId } = req.params;

    // Validate that the test series and test exist
    const testSeries = await TestSeries.findById(seriesId);
    if (!testSeries) {
      return res.status(404).json({
        success: false,
        message: 'Test series not found'
      });
    }

    const test = testSeries.tests.id(testId);
    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found in this series'
      });
    }

    // Find cutoff
    const cutoff = await Cutoff.findOne({ testSeries: seriesId, testId: testId });
    
    if (!cutoff) {
      return res.status(404).json({
        success: false,
        message: 'Cutoff not found for this test'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Cutoff fetched successfully',
      data: cutoff
    });
  } catch (error) {
    console.error('Error getting cutoff:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Update Cutoff for Test
exports.updateCutoff = async (req, res) => {
  try {
    const { seriesId, testId } = req.params;
    const { general, obc, sc, st } = req.body;

    // Validate that the test series and test exist
    const testSeries = await TestSeries.findById(seriesId);
    if (!testSeries) {
      return res.status(404).json({
        success: false,
        message: 'Test series not found'
      });
    }

    const test = testSeries.tests.id(testId);
    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found in this series'
      });
    }

    // Get existing cutoff to preserve unspecified values
    const existingCutoff = await Cutoff.findOne({ testSeries: seriesId, testId: testId });
    
    if (!existingCutoff) {
      return res.status(404).json({
        success: false,
        message: 'Cutoff not found for this test'
      });
    }

    // Build update object with only provided values
    const updateFields = {};
    if (general !== undefined) updateFields['cutoff.general'] = general;
    if (obc !== undefined) updateFields['cutoff.obc'] = obc;
    if (sc !== undefined) updateFields['cutoff.sc'] = sc;
    if (st !== undefined) updateFields['cutoff.st'] = st;

    // Update cutoff with only provided fields
    const cutoff = await Cutoff.findOneAndUpdate(
      { testSeries: seriesId, testId: testId },
      { $set: updateFields },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Cutoff updated successfully',
      data: cutoff
    });
  } catch (error) {
    console.error('Error updating cutoff:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Delete Cutoff for Test
exports.deleteCutoff = async (req, res) => {
  try {
    const { seriesId, testId } = req.params;

    // Validate that the test series and test exist
    const testSeries = await TestSeries.findById(seriesId);
    if (!testSeries) {
      return res.status(404).json({
        success: false,
        message: 'Test series not found'
      });
    }

    const test = testSeries.tests.id(testId);
    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found in this series'
      });
    }

    // Delete cutoff
    const cutoff = await Cutoff.findOneAndDelete({ testSeries: seriesId, testId: testId });
    
    if (!cutoff) {
      return res.status(404).json({
        success: false,
        message: 'Cutoff not found for this test'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Cutoff deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting cutoff:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// View all participants score, rank, accuracy
exports.getParticipants = async (req, res) => {
  try {
    const { seriesId, testId } = req.params;
    
    // Validate that the test series and test exist
    const testSeries = await TestSeries.findById(seriesId);
    if (!testSeries) {
      return res.status(404).json({
        success: false,
        message: 'Test series not found'
      });
    }

    const test = testSeries.tests.id(testId);
    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found in this series'
      });
    }

    // Check if result publish time has passed
    if (test.resultPublishTime && new Date() < new Date(test.resultPublishTime)) {
      return res.status(400).json({
        success: false,
        message: 'Test result not yet published'
      });
    }

    // Get all rankings for this test
    const rankings = await TestRanking.find({ testId: testId })
      .populate('user', 'name email')
      .sort({ rank: 1 });

    // Get additional details for each participant
    const participants = await Promise.all(rankings.map(async (ranking) => {
      // Get the test attempt for additional details
      const attempt = await TestAttempt.findOne({
        user: ranking.user._id,
        testSeries: seriesId,
        testId: testId
      });

      return {
        userId: ranking.user._id,
        userName: ranking.user.name,
        userEmail: ranking.user.email,
        score: ranking.score,
        rank: ranking.rank,
        accuracy: ranking.accuracy,
        totalParticipants: ranking.totalParticipants,
        correct: attempt ? attempt.correct : 0,
        incorrect: attempt ? attempt.incorrect : 0,
        unattempted: attempt ? attempt.unattempted : 0,
        speed: attempt ? attempt.speed : 0
      };
    }));

    return res.status(200).json({
      success: true,
      message: 'Participants fetched successfully',
      data: participants
    });
  } catch (error) {
    console.error('Error getting participants:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};