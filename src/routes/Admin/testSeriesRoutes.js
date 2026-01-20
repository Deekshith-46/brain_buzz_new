const express = require('express');
const adminAuthMiddleware = require('../../middlewares/Admin/authMiddleware');
const upload = require('../../middlewares/uploadMiddleware');
const {
  createTestSeries,
  getTestSeriesList,
  getTestSeriesById,
  getFullTestSeries,
  updateTestSeries,
  deleteTestSeries,
  addTestToSeries,
  bulkAddTestsToSeries,
  getTestInSeries,
  updateTestInSeries,
  deleteTestFromSeries,
  updateTestInstructions,
  updateTestExplanationVideo,
  addSectionToTest,
  updateSectionInTest,
  deleteSectionFromTest,
  addQuestionToSection,
  updateQuestionInSection,
  deleteQuestionFromSection,
} = require('../../controllers/Admin/testSeriesController');

const {
  setCutoff,
  getCutoff,
  updateCutoff,
  deleteCutoff,
  getParticipants
} = require('../../controllers/Admin/testAttemptController');

const router = express.Router();

router.use(adminAuthMiddleware);

// Test Series basic CRUD
router.post(
  '/',
  adminAuthMiddleware,
  upload.single('thumbnail'),
  createTestSeries
);
router.get('/', getTestSeriesList);
router.get('/:id', getTestSeriesById);
router.get('/:id/full', getFullTestSeries);
router.put(
  '/:id',
  upload.single('thumbnail'),
  updateTestSeries
);
router.delete('/:id', deleteTestSeries);

// Tests within a series
router.post('/:seriesId/tests', addTestToSeries);
router.post('/:seriesId/tests/bulk', bulkAddTestsToSeries);
router.get('/:seriesId/tests/:testId', getTestInSeries);
router.put('/:seriesId/tests/:testId', updateTestInSeries);
router.delete('/:seriesId/tests/:testId', deleteTestFromSeries);

// Test instructions
router.put('/:seriesId/tests/:testId/instructions', updateTestInstructions);

// Test explanation video
router.post(
  '/:seriesId/tests/:testId/explanation-video',
  upload.single('explanationVideo'),
  updateTestExplanationVideo
);

// Sections within a test
router.post('/:seriesId/tests/:testId/sections', addSectionToTest);
router.put('/:seriesId/tests/:testId/sections/:sectionId', updateSectionInTest);
router.delete('/:seriesId/tests/:testId/sections/:sectionId', deleteSectionFromTest);

// Questions within a section
router.post(
  '/:seriesId/tests/:testId/sections/:sectionId/questions',
  addQuestionToSection
);
router.put(
  '/:seriesId/tests/:testId/sections/:sectionId/questions/:questionId',
  updateQuestionInSection
);
router.delete(
  '/:seriesId/tests/:testId/sections/:sectionId/questions/:questionId',
  deleteQuestionFromSection
);

// Cutoff management for Test
router.post('/:seriesId/tests/:testId/cutoff', setCutoff);
router.get('/:seriesId/tests/:testId/cutoff', getCutoff);
router.put('/:seriesId/tests/:testId/cutoff', updateCutoff);
router.delete('/:seriesId/tests/:testId/cutoff', deleteCutoff);

// View all participants score, rank, accuracy
router.get('/:seriesId/tests/:testId/participants', getParticipants);

module.exports = router;
