import React, { useState, useEffect } from 'react';
import { Paper, Typography } from '@mui/material';
import { socket } from '../services/socket';

const ServerStatus = () => {
  const [status, setStatus] = useState('Connecting...');
  const [color, setColor] = useState('orange');

  useEffect(() => {
    function onConnect() {
      setStatus('Connected to server');
      setColor('green');
    }

    function onDisconnect() {
      setStatus('Disconnected from server');
      setColor('red');
    }

    function onConnectError() {
      setStatus('Connection error');
      setColor('red');
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
    };
  }, []);

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        p: 1,
        textAlign: 'center',
        backgroundColor: 'background.paper',
        borderTop: 1,
        borderColor: 'divider',
      }}
      elevation={3}
    >
      <Typography
        variant="body2"
        sx={{
          color: color,
          fontWeight: 'medium',
        }}
      >
        {status}
      </Typography>
    </Paper>
  );
};

export default ServerStatus;
