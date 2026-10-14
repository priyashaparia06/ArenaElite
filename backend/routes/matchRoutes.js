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
} = require('../controllers/matchController');

// Public route: Any visitor or captain can view tournament fixtures and visual bracket
router.get('/tournament/:tournamentId', getTournamentMatches);

// Protected routes
router.use(protect);

// Field Scorer portal
router.get('/scorer/my-matches', authorizeRoles('SCORER', 'ADMIN'), getMyAssignedMatches);

// Tournament Bracket & Fixture generation
router.get('/tournament/:tournamentId/team-stats', authorizeRoles('ORGANIZER', 'ADMIN'), getTournamentTeamStats);
router.post('/tournament/:tournamentId/generate', authorizeRoles('ORGANIZER', 'ADMIN'), generateTournamentMatches);

// Scheduling & Scorer Delegation
router.put('/:id/schedule', authorizeRoles('ORGANIZER', 'ADMIN'), scheduleMatch);
router.put('/:id/assign-scorer', authorizeRoles('ORGANIZER', 'ADMIN'), assignScorerToMatch);

module.exports = router;
