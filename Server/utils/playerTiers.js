// Player tier definitions based on overall rating
const PLAYER_TIERS = {
  GOLD: { min: 85, name: 'gold', minimumBid: 50000 },
  SILVER: { min: 75, name: 'silver', minimumBid: 30000 },
  BRONZE: { min: 65, name: 'bronze', minimumBid: 10000 },
  EXTRA: { min: 0, name: 'extra', minimumBid: 0 }
};

function getPlayerTierInfo(overall) {
  if (overall >= PLAYER_TIERS.GOLD.min) return PLAYER_TIERS.GOLD;
  if (overall >= PLAYER_TIERS.SILVER.min) return PLAYER_TIERS.SILVER;
  if (overall >= PLAYER_TIERS.BRONZE.min) return PLAYER_TIERS.BRONZE;
  return PLAYER_TIERS.EXTRA;
}

module.exports = {
  PLAYER_TIERS,
  getPlayerTierInfo
};
