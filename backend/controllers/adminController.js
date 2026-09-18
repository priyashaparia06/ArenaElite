const User = require('../models/User');
const SportCategory = require('../models/SportCategory');
const Venue = require('../models/Venue');
const Tournament = require('../models/Tournament');
const Team = require('../models/Team');

// ================= USER & ORGANIZER MANAGEMENT ================= //

// @desc Get all users with optional filtering
// @route GET /api/admin/users
exports.getUsers = async (req, res) => {
  try {
    const { role, approvalStatus, district, search } = req.query;
    const filter = {};

    if (role) filter.role = role;
    if (approvalStatus) filter.approvalStatus = approvalStatus;
    if (district) filter.district = new RegExp(district, 'i');
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { organizationName: new RegExp(search, 'i') },
      ];
    }

    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
    res.json({ count: users.length, users });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users', error: err.message });
  }
};

// @desc Approve, Reject or Change Organizer Status
// @route PUT /api/admin/organizers/:id/status
exports.updateOrganizerStatus = async (req, res) => {
  try {
    const { approvalStatus, isActive } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'ORGANIZER') {
      return res.status(400).json({ message: 'Specified user is not an organizer' });
    }

    if (approvalStatus) {
      user.approvalStatus = approvalStatus;
    }
    if (typeof isActive === 'boolean') {
      user.isActive = isActive;
    }

    await user.save();

    res.json({
      message: `Organizer status updated to ${user.approvalStatus}`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        organizationName: user.organizationName,
        approvalStatus: user.approvalStatus,
        isActive: user.isActive,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update organizer status', error: err.message });
  }
};

// @desc Toggle User Active State
// @route PUT /api/admin/users/:id/toggle-active
exports.toggleUserActive = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      message: `User is now ${user.isActive ? 'active' : 'deactivated'}`,
      userId: user._id,
      isActive: user.isActive,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to toggle user status', error: err.message });
  }
};

// ================= SPORTS CATEGORIES CRUD ================= //

// @desc Get all sport categories
// @route GET /api/admin/sports
exports.getSportCategories = async (req, res) => {
  try {
    const sports = await SportCategory.find().sort({ name: 1 });
    res.json(sports);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch sports', error: err.message });
  }
};

// @desc Create sport category with rules
// @route POST /api/admin/sports
exports.createSportCategory = async (req, res) => {
  try {
    const {
      name,
      code,
      icon,
      playersPerTeam,
      minSquadSize,
      maxSquadSize,
      formatType,
      defaultMatchDuration,
      rulesDescription,
    } = req.body;

    const existing = await SportCategory.findOne({
      $or: [{ code: code.toUpperCase() }, { name: new RegExp(`^${name}$`, 'i') }],
    });

    if (existing) {
      return res.status(400).json({ message: 'Sport category with this name or code already exists' });
    }

    const sport = await SportCategory.create({
      name,
      code: code.toUpperCase(),
      icon: icon || '🏆',
      playersPerTeam: Number(playersPerTeam),
      minSquadSize: Number(minSquadSize || playersPerTeam),
      maxSquadSize: Number(maxSquadSize || 25),
      formatType: formatType || 'TIME_BASED',
      defaultMatchDuration: Number(defaultMatchDuration || 60),
      rulesDescription: rulesDescription || '',
    });

    res.status(201).json({ message: 'Sport category created', sport });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create sport category', error: err.message });
  }
};

// @desc Update sport category & rules
// @route PUT /api/admin/sports/:id
exports.updateSportCategory = async (req, res) => {
  try {
    const sport = await SportCategory.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!sport) {
      return res.status(404).json({ message: 'Sport category not found' });
    }

    res.json({ message: 'Sport category updated', sport });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update sport category', error: err.message });
  }
};

// @desc Delete sport category
// @route DELETE /api/admin/sports/:id
exports.deleteSportCategory = async (req, res) => {
  try {
    const sport = await SportCategory.findByIdAndDelete(req.params.id);
    if (!sport) {
      return res.status(404).json({ message: 'Sport category not found' });
    }
    res.json({ message: 'Sport category deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete sport category', error: err.message });
  }
};

