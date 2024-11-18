import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
} from '@mui/material';
import { socket } from '../services/socket';

const AuctionRoom = () => {
  const { id } = useParams();
  const [auction, setAuction] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [participants, setParticipants] = useState([]);
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    socket.emit('joinAuction', id);

    socket.on('auctionUpdate', (data) => {
      setAuction(data);
      setCurrentPlayer(data.currentPlayer);
      setTimeLeft(data.currentPlayer?.timeLeft || 0);
      setParticipants(data.participants);
    });

    socket.on('bidPlaced', (data) => {
      setCurrentPlayer(prev => ({
        ...prev,
        currentBid: data
      }));
    });

    socket.on('timerUpdate', (time) => {
      setTimeLeft(time);
    });

    return () => {
      socket.emit('leaveAuction', id);
      socket.off('auctionUpdate');
      socket.off('bidPlaced');
      socket.off('timerUpdate');
    };
  }, [id]);

  const placeBid = (amount) => {
    socket.emit('placeBid', {
      auctionId: id,
      userId: user.id,
      amount: currentPlayer.currentBid.amount + amount
    });
  };

  const startAuction = () => {
    socket.emit('startAuction', id);
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
                {auction.host === user.id && (
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
                  <Chip
                    label={`${timeLeft}s`}
                    color={timeLeft <= 10 ? 'error' : 'primary'}
                  />
                </Box>
                <Card>
                  <CardContent>
                    <Typography variant="h4" gutterBottom>
                      {currentPlayer.player.name}
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body1">
                          Position: {currentPlayer.player.position}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body1">
                          Overall: {currentPlayer.player.overall}
                        </Typography>
                      </Grid>
                      {Object.entries(currentPlayer.player.stats).map(([stat, value]) => (
                        <Grid item xs={6} key={stat}>
                          <Typography variant="body1">
                            {stat.charAt(0).toUpperCase() + stat.slice(1)}: {value}
                          </Typography>
                        </Grid>
                      ))}
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
                      <Box sx={{ mt: 2 }}>
                        <Button
                          variant="contained"
                          onClick={() => placeBid(5)}
                          sx={{ mr: 1 }}
                        >
                          +$5
                        </Button>
                        <Button
                          variant="contained"
                          onClick={() => placeBid(10)}
                        >
                          +$10
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
                    primary={participant.username}
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
