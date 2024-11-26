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
    enum: ['waiting', 'active', 'paused', 'completed'],
    default: 'waiting'
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
    timeLeft: {
      type: Number,
      default: 30
    },
    startTime: {
      type: Date
    }
  },
  completedPlayers: [{
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player'
    },
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    amount: Number
  }],
  skippedPlayers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Auction', auctionSchema);
