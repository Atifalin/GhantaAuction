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
  const [auctions, setAuctions] = useState([]);
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
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

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

      <Grid container spacing={3}>
        {auctions.map((auction) => (
          <Grid item xs={12} sm={6} md={4} key={auction._id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Typography variant="h6" gutterBottom>
                    {auction.name}
                  </Typography>
                  <Chip
                    label={auction.status.toUpperCase()}
                    color={auction.status === 'active' ? 'success' : 'default'}
                    size="small"
                  />
                </Box>

                <Typography color="text.secondary" gutterBottom>
                  Host: {auction.host.username}
                </Typography>

                <Box display="flex" gap={1} mb={2}>
                  <Chip
                    label={`${auction.participants.length} Players`}
                    variant="outlined"
                    size="small"
                  />
                  <Chip
                    label={`Budget: $${auction.budget.toLocaleString()}`}
                    variant="outlined"
                    size="small"
                  />
                </Box>

                {auction.status === 'waiting' && (
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      {auction.availablePlayers?.length || 0} players remaining
                    </Typography>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handleJoinAuction(auction._id)}
                      disabled={auction.participants.some(p => p._id === user.id)}
                    >
                      {auction.participants.some(p => p._id === user.id) ? 'Joined' : 'Join'}
                    </Button>
                  </Box>
                )}

                {auction.status === 'active' && (
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      Auction in progress
                    </Typography>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => navigate(`/auction/${auction._id}`)}
                      disabled={!auction.participants.some(p => p._id === user.id)}
                    >
                      View Auction
                    </Button>
                  </Box>
                )}

                {auction.status === 'completed' && (
                  <Box display="flex" justifyContent="center">
                    <Typography variant="body2" color="text.secondary">
                      Auction completed
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}

        {auctions.length === 0 && (
          <Grid item xs={12}>
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <Typography variant="h6" color="text.secondary">
                No auctions available
              </Typography>
            </Box>
          </Grid>
        )}
      </Grid>
    </Container>
  );
};

export default Auctions;
