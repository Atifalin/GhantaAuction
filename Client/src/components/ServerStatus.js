import React, { useState, useEffect } from 'react';
import { Paper, Typography, Box } from '@mui/material';
import { socketService } from '../services/socket';
import { useUser } from '../context/UserContext';

const ServerStatus = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const { user } = useUser();

  useEffect(() => {
    const socket = socketService.getSocket();

    const handleConnect = () => {
      setIsConnected(true);
      setIsVisible(true);
      if (user?.id) {
        socket.emit('userConnected', user.id);
      }
      // Auto-hide after 3 seconds
      setTimeout(() => setIsVisible(false), 3000);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      setIsVisible(true); // Always show when disconnected
    };

    // Set initial connection status
    setIsConnected(socket.connected);
    if (socket.connected) {
      setTimeout(() => setIsVisible(false), 3000);
    }

    // Set up event listeners
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    // Cleanup
    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, [user]);

  const handleMouseEnter = () => {
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    if (isConnected) {
      setIsVisible(false);
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{
        position: 'fixed',
        bottom: isVisible ? 0 : -48,
        left: 0,
        right: 0,
        height: '48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'background.paper',
        borderTop: 1,
        borderColor: 'divider',
        zIndex: 9999,
        px: 2,
        transition: 'bottom 0.3s ease-in-out',
        '&:hover': {
          bottom: 0
        }
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: isConnected ? '#4caf50' : '#ff5252',
            marginRight: 8
          }}
        />
        <Typography variant="body2" color="textSecondary">
          {isConnected ? 'Connected' : 'Disconnected'}
        </Typography>
      </Box>
    </Paper>
  );
};

export default ServerStatus;
