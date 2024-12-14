const express = require('express');
const router = express.Router();
const Auction = require('../models/Auction');
const User = require('../models/User');
const Player = require('../models/Player');
const AuctionPlayer = require('../models/AuctionPlayer');
const auth = require('../middleware/auth');
const { getIO, broadcastAuctionUpdate } = require('../socket');
const { getPlayerTierInfo } = require('../utils/playerTiers');

// Create auction session
router.post('/', auth, async (req, res) => {
  try {
    const { name, budget } = req.body;
    const hostId = req.user.id; // Get host ID from authenticated user
    
    // Validate required fields
    if (!name || !budget) {
      return res.status(400).json({ 
        message: 'Missing required fields', 
        details: {
          name: !name ? 'Auction name is required' : null,
          budget: !budget ? 'Budget is required' : null,
        }
      });
    }

    // Validate host exists
    const host = await User.findById(hostId);
    if (!host) {
      return res.status(404).json({ message: 'Host user not found' });
    }

    // Get all players from the database
    const players = await Player.find()
      .select('_id shortName longName overall positions mainPosition');
    
    if (!players || players.length === 0) {
      return res.status(500).json({ 
        message: 'No players available for auction. Please ensure players are loaded in the database.' 
      });
    }

    // Shuffle the players array
    const shuffledPlayers = players.sort(() => Math.random() - 0.5);

    // Create auction with proper validation
    const auction = new Auction({
      name: name.trim(),
      budget: Number(budget),
      host: hostId,
      participants: [hostId],
      availablePlayers: shuffledPlayers.map(p => p._id),
      status: 'pending',
      round: 1,
      skipVotes: [], // Add array to track skip votes
      currentPlayer: {
        timeLeft: 30,
        currentBid: {
          amount: 0
        }
      }
    });

    await auction.save();
    
    // Populate the host information before sending response
    await auction.populate('host', 'username emoji color');
    
    // Broadcast the new auction to all connected clients
    broadcastAuctionUpdate(auction._id, 'created', { auction });

    res.status(201).json(auction);
  } catch (error) {
    console.error('Error creating auction:', error);
    res.status(500).json({ message: 'Error creating auction', error: error.message });
  }
});