// ================= VENUE MANAGEMENT CRUD ================= //

// @desc Get venues
// @route GET /api/admin/venues
exports.getVenues = async (req, res) => {
  try {
    const { district, sport } = req.query;
    const filter = {};

    if (district) filter.district = new RegExp(district, 'i');
    if (sport) filter.supportedSports = sport.toUpperCase();

    const venues = await Venue.find(filter).sort({ district: 1, name: 1 });
    res.json(venues);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch venues', error: err.message });
  }
};

// @desc Create venue
// @route POST /api/admin/venues
exports.createVenue = async (req, res) => {
  try {
    const { name, district, address, supportedSports, contactPerson, contactPhone, facilities } = req.body;

    const venue = await Venue.create({
      name,
      district,
      address,
      supportedSports: Array.isArray(supportedSports)
        ? supportedSports.map((s) => s.toUpperCase())
        : [supportedSports.toUpperCase()],
      contactPerson,
      contactPhone,
      facilities: Array.isArray(facilities)
        ? facilities
        : typeof facilities === 'string'
        ? facilities.split(',').map((f) => f.trim())
        : [],
    });

    res.status(201).json({ message: 'Venue created successfully', venue });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create venue', error: err.message });
  }
};

// @desc Update venue
// @route PUT /api/admin/venues/:id
exports.updateVenue = async (req, res) => {
  try {
    if (req.body.supportedSports && Array.isArray(req.body.supportedSports)) {
      req.body.supportedSports = req.body.supportedSports.map((s) => s.toUpperCase());
    }
    if (req.body.facilities && typeof req.body.facilities === 'string') {
      req.body.facilities = req.body.facilities.split(',').map((f) => f.trim());
    }

    const venue = await Venue.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!venue) {
      return res.status(404).json({ message: 'Venue not found' });
    }

    res.json({ message: 'Venue updated successfully', venue });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update venue', error: err.message });
  }
};

// @desc Delete venue
// @route DELETE /api/admin/venues/:id
exports.deleteVenue = async (req, res) => {
  try {
    const venue = await Venue.findByIdAndDelete(req.params.id);
    if (!venue) {
      return res.status(404).json({ message: 'Venue not found' });
    }
    res.json({ message: 'Venue deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete venue', error: err.message });
  }
};

// ================= SYSTEM STATS ================= //

// @desc Get platform-wide analytics
// @route GET /api/admin/stats
exports.getPlatformStats = async (req, res) => {
  try {
    const now = new Date();
    // Auto-update status for tournaments whose deadline has passed
    await Tournament.updateMany(
      {
        status: 'REGISTRATION_OPEN',
        registrationDeadline: { $lt: now },
      },
      { $set: { status: 'REGISTRATION_CLOSED' } }
    );

    const totalUsers = await User.countDocuments();
    const organizersCount = await User.countDocuments({ role: 'ORGANIZER' });
    const pendingOrganizers = await User.countDocuments({ role: 'ORGANIZER', approvalStatus: 'PENDING' });
    const captainsCount = await User.countDocuments({ role: 'CAPTAIN' });
    const scorersCount = await User.countDocuments({ role: 'SCORER' });
    const totalTournaments = await Tournament.countDocuments();
    const activeTournaments = await Tournament.countDocuments({ status: { $in: ['REGISTRATION_OPEN', 'ONGOING'] } });
    const totalTeams = await Team.countDocuments();
    const totalVenues = await Venue.countDocuments();
    const totalSports = await SportCategory.countDocuments();

    res.json({
      totalUsers,
      organizers: {
        total: organizersCount,
        pending: pendingOrganizers,
        approved: organizersCount - pendingOrganizers,
      },
      captainsCount,
      scorersCount,
      tournaments: {
        total: totalTournaments,
        active: activeTournaments,
      },
      totalTeams,
      totalVenues,
      totalSports,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch platform stats', error: err.message });
  }
};
