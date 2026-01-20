const express = require('express');
const { listEBooks, getEBookById } = require('../../controllers/User/eBookController');

const router = express.Router();

router.get('/ebooks', listEBooks);
router.get('/ebooks/:id', getEBookById);

module.exports = router;
