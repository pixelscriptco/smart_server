const jwt = require('jsonwebtoken');
const db = require('../models');

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Invalid token format' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user
    const user = await db.User.findOne({ where: { id: decoded.id } });
    if (!user) {
      console.log('User not found for ID:', decoded.id);
      return res.status(401).json({ message: 'User not found' });
    }

    if (user.status !== 'active') {
      console.log('User account not active:', user.status);
      return res.status(403).json({ message: 'User account is not active' });
    }

    // Add user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    res.status(401).json({ message: 'Authentication failed' });
  }
};

module.exports = auth; 