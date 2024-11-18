const mongoose = require('mongoose');

const auctionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
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
    required: true
  },
  status: {
    type: String,
    enum: ['waiting', 'active', 'round2', 'completed'],
    default: 'waiting'
  },
  currentPlayer: {
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player'
    },
    currentBid: {
      amount: Number,
      bidder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    },
    timeLeft: Number
  },
  round: {
    type: Number,
    default: 1
  },
  skippedPlayers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player'
  }],
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
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Auction', auctionSchema);
