const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  emoji: {
    type: String,
    default: '👤'
  },
  color: {
    type: String,
    default: '#1976d2'
  },
  status: {
    type: String,
    enum: ['online', 'offline'],
    default: 'offline'
  },
  budget: {
    type: Number,
    default: 1000000
  },
  team: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player'
  }],
  favorites: [{
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
      username: 'Atif',
      emoji: '👑',
      color: '#FF0000',
      budget: 1000000
    },
    {
      username: 'Saqib',
      emoji: '🎯',
      color: '#0000FF',
      budget: 1000000
    },
    {
      username: 'Aqib',
      emoji: '⚡',
      color: '#00FF00',
      budget: 1000000
    },
    {
      username: 'Wasif',
      emoji: '🌟',
      color: '#FFA500',
      budget: 1000000
    }
  ];
};

// Initialize predefined users and remove any others
userSchema.statics.initializePredefinedUsers = async function() {
  try {
    // First, remove all existing users
    await this.deleteMany({});
    console.log('Cleared all existing users');

    // Get predefined users
    const predefinedUsers = this.getPredefinedUsers();
    
    // Create the predefined users
    for (const userData of predefinedUsers) {
      await this.create({
        ...userData,
        status: 'offline'
      });
    }
    
    console.log('Successfully initialized predefined users');
  } catch (error) {
    console.error('Error initializing predefined users:', error);
    throw error;
  }
};

const User = mongoose.model('User', userSchema);

module.exports = User;
