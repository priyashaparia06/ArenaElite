const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const {
  generateTournamentMatches,
  getTournamentMatches,
  getTournamentTeamStats,
  scheduleMatch,
  assignScorerToMatch,
  getMyAssignedMatches,
  updateMatchScore,
  getPublicMatchFeed,
  liveScoreStream,
} = require('../controllers/matchController');

// Public routes: Any visitor or viewer can view live match feeds and tournament fixtures
router.get('/public/feed', getPublicMatchFeed);
router.get('/live-stream', liveScoreStream);
router.get('/tournament/:tournamentId', getTournamentMatches);

// Protected routes
router.use(protect);

// Field Scorer portal
router.get('/scorer/my-matches', authorizeRoles('SCORER', 'ADMIN'), getMyAssignedMatches);

// Tournament Bracket & Fixture generation
router.get('/tournament/:tournamentId/team-stats', authorizeRoles('ORGANIZER', 'ADMIN'), getTournamentTeamStats);
router.post('/tournament/:tournamentId/generate', authorizeRoles('ORGANIZER', 'ADMIN'), generateTournamentMatches);

// Live Scoring & Match Result Updating (Field Scorer, Organizer, Admin)
router.put('/:id/score', authorizeRoles('SCORER', 'ORGANIZER', 'ADMIN'), updateMatchScore);

// Scheduling & Scorer Delegation
router.put('/:id/schedule', authorizeRoles('ORGANIZER', 'ADMIN'), scheduleMatch);
router.put('/:id/assign-scorer', authorizeRoles('ORGANIZER', 'ADMIN'), assignScorerToMatch);

module.exports = router;
