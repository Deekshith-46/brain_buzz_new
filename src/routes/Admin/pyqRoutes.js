const express = require('express');
const router = express.Router();
const pyqController = require('../../controllers/Admin/pyqController');
const uploadMiddleware = require('../../middlewares/uploadMiddleware');

// Routes for Previous Question Papers
router.post('/', uploadMiddleware.fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'paper', maxCount: 1 }
]), pyqController.createPYQ);

router.get('/', pyqController.listPYQ);

router.get('/:id', pyqController.getPYQById);

router.put('/:id', uploadMiddleware.fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'paper', maxCount: 1 }
]), pyqController.updatePYQ);

router.delete('/:id', pyqController.deletePYQ);

module.exports = router;