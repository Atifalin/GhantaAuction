const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  overall: {
    type: Number,
    required: true
  },
  position: {
    type: String,
    required: true
  },
  tier: {
    type: String,
    enum: ['gold', 'silver', 'bronze', 'extra'],
    required: true
  },
  stats: {
    pace: Number,
    shooting: Number,
    passing: Number,
    dribbling: Number,
    defending: Number,
    physical: Number
  },
  basePrice: {
    type: Number,
    required: true
  },
  currentOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
});

// Calculate tier and base price before saving
playerSchema.pre('save', function(next) {
  // Set tier based on overall rating
  if (this.overall >= 85) {
    this.tier = 'gold';
    this.basePrice = 50;
  } else if (this.overall >= 75) {
    this.tier = 'silver';
    this.basePrice = 40;
  } else if (this.overall >= 70) {
    this.tier = 'bronze';
    this.basePrice = 30;
  } else {
    this.tier = 'extra';
    this.basePrice = 20;
  }
  next();
});

module.exports = mongoose.model('Player', playerSchema);
