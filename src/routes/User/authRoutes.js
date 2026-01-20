const express = require('express');
const {
  registerUser,
  loginUser,
  getCurrentUserProfile,
} = require('../../controllers/User/authController');
const userAuthMiddleware = require('../../middlewares/User/authMiddleware');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', userAuthMiddleware, getCurrentUserProfile);

module.exports = router;