// Get all auctions
router.get('/', async (req, res) => {
  try {
    const auctions = await Auction.find()
      .populate('host', 'username emoji color')
      .populate('participants', 'username emoji color budget')
      .populate('completedPlayers.player', 'shortName longName overall positions mainPosition')
      .populate('completedPlayers.winner', 'username emoji color')
      .sort({ 
        // Sort active and waiting first, then paused, then completed
        status: 1,
        // Within each status, sort by most recent first
        createdAt: -1 
      });

    // Group auctions by status for the client
    const groupedAuctions = {
      active: auctions.filter(a => a.status === 'active'),
      pending: auctions.filter(a => a.status === 'pending'),
      completed: auctions.filter(a => a.status === 'completed')
    };

    res.json(groupedAuctions);
  } catch (err) {
    console.error('Error fetching auctions:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
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

    if (auction.status !== 'pending') {
      return res.status(400).json({ message: 'Cannot join auction that has already started' });
    }

    if (auction.participants.includes(userId)) {
      return res.status(400).json({ message: 'User already in auction' });
    }

    auction.participants.push(userId);
    await auction.save();

    const populatedAuction = await Auction.findById(auction._id)
      .populate('host', 'username emoji color')
      .populate('participants', 'username emoji color budget')
      .populate('availablePlayers', 'shortName longName overall positions mainPosition')
      .populate('skipVotes', 'username')
      .populate('currentPlayer.player', 'shortName longName overall positions mainPosition')
      .populate('currentPlayer.currentBid.bidder', 'username emoji color');

    // Broadcast the updated auction to all connected clients
    broadcastAuctionUpdate(auction._id, 'updated', { auction: populatedAuction });

    res.json(populatedAuction);
  } catch (err) {
    console.error('Error joining auction:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Start auction
router.post('/:id/start', async (req, res) => {
  try {
    const { hostId } = req.body;
    const auction = await Auction.findById(req.params.id);
    
    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }

    if (auction.host.toString() !== hostId) {
      return res.status(403).json({ message: 'Only the host can start the auction' });
    }

    if (auction.status !== 'pending') {
      return res.status(400).json({ message: 'Auction has already started or is completed' });
    }

    if (auction.participants.length < 1) {
      return res.status(400).json({ message: 'Need at least one participant to start auction' });
    }

    // Set the first player up for auction
    auction.status = 'active';
    auction.currentPlayer = {
      player: auction.availablePlayers[0],
      currentBid: {
        amount: 0
      },
      timeLeft: 30,
      startTime: new Date()
    };
    auction.availablePlayers = auction.availablePlayers.slice(1);
    
    await auction.save();

    const populatedAuction = await Auction.findById(auction._id)
      .populate('host', 'username emoji color')
      .populate('participants', 'username emoji color budget')
      .populate('availablePlayers', 'shortName longName overall positions mainPosition')
      .populate('skipVotes', 'username')
      .populate('currentPlayer.player', 'shortName longName overall positions mainPosition')
      .populate('currentPlayer.currentBid.bidder', 'username emoji color');

    // Broadcast the updated auction to all connected clients
    broadcastAuctionUpdate(auction._id, 'updated', { auction: populatedAuction });

    res.json(populatedAuction);
  } catch (err) {
    console.error('Error starting auction:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Place bid
router.post('/:id/bid', auth, async (req, res) => {
  try {
    const { amount } = req.body;
    const auctionId = req.params.id;
    const userId = req.user.id;

    const auction = await Auction.findById(auctionId)
      .populate('currentPlayer.player', 'shortName longName overall positions mainPosition tier minimumBid pace shooting passing dribbling defending physical');
    
    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }

    // Validate auction is active
    if (auction.status !== 'active') {
      return res.status(400).json({ message: 'Auction is not active' });
    }

    // Get current player's tier info
    const player = auction.currentPlayer.player;
    if (!player) {
      return res.status(404).json({ message: 'Current player not found' });
    }

    // Use the player's own minimumBid instead of calculating from tier
    const minimumBid = player.minimumBid;

    // Validate initial bid meets minimum requirement
    if (auction.currentPlayer.currentBid.amount === 0 && amount < minimumBid) {
      return res.status(400).json({ 
        message: `Initial bid must be at least ${minimumBid} for ${player.tier} tier player` 
      });
    }

    // Validate bid increment
    if (auction.currentPlayer.currentBid.amount > 0 && 
        amount <= auction.currentPlayer.currentBid.amount + auction.settings.minBidIncrement) {
      return res.status(400).json({ 
        message: `Bid must be at least ${auction.currentPlayer.currentBid.amount + auction.settings.minBidIncrement}` 
      });
    }

    // Validate user has enough budget
    const bidder = await User.findById(userId);
    if (!bidder) {
      return res.status(404).json({ message: 'Bidder not found' });
    }

    if (bidder.budget < amount) {
      return res.status(400).json({ message: 'Insufficient budget' });
    }

    // Update the current bid
    auction.currentPlayer.currentBid = {
      amount: amount,
      bidder: userId
    };

    await auction.save();

    // Populate the updated auction
    await auction.populate([
      { path: 'host', select: 'username emoji color' },
      { path: 'participants', select: 'username emoji color budget' },
      { path: 'currentPlayer.player', select: 'shortName longName overall positions mainPosition' },
      { path: 'currentPlayer.currentBid.bidder', select: 'username emoji color' }
    ]);

    // Emit the updated auction to all participants
    const io = getIO();
    io.to(auctionId).emit('auctionUpdate', { type: 'bid', auction });

    res.json({ success: true, auction });
  } catch (error) {
    console.error('Error placing bid:', error);
    res.status(500).json({ message: 'Failed to place bid', error: error.message });
  }
});

// Complete current player auction
router.post('/:id/complete-player', async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id);
    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }

    if (auction.host.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only host can complete player auction' });
    }

    if (!auction.currentPlayer || !auction.currentPlayer.currentBid) {
      return res.status(400).json({ message: 'No active player or no valid bid' });
    }

    const winner = await User.findById(auction.currentPlayer.currentBid.bidder);
    if (!winner) {
      return res.status(404).json({ message: 'Winner not found' });
    }

    // Add to completed players in auction
    auction.completedPlayers.push({
      player: auction.currentPlayer.player,
      winner: winner._id,
      amount: auction.currentPlayer.currentBid.amount,
      timestamp: new Date()
    });

    // Create or update AuctionPlayer record
    await AuctionPlayer.findOneAndUpdate(
      { 
        auction: auction._id,
        player: auction.currentPlayer.player
      },
      {
        owner: winner._id,
        amount: auction.currentPlayer.currentBid.amount,
        isSubstitute: true, // Default to substitute when first won
        wonAt: new Date()
      },
      { upsert: true, new: true }
    );

    // Deduct budget from winner
    winner.budget -= auction.currentPlayer.currentBid.amount;
    await winner.save();

    // Update participant's budget in auction
    const participantIndex = auction.participants.findIndex(
      p => p._id.toString() === winner._id.toString()
    );
    if (participantIndex !== -1) {
      auction.participants[participantIndex].budget = winner.budget;
    }

    // Move to next player
    auction.currentPlayer = null;
    auction.markModified('completedPlayers');
    auction.markModified('participants');
    await auction.save();

    // Populate auction data before sending response
    const populatedAuction = await Auction.findById(auction._id)
      .populate('host', 'username emoji color')
      .populate('participants', 'username emoji color budget')
      .populate('availablePlayers', 'shortName longName overall positions mainPosition')
      .populate('skipVotes', 'username')
      .populate('currentPlayer.player', 'shortName longName overall positions mainPosition')
      .populate('currentPlayer.currentBid.bidder', 'username emoji color')
      .populate('completedPlayers.player', 'shortName longName overall positions mainPosition')
      .populate('completedPlayers.winner', 'username emoji color');

    // Notify clients about team update
    const io = getIO();
    io.emit('teamUpdate', { 
      userId: winner._id,
      auctionId: auction._id
    });

    // Broadcast the updated auction to all connected clients
    broadcastAuctionUpdate(auction._id, 'updated', { auction: populatedAuction });

    res.json(populatedAuction);
  } catch (error) {
    console.error('Error completing player auction:', error);
    res.status(500).json({ message: 'Error completing player auction', error: error.message });
  }
});

// Add skip vote endpoint
router.post('/:id/skip', async (req, res) => {
  try {
    const { userId } = req.body;
    const auction = await Auction.findById(req.params.id);

    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }

    // Check if user is a participant
    if (!auction.participants.includes(userId)) {
      return res.status(403).json({ message: 'User is not a participant in this auction' });
    }

    // Check if user already voted to skip
    if (auction.skipVotes.includes(userId)) {
      return res.status(400).json({ message: 'User has already voted to skip' });
    }

    // Add skip vote
    auction.skipVotes.push(userId);

    // Check if all participants have voted to skip
    if (auction.skipVotes.length === auction.participants.length) {
      // Move current player to skipped players
      if (auction.currentPlayer && auction.currentPlayer.player) {
        auction.skippedPlayers.push(auction.currentPlayer.player);
      }

      // Reset skip votes
      auction.skipVotes = [];

      // Move to next player
      const nextPlayerIndex = auction.availablePlayers.findIndex(
        p => p.toString() === auction.currentPlayer.player.toString()
      ) + 1;

      if (nextPlayerIndex < auction.availablePlayers.length) {
        auction.currentPlayer = {
          player: auction.availablePlayers[nextPlayerIndex],
          currentBid: { amount: 0 },
          timeLeft: 30,
          startTime: new Date()
        };
      } else {
        auction.status = 'completed';
      }

      // Notify all clients about the skip
      const io = getIO();
      io.to(auction._id.toString()).emit('playerSkipped', {
        skippedPlayer: auction.currentPlayer.player,
        nextPlayer: auction.currentPlayer
      });
    }

    await auction.save();

    // Populate and return the updated auction
    const populatedAuction = await Auction.findById(auction._id)
      .populate('host', 'username emoji color')
      .populate('participants', 'username emoji color budget')
      .populate('availablePlayers', 'shortName longName overall positions mainPosition')
      .populate('skipVotes', 'username')
      .populate('currentPlayer.player', 'shortName longName overall positions mainPosition')
      .populate('currentPlayer.currentBid.bidder', 'username emoji color');

    // Broadcast the updated auction to all connected clients
    broadcastAuctionUpdate(auction._id, 'updated', { auction: populatedAuction });

    res.json(populatedAuction);
  } catch (err) {
    console.error('Error processing skip vote:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update auction status (pause/resume)
router.post('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const auction = await Auction.findById(req.params.id)
      .populate('host', 'username')
      .populate('participants', 'username budget');

    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }

    if (auction.host._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only host can update auction status' });
    }

    if (!['active', 'paused', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    auction.status = status;
    await auction.save();

    // Broadcast the updated auction to all connected clients
    broadcastAuctionUpdate(auction._id, 'updated', { auction });

    res.json(auction);
  } catch (error) {
    console.error('Error updating auction status:', error);
    res.status(500).json({ message: 'Error updating auction status' });
  }
});

// Pause auction
router.post('/:id/pause', auth, async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id)
      .populate('host', 'username emoji color')
      .populate('participants', 'username emoji color budget')
      .populate('currentPlayer.player', 'shortName longName overall positions mainPosition tier minimumBid')
      .populate('currentPlayer.currentBid.bidder', 'username emoji color')
      .populate('completedPlayers.player', 'shortName longName overall positions mainPosition')
      .populate('completedPlayers.winner', 'username emoji color');
    
    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }

    // Check if user is host
    if (auction.host._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only host can pause auction' });
    }

    if (auction.status !== 'active') {
      return res.status(400).json({ message: 'Auction is not active' });
    }

    auction.status = 'paused';
    await auction.save();

    // Broadcast the update
    broadcastAuctionUpdate(auction._id, 'updated', { auction });

    res.json(auction);
  } catch (error) {
    console.error('Error pausing auction:', error);
    res.status(500).json({ message: 'Error pausing auction', error: error.message });
  }
});

// Resume auction
router.post('/:id/resume', auth, async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id)
      .populate('host', 'username emoji color')
      .populate('participants', 'username emoji color budget')
      .populate('currentPlayer.player', 'shortName longName overall positions mainPosition tier minimumBid')
      .populate('currentPlayer.currentBid.bidder', 'username emoji color')
      .populate('completedPlayers.player', 'shortName longName overall positions mainPosition')
      .populate('completedPlayers.winner', 'username emoji color');
    
    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }

    // Check if user is host
    if (auction.host._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only host can resume auction' });
    }

    if (auction.status !== 'paused') {
      return res.status(400).json({ message: 'Auction is not paused' });
    }

    auction.status = 'active';
    await auction.save();

    // Broadcast the update
    broadcastAuctionUpdate(auction._id, 'updated', { auction });

    res.json(auction);
  } catch (error) {
    console.error('Error resuming auction:', error);
    res.status(500).json({ message: 'Error resuming auction', error: error.message });
  }
});

