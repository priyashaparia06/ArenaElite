const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const {
  getUsers,
  updateOrganizerStatus,
  toggleUserActive,
  getSportCategories,
  createSportCategory,
  updateSportCategory,
  deleteSportCategory,
  getVenues,
  createVenue,
  updateVenue,
  deleteVenue,
  getPlatformStats,
} = require('../controllers/adminController');

// All admin routes require authentication
router.use(protect);

// Allow any authenticated user to view sports categories & venues (e.g. for dropdowns)
router.get('/sports', getSportCategories);
router.get('/venues', getVenues);

// Restrict all modification and management endpoints to ADMIN only
router.use(authorizeRoles('ADMIN'));

// Platform Analytics
router.get('/stats', getPlatformStats);

// User & Organizer Management
router.get('/users', getUsers);
router.put('/organizers/:id/status', updateOrganizerStatus);
router.put('/users/:id/toggle-active', toggleUserActive);

// Sports Category Configurator (Admin CRUD)
router.post('/sports', createSportCategory);
router.put('/sports/:id', updateSportCategory);
router.delete('/sports/:id', deleteSportCategory);

// Ground & Venue Management (Admin CRUD)
router.post('/venues', createVenue);
router.put('/venues/:id', updateVenue);
router.delete('/venues/:id', deleteVenue);

module.exports = router;
