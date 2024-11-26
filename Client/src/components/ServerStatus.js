import React, { useState, useEffect } from 'react';
import { Paper, Typography, Box } from '@mui/material';
import { socketService } from '../services/socket';
import { useUser } from '../context/UserContext';

const ServerStatus = () => {
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    const socket = socketService.getSocket();

    const handleConnect = () => {
      setIsConnected(true);
      if (user?.id) {
        socket.emit('userConnected', user.id);
      }
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    // Set initial connection status
    setIsConnected(socket.connected);

    // Set up event listeners
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    // Cleanup
    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, [user]);

  return (
    <Paper
      elevation={3}
      sx={{
        position: 'fixed',
        bottom: 0,
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
        px: 2
      }}
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
