const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const Player = require('../models/Player');
const Auction = require('../models/Auction');
const AuctionPlayer = require('../models/AuctionPlayer');

// Get current user
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update user
router.put('/me', auth, async (req, res) => {
    try {
        const { username, emoji, color } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (username) user.username = username;
        if (emoji) user.emoji = emoji;
        if (color) user.color = color;

        await user.save();
        res.json(user);
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update user budget
router.put('/:id/budget', auth, async (req, res) => {
    try {
        const { budget } = req.body;
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.budget = budget;
        await user.save();
        res.json(user);
    } catch (error) {
        console.error('Error updating user budget:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update user status
router.put('/status', auth, async (req, res) => {
    try {
        const { status } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!['online', 'offline'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        user.status = status;
        await user.save();
        res.json(user);
    } catch (error) {
        console.error('Error updating user status:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all users
router.get('/', auth, async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user's team
router.get('/:id/team', auth, async (req, res) => {
    try {
        // First, find the most recent auction this user participated in
        const latestAuction = await Auction.findOne({
            $or: [
                { status: 'active', participants: req.params.id },
                { status: 'completed', participants: req.params.id }
            ]
        }).sort({ createdAt: -1 });

        if (!latestAuction) {
            return res.json([]); // No auctions found
        }

        // Get all players won by this user in this auction
        const auctionPlayers = await AuctionPlayer.find({
            auction: latestAuction._id,
            owner: req.params.id
        }).populate('player', 'shortName longName overall positions mainPosition');

        // Transform the data for the response
        const players = auctionPlayers.map(ap => ({
            _id: ap.player._id,
            shortName: ap.player.shortName,
            longName: ap.player.longName,
            overall: ap.player.overall,
            positions: ap.player.positions,
            mainPosition: ap.player.mainPosition,
            amount: ap.amount,
            isSubstitute: ap.isSubstitute,
            wonAt: ap.wonAt
        }));

        res.json(players);
    } catch (error) {
        console.error('Error fetching user team:', error);
        res.status(500).json({ 
            message: 'Failed to fetch team data',
            error: error.message 
        });
    }
});

// Update player substitute status
router.patch('/team/:playerId', auth, async (req, res) => {
    try {
        const { isSubstitute } = req.body;
        const { playerId } = req.params;

        // Find the latest auction where this user won this player
        const latestAuction = await Auction.findOne({
            $or: [
                { status: 'active', participants: req.user.id },
                { status: 'completed', participants: req.user.id }
            ]
        }).sort({ createdAt: -1 });

        if (!latestAuction) {
            return res.status(404).json({ message: 'No active or completed auction found' });
        }

        // Update the player's substitute status
        const auctionPlayer = await AuctionPlayer.findOneAndUpdate(
            {
                auction: latestAuction._id,
                player: playerId,
                owner: req.user.id
            },
            { isSubstitute },
            { new: true }
        );

        if (!auctionPlayer) {
            return res.status(404).json({ message: 'Player not found in your team' });
        }

        res.json({ message: 'Player updated successfully' });
    } catch (error) {
        console.error('Error updating player substitute status:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Swap players
router.post('/team/swap', auth, async (req, res) => {
    try {
        const { playerId, substituteId } = req.body;

        // Find the latest auction where this user participated
        const latestAuction = await Auction.findOne({
            $or: [
                { status: 'active', participants: req.user.id },
                { status: 'completed', participants: req.user.id }
            ]
        }).sort({ createdAt: -1 });

        if (!latestAuction) {
            return res.status(404).json({ message: 'No active or completed auction found' });
        }

        // Find both players in the auction
        const player1 = await AuctionPlayer.findOne({
            auction: latestAuction._id,
            player: playerId,
            owner: req.user.id
        });

        const player2 = await AuctionPlayer.findOne({
            auction: latestAuction._id,
            player: substituteId,
            owner: req.user.id
        });

        if (!player1 || !player2) {
            return res.status(404).json({ message: 'One or both players not found in your team' });
        }

        // Swap their substitute status
        const temp = player1.isSubstitute;
        player1.isSubstitute = player2.isSubstitute;
        player2.isSubstitute = temp;

        await player1.save();
        await player2.save();

        res.json({ message: 'Players swapped successfully' });
    } catch (error) {
        console.error('Error swapping players:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
