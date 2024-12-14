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
- Enhanced host controls for auction management
- Player tier system (Gold/Silver/Bronze) with visual indicators
- Quick bid functionality with increment buttons
- Real-time countdown timer with visual alerts
- Comprehensive auction stats tracking

### Player Management
- Tier-based player categorization (Gold/Silver/Bronze)
- Detailed player statistics and attributes
- Visual skill representation with radar charts
- Position-based filtering and search
- Minimum bid requirements per player
- Player favoriting system

### Dashboard Features
- User status and information display
- Active auctions overview
- Team management interface
- Budget tracking
- Real-time updates via WebSocket
- Auction progress statistics
- Completed players tracking

## 🛠 Technical Stack

### Frontend
- **React**: UI framework
- **Material-UI**: Component library
- **Context API**: State management
- **Socket.io-client**: Real-time communication
- **Axios**: HTTP client
- **React Router**: Navigation
- **Recharts**: Data visualization

### Backend
- **Node.js**: Runtime environment
- **Express**: Web framework
- **MongoDB**: Database
- **Mongoose**: ODM
- **Socket.io**: Real-time server
- **JWT**: Authentication
- **bcryptjs**: Password hashing

## 🎨 UI/UX Features

### Auction Interface
- Real-time countdown timer
- Tier-based player cards with visual indicators
- Quick bid buttons for common increments
- Custom bid input with validation
- Host control panel for auction management
- Player statistics visualization
- Auction progress tracking

### Player Cards
- Tier-specific color coding
- Skill rating visualization
- Position indicators
- Minimum bid display
- Overall rating badge
- Interactive hover effects

## 🔄 Recent Updates

### UI Enhancements
- Redesigned player cards with tier-based styling
- Improved auction interface layout
- Enhanced visual feedback for bidding
- Real-time timer with color-coded alerts
- Better organization of player information

### Functionality Improvements
- Enhanced host controls for auction management
- Implemented tier system for player categorization
- Added quick bid functionality
- Improved auction state management
- Better budget tracking and validation

### System Stability
- Fixed host persistence after server restart
- Improved real-time synchronization
- Enhanced error handling
- Better state management for auction lifecycle

## 🚀 Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   cd Client && npm install
   cd ../Server && npm install
   ```
3. Set up environment variables
4. Start the development servers:
   ```bash
   # Start backend server
   cd Server && npm start

   # Start frontend client
   cd Client && npm start
   ```

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.
