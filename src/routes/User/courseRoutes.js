const express = require('express');
const { 
  listCourses, 
  getCourseById, 
  getCourseClass
} = require('../../controllers/User/courseController');
const userAuthMiddleware = require('../../middlewares/User/authMiddleware');
const checkContentAccess = require('../../middlewares/checkContentAccess');
const { checkCourseAccess } = require('../../middlewares/checkCourseAccess');

const router = express.Router();

// All course routes require authenticated user
router.use(userAuthMiddleware);

router.get('/courses', listCourses);
router.get('/courses/:id', getCourseById);
router.get('/courses/:courseId/classes/:classId', checkCourseAccess, getCourseClass);

module.exports = router;
