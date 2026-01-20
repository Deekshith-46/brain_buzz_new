const express = require('express');
const router = express.Router();
const subjectController = require('../../controllers/Admin/subjectController');

router.post('/', subjectController.createSubject);
router.get('/', subjectController.listSubjects);
router.put('/:id', subjectController.updateSubject);
router.delete('/:id', subjectController.deleteSubject);

module.exports = router;