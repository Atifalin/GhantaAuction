import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  TextField,
  Card,
  CardContent,
  CardMedia,
  Chip,
  ButtonGroup,
  Snackbar,
} from '@mui/material';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const Auction = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [auction, setAuction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [timeLeft, setTimeLeft] = useState(30);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [user] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (err) {
      console.error('Error parsing user from localStorage:', err);
      return null;
    }
  });
  const token = user?.token;

  const showSnackbar = useCallback((message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const fetchTime = useCallback(async () => {
    if (!auction?.status === 'active' || !id) return;
    
    try {
      const response = await axios.get(`http://localhost:5000/api/auctions/${id}/time`);
      if (response.data && typeof response.data.timeLeft === 'number') {
        setTimeLeft(response.data.timeLeft);
      }
    } catch (error) {
      console.error('Error fetching time:', error);
      // Don't show error for time fetch as it's not critical
    }
  }, [auction?.status, id]);

  const fetchAuction = useCallback(async () => {
    if (!id) return;

    try {
      const response = await axios.get(`http://localhost:5000/api/auctions/${id}`);
      if (response.data) {
        setAuction(response.data);
        setLoading(false);
        setError(null);
      }
    } catch (error) {
      console.error('Error fetching auction:', error);
      const errorMessage = error.response?.data?.message || 'Failed to fetch auction';
      setError(errorMessage);
      showSnackbar(errorMessage, 'error');
      setLoading(false);
    }
  }, [id, showSnackbar]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    let timeInterval;
    let updateInterval;

    const initializeAuction = async () => {
      try {
        await fetchAuction();
        
        timeInterval = setInterval(() => {
          fetchTime().catch(console.error);
        }, 1000);
        
        updateInterval = setInterval(() => {
          fetchAuction().catch(console.error);
        }, 3000);
      } catch (error) {
        console.error('Error initializing auction:', error);
        showSnackbar('Failed to initialize auction', 'error');
      }
    };

    initializeAuction();

    return () => {
      if (timeInterval) clearInterval(timeInterval);
      if (updateInterval) clearInterval(updateInterval);
    };
  }, [user, navigate, fetchAuction, fetchTime, showSnackbar]);

  const handleBid = useCallback(async () => {
    if (!user?.id || !id || !auction) return;

    try {
      const amount = Number(bidAmount);
      if (isNaN(amount) || amount <= 0) {
        showSnackbar('Please enter a valid bid amount', 'error');
        return;
      }

      if (amount <= (auction.currentPlayer?.currentBid?.amount || 0)) {
        showSnackbar('Bid must be higher than current bid', 'error');
        return;
      }

      const response = await axios.post(`http://localhost:5000/api/auctions/${id}/bid`, {
        userId: user.id,
        amount
      });

      if (response.data) {
        setBidAmount('');
        await fetchAuction();
        showSnackbar('Bid placed successfully', 'success');
      }
    } catch (error) {
      console.error('Error placing bid:', error);
      const errorMessage = error.response?.data?.message || 'Failed to place bid';
      showSnackbar(errorMessage, 'error');
    }
  }, [bidAmount, user?.id, id, auction, fetchAuction, showSnackbar]);

  const handleQuickBid = useCallback(async (increment) => {
    if (!user?.id || !id || !auction?.currentPlayer?.currentBid) return;

    try {
      const currentBid = auction.currentPlayer.currentBid.amount;
      const newBid = currentBid + increment;

      if (newBid > (user.budget || 0)) {
        showSnackbar('Bid exceeds your budget', 'error');
        return;
      }
      
      const response = await axios.post(`http://localhost:5000/api/auctions/${id}/bid`, {
        userId: user.id,
        amount: newBid
      });

      if (response.data) {
        await fetchAuction();
        showSnackbar('Quick bid placed successfully', 'success');
      }
    } catch (error) {
      console.error('Error placing quick bid:', error);
      const errorMessage = error.response?.data?.message || 'Failed to place bid';
      showSnackbar(errorMessage, 'error');
    }
  }, [auction, user?.id, id, fetchAuction, showSnackbar]);

  const handleStatusChange = async (newStatus) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setSnackbar({
          open: true,
          message: 'Authentication token not found',
          severity: 'error'
        });
        return;
      }

      const response = await axios.post(`${API_URL}/auctions/${id}/status`, {
        status: newStatus
      }, {
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        }
      });
      
      if (response.data) {
        setAuction(response.data);
        setSnackbar({
          open: true,
          message: `Auction ${newStatus}`,
          severity: 'success'
        });
      }
    } catch (error) {
      console.error('Status change error:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Error updating auction status',
        severity: 'error'
      });
    }
  };

  const handleDeleteAuction = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setSnackbar({
          open: true,
          message: 'Authentication token not found',
          severity: 'error'
        });
        return;
      }

      await axios.delete(`${API_URL}/auctions/${id}`, {
        headers: { 
          'Authorization': `Bearer ${token}` 
        }
      });
      setSnackbar({
        open: true,
        message: 'Auction deleted successfully',
        severity: 'success'
      });
      navigate('/auctions');
    } catch (error) {
      console.error('Delete error:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Error deleting auction',
        severity: 'error'
      });
    }
  };

  if (!user) {
    return null;
  }

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

  if (!auction) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 2 }}>
          Auction not found
        </Alert>
      </Container>
    );
  }

  const isHost = auction.host._id === user.id;
  const currentParticipant = auction.participants.find(p => p._id === user.id);
  const currentBidder = auction.currentPlayer?.currentBid?.bidder;
  const isHighestBidder = currentBidder?._id === user.id;

  return (
    <>
      <Container maxWidth="lg">
        <Grid container spacing={3} sx={{ mt: 2 }}>
          {/* Auction Info */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h5" gutterBottom>
                    {auction.name}
                  </Typography>
                  <Typography variant="body1">
                    Host: {auction.host.username}
                  </Typography>
                </Box>
                <Box display="flex" gap={1} alignItems="center">
                  <Chip 
                    label={auction.status.toUpperCase()}
                    color={auction.status === 'active' ? 'success' : 'default'}
                  />
                  <Chip 
                    label={`${auction.participants.length} Participants`}
                    variant="outlined"
                  />
                  {isHost && (
                    <Box>
                      {auction.status === 'active' ? (
                        <Button
                          variant="contained"
                          color="warning"
                          onClick={() => handleStatusChange('paused')}
                          sx={{ mr: 1 }}
                        >
                          Pause
                        </Button>
                      ) : auction.status === 'paused' ? (
                        <Button
                          variant="contained"
                          color="success"
                          onClick={() => handleStatusChange('active')}
                          sx={{ mr: 1 }}
                        >
                          Resume
                        </Button>
                      ) : null}
                      <Button
                        variant="contained"
                        color="error"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this auction?')) {
                            handleDeleteAuction();
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </Box>
                  )}
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* Current Player */}
          {auction.status === 'active' && auction.currentPlayer && (
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">
                      Current Player
                    </Typography>
                    <Chip 
                      label={`Time Left: ${timeLeft}s`}
                      color={timeLeft < 10 ? 'error' : 'primary'}
                      variant="outlined"
                    />
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <CardMedia
                        component="img"
                        height="200"
                        image={`https://via.placeholder.com/200x200?text=${encodeURIComponent(auction.currentPlayer.player.shortName)}`}
                        alt={auction.currentPlayer.player.shortName}
                        sx={{ borderRadius: 1 }}
                      />
                    </Grid>
                    <Grid item xs={12} md={8}>
                      <Typography variant="h6">
                        {auction.currentPlayer.player.longName}
                      </Typography>
                      <Box display="flex" gap={2} mb={2}>
                        <Chip 
                          label={`OVR: ${auction.currentPlayer.player.overall}`}
                          color="primary"
                          variant="outlined"
                        />
                        <Chip 
                          label={auction.currentPlayer.player.mainPosition}
                          variant="outlined"
                        />
                      </Box>
                      <Typography variant="h5" color="primary" gutterBottom>
                        Current Bid: ${auction.currentPlayer.currentBid.amount.toLocaleString()}
                        {currentBidder && (
                          <Typography component="span" variant="body2" color="text.secondary" ml={1}>
                            by {currentBidder.username}
                          </Typography>
                        )}
                      </Typography>

                      {auction.status === 'active' && (isHost || currentParticipant) && (
                        <Box sx={{ mt: 2 }}>
                          <Box display="flex" gap={1} mb={2}>
                            <ButtonGroup variant="outlined">
                              <Button onClick={() => handleQuickBid(10000)}>+10K</Button>
                              <Button onClick={() => handleQuickBid(50000)}>+50K</Button>
                              <Button onClick={() => handleQuickBid(100000)}>+100K</Button>
                            </ButtonGroup>
                          </Box>
                          <Box display="flex" gap={1}>
                            <TextField
                              label="Custom Bid"
                              type="number"
                              value={bidAmount}
                              onChange={(e) => setBidAmount(e.target.value)}
                              sx={{ flexGrow: 1 }}
                            />
                            <Button
                              variant="contained"
                              onClick={handleBid}
                              disabled={isHighestBidder}
                              sx={{ minWidth: 120 }}
                            >
                              Place Bid
                            </Button>
                          </Box>
                        </Box>
                      )}
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Participants and Stats */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Participants
              </Typography>
              <List>
                {auction.participants.map((participant) => (
                  <ListItem key={participant._id}>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          {participant.username}
                          {participant._id === auction.host._id && (
                            <Chip label="Host" size="small" color="primary" />
                          )}
                        </Box>
                      }
                      secondary={`Budget: $${participant.budget?.toLocaleString()}`}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>

            {/* Auction Stats */}
            <Paper sx={{ p: 2, mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Auction Stats
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="Remaining Players"
                    secondary={auction.availablePlayers?.length || 0}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Completed Players"
                    secondary={auction.completedPlayers?.length || 0}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Skipped Players"
                    secondary={auction.skippedPlayers?.length || 0}
                  />
                </ListItem>
              </List>
            </Paper>

            {/* Completed Players */}
            <Paper sx={{ p: 2, mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Completed Players
              </Typography>
              <List dense>
                {auction.completedPlayers?.map((item, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          {item.player.shortName}
                          <Chip 
                            label={`$${item.amount.toLocaleString()}`}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </Box>
                      }
                      secondary={
                        <Typography variant="body2" color="text.secondary">
                          Won by {auction.participants.find(p => p._id === item.winner)?.username || 'Unknown'}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
                {auction.completedPlayers?.length === 0 && (
                  <ListItem>
                    <ListItemText
                      primary="No completed players yet"
                      sx={{ color: 'text.secondary' }}
                    />
                  </ListItem>
                )}
              </List>
            </Paper>
          </Grid>
        </Grid>
      </Container>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default Auction;
