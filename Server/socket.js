const socketIO = require('socket.io');
const User = require('./models/User');
const { resetAllUserStatuses } = require('./utils/cleanup');

let io;
let connectedUsers = new Map();

async function updateUserStatus(userId, status) {
    try {
        await User.findByIdAndUpdate(userId, { status });
        io.emit('userStatusUpdate', { userId, status });
    } catch (error) {
        console.error(`Error updating user ${userId} status to ${status}:`, error);
    }
}

function broadcastAuctionUpdate(auctionId, type, data = {}) {
    io.emit('auctionUpdate', { auctionId, type, ...data });
}

module.exports = {
    init: async (server) => {
        try {
            // Reset all user statuses to offline when server starts
            await resetAllUserStatuses();

            io = socketIO(server, {
                cors: {
                    origin: "http://localhost:3000",
                    methods: ["GET", "POST"],
                    credentials: true
                }
            });

            io.on('connection', (socket) => {
                console.log('Client connected:', socket.id);

                socket.on('userConnected', async (userId) => {
                    try {
                        await updateUserStatus(userId, 'online');
                        connectedUsers.set(socket.id, userId);
                        console.log(`User ${userId} logged in with socket ${socket.id}`);
                    } catch (error) {
                        console.error('Error handling user login:', error);
                    }
                });

                socket.on('joinAuctionRoom', (auctionId) => {
                    socket.join(`auction-${auctionId}`);
                    console.log(`Socket ${socket.id} joined auction room: ${auctionId}`);
                });

                socket.on('leaveAuctionRoom', (auctionId) => {
                    socket.leave(`auction-${auctionId}`);
                    console.log(`Socket ${socket.id} left auction room: ${auctionId}`);
                });

                socket.on('disconnect', async () => {
                    try {
                        const userId = connectedUsers.get(socket.id);
                        if (userId) {
                            await updateUserStatus(userId, 'offline');
                            connectedUsers.delete(socket.id);
                            console.log(`User ${userId} logged out`);
                        }
                    } catch (error) {
                        console.error('Error handling user disconnect:', error);
                    }
                });
            });

        } catch (error) {
            console.error('Error initializing socket.io:', error);
        }
    },
    getIO: () => {
        if (!io) {
            throw new Error('Socket.io not initialized');
        }
        return io;
    },
    broadcastAuctionUpdate,
    connectedUsers
};
