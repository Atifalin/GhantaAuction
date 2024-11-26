import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  ButtonGroup,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useUser } from '../context/UserContext';
import { socketService } from '../services/socket'; // Assuming socketService is in a separate file

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [activeAuctions, setActiveAuctions] = useState([]);
  const [userTeam, setUserTeam] = useState([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newAuction, setNewAuction] = useState({
    name: '',
    budget: 1000
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
  }, [user, navigate]);

  const fetchUserTeam = useCallback(async () => {
    if (!user) return;
    
    try {
      const response = await axios.get(`http://localhost:5000/api/users/${user.id}/team`);
      setUserTeam(response.data);
    } catch (error) {
      console.error('Error fetching user team:', error);
      setError('Failed to fetch team data');
    }
  }, [user]);

  const fetchActiveAuctions = useCallback(async () => {
    if (!user) return;

    try {
      const response = await axios.get('http://localhost:5000/api/auctions');
      setActiveAuctions(response.data);
    } catch (error) {
      console.error('Error fetching auctions:', error);
      setError('Failed to fetch auctions');
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    // Connect to socket
    const socket = socketService.getSocket();
    
    // Set up socket event listeners
    socket.on('auctionUpdate', ({ auctionId, type, auction }) => {
      if (type === 'created') {
        setActiveAuctions(prev => [...prev, auction]);
      } else if (type === 'updated') {
        setActiveAuctions(prev => 
          prev.map(a => a._id === auctionId ? auction : a)
        );
      }
    });

    socket.on('teamUpdate', () => {
      fetchUserTeam();
    });

    fetchActiveAuctions();
    fetchUserTeam();

    // Cleanup
    return () => {
      socket.off('auctionUpdate');
      socket.off('teamUpdate');
    };
  }, [user, fetchActiveAuctions, fetchUserTeam]);

  const handleCreateAuction = async () => {
    try {
      const response = await axios.post('http://localhost:5000/api/auctions', {
        name: newAuction.name,
        budget: newAuction.budget
      });

      setCreateDialogOpen(false);
      setNewAuction({ name: '', budget: 1000 });
    } catch (error) {
      console.error('Error creating auction:', error);
      setError(error.response?.data?.message || 'Failed to create auction');
    }
  };

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

  const handleStartAuction = async (auctionId) => {
    try {
      await axios.post(`http://localhost:5000/api/auctions/${auctionId}/start`, {
        hostId: user.id
      });
      navigate(`/auction/${auctionId}`);
    } catch (error) {
      console.error('Error starting auction:', error);
      setError(error.response?.data?.message || 'Failed to start auction');
    }
  };

  const handleViewAuction = (auctionId) => {
    navigate(`/auction/${auctionId}`);
  };

  if (!user) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          {/* User Info */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h4" gutterBottom>
                Welcome, {user.username}!
              </Typography>
              <Typography variant="subtitle1" color="textSecondary">
                Your Budget: ${user.budget?.toLocaleString()}
              </Typography>
            </Paper>
          </Grid>

          {/* Error Alert */}
          {error && (
            <Grid item xs={12}>
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            </Grid>
          )}

          {/* User Stats */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                User Stats
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body1">
                  Username: {user.username}
                </Typography>
                <Typography variant="body1">
                  Budget: ${user.budget?.toLocaleString() || '1,000,000'}
                </Typography>
                <Typography variant="body1">
                  Team Size: {userTeam.length}
                </Typography>
              </Box>
            </Paper>
          </Grid>

          {/* Active Auctions */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Active Auctions
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={() => setCreateDialogOpen(true)}
                >
                  Create Auction
                </Button>
              </Box>
              <List>
                {activeAuctions.map((auction, index) => (
                  <React.Fragment key={auction._id}>
                    <ListItem>
                      <ListItemText
                        primary={auction.name}
                        secondary={`Host: ${auction.host?.username || 'Unknown'} | Status: ${auction.status} | Participants: ${auction.participants?.length || 0}`}
                      />
                      <ButtonGroup variant="outlined" size="small">
                        {auction.host?._id === user.id ? (
                          <>
                            <Button
                              color="primary"
                              onClick={() => handleViewAuction(auction._id)}
                            >
                              View
                            </Button>
                            {auction.status === 'waiting' && (
                              <Button
                                color="success"
                                onClick={() => handleStartAuction(auction._id)}
                              >
                                Start
                              </Button>
                            )}
                          </>
                        ) : (
                          <Button
                            color="primary"
                            onClick={() => handleJoinAuction(auction._id)}
                            disabled={auction.participants?.some(p => p._id === user.id)}
                          >
                            {auction.participants?.some(p => p._id === user.id) ? 'Joined' : 'Join'}
                          </Button>
                        )}
                      </ButtonGroup>
                    </ListItem>
                    {index < activeAuctions.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
                {activeAuctions.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                    No active auctions
                  </Typography>
                )}
              </List>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Create Auction Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)}>
        <DialogTitle>Create New Auction</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Auction Name"
            type="text"
            fullWidth
            value={newAuction.name}
            onChange={(e) => setNewAuction({ ...newAuction, name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Budget per Team"
            type="number"
            fullWidth
            value={newAuction.budget}
            onChange={(e) => setNewAuction({ ...newAuction, budget: parseInt(e.target.value) })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateAuction}
            disabled={!newAuction.name || newAuction.budget <= 0}
            variant="contained"
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Dashboard;
