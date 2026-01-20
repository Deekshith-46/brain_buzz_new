const ValidityOption = require('../../models/Course/ValidityOption');

exports.createValidity = async (req, res) => {
  try {
    const { label, durationInDays, isActive } = req.body;

    if (!label || !durationInDays) {
      return res.status(400).json({ message: 'Label and durationInDays are required' });
    }

    const existing = await ValidityOption.findOne({ label: label.trim() });
    if (existing) {
      return res.status(400).json({ message: 'Validity with this label already exists' });
    }

    const validity = await ValidityOption.create({ label, durationInDays, isActive });

    return res.status(201).json({
      message: 'Validity created successfully',
      data: validity,
    });
  } catch (error) {
    console.error('Error creating validity:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getValidities = async (req, res) => {
  try {
    const validities = await ValidityOption.find();
    return res.status(200).json({ data: validities });
  } catch (error) {
    console.error('Error fetching validities:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getValidityById = async (req, res) => {
  try {
    const { id } = req.params;

    const validity = await ValidityOption.findById(id);
    if (!validity) {
      return res.status(404).json({ message: 'Validity not found' });
    }

    return res.status(200).json({ data: validity });
  } catch (error) {
    console.error('Error fetching validity:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateValidity = async (req, res) => {
  try {
    const { id } = req.params;
    const { label, durationInDays, isActive } = req.body;

    const updates = { durationInDays, isActive };

    if (label) {
      const existing = await ValidityOption.findOne({ label: label.trim(), _id: { $ne: id } });
      if (existing) {
        return res.status(400).json({ message: 'Validity with this label already exists' });
      }
      updates.label = label;
    }

    const validity = await ValidityOption.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!validity) {
      return res.status(404).json({ message: 'Validity not found' });
    }

    return res.status(200).json({
      message: 'Validity updated successfully',
      data: validity,
    });
  } catch (error) {
    console.error('Error updating validity:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteValidity = async (req, res) => {
  try {
    const { id } = req.params;

    const validity = await ValidityOption.findByIdAndDelete(id);
    if (!validity) {
      return res.status(404).json({ message: 'Validity not found' });
    }

    return res.status(200).json({ message: 'Validity deleted successfully' });
  } catch (error) {
    console.error('Error deleting validity:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};
