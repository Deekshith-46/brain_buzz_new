const Admin = require('../../models/Admin/Admin');
const bcrypt = require('bcryptjs');

// Create new admin
exports.createAdmin = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      selectGender,
      email,
      mobileNumber,
      dateOfBirth,
      state,
      address,
      password,
      isActive,
    } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const existingByEmail = await Admin.findOne({ email });
    if (existingByEmail) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const existingByMobile = await Admin.findOne({ mobileNumber });
    if (existingByMobile) {
      return res.status(400).json({ message: 'Mobile number already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await Admin.create({
      firstName,
      lastName,
      selectGender,
      email,
      mobileNumber,
      dateOfBirth,
      state,
      address,
      password: hashedPassword,
      isActive,
    });

    const adminObj = admin.toObject();
    delete adminObj.password;

    return res.status(201).json({
      message: 'Admin created successfully',
      data: adminObj,
    });
  } catch (error) {
    console.error('Error creating admin:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all admins
exports.getAdmins = async (req, res) => {
  try {
    const admins = await Admin.find().select('-password');
    return res.status(200).json({ data: admins });
  } catch (error) {
    console.error('Error fetching admins:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get single admin by ID
exports.getAdminById = async (req, res) => {
  try {
    const { id } = req.params;

    const admin = await Admin.findById(id).select('-password');
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    return res.status(200).json({ data: admin });
  } catch (error) {
    console.error('Error fetching admin:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update admin
exports.updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.email) {
      const existingByEmail = await Admin.findOne({ email: updates.email, _id: { $ne: id } });
      if (existingByEmail) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }

    if (updates.mobileNumber) {
      const existingByMobile = await Admin.findOne({ mobileNumber: updates.mobileNumber, _id: { $ne: id } });
      if (existingByMobile) {
        return res.status(400).json({ message: 'Mobile number already exists' });
      }
    }

    if (updates.password) {
      if (updates.password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long' });
      }
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    const admin = await Admin.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    const adminObj = admin.toObject();
    delete adminObj.password;

    return res.status(200).json({
      message: 'Admin updated successfully',
      data: adminObj,
    });
  } catch (error) {
    console.error('Error updating admin:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete admin (hard delete)
exports.deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const admin = await Admin.findByIdAndDelete(id);

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    return res.status(200).json({ message: 'Admin deleted successfully' });
  } catch (error) {
    console.error('Error deleting admin:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};
