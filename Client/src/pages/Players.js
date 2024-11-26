import React, { useState, useEffect } from 'react';
import {
  Container,
  TextField,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Avatar,
  CircularProgress,
  Alert,
  Button,
  IconButton,
} from '@mui/material';
import { Search as SearchIcon, Favorite, FavoriteBorder } from '@mui/icons-material';
import axios from 'axios';

const Players = () => {
  const [players, setPlayers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching players...');
      const response = await axios.get('http://localhost:5000/api/players', {
        timeout: 5000,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      console.log('Response:', response);
      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('Invalid response format from server');
      }
      setPlayers(response.data);
    } catch (error) {
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack
      });
      setError(
        error.response?.data?.message || 
        error.message || 
        'Failed to fetch players'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFavorite = async (playerId) => {
    try {
      const userData = localStorage.getItem('user');
      console.log('Raw user data from localStorage:', userData);
      console.log('Parsed user:', user);
      console.log('User ID being sent:', user?._id);
      
      if (!user?._id) {
        console.error('No valid user ID found');
        return;
      }

      const response = await axios.post(`http://localhost:5000/api/players/${playerId}/favorite`, {
        userId: user._id
      });
      
      console.log('Favorite response:', response.data);
      
      setPlayers(players.map(player => {
        if (player._id === playerId) {
          console.log('Updating player:', player.shortName);
          return { ...player, favorites: response.data.favorites };
        }
        return player;
      }));
    } catch (error) {
      console.error('Error favoriting player:', error.response || error);
    }
  };

  const isFavorited = (player) => {
    if (!user || !player.favorites) return false;
    return player.favorites.includes(user._id);
  };

  const getOverallColor = (overall) => {
    if (overall >= 85) return '#FFD700'; // Gold
    if (overall >= 80) return '#00C853'; // Green
    if (overall >= 75) return '#2196F3'; // Blue
    if (overall >= 70) return '#C0C0C0'; // Silver
    return '#CD7F32'; // Bronze
  };

  const filteredPlayers = players.filter(player => {
    const nameMatch = player?.shortName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                     player?.longName?.toLowerCase().includes(searchQuery.toLowerCase());
    const positionMatch = positionFilter === 'all' || (player?.positions || []).includes(positionFilter);
    return nameMatch && positionMatch;
  }).sort((a, b) => {
    // Sort by favorite status first
    const aFavorited = isFavorited(a);
    const bFavorited = isFavorited(b);
    if (aFavorited && !bFavorited) return -1;
    if (!aFavorited && bFavorited) return 1;
    // Then sort by overall rating
    return b.overall - a.overall;
  });

  const positions = [
    'GK',
    'CB', 'LB', 'RB', 'LWB', 'RWB',
    'CDM', 'CM', 'CAM', 'LM', 'RM',
    'LW', 'RW', 'CF', 'ST'
  ];

  const renderStats = (player) => {
    if (player.positions.includes('GK')) {
      const gkStats = player.stats?.goalkeeping || {};
      return Object.entries(gkStats).map(([stat, value]) => (
        <Grid item xs={4} key={stat}>
          <Typography variant="caption" component="div" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
            {stat.replace(/([A-Z])/g, ' $1').trim()}
          </Typography>
          <Typography variant="body2" component="div">
            {value}
          </Typography>
        </Grid>
      ));
    }

    // For outfield players, show the main stats directly
    const mainStats = [
      { name: 'PAC', value: player.pace },
      { name: 'SHO', value: player.shooting },
      { name: 'PAS', value: player.passing },
      { name: 'DRI', value: player.dribbling },
      { name: 'DEF', value: player.defending },
      { name: 'PHY', value: player.physical }
    ];

    return mainStats.map(({ name, value }) => (
      <Grid item xs={4} key={name}>
        <Typography variant="caption" component="div" color="text.secondary" sx={{ fontWeight: 'bold' }}>
          {name}
        </Typography>
        <Typography variant="body2" component="div">
          {value}
        </Typography>
      </Grid>
    ));
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Error loading players: {error}
        </Alert>
        <Button variant="contained" onClick={fetchPlayers}>
          Retry
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search players..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Filter by Position</InputLabel>
              <Select
                value={positionFilter}
                onChange={(e) => setPositionFilter(e.target.value)}
                label="Filter by Position"
              >
                <MenuItem value="all">All Positions</MenuItem>
                {positions.map(pos => (
                  <MenuItem key={pos} value={pos}>{pos}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      <Grid container spacing={2}>
        {filteredPlayers.map((player) => (
          <Grid item xs={12} sm={6} md={4} key={player._id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" component="div">
                      {player.shortName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {player.longName}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton
                      onClick={() => handleFavorite(player._id)}
                      color="primary"
                      size="small"
                      sx={{ 
                        '& .MuiSvgIcon-root': {
                          color: isFavorited(player) ? 'red' : 'inherit'
                        }
                      }}
                    >
                      {isFavorited(player) ? <Favorite /> : <FavoriteBorder />}
                    </IconButton>
                    <Avatar
                      sx={{
                        bgcolor: getOverallColor(player.overall),
                        width: 56,
                        height: 56
                      }}
                    >
                      {player.overall}
                    </Avatar>
                  </Box>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Club: {player.club}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Nationality: {player.nationality}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Age: {player.age}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {player.positions.map((position) => (
                    <Chip
                      key={position}
                      label={position}
                      size="small"
                      sx={{
                        backgroundColor: position === player.mainPosition ? '#1976d2' : 'default',
                        color: position === player.mainPosition ? 'white' : 'default'
                      }}
                    />
                  ))}
                </Box>

                <Box sx={{ mt: 2 }}>
                  <Grid container spacing={1}>
                    {renderStats(player)}
                  </Grid>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          Found {filteredPlayers.length} player{filteredPlayers.length !== 1 ? 's' : ''}
          {searchQuery && ` matching "${searchQuery}"`}
          {positionFilter !== 'all' && ` in position ${positionFilter}`}
        </Typography>
      </Box>
    </Container>
  );
};

export default Players;
