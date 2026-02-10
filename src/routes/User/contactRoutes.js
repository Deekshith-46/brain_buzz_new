const express = require('express');
const router = express.Router();
const contactController = require('../../controllers/User/contactController');

// Route for getting contact config
router.get('/', contactController.getContact);

module.exports = router;