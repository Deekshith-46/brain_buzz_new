const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../models/User/User');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });
};

exports.registerUser = async (req, res) => {
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

    const existingByEmail = await User.findOne({ email });
    if (existingByEmail) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const existingByMobile = await User.findOne({ mobileNumber });
    if (existingByMobile) {
      return res.status(400).json({ message: 'Mobile number already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
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

    const token = generateToken(user._id);

    return res.status(201).json({
      message: 'User registered successfully',
      token,
      data: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        selectGender: user.selectGender,
        email: user.email,
        mobileNumber: user.mobileNumber,
        dateOfBirth: user.dateOfBirth,
        state: user.state,
        address: user.address,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error registering user:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      message: 'Login successful',
      token,
      data: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        selectGender: user.selectGender,
        email: user.email,
        mobileNumber: user.mobileNumber,
        dateOfBirth: user.dateOfBirth,
        state: user.state,
        address: user.address,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error logging in user:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getCurrentUserProfile = async (req, res) => {
  try {
    return res.status(200).json({ data: req.user });
  } catch (error) {
    console.error('Error getting user profile:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};
