const Language = require('../../models/Course/Language');

exports.createLanguage = async (req, res) => {
  try {
    const { name, code, isActive } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const existing = await Language.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({ message: 'Language with this name already exists' });
    }

    const language = await Language.create({ name, code, isActive });

    return res.status(201).json({
      message: 'Language created successfully',
      data: language,
    });
  } catch (error) {
    console.error('Error creating language:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getLanguages = async (req, res) => {
  try {
    const languages = await Language.find();
    return res.status(200).json({ data: languages });
  } catch (error) {
    console.error('Error fetching languages:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getLanguageById = async (req, res) => {
  try {
    const { id } = req.params;

    const language = await Language.findById(id);
    if (!language) {
      return res.status(404).json({ message: 'Language not found' });
    }

    return res.status(200).json({ data: language });
  } catch (error) {
    console.error('Error fetching language:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateLanguage = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, isActive } = req.body;

    const updates = { code, isActive };

    if (name) {
      const existing = await Language.findOne({ name: name.trim(), _id: { $ne: id } });
      if (existing) {
        return res.status(400).json({ message: 'Language with this name already exists' });
      }
      updates.name = name;
    }

    const language = await Language.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!language) {
      return res.status(404).json({ message: 'Language not found' });
    }

    return res.status(200).json({
      message: 'Language updated successfully',
      data: language,
    });
  } catch (error) {
    console.error('Error updating language:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteLanguage = async (req, res) => {
  try {
    const { id } = req.params;

    const language = await Language.findByIdAndDelete(id);
    if (!language) {
      return res.status(404).json({ message: 'Language not found' });
    }

    return res.status(200).json({ message: 'Language deleted successfully' });
  } catch (error) {
    console.error('Error deleting language:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};
