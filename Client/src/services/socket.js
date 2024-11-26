import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
    this.connectionStatus = false;
  }

  connect() {
    if (this.socket) {
      return this.socket;
    }

    console.log('Creating new socket connection');
    this.socket = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.connectionStatus = true;
      
      // Re-emit userConnected if we have user data
      const user = JSON.parse(localStorage.getItem('user'));
      if (user?.id) {
        this.socket.emit('userConnected', user.id);
      }
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.connectionStatus = false;
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      console.log('Disconnecting socket');
      this.socket.disconnect();
      this.socket = null;
      this.connectionStatus = false;
    }
  }

  getSocket() {
    if (!this.socket) {
      return this.connect();
    }
    return this.socket;
  }

  isConnected() {
    return this.connectionStatus;
  }
}

export const socketService = new SocketService();
