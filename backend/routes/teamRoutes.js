const express = require('express');
const router = express.Router();
const {
  createTeam,
  getMyTeams,
  getTeamById,
  addPlayer,
  removePlayer,
  deleteTeam,
} = require('../controllers/teamController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// 1. All protected routes require login
router.use(protect);

// 2. Specific named routes (MUST come before /:id)
router.route('/')
  .post(authorizeRoles('CAPTAIN', 'ADMIN'), createTeam);

router.route('/my-teams')
  .get(authorizeRoles('CAPTAIN', 'ADMIN'), getMyTeams);

// 3. Parameterized /:id routes (MUST come after specific routes)
router.route('/:id')
  .get(getTeamById)
  .delete(authorizeRoles('CAPTAIN', 'ADMIN'), deleteTeam);

router.route('/:id/players')
  .post(authorizeRoles('CAPTAIN', 'ADMIN'), addPlayer);

router.route('/:id/players/:playerId')
  .delete(authorizeRoles('CAPTAIN', 'ADMIN'), removePlayer);

module.exports = router;