// Move to next player
router.post('/:id/next-player', auth, async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id);
    
    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }

    // Check if user is host
    if (auction.host.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only host can move to next player' });
    }

    // If there's a current player with a bid, complete their auction first
    if (auction.currentPlayer?.currentBid?.amount > 0) {
      const winner = await User.findById(auction.currentPlayer.currentBid.bidder);
      if (winner) {
        // Add to completed players
        auction.completedPlayers.push({
          player: auction.currentPlayer.player,
          winner: winner._id,
          amount: auction.currentPlayer.currentBid.amount,
          timestamp: new Date()
        });

        // Update winner's budget
        winner.budget -= auction.currentPlayer.currentBid.amount;
        await winner.save();
      } else {
        // Add to skipped players
        auction.skippedPlayers.push(auction.currentPlayer.player);
      }

      // Move to next player if available
      if (auction.availablePlayers.length > 0) {
        auction.currentPlayer = {
          player: auction.availablePlayers[0],
          currentBid: {
            amount: 0
          },
          timeLeft: 30,
          startTime: new Date()
        };
        auction.availablePlayers = auction.availablePlayers.slice(1);
      } else {
        // End auction if no more players
        auction.status = 'completed';
        auction.currentPlayer = null;
      }

      await auction.save();
    }

    const populatedAuction = await Auction.findById(auction._id)
      .populate('host', 'username emoji color')
      .populate('participants', 'username emoji color budget')
      .populate('currentPlayer.player', 'shortName longName overall positions mainPosition tier minimumBid')
      .populate('currentPlayer.currentBid.bidder', 'username emoji color');

    // Broadcast the update
    broadcastAuctionUpdate(auction._id, 'updated', { auction: populatedAuction });

    res.json(populatedAuction);
  } catch (error) {
    console.error('Error moving to next player:', error);
    res.status(500).json({ message: 'Error moving to next player', error: error.message });
  }
});

