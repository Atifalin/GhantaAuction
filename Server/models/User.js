const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  emoji: {
    type: String,
    required: true
  },
  color: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['online', 'offline'],
    default: 'offline'
  },
  budget: {
    type: Number,
    default: 1000
  },
  team: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player'
  }],
  auctionsWon: [{
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player'
    },
    amount: Number,
    date: Date
  }]
}, {
  timestamps: true
});

// Static method to get predefined users
userSchema.statics.getPredefinedUsers = function() {
  return [
    {
      username: 'atif',
      emoji: '⚽',
      color: '#FF5722',
      status: 'offline',
      budget: 1000
    },
    {
      username: 'saqib',
      emoji: '🎯',
      color: '#2196F3',
      status: 'offline',
      budget: 1000
    },
    {
      username: 'aqib',
      emoji: '🎮',
      color: '#4CAF50',
      status: 'offline',
      budget: 1000
    },
    {
      username: 'wasif',
      emoji: '🏆',
      color: '#9C27B0',
      status: 'offline',
      budget: 1000
    }
  ];
};

// Initialize predefined users in the database
userSchema.statics.initializePredefinedUsers = async function() {
  try {
    const predefinedUsers = this.getPredefinedUsers();
    
    for (const userData of predefinedUsers) {
      await this.findOneAndUpdate(
        { username: userData.username },
        userData,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
    
    console.log('Predefined users initialized successfully');
  } catch (error) {
    console.error('Error initializing predefined users:', error);
    throw error;
  }
};

const User = mongoose.model('User', userSchema);

module.exports = User;
