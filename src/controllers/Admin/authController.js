const jwt = require('jsonwebtoken');

const generateToken = (email) => {
  return jwt.sign({ email, role: 'admin' }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });
};

exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      return res.status(500).json({ message: 'Admin credentials are not configured' });
    }

    if (email !== adminEmail || password !== adminPassword) {
      return res.status(400).json({ message: 'Invalid admin credentials' });
    }

    const token = generateToken(email);

    return res.status(200).json({
      message: 'Admin login successful',
      token,
      data: {
        email: adminEmail,
        role: 'admin',
      },
    });
  } catch (error) {
    console.error('Error logging in admin:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getCurrentAdminProfile = async (req, res) => {
  try {
    return res.status(200).json({ data: req.admin });
  } catch (error) {
    console.error('Error getting admin profile:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};
