const express = require('express');
const router = express.Router();
const pyqController = require('../../controllers/User/pyqController');
const userAuthMiddleware = require('../../middlewares/User/authMiddleware');

// All PYQ routes require authenticated user
router.use(userAuthMiddleware);

router.get('/', pyqController.listPYQ);
router.get('/:id', pyqController.getPYQById);

module.exports = router;