const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/ghantaAuction', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.log('MongoDB Connection Error:', err));

// Routes
const authRoutes = require('./routes/auth');
const playerRoutes = require('./routes/players');
const auctionRoutes = require('./routes/auctions');

app.use('/api/auth', authRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/auctions', auctionRoutes);

// Socket.IO Connection
io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('joinAuction', (auctionId) => {
    socket.join(auctionId);
  });

  socket.on('placeBid', async ({ auctionId, userId, amount }) => {
    // Handle bid logic here
    io.to(auctionId).emit('newBid', { userId, amount });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
