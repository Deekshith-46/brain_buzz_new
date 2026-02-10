const express = require('express');
const router = express.Router();
const contactController = require('../../controllers/Admin/contactController');

// Route for creating/updating contact config (upsert)
router.post('/', contactController.upsertContact);

// Route for getting contact config by site type
router.get('/:siteType', contactController.getContact);

// Route for deleting contact config by site type
router.delete('/:siteType', contactController.deleteContact);

module.exports = router;