import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import axios from 'axios';

const Dashboard = () => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
  const [activeAuctions, setActiveAuctions] = useState([]);
  const [userTeam, setUserTeam] = useState([]);

  useEffect(() => {
    fetchActiveAuctions();
    fetchUserTeam();
  }, []);

  const fetchActiveAuctions = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/auctions');
      setActiveAuctions(response.data);
    } catch (error) {
      console.error('Error fetching auctions:', error);
    }
  };

  const fetchUserTeam = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/players?owner=${user.id}`);
      setUserTeam(response.data);
    } catch (error) {
      console.error('Error fetching team:', error);
    }
  };

  return (
    <Container maxWidth="lg">
      <Grid container spacing={3}>
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
                Budget: ${user.budget}
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
              <Button variant="contained" color="primary">
                Create Auction
              </Button>
            </Box>
            <List>
              {activeAuctions.map((auction, index) => (
                <React.Fragment key={auction._id}>
                  <ListItem>
                    <ListItemText
                      primary={auction.name}
                      secondary={`Host: ${auction.host.username} | Participants: ${auction.participants.length}`}
                    />
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={() => {/* Handle join */}}
                    >
                      Join
                    </Button>
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
    </Container>
  );
};

export default Dashboard;
