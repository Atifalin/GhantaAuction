import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { socketService } from '../services/socket';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return null;
    try {
      return JSON.parse(storedUser);
    } catch (error) {
      console.error('Error parsing stored user:', error);
      localStorage.removeItem('user');
      return null;
    }
  });

  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Check for existing user session
    const token = localStorage.getItem('token');
    if (user && token) {
      // Set up axios defaults
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Connect socket
      const socket = socketService.connect();
      socket.emit('userConnected', user.id);
    }

    return () => {
      if (user) {
        socketService.disconnect();
      }
    };
  }, [user]);

  const login = async (userData) => {
    try {
      // Store user data
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);

      // Set up axios default headers
      const token = localStorage.getItem('token');
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }

      // Connect socket
      const socket = socketService.connect();
      socket.emit('userConnected', userData.id);
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Disconnect socket
      socketService.disconnect();

      // Clear local storage
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];

      // Clear state
      setUser(null);
      setIsConnected(false);
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        login,
        logout,
        isConnected
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
