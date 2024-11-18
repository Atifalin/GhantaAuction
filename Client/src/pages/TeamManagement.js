import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  SwapVert as SwapIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import axios from 'axios';

const TeamManagement = () => {
  const [team, setTeam] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [substitutes, setSubstitutes] = useState([]);
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/players?owner=${user.id}`);
      const players = response.data;
      setTeam(players.filter(p => !p.isSubstitute));
      setSubstitutes(players.filter(p => p.isSubstitute));
    } catch (error) {
      console.error('Error fetching team:', error);
    }
  };

  const handleSwapPlayer = (player) => {
    setSelectedPlayer(player);
    setOpenDialog(true);
  };

  const handleConfirmSwap = async (substituteId) => {
    try {
      await axios.post(`http://localhost:5000/api/players/swap`, {
        playerId: selectedPlayer._id,
        substituteId,
      });
      fetchTeam();
    } catch (error) {
      console.error('Error swapping players:', error);
    }
    setOpenDialog(false);
  };

  const renderPlayerCard = (player, isSubstitute = false) => (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            {player.name}
          </Typography>
          <Box>
            {!isSubstitute && (
              <IconButton
                size="small"
                onClick={() => handleSwapPlayer(player)}
                title="Swap with substitute"
              >
                <SwapIcon />
              </IconButton>
            )}
          </Box>
        </Box>
        <Typography color="text.secondary" gutterBottom>
          {player.position}
        </Typography>
        <Grid container spacing={1}>
          <Grid item xs={6}>
            <Typography variant="body2">Overall: {player.overall}</Typography>
          </Grid>
          {Object.entries(player.stats).map(([stat, value]) => (
            <Grid item xs={6} key={stat}>
              <Typography variant="body2">
                {stat.charAt(0).toUpperCase() + stat.slice(1)}: {value}
              </Typography>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="lg">
      <Grid container spacing={3}>
        {/* Main Squad */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h5" gutterBottom>
              Main Squad
            </Typography>
            <Grid container spacing={2}>
              {team.map((player) => (
                <Grid item xs={12} sm={6} key={player._id}>
                  {renderPlayerCard(player)}
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Substitutes */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h5" gutterBottom>
              Substitutes
            </Typography>
            {substitutes.map((player) => renderPlayerCard(player, true))}
          </Paper>
        </Grid>
      </Grid>

      {/* Swap Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Select Substitute</DialogTitle>
        <DialogContent>
          <List>
            {substitutes.map((sub) => (
              <ListItem key={sub._id}>
                <ListItemText
                  primary={sub.name}
                  secondary={`${sub.position} - Overall: ${sub.overall}`}
                />
                <ListItemSecondaryAction>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => handleConfirmSwap(sub._id)}
                  >
                    Swap
                  </Button>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TeamManagement;
