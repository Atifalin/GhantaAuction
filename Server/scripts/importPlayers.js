const fs = require('fs');
const csv = require('csv-parser');
const mongoose = require('mongoose');
const Player = require('../models/Player');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/ghantaAuction', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.error('MongoDB Connection Error:', err));

// Track top players by position with position limits
const PLAYERS_PER_POSITION = {
  'GK': 25,    // Goalkeepers
  'CB': 40,    // Center backs
  'LB': 25,    // Left backs
  'RB': 25,    // Right backs
  'LWB': 15,   // Left wing backs
  'RWB': 15,   // Right wing backs
  'CDM': 25,   // Defensive midfielders
  'CM': 35,    // Central midfielders
  'CAM': 25,   // Attacking midfielders
  'LM': 20,    // Left midfielders
  'RM': 20,    // Right midfielders
  'LW': 25,    // Left wingers
  'RW': 25,    // Right wingers
  'CF': 20,    // Center forwards
  'ST': 35     // Strikers
};

const topPlayersByPosition = {};
const positions = Object.keys(PLAYERS_PER_POSITION);
positions.forEach(pos => {
  topPlayersByPosition[pos] = [];
});

let totalPlayers = 0;
let skippedPlayers = 0;

// Process CSV file
fs.createReadStream('../players.csv')
  .pipe(csv())
  .on('data', (row) => {
    try {
      // Check if overall rating meets minimum requirement
      const overall = parseInt(row.overall) || 0;
      if (overall < 65) {
        skippedPlayers++;
        return;
      }

      // Parse positions and clean them
      const positions = (row.player_positions || '').split(',').map(pos => pos.trim()).filter(pos => pos);
      if (!positions.length) {
        skippedPlayers++;
        return;
      }

      // Filter to only valid positions
      const validPositions = positions.filter(pos => PLAYERS_PER_POSITION[pos] !== undefined);
      if (!validPositions.length) {
        skippedPlayers++;
        return;
      }

      // Create player object with all FIFA stats
      const player = {
        playerId: parseInt(row.player_id) || 0,
        shortName: row.short_name || 'Unknown',
        longName: row.long_name || row.short_name || 'Unknown',
        positions: validPositions,
        mainPosition: validPositions[0],
        overall: overall,
        potential: parseInt(row.potential) || overall,
        value: parseInt(row.value_eur) || 0,
        wage: parseInt(row.wage_eur) || 0,
        age: parseInt(row.age) || 0,
        height: parseInt(row.height_cm) || 0,
        weight: parseInt(row.weight_kg) || 0,
        nationality: row.nationality_name || 'Unknown',
        club: row.club_name || 'Free Agent',
        league: row.league_name || 'Unknown League',
        preferredFoot: row.preferred_foot || 'Right',
        weakFoot: parseInt(row.weak_foot) || 1,
        skillMoves: parseInt(row.skill_moves) || 1,
        workRate: row.work_rate || 'Medium/Medium',
        bodyType: row.body_type || 'Normal',
        realFace: row.real_face === 'Yes',
        releaseClause: parseInt(row.release_clause_eur) || 0,
        
        // Player stats
        pace: parseInt(row.pace) || 0,
        shooting: parseInt(row.shooting) || 0,
        passing: parseInt(row.passing) || 0,
        dribbling: parseInt(row.dribbling) || 0,
        defending: parseInt(row.defending) || 0,
        physical: parseInt(row.physic) || 0,

        // Detailed stats
        stats: {
          attacking: {
            crossing: parseInt(row.attacking_crossing) || 0,
            finishing: parseInt(row.attacking_finishing) || 0,
            headingAccuracy: parseInt(row.attacking_heading_accuracy) || 0,
            shortPassing: parseInt(row.attacking_short_passing) || 0,
            volleys: parseInt(row.attacking_volleys) || 0
          },
          skill: {
            dribbling: parseInt(row.skill_dribbling) || 0,
            curve: parseInt(row.skill_curve) || 0,
            fkAccuracy: parseInt(row.skill_fk_accuracy) || 0,
            longPassing: parseInt(row.skill_long_passing) || 0,
            ballControl: parseInt(row.skill_ball_control) || 0
          },
          movement: {
            acceleration: parseInt(row.movement_acceleration) || 0,
            sprintSpeed: parseInt(row.movement_sprint_speed) || 0,
            agility: parseInt(row.movement_agility) || 0,
            reactions: parseInt(row.movement_reactions) || 0,
            balance: parseInt(row.movement_balance) || 0
          },
          power: {
            shotPower: parseInt(row.power_shot_power) || 0,
            jumping: parseInt(row.power_jumping) || 0,
            stamina: parseInt(row.power_stamina) || 0,
            strength: parseInt(row.power_strength) || 0,
            longShots: parseInt(row.power_long_shots) || 0
          },
          mentality: {
            aggression: parseInt(row.mentality_aggression) || 0,
            interceptions: parseInt(row.mentality_interceptions) || 0,
            positioning: parseInt(row.mentality_positioning) || 0,
            vision: parseInt(row.mentality_vision) || 0,
            penalties: parseInt(row.mentality_penalties) || 0,
            composure: parseInt(row.mentality_composure) || 0
          },
          defending: {
            marking: parseInt(row.defending_marking_awareness) || 0,
            standingTackle: parseInt(row.defending_standing_tackle) || 0,
            slidingTackle: parseInt(row.defending_sliding_tackle) || 0
          },
          goalkeeping: {
            diving: parseInt(row.goalkeeping_diving) || 0,
            handling: parseInt(row.goalkeeping_handling) || 0,
            kicking: parseInt(row.goalkeeping_kicking) || 0,
            positioning: parseInt(row.goalkeeping_positioning) || 0,
            reflexes: parseInt(row.goalkeeping_reflexes) || 0
          }
        },

        // Player traits and tags
        traits: row.player_traits ? row.player_traits.split(',').map(t => t.trim()) : [],
        tags: row.player_tags ? row.player_tags.split(',').map(t => t.trim()) : []
      };

      // Add player to respective position arrays
      validPositions.forEach(pos => {
        if (topPlayersByPosition[pos]) {
          topPlayersByPosition[pos].push(player);
          // Sort by overall rating and keep only top N players per position
          topPlayersByPosition[pos].sort((a, b) => b.overall - a.overall);
          if (topPlayersByPosition[pos].length > PLAYERS_PER_POSITION[pos]) {
            topPlayersByPosition[pos].pop();
          }
        }
      });

    } catch (err) {
      console.error('Error processing player:', err);
    }
  })
  .on('end', async () => {
    try {
      // Clear existing players
      await Player.deleteMany({});
      console.log('Cleared existing players');

      // Insert top players for each position
      const allPlayers = new Map();
      for (const pos of positions) {
        console.log(`Processing ${pos} players...`);
        for (const player of topPlayersByPosition[pos]) {
          allPlayers.set(player.playerId, player);
        }
      }

      const uniquePlayers = Array.from(allPlayers.values());
      await Player.insertMany(uniquePlayers);
      
      console.log('\nImport completed successfully');
      console.log(`Total unique players imported: ${uniquePlayers.length}`);
      
      // Log player counts by position
      console.log('\nPlayers by position:');
      for (const pos of positions) {
        const count = topPlayersByPosition[pos].length;
        console.log(`${pos}: ${count} players (Target: ${PLAYERS_PER_POSITION[pos]})`);
        totalPlayers += count;
      }

      console.log('\nTotal player appearances:', totalPlayers);
      console.log('(Note: Players can appear in multiple positions)');
      console.log(`Skipped players: ${skippedPlayers}`);

      mongoose.connection.close();
    } catch (error) {
      console.error('Error saving players:', error);
      mongoose.connection.close();
    }
  });
