const express = require('express');
const router = express.Router();
const Auction = require('../models/Auction');
const Player = require('../models/Player');

// Create auction session
router.post('/', async (req, res) => {
  try {
    const { name, budget, hostId } = req.body;
    const auction = new Auction({
      name,
      budget,
      host: hostId,
      participants: [hostId]
    });
    await auction.save();
    res.status(201).json(auction);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all active auctions
router.get('/', async (req, res) => {
  try {
    const auctions = await Auction.find({ status: { $ne: 'completed' } })
      .populate('host', 'username')
      .populate('participants', 'username');
    res.json(auctions);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Join auction
router.post('/:id/join', async (req, res) => {
  try {
    const { userId } = req.body;
    const auction = await Auction.findById(req.params.id);
    
    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }

    if (auction.status !== 'waiting') {
      return res.status(400).json({ message: 'Auction already started' });
    }

    if (!auction.participants.includes(userId)) {
      auction.participants.push(userId);
      await auction.save();
    }

    res.json(auction);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Start auction
router.post('/:id/start', async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id);
    
    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }

    if (auction.status !== 'waiting') {
      return res.status(400).json({ message: 'Auction already started' });
    }

    // Get random player
    const player = await Player.findOne({ currentOwner: null });
    if (!player) {
      return res.status(400).json({ message: 'No players available' });
    }

    auction.status = 'active';
    auction.currentPlayer = {
      player: player._id,
      currentBid: {
        amount: player.basePrice,
        bidder: null
      },
      timeLeft: player.tier === 'gold' ? 60 : player.tier === 'silver' ? 45 : 30
    };

    await auction.save();
    res.json(auction);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
