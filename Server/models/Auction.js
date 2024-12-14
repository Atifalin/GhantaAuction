const mongoose = require('mongoose');

const auctionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  budget: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'paused', 'completed'],
    default: 'pending'
  },
  round: {
    type: Number,
    default: 1
  },
  availablePlayers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player'
  }],
  skipVotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  currentPlayer: {
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player'
    },
    currentBid: {
      amount: {
        type: Number,
        default: 0
      },
      bidder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    },
    startTime: Date,
    endTime: Date,
    timeLeft: Number
  },
  completedPlayers: [{
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player',
      required: true
    },
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  skippedPlayers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player'
  }],
  settings: {
    bidTime: {
      type: Number,
      default: 30  // seconds
    },
    minBidIncrement: {
      type: Number,
      default: 1000
    },
    autoShuffle: {
      type: Boolean,
      default: true
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Ensure host reference is maintained after server restart
auctionSchema.pre('save', async function(next) {
  if (this.isModified('host')) {
    // Verify host exists
    const User = mongoose.model('User');
    const hostExists = await User.exists({ _id: this.host });
    if (!hostExists) {
      throw new Error('Invalid host reference');
    }
  }
  next();
});

// Validate minimum bid amount
auctionSchema.methods.validateBid = async function(amount, playerId) {
  const Player = mongoose.model('Player');
  const player = await Player.findById(playerId);
  
  if (!player) {
    throw new Error('Player not found');
  }

  // Check if bid meets minimum bid requirement
  if (this.currentPlayer.currentBid.amount === 0 && amount < player.minimumBid) {
    throw new Error(`Bid must be at least ${player.minimumBid} for ${player.tier} tier player`);
  }

  // Check if bid increment is valid
  if (this.currentPlayer.currentBid.amount > 0 && 
      amount < this.currentPlayer.currentBid.amount + this.settings.minBidIncrement) {
    throw new Error(`Bid must be at least ${this.currentPlayer.currentBid.amount + this.settings.minBidIncrement}`);
  }

  return true;
};

module.exports = mongoose.model('Auction', auctionSchema);
