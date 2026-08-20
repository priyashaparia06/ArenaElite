const Team = require('../models/Team');

// @desc    Create a new team
// @route   POST /api/teams
// @access  Private (CAPTAIN, ADMIN)
exports.createTeam = async (req, res) => {
  try {
    const { name, sport, logoUrl, district } = req.body;

    // Optional: Prevent captain from creating duplicate team names for the same sport
    const existingTeam = await Team.findOne({
      captainId: req.user.id,
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      sport,
    });

    if (existingTeam) {
      return res.status(400).json({ message: `You already have a team named "${name}" in ${sport}` });
    }

    const team = await Team.create({
      name,
      sport,
      logoUrl: logoUrl || '',
      district: district || req.user.district,
      captainId: req.user.id,
      players: [],
    });

    res.status(201).json({ success: true, team });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create team', error: error.message });
  }
};

// @desc    Get all teams created by the logged-in captain
// @route   GET /api/teams/my-teams
// @access  Private (CAPTAIN, ADMIN)
exports.getMyTeams = async (req, res) => {
  try {
    const teams = await Team.find({ captainId: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, count: teams.length, teams });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch teams', error: error.message });
  }
};

// @desc    Get a single team by ID
// @route   GET /api/teams/:id
// @access  Public (Guest / Authenticated)
exports.getTeamById = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id).populate('captainId', 'name email phone district');
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }
    res.json({ success: true, team });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving team', error: error.message });
  }
};

// @desc    Add a player to a team's roster
// @route   POST /api/teams/:id/players
// @access  Private (CAPTAIN of the team, ADMIN)
exports.addPlayer = async (req, res) => {
  try {
    const { fullName, jerseyNumber, role, studentOrGovtId, photoUrl } = req.body;
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Ownership check (only creator captain or admin can edit)
    if (team.captainId.toString() !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Unauthorized: You can only modify your own team' });
    }

    // Check duplicate jersey number
    const jerseyExists = team.players.some((p) => p.jerseyNumber === Number(jerseyNumber));
    if (jerseyExists) {
      return res.status(400).json({ message: `Jersey number ${jerseyNumber} is already taken in this team` });
    }

    // Check duplicate ID proof
    const idExists = team.players.some((p) => p.studentOrGovtId.toLowerCase() === studentOrGovtId.toLowerCase());
    if (idExists) {
      return res.status(400).json({ message: `Player with ID ${studentOrGovtId} is already on the roster` });
    }

    // Atomic push into players array
    team.players.push({
      fullName,
      jerseyNumber,
      role,
      studentOrGovtId,
      photoUrl: photoUrl || '',
    });

    await team.save();

    res.status(201).json({ success: true, message: 'Player added successfully', team });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add player', error: error.message });
  }
};

// @desc    Remove a player from a team's roster
// @route   DELETE /api/teams/:id/players/:playerId
// @access  Private (CAPTAIN of the team, ADMIN)
exports.removePlayer = async (req, res) => {
  try {
    const { id, playerId } = req.params;
    const team = await Team.findById(id);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    if (team.captainId.toString() !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Unauthorized: You can only modify your own team' });
    }

    // Remove player using sub-document pull
    team.players.pull({ _id: playerId });
    await team.save();

    res.json({ success: true, message: 'Player removed successfully', team });
  } catch (error) {
    res.status(500).json({ message: 'Failed to remove player', error: error.message });
  }
};

// @desc    Delete a team
// @route   DELETE /api/teams/:id
// @access  Private (CAPTAIN of the team, ADMIN)
exports.deleteTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    if (team.captainId.toString() !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Unauthorized to delete this team' });
    }

    await team.deleteOne();
    res.json({ success: true, message: 'Team deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete team', error: error.message });
  }
};