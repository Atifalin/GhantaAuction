import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Avatar,
  Grid,
  CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useUser } from '../context/UserContext';
import { socketService } from '../services/socket';

const Login = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login, user } = useUser();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/auth/users');
        setUsers(response.data);
      } catch (error) {
        console.error('Error fetching users:', error);
        setError('Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleLogin = async (selectedUser) => {
    try {
      if (selectedUser.status === 'online') {
        setError('This user is already logged in');
        return;
      }

      setLoading(true);
      setError('');

      const response = await axios.post('http://localhost:5000/api/auth/login', {
        username: selectedUser.username
      });

      if (response.data.token && response.data.user) {
        localStorage.setItem('token', response.data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        await login(response.data.user);
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.message || 'Failed to log in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && users.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Typography variant="h3" align="center" gutterBottom>
          Ghanta Auction
        </Typography>
        <Typography variant="h6" align="center" color="textSecondary" gutterBottom>
          Select your profile to continue
        </Typography>
      </Box>
      
      {error && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: '#ffebee' }}>
          <Typography color="error">{error}</Typography>
        </Paper>
      )}

      <Grid container spacing={2} justifyContent="center">
        {users.map((user) => (
          <Grid item xs={12} sm={6} key={user._id}>
            <Paper
              sx={{
                p: 2,
                cursor: user.status === 'online' ? 'not-allowed' : 'pointer',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: user.status === 'online' ? 'none' : 'scale(1.02)',
                },
                bgcolor: user.status === 'online' ? '#f5f5f5' : 'background.paper',
                opacity: user.status === 'online' ? 0.7 : 1,
                position: 'relative'
              }}
              onClick={() => user.status !== 'online' && handleLogin(user)}
            >
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar
                  sx={{
                    bgcolor: user.color,
                    width: 56,
                    height: 56,
                    fontSize: '1.5rem'
                  }}
                >
                  {user.emoji}
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {user.username}
                  </Typography>
                  <Typography
                    variant="body2"
                    color={user.status === 'online' ? 'error.main' : 'success.main'}
                  >
                    {user.status === 'online' ? '● Already logged in' : '○ Available'}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default Login;
