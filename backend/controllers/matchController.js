const Match = require('../models/Match');
const Tournament = require('../models/Tournament');
const Team = require('../models/Team');
const User = require('../models/User');

// @desc Generate knockout match fixtures for approved teams in a tournament
// @route POST /api/matches/tournament/:tournamentId/generate
exports.generateTournamentMatches = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const tournament = await Tournament.findById(tournamentId);

    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    // Verify authorization
    if (tournament.organizerId.toString() !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized to manage fixtures for this tournament' });
    }

    // Check existing matches
    const existingMatches = await Match.find({ tournamentId })
      .populate('teamA', 'name logoUrl players')
      .populate('teamB', 'name logoUrl players')
      .populate('assignedScorer', 'name email phone');

    if (existingMatches.length > 0 && !req.query.force) {
      return res.json({
        message: 'Matches already generated for this tournament',
        matches: existingMatches,
      });
    }

    // Get approved teams
    const approvedRegistrations = tournament.registeredTeams.filter((r) => r.status === 'APPROVED');
    if (approvedRegistrations.length < 2) {
      return res.status(400).json({
        message: 'At least 2 approved teams are required to generate match fixtures. Currently approved: ' + approvedRegistrations.length,
      });
    }

    // If force regenerate, delete previous scheduled matches
    if (existingMatches.length > 0 && req.query.force) {
      await Match.deleteMany({ tournamentId, status: 'SCHEDULED' });
    }

    const teamIds = approvedRegistrations.map((r) => r.teamId);

    // Determine round title based on count
    let roundTitle = 'Round 1';
    if (teamIds.length === 2) roundTitle = 'Final';
    else if (teamIds.length <= 4) roundTitle = 'Semi-Final';
    else if (teamIds.length <= 8) roundTitle = 'Quarter-Final';

    const matchesToCreate = [];
    const baseDate = new Date(tournament.startDate);

    for (let i = 0; i < teamIds.length; i += 2) {
      if (i + 1 < teamIds.length) {
        const matchNum = Math.floor(i / 2) + 1;
        // Schedule each match with a 2-hour offset
        const matchDate = new Date(baseDate);
        matchDate.setHours(9 + (matchNum - 1) * 2, 0, 0, 0);

        matchesToCreate.push({
          tournamentId,
          round: roundTitle,
          matchNumber: matchNum,
          teamA: teamIds[i],
          teamB: teamIds[i + 1],
          assignedScorer: null,
          scheduledDate: matchDate,
          venue: tournament.venueName || tournament.district,
          sportCategory: tournament.sportCategory,
          status: 'SCHEDULED',
        });
      }
    }

    const createdMatches = await Match.insertMany(matchesToCreate);

    const populatedMatches = await Match.find({ _id: { $in: createdMatches.map((m) => m._id) } })
      .populate('teamA', 'name logoUrl players')
      .populate('teamB', 'name logoUrl players')
      .populate('assignedScorer', 'name email phone');

    res.status(201).json({
      message: `Generated ${populatedMatches.length} match fixtures successfully!`,
      matches: populatedMatches,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate match fixtures', error: err.message });
  }
};

// @desc Get all matches for a tournament
// @route GET /api/matches/tournament/:tournamentId
exports.getTournamentMatches = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const matches = await Match.find({ tournamentId })
      .populate('teamA', 'name logoUrl players')
      .populate('teamB', 'name logoUrl players')
      .populate('assignedScorer', 'name email phone')
      .sort({ matchNumber: 1, scheduledDate: 1 });

    res.json(matches);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch tournament matches', error: err.message });
  }
};

// @desc Assign a Field Scorer to a match card
// @route PUT /api/matches/:id/assign-scorer
exports.assignScorerToMatch = async (req, res) => {
  try {
    const { id } = req.params;
    const { scorerId } = req.body;

    const match = await Match.findById(id).populate('tournamentId');
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    // Check organizer authority
    const tournament = match.tournamentId;
    if (tournament && tournament.organizerId.toString() !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized to delegate scorers for this match' });
    }

    if (scorerId && scorerId !== 'NONE') {
      const scorer = await User.findById(scorerId);
      if (!scorer || scorer.role !== 'SCORER') {
        return res.status(400).json({ message: 'Selected user is not a valid Field Scorer' });
      }
      match.assignedScorer = scorerId;
    } else {
      match.assignedScorer = null;
    }

    await match.save();

    const updatedMatch = await Match.findById(id)
      .populate('teamA', 'name logoUrl players')
      .populate('teamB', 'name logoUrl players')
      .populate('assignedScorer', 'name email phone');

    res.json({
      message: match.assignedScorer
        ? `Field Scorer assigned successfully to Match #${match.matchNumber}`
        : `Field Scorer removed from Match #${match.matchNumber}`,
      match: updatedMatch,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to assign scorer', error: err.message });
  }
};

// @desc Fetch matches assigned to logged-in Field Scorer
// @route GET /api/matches/scorer/my-matches
exports.getMyAssignedMatches = async (req, res) => {
  try {
    const matches = await Match.find({ assignedScorer: req.user.id })
      .populate('tournamentId', 'title sportCategory district venueName startDate endDate')
      .populate('teamA', 'name logoUrl players')
      .populate('teamB', 'name logoUrl players')
      .populate('assignedScorer', 'name email phone')
      .sort({ scheduledDate: 1 });

    res.json(matches);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch assigned matches', error: err.message });
  }
};
