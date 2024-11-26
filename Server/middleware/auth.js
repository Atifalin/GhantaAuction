const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: 'No authentication token, authorization denied.' });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
            const user = await User.findById(decoded.id).select('-password');

            if (!user) {
                return res.status(401).json({ message: 'Token is valid but user not found.' });
            }

            req.user = user;
            next();
        } catch (error) {
            console.error('Token verification error:', error);
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({ message: 'Invalid token format.' });
            } else if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Token has expired.' });
            } else {
                return res.status(401).json({ message: 'Token validation failed.' });
            }
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({ message: 'Server error during authentication.' });
    }
};

module.exports = auth;
