const Tournament = require('../models/Tournament');
const Team = require('../models/Team');
const SportCategory = require('../models/SportCategory');
const User = require('../models/User');

// ================= ORGANIZER ENDPOINTS ================= //

// @desc Create a new tournament
// @route POST /api/tournaments
exports.createTournament = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'ORGANIZER' || user.approvalStatus !== 'APPROVED') {
      return res.status(403).json({
        message: 'Only approved organizers can create tournaments. Please check your account status.',
      });
    }

    const {
      title,
      description,
      sportCategory,
      district,
      venueId,
      venueName,
      startDate,
      endDate,
      registrationDeadline,
      maxTeams,
      format,
      rules,
      bannerUrl,
    } = req.body;

    if (new Date(registrationDeadline) > new Date(startDate)) {
      return res.status(400).json({ message: 'Registration deadline cannot be after the tournament start date' });
    }

    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({ message: 'Start date cannot be after end date' });
    }

    const tournament = await Tournament.create({
      title,
      description,
      organizerId: req.user.id,
      sportCategory: sportCategory.toUpperCase(),
      district,
      venueId: venueId || null,
      venueName,
      startDate,
      endDate,
      registrationDeadline,
      maxTeams: Number(maxTeams) || 16,
      format: format || 'KNOCKOUT',
      rules: rules || '',
      bannerUrl: bannerUrl || '',
      status: 'REGISTRATION_OPEN',
      registeredTeams: [],
    });

    res.status(201).json({ message: 'Tournament created successfully', tournament });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create tournament', error: err.message });
  }
};

// @desc Get tournaments organized by logged in organizer
// @route GET /api/tournaments/organizer/my-tournaments
exports.getMyOrganizedTournaments = async (req, res) => {
  try {
    const tournaments = await Tournament.find({ organizerId: req.user.id })
      .populate('registeredTeams.teamId', 'name sport logoUrl district players')
      .populate('registeredTeams.appliedBy', 'name email phone')
      .sort({ createdAt: -1 });

    res.json(tournaments);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch your tournaments', error: err.message });
  }
};

// @desc Get registrations for a tournament (with full team rosters)
// @route GET /api/tournaments/:id/registrations
exports.getTournamentRegistrations = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id)
      .populate({
        path: 'registeredTeams.teamId',
        populate: { path: 'captainId', select: 'name email phone district' },
      })
      .populate('registeredTeams.appliedBy', 'name email phone');

    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    // Only allow the organizer of this tournament or an Admin to view full registrations
    if (tournament.organizerId.toString() !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized to view registrations for this tournament' });
    }

    res.json({
      tournamentId: tournament._id,
      title: tournament.title,
      sportCategory: tournament.sportCategory,
      maxTeams: tournament.maxTeams,
      approvedCount: tournament.registeredTeams.filter((r) => r.status === 'APPROVED').length,
      registeredTeams: tournament.registeredTeams,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch registrations', error: err.message });
  }
};

// @desc Approve or Reject a participating team registration
// @route PUT /api/tournaments/:id/registrations/:teamId
exports.updateTeamRegistrationStatus = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    if (!['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be APPROVED, REJECTED, or PENDING' });
    }

    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    if (tournament.organizerId.toString() !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized to manage this tournament' });
    }

    const registration = tournament.registeredTeams.find(
      (r) => r.teamId.toString() === req.params.teamId
    );

    if (!registration) {
      return res.status(404).json({ message: 'Team registration not found in this tournament' });
    }

    // If approving, verify slot capacity
    if (status === 'APPROVED' && registration.status !== 'APPROVED') {
      const currentApprovedCount = tournament.registeredTeams.filter((r) => r.status === 'APPROVED').length;
      if (currentApprovedCount >= tournament.maxTeams) {
        return res.status(400).json({
          message: `Tournament team limit of ${tournament.maxTeams} teams has already been reached`,
        });
      }
    }

    registration.status = status;
    if (rejectionReason !== undefined) {
      registration.rejectionReason = rejectionReason;
    }

    await tournament.save();

    res.json({
      message: `Team registration ${status.toLowerCase()} successfully`,
      tournament,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update registration status', error: err.message });
  }
};

// ================= TEAM CAPTAIN ENDPOINTS ================= //

