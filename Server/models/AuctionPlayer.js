const mongoose = require('mongoose');

const auctionPlayerSchema = new mongoose.Schema({
    auction: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Auction',
        required: true
    },
    player: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Player',
        required: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    isSubstitute: {
        type: Boolean,
        default: true
    },
    wonAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Create a compound index for efficient querying
auctionPlayerSchema.index({ auction: 1, owner: 1 });
auctionPlayerSchema.index({ auction: 1, player: 1 }, { unique: true });

const AuctionPlayer = mongoose.model('AuctionPlayer', auctionPlayerSchema);

module.exports = AuctionPlayer;
