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
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import axios from 'axios';

const Players = () => {
  const [players, setPlayers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/players');
      setPlayers(response.data);
    } catch (error) {
      console.error('Error fetching players:', error);
    }
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case 'gold':
        return '#FFD700';
      case 'silver':
        return '#C0C0C0';
      case 'bronze':
        return '#CD7F32';
      default:
        return '#808080';
    }
  };

  const filteredPlayers = players.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || player.tier === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <Container maxWidth="lg">
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
              <InputLabel>Filter by Tier</InputLabel>
              <Select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                label="Filter by Tier"
              >
                <MenuItem value="all">All Tiers</MenuItem>
                <MenuItem value="gold">Gold</MenuItem>
                <MenuItem value="silver">Silver</MenuItem>
                <MenuItem value="bronze">Bronze</MenuItem>
                <MenuItem value="extra">Extra</MenuItem>
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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h6" component="div">
                    {player.name}
                  </Typography>
                  <Chip
                    label={player.tier.toUpperCase()}
                    sx={{
                      backgroundColor: getTierColor(player.tier),
                      color: player.tier === 'gold' ? 'black' : 'white',
                    }}
                  />
                </Box>
                <Typography color="text.secondary" gutterBottom>
                  {player.position}
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Typography variant="body2">Overall: {player.overall}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2">Base Price: ${player.basePrice}</Typography>
                    </Grid>
                    {Object.entries(player.stats).map(([stat, value]) => (
                      <Grid item xs={6} key={stat}>
                        <Typography variant="body2">
                          {stat.charAt(0).toUpperCase() + stat.slice(1)}: {value}
                        </Typography>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default Players;
