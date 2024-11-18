# GhantaAuction - FIFA Player Auction System

A real-time FIFA player auction system built with the MERN stack (MongoDB, Express.js, React.js, Node.js).

## Features

- **User Authentication**
  - Predefined user profiles with unique identifiers (emojis)
  - Single-session login restriction
  - Real-time online/offline status tracking

- **User Interface**
  - Modern, animated user profile selection
  - Dark/Light mode support
  - Responsive design with Material-UI
  - Real-time status indicators

- **Technical Features**
  - JWT-based authentication
  - Real-time updates with Socket.IO
  - MongoDB for data persistence
  - Express.js REST API
  - React.js frontend with Material-UI

## Project Structure

```
GhantaAuction/
├── Client/                 # React frontend
│   ├── public/            # Static files
│   └── src/               # Source files
│       ├── components/    # React components
│       ├── pages/         # Page components
│       └── App.js         # Main App component
│
└── Server/                # Node.js backend
    ├── models/           # MongoDB models
    ├── routes/           # API routes
    └── server.js         # Server entry point
```

## Setup

1. **Clone the repository**
   ```bash
   git clone [repository-url]
   ```

2. **Install dependencies**
   ```bash
   # Install server dependencies
   cd Server
   npm install

   # Install client dependencies
   cd ../Client
   npm install
   ```

3. **Start MongoDB**
   - Ensure MongoDB is running on your system
   - Default connection URL: `mongodb://localhost:27017/ghantaAuction`

4. **Start the application**
   ```bash
   # Start server (from Server directory)
   npm run dev

   # Start client (from Client directory)
   npm start
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5000

## Predefined Users

The system comes with four predefined users:
- atif (⚽)
- saqib (🎯)
- aqib (🎮)
- wasif (🏆)

Each user has:
- Unique emoji identifier
- Custom color theme
- Real-time online/offline status

## Environment Variables

Create a `.env` file in the server directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ghantaAuction
JWT_SECRET=your_jwt_secret
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
