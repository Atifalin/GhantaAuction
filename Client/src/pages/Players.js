import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Avatar,
  Button,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Favorite,
  FavoriteBorder,
  SportsSoccer as PlayerIcon,
  EmojiEvents as TrophyIcon,
  Speed as SpeedIcon,
  Login as LoginIcon,
} from '@mui/icons-material';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';

const Players = () => {
  const [players, setPlayers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, login } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPlayers();
  }, [user]); // Refetch when user changes

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/players', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('Invalid response format from server');
      }
      setPlayers(response.data);
    } catch (error) {
      console.error('Error fetching players:', error);
      setError(error.response?.data?.message || 'Failed to fetch players');
    } finally {
      setLoading(false);
    }
  };

  const handleFavorite = async (playerId) => {
    try {
      if (!user) {
        setError('Please log in to favorite players');
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to favorite players');
        return;
      }

      const response = await axios.post(
        `http://localhost:5000/api/players/${playerId}/favorite`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data) {
        setPlayers(players.map(player => {
          if (player._id === playerId) {
            return { ...player, isFavorite: !player.isFavorite };
          }
          return player;
        }));
        setError(null);
      }
    } catch (error) {
      console.error('Error favoriting player:', error);
      if (error.response?.status === 401) {
        setError('Your session has expired. Please log in again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } else {
        setError(error.response?.data?.message || 'Failed to favorite player');
      }
    }
  };

  const isFavorited = (player) => {
    return player.isFavorite || false;
  };

  const getOverallColor = (overall) => {
    if (overall >= 85) return '#4caf50';
    if (overall >= 75) return '#2196f3';
    if (overall >= 65) return '#ff9800';
    return '#f44336';
  };

  const getTierColor = (tier) => {
    switch(tier) {
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

  const positions = [
    'GK',
    'CB', 'LB', 'RB', 'LWB', 'RWB',
    'CDM', 'CM', 'CAM', 'LM', 'RM',
    'LW', 'RW', 'CF', 'ST'
  ];

  const getFilteredPlayers = () => {
    return players
      .filter(player => {
        const matchesPosition = positionFilter === 'all' || player.positions.includes(positionFilter);
        const matchesSearch = !searchQuery || 
          player.shortName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          player.longName.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesPosition && matchesSearch;
      })
      .sort((a, b) => {
        // Sort by favorite status first
        if (a.isFavorite && !b.isFavorite) return -1;
        if (!a.isFavorite && b.isFavorite) return 1;
        // Then sort by overall rating
        return b.overall - a.overall;
      });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      {/* Header */}
      <Box sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
            Players Database
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Browse and favorite players for your team
          </Typography>
        </Box>
        {!user && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<LoginIcon />}
            onClick={() => navigate('/login')}
          >
            Login to Favorite Players
          </Button>
        )}
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Stats Overview */}
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
              <PlayerIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6">Total Players</Typography>
              <Typography variant="h4" color="primary">
                {players.length}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <TrophyIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h6">Elite Players</Typography>
              <Typography variant="h4" color="success.main">
                {players.filter(p => p.overall >= 85).length}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <SpeedIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h6">Average Rating</Typography>
              <Typography variant="h4" color="warning.main">
                {Math.round(players.reduce((acc, p) => acc + p.overall, 0) / players.length)}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Filters */}
      <Paper 
        elevation={3} 
        sx={{ 
          p: 3, 
          mb: 3,
          background: 'linear-gradient(to right, #ffffff, #f5f5f5)',
          borderRadius: 2
        }}
      >
        <Grid container spacing={3}>
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
      </Paper>

      {/* Players Grid */}
      <Grid container spacing={3}>
        {getFilteredPlayers().map((player) => (
          <Grid item xs={12} sm={6} md={4} key={player._id}>
            <Paper 
              elevation={3}
              sx={{ 
                position: 'relative',
                background: 'linear-gradient(to bottom right, #ffffff, #f5f5f5)',
                borderRadius: 2,
                overflow: 'hidden',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)'
                }
              }}
            >
              <Box 
                sx={{ 
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: getTierColor(player.tier)
                }} 
              />
              <Box sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ flex: 1, pr: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      {player.shortName}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      {player.longName}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Chip
                        label={player.tier.toUpperCase()}
                        size="small"
                        sx={{
                          bgcolor: getTierColor(player.tier),
                          color: player.tier === 'gold' ? 'black' : 'white',
                          fontWeight: 'bold'
                        }}
                      />
                      <Typography variant="body2" color="textSecondary">
                        Min Bid: {formatCurrency(player.minimumBid)}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <IconButton 
                      onClick={() => handleFavorite(player._id)}
                      color={isFavorited(player) ? "error" : "default"}
                      size="small"
                      sx={{ 
                        backgroundColor: 'rgba(255,255,255,0.8)',
                        '&:hover': {
                          backgroundColor: 'rgba(255,255,255,0.9)'
                        }
                      }}
                    >
                      {isFavorited(player) ? <Favorite /> : <FavoriteBorder />}
                    </IconButton>
                    <Avatar
                      sx={{
                        bgcolor: getTierColor(player.tier),
                        width: 56,
                        height: 56,
                        color: player.tier === 'gold' ? 'black' : 'white'
                      }}
                    >
                      {player.overall}
                    </Avatar>
                  </Box>
                </Box>

                {/* Stats Chart */}
                <Box sx={{ height: 200, mb: 2 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart 
                      data={[
                        { name: 'PAC', value: player.pace },
                        { name: 'SHO', value: player.shooting },
                        { name: 'PAS', value: player.passing },
                        { name: 'DRI', value: player.dribbling },
                        { name: 'DEF', value: player.defending },
                        { name: 'PHY', value: player.physical }
                      ]} 
                      margin={{ top: 0, right: 30, bottom: 0, left: 30 }}
                    >
                      <PolarGrid />
                      <PolarAngleAxis dataKey="name" />
                      <Radar
                        name="Stats"
                        dataKey="value"
                        stroke={getTierColor(player.tier)}
                        fill={getTierColor(player.tier)}
                        fillOpacity={0.3}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    Club: {player.club}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Nationality: {player.nationality}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Age: {player.age}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {player.positions.map((position) => (
                    <Chip
                      key={position}
                      label={position}
                      size="small"
                      color={position === player.mainPosition ? "primary" : "default"}
                      sx={{
                        fontWeight: position === player.mainPosition ? 'bold' : 'normal'
                      }}
                    />
                  ))}
                </Box>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default Players;
