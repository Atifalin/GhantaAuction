import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Alert,
  Grid,
  useTheme,
} from '@mui/material';
import axios from 'axios';

const UserCard = ({ user, onClick }) => {
  const theme = useTheme();
  const isOnline = user.status === 'online';

  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: 'pointer',
        transition: 'transform 0.2s ease-in-out',
        position: 'relative',
        '&:hover': {
          transform: 'translateY(-4px)',
        },
        border: `2px solid ${isOnline ? '#4caf50' : '#bdbdbd'}`,
      }}
      onClick={onClick}
    >
      {/* Status Indicator */}
      <Box
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          width: 12,
          height: 12,
          borderRadius: '50%',
          backgroundColor: isOnline ? '#4caf50' : '#bdbdbd',
          boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
        }}
      />

      {/* Emoji */}
      <Box
        sx={{
          fontSize: '2.5rem',
          mb: 2,
          width: 64,
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          backgroundColor: theme.palette.action.hover,
        }}
      >
        {user.emoji}
      </Box>

      {/* Username */}
      <Typography variant="h6" sx={{ fontWeight: 500 }}>
        {user.username}
      </Typography>

      {/* Status Text */}
      <Typography
        variant="body2"
        sx={{
          color: isOnline ? 'success.main' : 'text.secondary',
          mt: 1,
        }}
      >
        {isOnline ? 'Online' : 'Offline'}
      </Typography>
    </Paper>
  );
};

const Login = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/auth/users');
        setUsers(response.data);
      } catch (err) {
        setError('Failed to fetch users');
      }
    };
    fetchUsers();
  }, []);

  const handleLogin = async (username) => {
    setError('');
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', { username });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate('/dashboard');
    } catch (err) {
      if (err.response?.data?.error === 'USER_ALREADY_ONLINE') {
        setError('This user is already logged in from another device');
      } else {
        setError(err.response?.data?.message || 'Login failed');
      }
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 8 }}>
        <Typography
          variant="h3"
          align="center"
          gutterBottom
          sx={{ fontWeight: 700, mb: 6 }}
        >
          GhantaAuction
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {users.map((user) => (
            <Grid item xs={12} sm={6} key={user.username}>
              <UserCard user={user} onClick={() => handleLogin(user.username)} />
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
};

export default Login;
