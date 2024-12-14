const express = require('express');
const router = express.Router();
const Player = require('../models/Player');
const User = require('../models/User');
const auth = require('../middleware/auth'); // Assuming auth middleware is defined in this file

// Helper function to get tier and minimum bid
const getPlayerTierInfo = (overall) => {
  let tier, minimumBid;
  
  if (overall >= 85) {
    tier = 'gold';
    minimumBid = 50000;
  } else if (overall >= 75) {
    tier = 'silver';
    minimumBid = 30000;
  } else if (overall >= 65) {
    tier = 'bronze';
    minimumBid = 10000;
  } else {
    tier = 'extra';
    minimumBid = 0;
  }

  return { tier, minimumBid };
};

// Get all players with optional filters
router.get('/', auth, async (req, res) => {
  try {
    const { position, minOverall, maxOverall, search } = req.query;
    const userId = req.user._id;
    
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

    // Get user's favorites
    const user = await User.findById(userId).select('favorites');
    const userFavorites = user?.favorites || [];

    // Get players and add tier, minimumBid, and isFavorite
    const players = await Player.find(query).sort({ overall: -1 });
    const playersWithInfo = players.map(player => {
      const playerObj = player.toObject();
      const { tier, minimumBid } = getPlayerTierInfo(playerObj.overall);
      return {
        ...playerObj,
        tier,
        minimumBid,
        isFavorite: userFavorites.includes(player._id)
      };
    });

    res.json(playersWithInfo);
  } catch (error) {
    console.error('Error in GET /api/players:', error);
    res.status(500).json({ message: 'Failed to fetch players' });
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

// Get players by owner
router.get('/owner/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const players = await Player.find({ owner: userId });
    res.json(players);
  } catch (err) {
    console.error('Error fetching players by owner:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/players/:id/favorite - Toggle favorite status for a player
router.post('/:id/favorite', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const playerId = req.params.id;

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Initialize favorites array if it doesn't exist
    if (!user.favorites) {
      user.favorites = [];
    }

    // Toggle favorite status
    const favoriteIndex = user.favorites.findIndex(id => id.toString() === playerId);
    if (favoriteIndex === -1) {
      user.favorites.push(playerId);
    } else {
      user.favorites.splice(favoriteIndex, 1);
    }

    // Save the updated user
    await user.save();

    res.json({
      success: true,
      isFavorite: favoriteIndex === -1
    });
  } catch (error) {
    console.error('Error in favorite player:', error);
    res.status(500).json({ message: 'Server error while updating favorites' });
  }
});

// Update player's substitute status
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { isSubstitute } = req.body;

    const player = await Player.findByIdAndUpdate(
      id,
      { isSubstitute },
      { new: true }
    );

    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }

    res.json(player);
  } catch (err) {
    console.error('Error updating player:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
