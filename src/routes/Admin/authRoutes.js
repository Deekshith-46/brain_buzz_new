const express = require('express');
const { loginAdmin, getCurrentAdminProfile } = require('../../controllers/Admin/authController');
const authMiddleware = require('../../middlewares/Admin/authMiddleware');

const router = express.Router();

router.post('/login', loginAdmin);
router.get('/me', authMiddleware, getCurrentAdminProfile);

module.exports = router;