// End auction
router.post('/:id/end', auth, async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id)
      .populate('host', 'username emoji color')
      .populate('participants', 'username emoji color budget')
      .populate('availablePlayers', 'shortName longName overall positions mainPosition')
      .populate('skipVotes', 'username')
      .populate('currentPlayer.player', 'shortName longName overall positions mainPosition')
      .populate('currentPlayer.currentBid.bidder', 'username emoji color')
      .populate('completedPlayers.player', 'shortName longName overall positions mainPosition')
      .populate('completedPlayers.winner', 'username emoji color');

    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }

    if (auction.host._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only host can end auction' });
    }

    auction.status = 'completed';
    auction.currentPlayer = null;
    await auction.save();

    // Notify all clients about auction end
    const io = getIO();
    io.to(auction._id.toString()).emit('auctionEnded', {
      auctionId: auction._id,
      message: 'Auction has been ended by the host'
    });

    // Broadcast the final state
    broadcastAuctionUpdate(auction._id, 'updated', { auction });

    res.json(auction);
  } catch (error) {
    console.error('Error ending auction:', error);
    res.status(500).json({ message: 'Error ending auction' });
  }
});

// Delete auction
router.delete('/:id', auth, async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id)
      .populate('host', 'username');

    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }

    if (auction.host._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only host can delete auction' });
    }

    // Notify all participants before deletion
    getIO().to(auction._id.toString()).emit('auctionDeleted', auction._id);

    await Auction.findByIdAndDelete(req.params.id);
    res.json({ message: 'Auction deleted successfully' });
  } catch (error) {
    console.error('Error deleting auction:', error);
    res.status(500).json({ message: 'Error deleting auction' });
  }
});

