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

const AuctionCard = ({ auction, user, onJoin, onStart, onView, isCompleted }) => {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="h6">{auction.name}</Typography>
      <Typography color="text.secondary">
        Host: {auction.host?.username || 'N/A'} | Status: {auction.status} | Participants: {auction.participants?.length || 0}
      </Typography>
      <ButtonGroup variant="outlined" size="small">
        <Button
          color="primary"
          onClick={() => onView(auction._id)}
        >
          VIEW
        </Button>
        {auction.host?._id === user.id ? (
          auction.status === 'pending' && (
            <Button
              color="success"
              onClick={() => onStart(auction._id)}
            >
              START
            </Button>
          )
        ) : (
          auction.status === 'pending' && !auction.participants?.some(p => p._id === user.id) && (
            <Button
              color="primary"
              onClick={() => onJoin(auction._id)}
            >
              JOIN
            </Button>
          )
        )}
      </ButtonGroup>
    </Box>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [auctions, setAuctions] = useState({
    active: [],
    pending: [],
    completed: []
  });
  const [userTeam, setUserTeam] = useState([]);
  const [teamError, setTeamError] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
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
    setIsLoading(false);
  }, [user, navigate]);

  const fetchUserTeam = useCallback(async () => {
    if (!user) return;
    
    try {
      const response = await axios.get(`http://localhost:5000/api/users/${user.id}/team`);
      setUserTeam(response.data);
      setTeamError(null);
    } catch (error) {
      console.error('Error fetching user team:', error);
      setTeamError('Failed to fetch team data');
    }
  }, [user]);

  const fetchActiveAuctions = useCallback(async () => {
    if (!user) return;

    try {
      const response = await axios.get('http://localhost:5000/api/auctions');
      setAuctions(response.data);
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
        setAuctions(prev => ({ ...prev, [auction.status]: [...prev[auction.status], auction] }));
      } else if (type === 'updated') {
        setAuctions(prev => {
          const updatedAuctions = { ...prev };
          Object.keys(updatedAuctions).forEach(status => {
            updatedAuctions[status] = updatedAuctions[status].map(a => a._id === auctionId ? auction : a);
          });
          return updatedAuctions;
        });
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

  if (!user || isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Welcome, {user?.username || 'User'}!
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          Your Budget: ${(user?.budget || 0).toLocaleString()}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* User Stats */}
        <Grid item xs={12} md={4}>
          <Paper 
            elevation={3}
            sx={{ 
              p: 3, 
              height: '100%',
              background: 'linear-gradient(to bottom right, #ffffff, #f5f5f5)',
              borderRadius: 2
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
              Your Status
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                {/* Budget */}
                <Grid item xs={12}>
                  <Paper 
                    elevation={1} 
                    sx={{ 
                      p: 2, 
                      background: 'rgba(255, 255, 255, 0.9)',
                      border: '1px solid rgba(0, 0, 0, 0.1)',
                      borderRadius: 1
                    }}
                  >
                    <Typography variant="subtitle2" color="textSecondary">
                      Available Budget
                    </Typography>
                    <Typography variant="h4" sx={{ color: 'success.main', fontWeight: 'medium' }}>
                      ₹{(user?.budget || 0).toLocaleString()}
                    </Typography>
                  </Paper>
                </Grid>

                {/* Team Size */}
                <Grid item xs={12}>
                  <Paper 
                    elevation={1} 
                    sx={{ 
                      p: 2, 
                      background: 'rgba(255, 255, 255, 0.9)',
                      border: '1px solid rgba(0, 0, 0, 0.1)',
                      borderRadius: 1
                    }}
                  >
                    <Typography variant="subtitle2" color="textSecondary">
                      Team Size
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
                      <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 'medium' }}>
                        {userTeam?.length || 0}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ ml: 1 }}>
                        players
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>

                {/* Last Won Player */}
                <Grid item xs={12}>
                  <Paper 
                    elevation={1} 
                    sx={{ 
                      p: 2, 
                      background: 'rgba(255, 255, 255, 0.9)',
                      border: '1px solid rgba(0, 0, 0, 0.1)',
                      borderRadius: 1
                    }}
                  >
                    <Typography variant="subtitle2" color="textSecondary">
                      Last Won Player
                    </Typography>
                    {userTeam && userTeam.length > 0 ? (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="h6" sx={{ color: 'text.primary' }}>
                          {userTeam[userTeam.length - 1]?.name || 'N/A'}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Bid: ₹{userTeam[userTeam.length - 1]?.bidAmount?.toLocaleString() || '0'}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body1" sx={{ color: 'text.secondary', mt: 1 }}>
                        No players won yet
                      </Typography>
                    )}
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Grid>

        {/* Active Auctions */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Auctions
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => setCreateDialogOpen(true)}
              >
                CREATE AUCTION
              </Button>
            </Box>

            {/* Active & Pending Auctions */}
            {(auctions.active.length > 0 || auctions.pending.length > 0) && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" color="primary" gutterBottom>
                  Active & Pending Auctions
                </Typography>
                {[...auctions.active, ...auctions.pending].map((auction) => (
                  <AuctionCard 
                    key={auction._id} 
                    auction={auction} 
                    user={user}
                    onJoin={handleJoinAuction}
                    onStart={handleStartAuction}
                    onView={handleViewAuction}
                  />
                ))}
              </Box>
            )}

            {/* Completed Auctions */}
            {auctions.completed.length > 0 && (
              <Box>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Completed Auctions
                </Typography>
                {auctions.completed.map((auction) => (
                  <AuctionCard 
                    key={auction._id} 
                    auction={auction} 
                    user={user}
                    onView={handleViewAuction}
                    isCompleted
                  />
                ))}
              </Box>
            )}

            {Object.values(auctions).every(arr => arr.length === 0) && (
              <Typography color="text.secondary" align="center">
                No auctions available
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      {error && (
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
      )}

      {teamError && (
        <Alert severity="error" onClose={() => setTeamError(null)} sx={{ mt: 2 }}>
          {teamError}
        </Alert>
      )}

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
