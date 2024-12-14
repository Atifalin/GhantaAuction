import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Chip
} from '@mui/material';
import {
  SwapVert as SwapIcon,
  Delete as DeleteIcon,
  SportsSoccer as PlayerIcon,
  EmojiEvents as TrophyIcon,
  Groups as TeamIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useUser } from '../context/UserContext';

const TeamManagement = () => {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const { user } = useUser();

  useEffect(() => {
    if (!user) {
      setError('Please log in to view your team');
      setLoading(false);
      return;
    }
    fetchTeam();
  }, [user]);

  const fetchTeam = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get(`/api/users/${user.id}/team`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (Array.isArray(response.data)) {
        setTeam(response.data);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching team:', error);
      setError(error.response?.data?.message || 'Failed to fetch team data');
    } finally {
      setLoading(false);
    }
  };

  const handleMovePlayer = async (playerId, isSubstitute) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      await axios.patch(
        `/api/team/${playerId}`,
        { isSubstitute },
        {
          headers: { 
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      fetchTeam();
    } catch (error) {
      console.error('Error moving player:', error);
      setError(error.response?.data?.message || 'Failed to update player status');
    }
  };

  const handleSwapPlayers = async (player1Id, player2Id) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      await axios.post(
        '/api/team/swap',
        {
          playerId: player1Id,
          substituteId: player2Id
        },
        {
          headers: { 
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      setOpenDialog(false);
      fetchTeam();
    } catch (error) {
      console.error('Error swapping players:', error);
      setError(error.response?.data?.message || 'Failed to swap players');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  const mainTeam = team.filter(player => !player.isSubstitute);
  const substitutes = team.filter(player => player.isSubstitute);

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
          Team Management
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          Manage your team lineup and substitutes
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Team Summary */}
        <Grid item xs={12}>
          <Paper 
            elevation={3}
            sx={{ 
              p: 3,
              background: 'linear-gradient(to right, #ffffff, #f5f5f5)',
              borderRadius: 2,
              mb: 3
            }}
          >
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <TeamIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                  <Typography variant="h6">Squad Size</Typography>
                  <Typography variant="h4" color="primary">
                    {team.length}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <PlayerIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                  <Typography variant="h6">Starting XI</Typography>
                  <Typography variant="h4" color="success.main">
                    {mainTeam.length}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <SwapIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                  <Typography variant="h6">Substitutes</Typography>
                  <Typography variant="h4" color="warning.main">
                    {substitutes.length}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Main Team */}
        <Grid item xs={12} md={8}>
          <Paper 
            elevation={3}
            sx={{ 
              p: 3,
              height: '100%',
              background: 'linear-gradient(to bottom right, #ffffff, #f5f5f5)',
              borderRadius: 2
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ color: 'success.main', fontWeight: 'bold' }}>
              Starting XI
            </Typography>
            <Grid container spacing={2}>
              {mainTeam.map((player) => (
                <Grid item xs={12} key={player._id}>
                  <Paper 
                    elevation={1}
                    sx={{
                      p: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'rgba(255, 255, 255, 0.9)',
                      '&:hover': {
                        bgcolor: 'rgba(0, 0, 0, 0.02)'
                      }
                    }}
                  >
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                        {player.shortName}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {player.mainPosition} • OVR {player.overall}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip 
                        label={`₹${player.amount?.toLocaleString()}`}
                        color="primary"
                        size="small"
                      />
                      <IconButton
                        size="small"
                        onClick={() => handleMovePlayer(player._id, true)}
                        color="warning"
                      >
                        <SwapIcon />
                      </IconButton>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Substitutes */}
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
            <Typography variant="h6" gutterBottom sx={{ color: 'warning.main', fontWeight: 'bold' }}>
              Substitutes
            </Typography>
            <Grid container spacing={2}>
              {substitutes.map((player) => (
                <Grid item xs={12} key={player._id}>
                  <Paper 
                    elevation={1}
                    sx={{
                      p: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'rgba(255, 255, 255, 0.9)',
                      '&:hover': {
                        bgcolor: 'rgba(0, 0, 0, 0.02)'
                      }
                    }}
                  >
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                        {player.shortName}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {player.mainPosition} • OVR {player.overall}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip 
                        label={`₹${player.amount?.toLocaleString()}`}
                        color="primary"
                        size="small"
                      />
                      <IconButton
                        size="small"
                        onClick={() => handleMovePlayer(player._id, false)}
                        color="success"
                      >
                        <SwapIcon />
                      </IconButton>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {error && (
        <Alert 
          severity="error" 
          onClose={() => setError(null)}
          sx={{ 
            position: 'fixed', 
            bottom: 16, 
            right: 16,
            zIndex: 9999
          }}
        >
          {error}
        </Alert>
      )}

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Swap Players</DialogTitle>
        <DialogContent>
          <Typography>
            Select a player to swap with {selectedPlayer?.shortName}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TeamManagement;
