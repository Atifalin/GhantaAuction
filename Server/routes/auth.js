const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth');

// Initialize predefined users on server start
(async () => {
  try {
    console.log('Initializing predefined users...');
    await User.initializePredefinedUsers();
    console.log('Predefined users initialized successfully');
  } catch (error) {
    console.error('Error initializing predefined users:', error);
  }
})();

// Get all users (public endpoint)
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({})
      .select('username emoji color status')
      .lean();
    
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users with their current status from database
router.get('/users/status', async (req, res) => {
  try {
    // Get all users directly from database
    const users = await User.find({})
      .select('username emoji color status')
      .lean();
    
    if (!users || users.length === 0) {
      // If no users found, try to initialize them
      await User.initializePredefinedUsers();
      const newUsers = await User.find({})
        .select('username emoji color status')
        .lean();
      return res.json(newUsers);
    }
    
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      message: 'Failed to fetch users',
      error: error.message 
    });
  }
});

// Register user
router.post('/register', async (req, res) => {
  try {
    const { username, password, emoji, color } = req.body;

    let user = await User.findOne({ username });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    user = new User({
      username,
      password,
      emoji: emoji || '👤',
      color: color || '#1976d2',
      budget: 1000000 // Default budget
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    const payload = {
      id: user.id
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        emoji: user.emoji,
        color: user.color,
        budget: user.budget
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login with predefined user
router.post('/login', async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ message: 'Username is required' });
    }

    // Find user in database
    let user = await User.findOne({ username });
    
    if (!user) {
      // If user not found, check predefined users
      const predefinedUsers = User.getPredefinedUsers();
      const predefinedUser = predefinedUsers.find(u => u.username === username);
      
      if (!predefinedUser) {
        return res.status(400).json({ message: 'Invalid username' });
      }

      // Create user in database
      try {
        user = await User.create({
          ...predefinedUser,
          status: 'offline' // Start as offline until we confirm no one else is logged in
        });
      } catch (createError) {
        console.error('Error creating user:', createError);
        return res.status(500).json({ 
          message: 'Failed to create user',
          error: createError.message 
        });
      }
    }

    // Check if user is already online
    if (user.status === 'online') {
      return res.status(403).json({
        message: 'This user is already logged in',
        error: 'USER_ALREADY_ONLINE'
      });
    }

    // Update user status to online
    user.status = 'online';
    user.lastSeen = new Date();
    await user.save();

    // Create JWT token
    const token = jwt.sign(
      { 
        id: user._id,
        username: user.username 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Send response with user data and token
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        emoji: user.emoji,
        color: user.color,
        status: user.status,
        budget: user.budget
      }
    });

  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ 
      message: 'Login failed',
      error: error.message 
    });
  }
});

// Logout user
router.post('/logout', async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ message: 'Username is required' });
    }

    await User.findOneAndUpdate(
      { username },
      { status: 'offline' }
    );

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Error during logout:', error);
    res.status(500).json({ 
      message: 'Logout failed',
      error: error.message 
    });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Handle unexpected disconnections
router.post('/disconnect', async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ message: 'Username is required' });
    }

    // Force set user status to offline
    const user = await User.findOneAndUpdate(
      { username },
      { status: 'offline' },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ 
      message: 'User disconnected successfully',
      username: user.username,
      _id: user._id // Include MongoDB _id
    });
  } catch (error) {
    console.error('Disconnect error:', error);
    res.status(500).json({ 
      message: 'Disconnect failed',
      error: error.message 
    });
  }
});

// Verify token
router.get('/verify', async (req, res) => {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, 'your_jwt_secret');
    const user = await User.findById(decoded.id);
    if (!user) return res.status(400).json({ message: 'User not found' });

    res.json({
      user: {
        _id: user._id, // Include MongoDB _id
        id: user._id.toString(), // Include as string for compatibility
        username: user.username,
        emoji: user.emoji,
        color: user.color,
        status: user.status,
        budget: user.budget
      }
    });
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

module.exports = router;
