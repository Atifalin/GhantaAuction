import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Chip,
  TextField,
  Avatar,
  LinearProgress,
} from '@mui/material';
import axios from 'axios';
import { socket } from '../services/socket';

const AuctionRoom = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [auction, setAuction] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [participants, setParticipants] = useState([]);
  const [customBid, setCustomBid] = useState('');
  const [bidError, setBidError] = useState('');
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    socket.emit('joinAuction', { auctionId: id, userId: user._id });

    socket.on('auctionUpdate', (data) => {
      setAuction(data);
      setCurrentPlayer(data.currentPlayer);
      setTimeLeft(data.currentPlayer?.timeLeft || 30);
      setParticipants(data.participants);
      setBidError('');
      setCustomBid('');
    });

    socket.on('bidPlaced', (data) => {
      setCurrentPlayer(prev => ({
        ...prev,
        currentBid: data
      }));
      setBidError('');
    });

    socket.on('bidError', (error) => {
      setBidError(error);
    });

    socket.on('timerUpdate', (time) => {
      setTimeLeft(time);
    });

    socket.on('playerSkipped', ({ skippedPlayer, nextPlayer }) => {
      setCurrentPlayer(nextPlayer);
      setTimeLeft(30);
      setBidError('');
      setCustomBid('');
    });

    socket.on('playerAssigned', ({ winner, player }) => {
      if (winner._id === user._id) {
        // Show success message or notification
      }
    });

    socket.on('auctionCompleted', () => {
      navigate('/team-management');
    });

    return () => {
      socket.emit('leaveAuction', { auctionId: id, userId: user._id });
      socket.off('auctionUpdate');
      socket.off('bidPlaced');
      socket.off('bidError');
      socket.off('timerUpdate');
      socket.off('playerSkipped');
      socket.off('playerAssigned');
      socket.off('auctionCompleted');
    };
  }, [id, user._id, navigate]);

  const placeBid = async (amount) => {
    try {
      await axios.post(`http://localhost:5000/api/auctions/${id}/bid`, {
        amount: parseInt(amount),
        userId: user._id
      });
      setCustomBid('');
      setBidError('');
    } catch (error) {
      console.error('Error placing bid:', error);
      setBidError(error.response?.data?.message || 'Failed to place bid');
    }
  };

  const handleCustomBid = () => {
    const amount = parseInt(customBid);
    if (isNaN(amount) || amount <= 0) {
      setBidError('Please enter a valid bid amount');
      return;
    }

    if (amount <= (currentPlayer?.currentBid?.amount || 0)) {
      setBidError('Bid must be higher than current bid');
      return;
    }

    if (amount > user.budget) {
      setBidError('Bid cannot exceed your budget');
      return;
    }

    placeBid(amount);
  };

  const handleSkip = async () => {
    try {
      await axios.post(`http://localhost:5000/api/auctions/${id}/skip`, {
        userId: user._id
      });
    } catch (error) {
      console.error('Error voting to skip:', error);
      setBidError(error.response?.data?.message || 'Error voting to skip');
    }
  };

  const startAuction = () => {
    socket.emit('startAuction', { auctionId: id, userId: user._id });
  };

  if (!auction) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Grid container spacing={3}>
        {/* Current Player */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            {auction.status === 'waiting' ? (
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" gutterBottom>
                  Waiting for auction to start...
                </Typography>
                {auction.host === user._id && (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={startAuction}
                    sx={{ mt: 2 }}
                  >
                    Start Auction
                  </Button>
                )}
              </Box>
            ) : currentPlayer ? (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h5">
                    Current Player
                  </Typography>
                  <Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={(timeLeft / 30) * 100} 
                      sx={{ mb: 1, minWidth: 100 }}
                    />
                    <Chip
                      label={`${timeLeft}s`}
                      color={timeLeft <= 10 ? 'error' : 'primary'}
                    />
                  </Box>
                </Box>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar
                        src={currentPlayer.player.photo}
                        alt={currentPlayer.player.shortName}
                        sx={{ width: 80, height: 80, mr: 2 }}
                      />
                      <Box>
                        <Typography variant="h4" gutterBottom>
                          {currentPlayer.player.shortName}
                        </Typography>
                        <Typography variant="subtitle1" color="textSecondary">
                          {currentPlayer.player.longName}
                        </Typography>
                      </Box>
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body1">
                          Position: {currentPlayer.player.mainPosition}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body1">
                          Overall: {currentPlayer.player.overall}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body1">
                          Club: {currentPlayer.player.club}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body1">
                          Nationality: {currentPlayer.player.nationality}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {['pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical'].map(stat => (
                            <Chip
                              key={stat}
                              label={`${stat.charAt(0).toUpperCase() + stat.slice(1)}: ${currentPlayer.player[stat]}`}
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      </Grid>
                    </Grid>
                    <Box sx={{ mt: 3, textAlign: 'center' }}>
                      <Typography variant="h6" gutterBottom>
                        Current Bid: ${currentPlayer.currentBid.amount}
                      </Typography>
                      {currentPlayer.currentBid.bidder && (
                        <Typography variant="subtitle1" gutterBottom>
                          Highest Bidder: {currentPlayer.currentBid.bidder.username}
                        </Typography>
                      )}
                      {bidError && (
                        <Typography color="error" variant="body2" sx={{ mb: 2 }}>
                          {bidError}
                        </Typography>
                      )}
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2 }}>
                        <Button
                          variant="contained"
                          onClick={() => placeBid(currentPlayer.currentBid.amount + 5)}
                          disabled={user.budget < currentPlayer.currentBid.amount + 5}
                        >
                          +$5
                        </Button>
                        <Button
                          variant="contained"
                          onClick={() => placeBid(currentPlayer.currentBid.amount + 10)}
                          disabled={user.budget < currentPlayer.currentBid.amount + 10}
                        >
                          +$10
                        </Button>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                        <TextField
                          size="small"
                          type="number"
                          label="Custom Bid"
                          value={customBid}
                          onChange={(e) => setCustomBid(e.target.value)}
                          sx={{ width: 150 }}
                        />
                        <Button
                          variant="contained"
                          onClick={handleCustomBid}
                          disabled={!customBid || user.budget < parseInt(customBid)}
                        >
                          Place Bid
                        </Button>
                        <Button
                          variant="outlined"
                          color="secondary"
                          onClick={handleSkip}
                          disabled={auction?.skipVotes?.includes(user._id)}
                        >
                          Skip Player ({auction?.skipVotes?.length || 0}/{participants.length})
                        </Button>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Typography variant="h6" align="center">
                Auction completed
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Participants */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Participants
            </Typography>
            <List>
              {participants.map((participant) => (
                <ListItem key={participant._id}>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {participant.emoji}
                        <span style={{ color: participant.color }}>{participant.username}</span>
                      </Box>
                    }
                    secondary={`Budget: $${participant.budget}`}
                  />
                  {auction.host === participant._id && (
                    <Chip label="Host" color="primary" size="small" />
                  )}
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AuctionRoom;
