const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const {
  generateTournamentMatches,
  getTournamentMatches,
  assignScorerToMatch,
  getMyAssignedMatches,
} = require('../controllers/matchController');

// All match routes require authentication
router.use(protect);

// Scorer specific
router.get('/scorer/my-matches', authorizeRoles('SCORER', 'ADMIN'), getMyAssignedMatches);

// Tournament matches
router.get('/tournament/:tournamentId', getTournamentMatches);
router.post('/tournament/:tournamentId/generate', authorizeRoles('ORGANIZER', 'ADMIN'), generateTournamentMatches);

// Scorer assignment
router.put('/:id/assign-scorer', authorizeRoles('ORGANIZER', 'ADMIN'), assignScorerToMatch);

module.exports = router;
