import React from 'react';
import { Container, Typography, Paper, Grid, Box, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h3" gutterBottom>
            Welcome to Ghanta Auction
          </Typography>
          <Typography variant="h5" color="text.secondary" gutterBottom>
            The Ultimate FIFA Player Trading Platform
          </Typography>
        </Paper>

        <Grid container spacing={4} sx={{ mt: 2 }}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h5" gutterBottom>
                Live Auctions
              </Typography>
              <Typography paragraph>
                Join live auctions to bid on your favorite FIFA players. Compete with other managers in real-time!
              </Typography>
              <Button 
                variant="contained" 
                fullWidth
                onClick={() => navigate(user ? '/dashboard' : '/login')}
              >
                {user ? 'View Auctions' : 'Get Started'}
              </Button>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h5" gutterBottom>
                Player Database
              </Typography>
              <Typography paragraph>
                Access our comprehensive database of FIFA players. View stats, compare players, and plan your strategy.
              </Typography>
              <Button 
                variant="contained" 
                fullWidth
                onClick={() => navigate(user ? '/players' : '/login')}
              >
                Browse Players
              </Button>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h5" gutterBottom>
                Team Management
              </Typography>
              <Typography paragraph>
                Build and manage your dream team. Track your budget, view your roster, and plan your next moves.
              </Typography>
              <Button 
                variant="contained" 
                fullWidth
                onClick={() => navigate(user ? '/team' : '/login')}
              >
                Manage Team
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default Home;