// Get single auction
router.get('/:id', async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id)
      .populate('host', 'username emoji color')
      .populate('participants', 'username emoji color budget')
      .populate('currentPlayer.player', 'shortName longName overall positions mainPosition tier minimumBid pace shooting passing dribbling defending physical')
      .populate('currentPlayer.currentBid.bidder', 'username emoji color')
      .populate('completedPlayers.player', 'shortName longName overall positions mainPosition tier')
      .populate('completedPlayers.winner', 'username emoji color');

    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }

    res.json(auction);
  } catch (error) {
    console.error('Error fetching auction:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get auction time left
router.get('/:id/time', async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id);
    
    if (!auction || !auction.currentPlayer || !auction.currentPlayer.startTime) {
      return res.status(404).json({ message: 'No active auction found' });
    }

    const now = new Date();
    const startTime = new Date(auction.currentPlayer.startTime);
    const elapsedSeconds = Math.floor((now - startTime) / 1000);
    const timeLeft = Math.max(0, 30 - elapsedSeconds);

    // If time is up and there's a bid, move to next player
    if (timeLeft === 0) {
      if (auction.currentPlayer.currentBid.bidder) {
        // Add to completed players
        auction.completedPlayers.push({
          player: auction.currentPlayer.player,
          winner: auction.currentPlayer.currentBid.bidder,
          amount: auction.currentPlayer.currentBid.amount,
          timestamp: new Date()
        });

        // Update winner's budget
        const winner = await User.findById(auction.currentPlayer.currentBid.bidder);
        winner.budget -= auction.currentPlayer.currentBid.amount;
        await winner.save();
      } else {
        // Add to skipped players
        auction.skippedPlayers.push(auction.currentPlayer.player);
      }

      // Move to next player if available
      if (auction.availablePlayers.length > 0) {
        auction.currentPlayer = {
          player: auction.availablePlayers[0],
          currentBid: {
            amount: 0
          },
          timeLeft: 30,
          startTime: new Date()
        };
        auction.availablePlayers = auction.availablePlayers.slice(1);
      } else {
        // End auction if no more players
        auction.status = 'completed';
        auction.currentPlayer = null;
      }

      await auction.save();
    }

    res.json({ timeLeft });
  } catch (err) {
    console.error('Error getting auction time:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
