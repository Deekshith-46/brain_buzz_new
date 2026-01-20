const express = require('express');
const router = express.Router();

const {
  createUser,
  getUsers,
  getUserProfile,
  updateUserProfile,
  deleteUserProfile,
  getAllUserDetails,
  getMyCourses,
  getMyTestSeries,
  getMyPublications,
  getMyOrders
} = require('../../controllers/User/userController');
const userAuthMiddleware = require('../../middlewares/User/authMiddleware');

router.post('/', createUser);
router.get('/', getUsers);
router.get('/profile', userAuthMiddleware, getUserProfile);
router.put('/profile', userAuthMiddleware, updateUserProfile);
router.delete('/profile', userAuthMiddleware, deleteUserProfile);

// My Content routes
router.get('/all-details', userAuthMiddleware, getAllUserDetails);
router.get('/my-courses', userAuthMiddleware, getMyCourses);
router.get('/my-test-series', userAuthMiddleware, getMyTestSeries);
router.get('/my-publications', userAuthMiddleware, getMyPublications);
router.get('/my-orders', userAuthMiddleware, getMyOrders);

module.exports = router;
