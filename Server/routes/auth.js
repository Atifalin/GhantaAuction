const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Initialize predefined users on server start
(async () => {
  try {
    await User.initializePredefinedUsers();
  } catch (error) {
    console.error('Failed to initialize predefined users:', error);
  }
})();

// Get all users with their current status from database
router.get('/users', async (req, res) => {
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
        message: 'This user is already logged in from another device',
        error: 'USER_ALREADY_ONLINE'
      });
    }

    // Try to set user status to online using atomic operation
    const updatedUser = await User.findOneAndUpdate(
      { 
        username,
        status: 'offline' // Only update if current status is offline
      },
      { status: 'online' },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(403).json({
        message: 'This user is already logged in from another device',
        error: 'USER_ALREADY_ONLINE'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: updatedUser._id,
        username: updatedUser.username,
        emoji: updatedUser.emoji,
        color: updatedUser.color
      },
      'your_jwt_secret',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        username: updatedUser.username,
        emoji: updatedUser.emoji,
        color: updatedUser.color,
        status: updatedUser.status,
        budget: updatedUser.budget
      }
    });
  } catch (error) {
    console.error('Login error:', error);
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

    // Update user status to offline
    const user = await User.findOneAndUpdate(
      { username },
      { status: 'offline' },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ 
      message: 'Logged out successfully',
      username: user.username
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      message: 'Logout failed',
      error: error.message 
    });
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
      username: user.username
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
        id: user._id,
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
