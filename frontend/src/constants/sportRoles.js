// Predefined player roles mapped to each sport category
export const SPORT_ROLES = {
  CRICKET: [
    'Batsman',
    'Bowler',
    'All-Rounder',
    'Wicket-Keeper'
  ],
  FOOTBALL: [
    'Goalkeeper',
    'Center-Back (Defender)',
    'Full-Back / Wing-Back',
    'Midfielder',
    'Winger',
    'Forward / Striker'
  ],
  BASKETBALL: [
    'Point Guard (PG)',
    'Shooting Guard (SG)',
    'Small Forward (SF)',
    'Power Forward (PF)',
    'Center (C)'
  ],
  BADMINTON: [
    'Singles Specialist',
    'Doubles - Front Court Attacker',
    'Doubles - Back Court Smasher',
    'All-Rounder'
  ],
  KABADDI: [
    'Main Raider',
    'Secondary Raider',
    'Right Corner Defender',
    'Left Corner Defender',
    'Right Cover Defender',
    'Left Cover Defender',
    'All-Rounder'
  ],
  VOLLEYBALL: [
    'Setter',
    'Outside Hitter',
    'Middle Blocker',
    'Opposite Hitter',
    'Libero (Defensive Specialist)'
  ],
  DEFAULT: [
    'Captain',
    'Key Player',
    'Attacker / Offense',
    'Defender',
    'All-Rounder',
    'Substitute'
  ]
};

export const getRolesForSport = (sportCode) => {
  if (!sportCode) return SPORT_ROLES.DEFAULT;
  const upper = sportCode.toUpperCase();
  return SPORT_ROLES[upper] || SPORT_ROLES.DEFAULT;
};
