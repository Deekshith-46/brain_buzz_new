const ensureCategory = (req, res, next) => {
  if (!req.user || !req.user.category) {
    return res.status(403).json({
      success: false,
      message: 'Please complete your profile (category required)'
    });
  }
  next();
};

module.exports = ensureCategory;