// @desc Apply / Register a team squad for a tournament
// @route POST /api/tournaments/:id/apply
exports.applyForTournament = async (req, res) => {
  try {
    const { teamId, notes } = req.body;
    if (!teamId) {
      return res.status(400).json({ message: 'Team selection is required' });
    }

    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    if (tournament.status !== 'REGISTRATION_OPEN') {
      return res.status(400).json({ message: `Tournament registration is currently ${tournament.status}` });
    }

    if (new Date() > new Date(tournament.registrationDeadline)) {
      return res.status(400).json({ message: 'Tournament registration deadline has passed' });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Selected team not found' });
    }

    // Verify captain ownership
    if (team.captainId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only register teams you captain' });
    }

    // Verify sport category matches
    if (team.sport.toUpperCase() !== tournament.sportCategory.toUpperCase()) {
      return res.status(400).json({
        message: `Sport category mismatch. Team is for ${team.sport} but tournament is for ${tournament.sportCategory}`,
      });
    }

    // Verify minimum squad requirements
    const sportCat = await SportCategory.findOne({ code: tournament.sportCategory.toUpperCase() });
    const minRequired = sportCat ? sportCat.minSquadSize : 1;
    if (team.players.length < minRequired) {
      return res.status(400).json({
        message: `Your team must have at least ${minRequired} players registered to enter this tournament (Current: ${team.players.length})`,
      });
    }

    // Check if team is already applied
    const alreadyApplied = tournament.registeredTeams.some(
      (r) => r.teamId.toString() === team._id.toString()
    );

    if (alreadyApplied) {
      return res.status(400).json({ message: 'This team has already registered for this tournament' });
    }

    // Register team
    tournament.registeredTeams.push({
      teamId: team._id,
      appliedBy: req.user.id,
      status: 'PENDING',
      appliedAt: new Date(),
      rejectionReason: '',
    });

    await tournament.save();

    res.status(201).json({
      message: 'Tournament registration submitted successfully! Awaiting Organizer review.',
      tournamentTitle: tournament.title,
      status: 'PENDING',
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to apply for tournament', error: err.message });
  }
};

// @desc Get all tournament applications for the logged-in captain
// @route GET /api/tournaments/captain/my-applications
exports.getMyApplications = async (req, res) => {
  try {
    const tournaments = await Tournament.find({
      'registeredTeams.appliedBy': req.user.id,
    })
      .populate('organizerId', 'name email phone organizationName')
      .populate('registeredTeams.teamId', 'name sport district logoUrl players')
      .sort({ createdAt: -1 });

    const applications = [];

    tournaments.forEach((t) => {
      const myRegs = t.registeredTeams.filter(
        (r) => r.appliedBy.toString() === req.user.id
      );

      myRegs.forEach((r) => {
        applications.push({
          tournamentId: t._id,
          tournamentTitle: t.title,
          sportCategory: t.sportCategory,
          district: t.district,
          venueName: t.venueName,
          startDate: t.startDate,
          endDate: t.endDate,
          organizer: t.organizerId,
          team: r.teamId,
          status: r.status,
          appliedAt: r.appliedAt,
          rejectionReason: r.rejectionReason,
        });
      });
    });

    res.json(applications);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch your applications', error: err.message });
  }
};

// ================= PUBLIC / GENERAL ENDPOINTS ================= //

// @desc Get all open or upcoming tournaments
// @route GET /api/tournaments
exports.getTournaments = async (req, res) => {
  try {
    const { sport, district, status } = req.query;
    const filter = {};

    if (sport) filter.sportCategory = sport.toUpperCase();
    if (district) filter.district = new RegExp(district, 'i');
    if (status) {
      filter.status = status;
    }

    const tournaments = await Tournament.find(filter)
      .populate('organizerId', 'name organizationName')
      .populate('registeredTeams.teamId', 'name logoUrl')
      .sort({ startDate: 1 });

    // Format response to include registered / approved counts
    const data = tournaments.map((t) => {
      const approvedTeams = t.registeredTeams.filter((r) => r.status === 'APPROVED');
      return {
        _id: t._id,
        title: t.title,
        description: t.description,
        sportCategory: t.sportCategory,
        district: t.district,
        venueName: t.venueName,
        startDate: t.startDate,
        endDate: t.endDate,
        registrationDeadline: t.registrationDeadline,
        maxTeams: t.maxTeams,
        format: t.format,
        rules: t.rules,
        bannerUrl: t.bannerUrl,
        status: t.status,
        organizer: t.organizerId,
        approvedTeamsCount: approvedTeams.length,
        totalRegisteredCount: t.registeredTeams.length,
        isRegistrationOpen:
          t.status === 'REGISTRATION_OPEN' &&
          new Date() <= new Date(t.registrationDeadline) &&
          approvedTeams.length < t.maxTeams,
      };
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch tournaments', error: err.message });
  }
};

// @desc Get single tournament details
// @route GET /api/tournaments/:id
exports.getTournamentById = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id)
      .populate('organizerId', 'name email phone organizationName')
      .populate('registeredTeams.teamId', 'name sport district logoUrl players');

    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    res.json(tournament);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch tournament', error: err.message });
  }
};
