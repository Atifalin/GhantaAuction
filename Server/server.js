const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketInit = require('./socket');
const { resetAllUserStatuses } = require('./utils/cleanup');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/auctions', require('./routes/auctions'));
app.use('/api/players', require('./routes/players'));

// Error handling middleware (after routes)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

async function startServer() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ghantaAuction', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');

        // Reset all user statuses on server start
        await resetAllUserStatuses();
        console.log('Reset all user statuses');

        // Initialize Socket.IO with app instance
        await socketInit.init(server, app);
        console.log('Socket.IO initialized');

        // Start server
        const PORT = process.env.PORT || 5000;
        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });

    } catch (error) {
        console.error('Error starting server:', error);
        process.exit(1);
    }
}

// Handle server shutdown
process.on('SIGINT', async () => {
    try {
        // Reset all user statuses to offline
        await resetAllUserStatuses();
        console.log('Reset all user statuses on shutdown');
        
        // Close MongoDB connection
        await mongoose.connection.close();
        console.log('MongoDB connection closed');
        
        process.exit(0);
    } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
    }
});

// Start the server
startServer().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
