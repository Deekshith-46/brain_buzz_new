const express = require('express');
const {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  addClassesToCourse,
  createCourseShell,
  updateCourseShell,
  updateCourseBasic,
  updateCourseContent,
  addTutors,
  updateTutor,
  deleteTutor,
  updateClass,
  deleteClass,
  deleteStudyMaterial,
  publishCourse,
  unpublishCourse,
  uploadClassMedia,
  updateCourseDescriptions,
  createFullCourse,
  testUpdateCourseActiveStatus
} = require('../../controllers/Admin/courseController');
const adminAuthMiddleware = require('../../middlewares/Admin/authMiddleware');
const upload = require('../../middlewares/uploadMiddleware');

const router = express.Router();

router.use(adminAuthMiddleware);

// Clean professional routes
router.post('/', upload.fields([{ name: 'thumbnail', maxCount: 1 }]), createCourseShell); // create shell
router.put('/:id', upload.none(), updateCourseShell); // update shell
router.put(
  '/:id/basics',
  upload.fields([{ name: 'thumbnail', maxCount: 1 }]),
  updateCourseBasic
);
router.put(
  '/:id/content',
  upload.fields([{ name: 'studyMaterialFiles', maxCount: 50 }]),
  updateCourseContent
);
router.put(
  '/:id/descriptions',
  updateCourseDescriptions
);
router.delete('/:id/study-materials/:materialId', deleteStudyMaterial);
router.post(
  '/:id/tutors',
  upload.fields([{ name: 'tutorImages', maxCount: 10 }]),
  addTutors
);
router.put(
  '/:id/tutors/:tutorId',
  upload.fields([{ name: 'tutorImage', maxCount: 1 }]),
  updateTutor
);
router.delete('/:id/tutors/:tutorId', deleteTutor);
router.post(
  '/:id/classes',
  upload.fields([
    { name: 'classThumbnails', maxCount: 50 },
    { name: 'classLecturePics', maxCount: 50 },
    { name: 'classVideos', maxCount: 50 },
  ]),
  addClassesToCourse
);
router.put(
  '/:id/classes/:classId',
  upload.fields([
    { name: 'classThumbnail', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 },
    { name: 'classLecturePic', maxCount: 1 },
    { name: 'lecturePhoto', maxCount: 1 },
    { name: 'classVideo', maxCount: 1 },
    { name: 'video', maxCount: 1 },
  ]),
  updateClass
);
router.put(
  '/:id/classes/:classId/media',
  upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'lecturePhoto', maxCount: 1 },
    { name: 'video', maxCount: 1 },
  ]),
  uploadClassMedia
);
router.delete('/:id/classes/:classId', deleteClass);
router.patch('/:id/publish', publishCourse);
router.patch('/:id/unpublish', unpublishCourse);
router.patch('/:id/test-active-status', testUpdateCourseActiveStatus);

// Legacy all-in-one create/update if needed
router.post(
  '/all-in-one',
  upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'tutorImages', maxCount: 10 },
    { name: 'classThumbnails', maxCount: 50 },
    { name: 'classLecturePics', maxCount: 50 },
    { name: 'classVideos', maxCount: 50 },
    { name: 'studyMaterialFiles', maxCount: 50 },
  ]),
  createCourse
);

// New endpoint for creating a complete course in one API call
router.post(
  '/full',
  upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'tutorImages', maxCount: 10 },
    { name: 'classThumbnails', maxCount: 50 },
    { name: 'classLecturePics', maxCount: 50 },
    { name: 'classVideos', maxCount: 50 },
    { name: 'studyMaterialFiles', maxCount: 50 },
  ]),
  createFullCourse
);

router.get('/', getCourses);
router.get('/:id', getCourseById);

// SOLUTION 2: Change to PATCH for partial updates (better REST practice)
router.patch(
  '/:id/all-in-one',
  upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'tutorImages', maxCount: 10 },
    { name: 'classThumbnails', maxCount: 50 },
    { name: 'classLecturePics', maxCount: 50 },
    { name: 'classVideos', maxCount: 50 },
    { name: 'studyMaterialFiles', maxCount: 50 },
  ]),
  updateCourse
);

router.delete('/:id', deleteCourse);

module.exports = router;