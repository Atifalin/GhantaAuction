const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  playerId: {
    type: Number,
    required: true,
    unique: true
  },
  shortName: {
    type: String,
    required: true
  },
  longName: {
    type: String,
    required: true
  },
  positions: {
    type: [String],
    required: true
  },
  mainPosition: {
    type: String,
    required: true
  },
  overall: {
    type: Number,
    required: true
  },
  potential: {
    type: Number,
    required: true
  },
  value: {
    type: Number,
    required: true
  },
  wage: {
    type: Number,
    required: true
  },
  age: {
    type: Number,
    required: true
  },
  height: {
    type: Number,
    required: true
  },
  weight: {
    type: Number,
    required: true
  },
  nationality: {
    type: String,
    required: true
  },
  club: {
    type: String,
    required: true
  },
  league: {
    type: String,
    required: true
  },
  preferredFoot: {
    type: String,
    required: true
  },
  weakFoot: {
    type: Number,
    required: true
  },
  skillMoves: {
    type: Number,
    required: true
  },
  workRate: {
    type: String,
    required: true
  },
  bodyType: {
    type: String,
    required: true
  },
  realFace: {
    type: Boolean,
    required: true
  },
  releaseClause: {
    type: Number,
    required: true
  },
  
  // Main stats
  pace: { type: Number, required: true },
  shooting: { type: Number, required: true },
  passing: { type: Number, required: true },
  dribbling: { type: Number, required: true },
  defending: { type: Number, required: true },
  physical: { type: Number, required: true },

  // Detailed stats
  stats: {
    attacking: {
      crossing: { type: Number, required: true },
      finishing: { type: Number, required: true },
      headingAccuracy: { type: Number, required: true },
      shortPassing: { type: Number, required: true },
      volleys: { type: Number, required: true }
    },
    skill: {
      dribbling: { type: Number, required: true },
      curve: { type: Number, required: true },
      fkAccuracy: { type: Number, required: true },
      longPassing: { type: Number, required: true },
      ballControl: { type: Number, required: true }
    },
    movement: {
      acceleration: { type: Number, required: true },
      sprintSpeed: { type: Number, required: true },
      agility: { type: Number, required: true },
      reactions: { type: Number, required: true },
      balance: { type: Number, required: true }
    },
    power: {
      shotPower: { type: Number, required: true },
      jumping: { type: Number, required: true },
      stamina: { type: Number, required: true },
      strength: { type: Number, required: true },
      longShots: { type: Number, required: true }
    },
    mentality: {
      aggression: { type: Number, required: true },
      interceptions: { type: Number, required: true },
      positioning: { type: Number, required: true },
      vision: { type: Number, required: true },
      penalties: { type: Number, required: true },
      composure: { type: Number, required: true }
    },
    defending: {
      marking: { type: Number, required: true },
      standingTackle: { type: Number, required: true },
      slidingTackle: { type: Number, required: true }
    },
    goalkeeping: {
      diving: { type: Number, required: true },
      handling: { type: Number, required: true },
      kicking: { type: Number, required: true },
      positioning: { type: Number, required: true },
      reflexes: { type: Number, required: true }
    }
  },

  // Player traits and tags
  traits: {
    type: [String],
    required: true,
    default: []
  },
  tags: {
    type: [String],
    required: true,
    default: []
  },
  favorites: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    default: [],
    required: true
  },
}, {
  timestamps: true
});

// Static method to get all positions
playerSchema.statics.getAllPositions = function() {
  return [
    'GK',    // Goalkeeper
    'CB',    // Center Back
    'LB',    // Left Back
    'RB',    // Right Back
    'LWB',   // Left Wing Back
    'RWB',   // Right Wing Back
    'CDM',   // Defensive Midfielder
    'CM',    // Central Midfielder
    'CAM',   // Attacking Midfielder
    'LM',    // Left Midfielder
    'RM',    // Right Midfielder
    'LW',    // Left Winger
    'RW',    // Right Winger
    'CF',    // Center Forward
    'ST'     // Striker
  ];
};

// Static method to get top players by position
playerSchema.statics.getTopPlayersByPosition = function(position, limit = 30, minOverall = 65) {
  return this.find({
    positions: position,
    overall: { $gte: minOverall }
  })
  .sort({ overall: -1 })
  .limit(limit);
};

const Player = mongoose.model('Player', playerSchema);

module.exports = Player;
