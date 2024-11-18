const express = require('express');
const router = express.Router();
const Player = require('../models/Player');

// Get all players with optional filters
router.get('/', async (req, res) => {
  try {
    console.log('GET /api/players - Received request');
    const { position, minOverall, maxOverall, search } = req.query;
    
    let query = {};
    
    // Position filter
    if (position && position !== 'all') {
      query.positions = position;
    }
    
    // Overall rating range
    if (minOverall || maxOverall) {
      query.overall = {};
      if (minOverall) query.overall.$gte = parseInt(minOverall);
      if (maxOverall) query.overall.$lte = parseInt(maxOverall);
    }
    
    // Search by name
    if (search) {
      query.$or = [
        { shortName: { $regex: search, $options: 'i' } },
        { longName: { $regex: search, $options: 'i' } }
      ];
    }

    console.log('Query:', JSON.stringify(query));
    const players = await Player.find(query).sort({ overall: -1 });
    console.log(`Found ${players.length} players`);
    res.json(players);
  } catch (err) {
    console.error('Error in GET /api/players:', err);
    res.status(500).json({ 
      message: 'Server error', 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined 
    });
  }
});

// Get player by ID
router.get('/:id', async (req, res) => {
  try {
    const player = await Player.findById(req.params.id);
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }
    res.json(player);
  } catch (err) {
    console.error('Error fetching player:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get top players by position
router.get('/position/:position', async (req, res) => {
  try {
    const { position } = req.params;
    const { limit = 30, minOverall = 68 } = req.query;
    
    const players = await Player.getTopPlayersByPosition(position, parseInt(limit), parseInt(minOverall));
    res.json(players);
  } catch (err) {
    console.error('Error fetching players by position:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get all available positions
router.get('/meta/positions', async (req, res) => {
  try {
    const positions = Player.getAllPositions();
    res.json(positions);
  } catch (err) {
    console.error('Error fetching positions:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
