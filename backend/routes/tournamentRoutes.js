const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const {
  createTournament,
  getMyOrganizedTournaments,
  getTournamentRegistrations,
  updateTeamRegistrationStatus,
  applyForTournament,
  getMyApplications,
  getTournaments,
  getTournamentById,
} = require('../controllers/tournamentController');

// Public listing
router.get('/', getTournaments);
router.get('/:id', getTournamentById);

// Protected routes
router.use(protect);

// Team Captain actions
router.post('/:id/apply', authorizeRoles('CAPTAIN'), applyForTournament);
router.get('/captain/my-applications', authorizeRoles('CAPTAIN'), getMyApplications);

// Organizer actions
router.post('/', authorizeRoles('ORGANIZER'), createTournament);
router.get('/organizer/my-tournaments', authorizeRoles('ORGANIZER'), getMyOrganizedTournaments);
router.get('/:id/registrations', authorizeRoles('ORGANIZER', 'ADMIN'), getTournamentRegistrations);
router.put('/:id/registrations/:teamId', authorizeRoles('ORGANIZER', 'ADMIN'), updateTeamRegistrationStatus);

module.exports = router;
