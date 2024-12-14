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
  Avatar,
  InputAdornment,
  Divider
} from '@mui/material';
import { EmojiEvents as TrophyIcon } from '@mui/icons-material';
import axios from 'axios';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';

const API_URL = 'http://localhost:5000/api';

const Auction = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [auction, setAuction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [customBid, setCustomBid] = useState('');
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

  const handleBid = useCallback(async () => {
    if (!user?.id || !id || !auction) return;

    try {
      const amount = Number(customBid);
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
        setCustomBid('');
        await fetchAuction();
        showSnackbar('Bid placed successfully', 'success');
      }
    } catch (error) {
      console.error('Error placing bid:', error);
      const errorMessage = error.response?.data?.message || 'Failed to place bid';
      showSnackbar(errorMessage, 'error');
    }
  }, [customBid, user?.id, id, auction, fetchAuction, showSnackbar]);

  const handleQuickBid = useCallback((increment) => {
    if (!auction?.currentPlayer?.currentBid) return;
    
    const currentBid = auction.currentPlayer.currentBid.amount || 0;
    const newBid = Math.max(currentBid + increment, auction.currentPlayer.player.minimumBid || 0);
    setCustomBid(newBid.toString());
    handleBid();
  }, [auction, handleBid]);

  const handleNextPlayer = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      await axios.post(
        `${API_URL}/auctions/${id}/next-player`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      showSnackbar('Moving to next player...', 'info');
      await fetchAuction(); // Fetch the updated auction state
    } catch (error) {
      console.error('Error moving to next player:', error);
      showSnackbar(error.response?.data?.message || 'Failed to move to next player', 'error');
    }
  };

  const handleStatusChange = async (action) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.post(
        `${API_URL}/auctions/${id}/${action}`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data) {
        setAuction(response.data);
        showSnackbar(`Auction ${action}ed successfully`, 'success');
      }
    } catch (error) {
      console.error(`Error ${action}ing auction:`, error);
      showSnackbar(error.response?.data?.message || `Failed to ${action} auction`, 'error');
    }
  };

  const handleEndAuction = () => handleStatusChange('end');

  const handleDeleteAuction = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      await axios.delete(`${API_URL}/auctions/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      showSnackbar('Auction deleted successfully', 'success');
      navigate('/auctions');
    } catch (error) {
      console.error('Error deleting auction:', error);
      showSnackbar(error.response?.data?.message || 'Failed to delete auction', 'error');
    }
  };

  const getTierColor = (tier) => {
    switch(tier?.toLowerCase()) {
      case 'gold': return '#FFD700';
      case 'silver': return '#C0C0C0';
      case 'bronze': return '#CD7F32';
      default: return '#808080';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

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
        
        // Only set up intervals if auction is active
        if (auction?.status === 'active') {
          timeInterval = setInterval(() => {
            fetchTime();
          }, 1000);

          updateInterval = setInterval(() => {
            fetchAuction();
          }, 5000);
        }
      } catch (error) {
        console.error('Error initializing auction:', error);
        setError('Failed to initialize auction');
        setLoading(false);
      }
    };

    initializeAuction();

    // Cleanup intervals
    return () => {
      if (timeInterval) clearInterval(timeInterval);
      if (updateInterval) clearInterval(updateInterval);
    };
  }, [user, navigate, fetchAuction, fetchTime, auction?.status]);

  if (!user) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 2 }}>
          Please log in to view this auction
        </Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      </Container>
    );
  }

  if (!auction) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 2 }}>
          Auction not found
        </Alert>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => navigate('/auctions')} 
          sx={{ mt: 2 }}
        >
          Back to Auctions
        </Button>
      </Container>
    );
  }

  const isHost = auction?.host?._id === user?.id;
  const currentParticipant = auction?.participants?.find(p => p?._id === user?.id);
  const currentBidder = auction?.currentPlayer?.currentBid?.bidder;
  const isHighestBidder = currentBidder?._id === user?.id;

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {auction ? (
        <Grid container spacing={3}>
          {/* Left Column - Host Controls & Current Player */}
          <Grid item xs={12} md={8}>
            {/* Host Controls */}
            {isHost && (
              <Paper sx={{ p: 2, mb: 2, bgcolor: 'background.paper' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" component="h2">Host Controls</Typography>
                  <Box>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => handleStatusChange(auction.status === 'active' ? 'pause' : 'resume')}
                      sx={{ mr: 1 }}
                    >
                      {auction.status === 'active' ? 'Pause' : 'Resume'}
                    </Button>
                    <Button
                      variant="contained"
                      color="secondary"
                      onClick={handleNextPlayer}
                      disabled={auction.status !== 'active'}
                    >
                      Next Player
                    </Button>
                  </Box>
                </Box>
              </Paper>
            )}

            {/* Current Player Section */}
            <Paper 
              elevation={3}
              sx={{ 
                position: 'relative',
                background: 'linear-gradient(to bottom right, #ffffff, #f5f5f5)',
                borderRadius: 2,
                overflow: 'hidden',
                mb: 2
              }}
            >
              {auction.currentPlayer?.player ? (
                <>
                  {/* Tier Color Bar */}
                  <Box 
                    sx={{ 
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '4px',
                      background: getTierColor(auction.currentPlayer.player.tier)
                    }} 
                  />

                  <Box sx={{ p: 3, position: 'relative' }}>
                    {/* Timer */}
                    <Box 
                      sx={{
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        bgcolor: timeLeft <= 10 ? 'error.main' : '#1976d2',
                        color: 'white',
                        p: 2,
                        borderRadius: 2,
                        width: 120,
                        height: 80,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: 3,
                        zIndex: 2
                      }}
                    >
                      <Typography variant="h3" sx={{ fontWeight: 'medium' }}>
                        {timeLeft}s
                      </Typography>
                    </Box>

                    {/* Player Info Header */}
                    <Box sx={{ pr: 16 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <Typography variant="h4" sx={{ fontWeight: 'medium' }}>
                          {auction.currentPlayer.player.shortName}
                        </Typography>
                        <Avatar
                          sx={{
                            bgcolor: getTierColor(auction.currentPlayer.player.tier),
                            width: 45,
                            height: 45,
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            color: auction.currentPlayer.player.tier === 'gold' ? 'black' : 'white'
                          }}
                        >
                          {auction.currentPlayer.player.overall}
                        </Avatar>
                      </Box>
                      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                        {auction.currentPlayer.player.longName}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Chip
                          label="GOLD"
                          size="small"
                          sx={{
                            bgcolor: '#FFD700',
                            color: 'black',
                            fontWeight: 'bold',
                            fontSize: '0.9rem'
                          }}
                        />
                        <Chip
                          label={auction.currentPlayer.player.mainPosition}
                          color="primary"
                          size="small"
                          sx={{ fontSize: '0.9rem' }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          Min Bid: ${auction.currentPlayer.player.minimumBid?.toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Stats Chart */}
                    <Box sx={{ height: 200, mb: 2 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart 
                          data={[
                            { name: 'PAC', value: auction.currentPlayer.player.pace },
                            { name: 'SHO', value: auction.currentPlayer.player.shooting },
                            { name: 'PAS', value: auction.currentPlayer.player.passing },
                            { name: 'DRI', value: auction.currentPlayer.player.dribbling },
                            { name: 'DEF', value: auction.currentPlayer.player.defending },
                            { name: 'PHY', value: auction.currentPlayer.player.physical }
                          ]} 
                          margin={{ top: 0, right: 30, bottom: 0, left: 30 }}
                        >
                          <PolarGrid />
                          <PolarAngleAxis dataKey="name" />
                          <Radar
                            name="Stats"
                            dataKey="value"
                            stroke={getTierColor(auction.currentPlayer.player.tier)}
                            fill={getTierColor(auction.currentPlayer.player.tier)}
                            fillOpacity={0.3}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </Box>

                    {/* Current Bid Section */}
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ mb: 2 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Box>
                          <Typography variant="h6" gutterBottom>
                            Current Bid: ${auction.currentPlayer.currentBid.amount?.toLocaleString() || '0'}
                          </Typography>
                          {auction.currentPlayer.currentBid.bidder && (
                            <Typography color="text.secondary">
                              by {auction.currentPlayer.currentBid.bidder.username}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                      
                      {/* Quick Bid Buttons */}
                      <Box display="flex" gap={2} mt={2}>
                        {[10000, 30000, 50000].map((amount) => (
                          <Button
                            key={amount}
                            variant="contained"
                            color="primary"
                            size="large"
                            onClick={() => handleQuickBid(amount)}
                            disabled={auction.status !== 'active'}
                            sx={{
                              minWidth: 120,
                              py: 1.5,
                              fontSize: '1.1rem',
                              '&:hover': {
                                transform: 'translateY(-2px)',
                                transition: 'transform 0.2s'
                              }
                            }}
                          >
                            +{amount/1000}K
                          </Button>
                        ))}
                      </Box>

                      {/* Custom Bid Input */}
                      <Box display="flex" gap={2} mt={2}>
                        <TextField
                          type="number"
                          value={customBid}
                          onChange={(e) => setCustomBid(e.target.value)}
                          label="Custom Bid"
                          variant="outlined"
                          sx={{ flexGrow: 1 }}
                          InputProps={{
                            startAdornment: <InputAdornment position="start">$</InputAdornment>
                          }}
                        />
                        <Button
                          variant="contained"
                          onClick={handleBid}
                          disabled={auction.status !== 'active'}
                          sx={{ minWidth: 120 }}
                          color="primary"
                        >
                          Place Bid
                        </Button>
                      </Box>
                    </Box>
                  </Box>
                </>
              ) : (
                <Typography variant="h6" color="text.secondary" align="center" py={4}>
                  No active player
                </Typography>
              )}
            </Paper>
          </Grid>

          {/* Right Column - Stats */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, mb: 2, bgcolor: 'background.paper' }}>
              <Typography variant="h6" gutterBottom>
                Auction Stats
              </Typography>
              <List>
                <ListItem divider>
                  <ListItemText
                    primary={
                      <Box display="flex" justifyContent="space-between">
                        <Typography>Remaining Players</Typography>
                        <Typography color="primary.main" fontWeight="bold">
                          {auction.availablePlayers?.length || 0}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
                <ListItem divider>
                  <ListItemText
                    primary={
                      <Box display="flex" justifyContent="space-between">
                        <Typography>Completed Players</Typography>
                        <Typography color="success.main" fontWeight="bold">
                          {auction.completedPlayers?.length || 0}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
                {auction.skippedPlayers?.length > 0 && (
                  <ListItem>
                    <ListItemText
                      primary={
                        <Box display="flex" justifyContent="space-between">
                          <Typography>Skipped Players</Typography>
                          <Typography color="warning.main" fontWeight="bold">
                            {auction.skippedPlayers.length}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                )}
              </List>
            </Paper>

            {/* Completed Players */}
            <Paper sx={{ p: 2, bgcolor: 'background.paper' }}>
              <Typography variant="h6" gutterBottom>
                Completed Players
              </Typography>
              <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                {auction.completedPlayers?.map((item, index) => (
                  <ListItem 
                    key={index}
                    divider={index < auction.completedPlayers.length - 1}
                    sx={{ 
                      '&:hover': { 
                        bgcolor: 'action.hover',
                        transition: 'background-color 0.2s'
                      }
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                          <Typography variant="subtitle1" fontWeight="medium">
                            {item.player?.shortName}
                          </Typography>
                          <Chip
                            label={`$${item.amount?.toLocaleString()}`}
                            color="primary"
                            sx={{ fontWeight: 'bold' }}
                          />
                        </Box>
                      }
                      secondary={
                        <Box display="flex" justifyContent="space-between" mt={0.5}>
                          <Typography variant="body2" color="text.secondary">
                            Won by {item.winner?.username}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(item.timestamp).toLocaleTimeString()}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
                {(!auction.completedPlayers || auction.completedPlayers.length === 0) && (
                  <ListItem>
                    <ListItemText
                      primary="No completed players yet"
                      sx={{ color: 'text.secondary', textAlign: 'center' }}
                    />
                  </ListItem>
                )}
              </List>
            </Paper>
          </Grid>
        </Grid>
      ) : null}
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        message={snackbar.message}
      />
    </Container>
  );
};

export default Auction;
