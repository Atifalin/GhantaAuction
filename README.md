# 🎮 Ghanta Auction Platform

A real-time multiplayer auction platform for team selection and player bidding, built with modern web technologies.

## 🌟 Features

### Authentication & User Management
- Simplified login system with 4 predefined users:
  - Atif
  - Saqib
  - Aqib
  - Wasif
- JWT-based authentication
- Real-time user status tracking (online/offline)
- Secure token handling
- Automatic socket connection management

### Real-time Auction System
- Live auction creation and management
- Real-time bidding with instant updates
- Team management and player selection
- Auction room functionality with participant management
- Budget tracking and validation
- Player shuffling for fair distribution

### Dashboard Features
- User status and information display
- Active auctions overview
- Team management interface
- Budget tracking
- Real-time updates via WebSocket

## 🛠 Technical Stack

### Frontend
- **React**: UI framework
- **Material-UI**: Component library
- **Context API**: State management
- **Socket.io-client**: Real-time communication
- **Axios**: HTTP client
- **React Router**: Navigation

### Backend
- **Node.js**: Runtime environment
- **Express**: Web framework
- **MongoDB**: Database
- **Mongoose**: ODM
- **Socket.io**: Real-time server
- **JWT**: Authentication
- **bcryptjs**: Password hashing

## 🏗 Architecture

### Frontend Architecture
```
Client/
├── src/
│   ├── components/      # Reusable UI components
│   ├── context/        # React Context providers
│   ├── pages/          # Main application views
│   ├── services/       # API and Socket services
│   └── utils/          # Helper functions
```

### Backend Architecture
```
Server/
├── models/            # MongoDB schemas
├── routes/            # API endpoints
├── middleware/        # Custom middleware
├── socket/           # WebSocket handlers
└── utils/            # Helper functions
```

## 🔌 WebSocket Events

### Server Events
- `userConnected`: User login notification
- `userStatusUpdate`: User status changes
- `auctionUpdate`: Auction state changes
- `joinAuctionRoom`: Join auction space
- `leaveAuctionRoom`: Leave auction space

### Client Events
- `auctionUpdate`: Handle auction updates
- `userStatusUpdate`: Handle user status changes
- `teamUpdate`: Handle team changes

## 🔒 Authentication Flow

1. User selects predefined username
2. Server validates user and generates JWT
3. Client stores token in localStorage
4. Socket connection established with token
5. Real-time status updates begin

## 💾 Data Models

### User Model
```javascript
{
  username: String,
  status: String,
  emoji: String,
  color: String,
  budget: Number
}
```

### Auction Model
```javascript
{
  name: String,
  budget: Number,
  host: User,
  participants: [User],
  status: String,
  availablePlayers: [Player],
  currentPlayer: {
    player: Player,
    currentBid: {
      amount: Number,
      bidder: User
    }
  }
}
```

## 🚀 Getting Started

1. Clone the repository
```bash
git clone https://github.com/yourusername/ghanta-auction.git
```

2. Install dependencies
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

3. Start the development servers
```bash
# Start server (from server directory)
npm run dev

# Start client (from client directory)
npm start
```

4. Access the application
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## 🔧 Configuration

### Environment Variables
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ghanta
JWT_SECRET=your_jwt_secret
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Material-UI for the beautiful components
- Socket.io for real-time capabilities
- MongoDB for the flexible database solution
