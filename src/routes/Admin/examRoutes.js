const express = require('express');
const router = express.Router();
const examController = require('../../controllers/Admin/examController');

router.post('/', examController.createExam);
router.get('/', examController.listExams);
router.put('/:id', examController.updateExam);
router.delete('/:id', examController.deleteExam);

module.exports = router;