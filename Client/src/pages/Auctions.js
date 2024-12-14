import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import axios from 'axios';

const Auctions = () => {
  const navigate = useNavigate();
  const [auctions, setAuctions] = useState({
    active: [],
    pending: [],
    completed: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (err) {
      console.error('Error parsing user from localStorage:', err);
      return null;
    }
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchAuctions = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/auctions');
        setAuctions(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching auctions:', error);
        setError(error.response?.data?.message || 'Failed to fetch auctions');
        setLoading(false);
      }
    };

    fetchAuctions();
  }, [user, navigate]);

  const handleJoinAuction = async (auctionId) => {
    try {
      await axios.post(`http://localhost:5000/api/auctions/${auctionId}/join`, {
        userId: user.id
      });
      navigate(`/auction/${auctionId}`);
    } catch (error) {
      console.error('Error joining auction:', error);
      setError(error.response?.data?.message || 'Failed to join auction');
    }
  };

  const handleViewAuction = (auctionId) => {
    navigate(`/auction/${auctionId}`);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert 
          severity="error" 
          sx={{ 
            position: 'fixed', 
            top: '20px', 
            left: '50%', 
            transform: 'translateX(-50%)',
            zIndex: 9999,
            minWidth: '300px',
            maxWidth: '90%'
          }}
        >
          {error}
        </Alert>
      </Container>
    );
  }

  const renderAuctionCard = (auction, showJoin = true) => (
    <Grid item xs={12} sm={6} md={4} key={auction._id}>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {auction.name}
          </Typography>
          <Typography color="textSecondary" gutterBottom>
            Host: {auction.host?.username}
          </Typography>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <Chip 
              label={auction.status.toUpperCase()} 
              color={
                auction.status === 'active' ? 'success' : 
                auction.status === 'pending' ? 'primary' : 
                auction.status === 'completed' ? 'default' : 
                'primary'
              } 
              size="small" 
            />
            <Typography variant="body2">
              {auction.participants?.length || 0} participants
            </Typography>
          </Box>
          <Box display="flex" gap={1}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={() => handleViewAuction(auction._id)}
            >
              VIEW
            </Button>
            {showJoin && !auction.participants?.some(p => p._id === user.id) && (
              <Button
                variant="outlined"
                color="primary"
                fullWidth
                onClick={() => handleJoinAuction(auction._id)}
              >
                JOIN
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>
    </Grid>
  );

  return (
    <Container maxWidth="lg">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          Available Auctions
        </Typography>
        <Button 
          variant="contained" 
          color="primary"
          onClick={() => navigate('/dashboard')}
        >
          Create New Auction
        </Button>
      </Box>

      {/* Active & Pending Auctions */}
      {(auctions.active.length > 0 || auctions.pending.length > 0) && (
        <Box mb={4}>
          <Typography variant="h5" color="primary" gutterBottom>
            Active & Pending Auctions
          </Typography>
          <Grid container spacing={3}>
            {[...auctions.active, ...auctions.pending].map((auction) => renderAuctionCard(auction))}
          </Grid>
        </Box>
      )}

      {/* Completed Auctions */}
      {auctions.completed.length > 0 && (
        <Box>
          <Typography variant="h5" color="text.secondary" gutterBottom>
            Completed Auctions
          </Typography>
          <Grid container spacing={3}>
            {auctions.completed.map((auction) => renderAuctionCard(auction, false))}
          </Grid>
        </Box>
      )}

      {Object.values(auctions).every(arr => arr.length === 0) && (
        <Typography color="text.secondary" align="center" variant="h6">
          No auctions available
        </Typography>
      )}
    </Container>
  );
};

export default Auctions;
