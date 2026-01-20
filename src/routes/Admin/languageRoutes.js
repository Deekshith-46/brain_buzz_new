const express = require('express');
const {
  createLanguage,
  getLanguages,
  getLanguageById,
  updateLanguage,
  deleteLanguage,
} = require('../../controllers/Admin/languageController');
const adminAuthMiddleware = require('../../middlewares/Admin/authMiddleware');

const router = express.Router();

router.use(adminAuthMiddleware);

router.post('/', createLanguage);
router.get('/', getLanguages);
router.get('/:id', getLanguageById);
router.put('/:id', updateLanguage);
router.delete('/:id', deleteLanguage);

module.exports = router;
