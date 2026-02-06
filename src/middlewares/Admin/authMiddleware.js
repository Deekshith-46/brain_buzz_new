const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization header missing or invalid' });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded || decoded.role !== 'admin') {
      return res.status(401).json({ message: 'Invalid admin token' });
    }

    // Create a mock admin user object with valid ObjectId for TestAttempt model
    req.user = { 
      _id: new mongoose.Types.ObjectId('000000000000000000000000'), // Valid ObjectId
      email: decoded.email, 
      role: decoded.role,
      isAdmin: true
    };
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ message: 'Unauthorized', error: error.message });
  }
};

module.exports = authMiddleware;
