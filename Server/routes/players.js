const express = require('express');
const router = express.Router();
const Player = require('../models/Player');

// Get all players
router.get('/', async (req, res) => {
  try {
    const players = await Player.find();
    res.json(players);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
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
    res.status(500).json({ message: 'Server error' });
  }
});

// Search players
router.get('/search/:query', async (req, res) => {
  try {
    const query = req.params.query;
    const players = await Player.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { position: { $regex: query, $options: 'i' } }
      ]
    });
    res.json(players);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
