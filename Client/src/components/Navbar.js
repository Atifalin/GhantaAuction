import React from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  useTheme,
} from '@mui/material';
import axios from 'axios';

const Navbar = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const user = JSON.parse(localStorage.getItem('user'));

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:5000/api/auth/logout', {
        username: user.username
      });
    } catch (error) {
      console.error('Logout failed:', error);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  if (!user) return null;

  return (
    <AppBar 
      position="static" 
      sx={{
        backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#ffffff',
        color: theme.palette.text.primary,
      }}
    >
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          GhantaAuction
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button color="inherit" component={RouterLink} to="/dashboard">
            Dashboard
          </Button>
          <Button color="inherit" component={RouterLink} to="/players">
            Players
          </Button>
          <Button color="inherit" component={RouterLink} to="/team">
            My Team
          </Button>
          
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: 1,
              ml: 2,
              px: 2,
              py: 0.5,
              borderRadius: 1,
              backgroundColor: theme.palette.action.hover,
            }}
          >
            <Box sx={{ fontSize: '1.25rem' }}>{user.emoji}</Box>
            <Typography>{user.username}</Typography>
          </Box>

          <Button 
            color="inherit" 
            onClick={handleLogout}
            sx={{
              ml: 1,
              borderRadius: 1,
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
              '&:hover': {
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
              }
            }}
          >
            Logout
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
