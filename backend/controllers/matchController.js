const mongoose = require('mongoose');
const Match = require('../models/Match');
const Tournament = require('../models/Tournament');
const Team = require('../models/Team');
const User = require('../models/User');

// Helper to determine round title from distance to final
const getRoundTitle = (distanceToFinal, roundIndex) => {
  switch (distanceToFinal) {
    case 0:
      return 'Final';
    case 1:
      return 'Semi-Final';
    case 2:
      return 'Quarter-Final';
    case 3:
      return 'Round of 16';
    case 4:
      return 'Round of 32';
    default:
      return `Round ${roundIndex}`;
  }
};

// Helper: Standard tournament slot order to distribute BYEs evenly across brackets
const getSpreadSlotOrder = (count) => {
  if (count <= 1) return [0];
  if (count === 2) return [0, 1];
  if (count === 4) return [0, 2, 1, 3];
  if (count === 8) return [0, 4, 2, 6, 1, 5, 3, 7];
  if (count === 16) return [0, 8, 4, 12, 2, 10, 6, 14, 1, 9, 5, 13, 3, 11, 7, 15];

  // Fallback linear
  return Array.from({ length: count }, (_, i) => i);
};

// Helper: Retrieve historical stats for a team
const getTeamHistoricalStats = async (teamId) => {
  const team = await Team.findById(teamId);
  const completedMatches = await Match.countDocuments({
    $or: [{ teamA: teamId }, { teamB: teamId }],
    status: 'COMPLETED',
    isBye: false,
  });

  const wonMatches = await Match.countDocuments({
    winnerId: teamId,
    status: 'COMPLETED',
    isBye: false,
  });

  const baseWins = team?.stats?.wins || 0;
  const baseMatches = team?.stats?.matchesPlayed || 0;

  const totalWins = wonMatches + baseWins;
  const totalMatches = completedMatches + baseMatches;
  const winRate = totalMatches > 0 ? Math.round((totalWins / totalMatches) * 100) : 0;

  return {
    team,
    totalMatches,
    totalWins,
    winRate,
    playersCount: team?.players?.length || 0,
  };
};

// @desc Preview approved teams and their performance stats for BYE strategy selection
// @route GET /api/matches/tournament/:tournamentId/team-stats
exports.getTournamentTeamStats = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const tournament = await Tournament.findById(tournamentId);

    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    const approvedRegistrations = tournament.registeredTeams.filter((r) => r.status === 'APPROVED');
    const N = approvedRegistrations.length;
    const bracketSize = N >= 2 ? Math.pow(2, Math.ceil(Math.log2(N))) : 2;
    const byesCount = bracketSize - N;

    const teamStatsList = await Promise.all(
      approvedRegistrations.map(async (r) => {
        const stats = await getTeamHistoricalStats(r.teamId);
        return {
          teamId: r.teamId,
          name: stats.team?.name || 'Unknown Team',
          logoUrl: stats.team?.logoUrl || '',
          district: stats.team?.district || '',
          playersCount: stats.playersCount,
          totalMatches: stats.totalMatches,
          totalWins: stats.totalWins,
          winRate: stats.winRate,
        };
      })
    );

    // Sort descending by winRate, totalWins, playersCount
    teamStatsList.sort((a, b) => {
      if (b.winRate !== a.winRate) return b.winRate - a.winRate;
      if (b.totalWins !== a.totalWins) return b.totalWins - a.totalWins;
      return b.playersCount - a.playersCount;
    });

    res.json({
      totalApprovedTeams: N,
      bracketSize,
      byesCount,
      requiresByeSelection: byesCount > 0,
      teams: teamStatsList,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve team stats', error: err.message });
  }
};

// @desc Generate knockout match fixtures for approved teams with advanced BYE allocation strategy
// @route POST /api/matches/tournament/:tournamentId/generate
exports.generateTournamentMatches = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { byeStrategy = 'SEEDED', force = false } = { ...req.query, ...req.body };

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
      .populate('winnerId', 'name logoUrl')
      .populate('assignedScorer', 'name email phone')
      .sort({ roundIndex: 1, matchNumber: 1 });

    if (existingMatches.length > 0 && !force) {
      return res.json({
        message: 'Matches already generated for this tournament',
        matches: existingMatches,
      });
    }

    // Get approved teams
    const approvedRegistrations = tournament.registeredTeams.filter((r) => r.status === 'APPROVED');
    const N = approvedRegistrations.length;
    if (N < 2) {
      return res.status(400).json({
        message: `At least 2 approved teams are required to generate match fixtures. Currently approved: ${N}`,
      });
    }

    // Delete existing matches if regenerating
    if (existingMatches.length > 0 && force) {
      await Match.deleteMany({ tournamentId });
    }

    // 1. Calculate bracket math
    const bracketSize = Math.pow(2, Math.ceil(Math.log2(N)));
    const byesCount = bracketSize - N;
    const totalRounds = Math.log2(bracketSize);

    // 2. Fetch and order teams according to selected strategy
    let orderedTeamIds = [];

    if (byeStrategy === 'LOTTERY') {
      // Option B: Fair Random Lottery Draw via Fisher-Yates
      const rawIds = approvedRegistrations.map((r) => r.teamId);
      for (let i = rawIds.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [rawIds[i], rawIds[j]] = [rawIds[j], rawIds[i]];
      }
      orderedTeamIds = rawIds;
    } else {
      // Option A: Seeded by Past Performance / History
      const teamStatsList = await Promise.all(
        approvedRegistrations.map(async (r) => {
          const stats = await getTeamHistoricalStats(r.teamId);
          return {
            teamId: r.teamId,
            winRate: stats.winRate,
            totalWins: stats.totalWins,
            playersCount: stats.playersCount,
            name: stats.team?.name || '',
          };
        })
      );

      teamStatsList.sort((a, b) => {
        if (b.winRate !== a.winRate) return b.winRate - a.winRate;
        if (b.totalWins !== a.totalWins) return b.totalWins - a.totalWins;
        if (b.playersCount !== a.playersCount) return b.playersCount - a.playersCount;
        return a.name.localeCompare(b.name);
      });

      orderedTeamIds = teamStatsList.map((t) => t.teamId);
    }

    // Top byesCount teams get automatic BYE into Round 2
    const byeTeamIds = orderedTeamIds.slice(0, byesCount);
    const playingTeamIds = orderedTeamIds.slice(byesCount);

    // 3. Pre-create match tree structure layer-by-layer
    // roundsMatches[roundIndex - 1][matchIndexInRound]
    const roundsMatches = [];
    let globalMatchNumber = 1;
    const baseDate = new Date(tournament.startDate || Date.now());

    for (let r = 1; r <= totalRounds; r++) {
      const distanceToFinal = totalRounds - r;
      const roundTitle = getRoundTitle(distanceToFinal, r);
      const matchesInRound = bracketSize / Math.pow(2, r);
      const currentRoundList = [];

      for (let m = 0; m < matchesInRound; m++) {
        // Schedule time offset: stagger rounds across days or hours
        const matchDate = new Date(baseDate);
        matchDate.setDate(matchDate.getDate() + (r - 1));
        matchDate.setHours(9 + m * 2, 0, 0, 0);

        currentRoundList.push({
          _id: new mongoose.Types.ObjectId(),
          tournamentId,
          round: roundTitle,
          roundIndex: r,
          matchNumber: globalMatchNumber++,
          teamA: null,
          teamB: null,
          assignedScorer: null,
          scheduledDate: matchDate,
          venue: tournament.venueName || tournament.district,
          sportCategory: tournament.sportCategory,
          status: 'SCHEDULED',
          isBye: false,
          score: { teamAScore: '', teamBScore: '', resultSummary: '', note: '' },
          winnerId: null,
          nextMatchId: null,
          nextMatchSlot: null,
          sourceMatchA: null,
          sourceMatchB: null,
        });
      }
      roundsMatches.push(currentRoundList);
    }

    // 4. Link child matches to parents across all rounds (Round r -> Round r+1)
    for (let r = 0; r < totalRounds - 1; r++) {
      const currentRound = roundsMatches[r];
      const nextRound = roundsMatches[r + 1];

      for (let m = 0; m < currentRound.length; m++) {
        const parentMatchIndex = Math.floor(m / 2);
        const parentMatch = nextRound[parentMatchIndex];
        const isTeamA = m % 2 === 0;

        currentRound[m].nextMatchId = parentMatch._id;
        currentRound[m].nextMatchSlot = isTeamA ? 'teamA' : 'teamB';

        if (isTeamA) {
          parentMatch.sourceMatchA = currentRound[m]._id;
        } else {
          parentMatch.sourceMatchB = currentRound[m]._id;
        }
      }
    }

    // 5. Populate Round 1 with BYEs and Playing Matches
    const r1Matches = roundsMatches[0];
    const r1Count = r1Matches.length; // bracketSize / 2
    const spreadSlots = getSpreadSlotOrder(r1Count);
    const byeSlotIndices = new Set(spreadSlots.slice(0, byesCount));

    let byeIdx = 0;
    let playIdx = 0;

    for (let m = 0; m < r1Count; m++) {
      const currentMatch = r1Matches[m];

      if (byeSlotIndices.has(m) && byeIdx < byeTeamIds.length) {
        // BYE Match
        const byeTeamId = byeTeamIds[byeIdx++];
        currentMatch.teamA = byeTeamId;
        currentMatch.teamB = null;
        currentMatch.isBye = true;
        currentMatch.status = 'COMPLETED';
        currentMatch.winnerId = byeTeamId;
        currentMatch.score = {
          teamAScore: '',
          teamBScore: '',
          resultSummary: 'Advanced via BYE',
          note: 'Advanced via BYE',
        };

        // Advance automatically into the Round 2 parent match slot
        if (totalRounds > 1) {
          const parentMatchIndex = Math.floor(m / 2);
          const parentMatch = roundsMatches[1][parentMatchIndex];
          if (currentMatch.nextMatchSlot === 'teamA') {
            parentMatch.teamA = byeTeamId;
          } else {
            parentMatch.teamB = byeTeamId;
          }
        }
      } else {
        // Competitive Playing Match
        if (playIdx + 1 < playingTeamIds.length) {
          currentMatch.teamA = playingTeamIds[playIdx++];
          currentMatch.teamB = playingTeamIds[playIdx++];
          currentMatch.isBye = false;
          currentMatch.status = 'SCHEDULED';
          currentMatch.winnerId = null;
        } else if (playIdx < playingTeamIds.length) {
          // Fallback single team if any
          const singleTeam = playingTeamIds[playIdx++];
          currentMatch.teamA = singleTeam;
          currentMatch.teamB = null;
          currentMatch.isBye = true;
          currentMatch.status = 'COMPLETED';
          currentMatch.winnerId = singleTeam;
          currentMatch.score = {
            teamAScore: '',
            teamBScore: '',
            resultSummary: 'Advanced via BYE',
            note: 'Advanced via BYE',
          };
          if (totalRounds > 1) {
            const parentMatchIndex = Math.floor(m / 2);
            const parentMatch = roundsMatches[1][parentMatchIndex];
            if (currentMatch.nextMatchSlot === 'teamA') {
              parentMatch.teamA = singleTeam;
            } else {
              parentMatch.teamB = singleTeam;
            }
          }
        }
      }
    }

    // Flatten all matches across rounds and insert to DB
    const allMatchesToInsert = roundsMatches.flat();
    await Match.insertMany(allMatchesToInsert);

    // Retrieve and return fully populated matches
    const populatedMatches = await Match.find({ tournamentId })
      .populate('teamA', 'name logoUrl players')
      .populate('teamB', 'name logoUrl players')
      .populate('winnerId', 'name logoUrl')
      .populate('assignedScorer', 'name email phone')
      .populate('sourceMatchA', 'matchNumber round')
      .populate('sourceMatchB', 'matchNumber round')
      .sort({ roundIndex: 1, matchNumber: 1 });

    res.status(201).json({
      message: `Generated ${populatedMatches.length} tournament matches across ${totalRounds} round(s) successfully! (${byesCount} BYEs awarded via ${byeStrategy})`,
      matches: populatedMatches,
      bracketSize,
      byesCount,
      totalRounds,
      byeStrategy,
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
      .populate('winnerId', 'name logoUrl')
      .populate('assignedScorer', 'name email phone')
      .populate('sourceMatchA', 'matchNumber round')
      .populate('sourceMatchB', 'matchNumber round')
      .sort({ roundIndex: 1, matchNumber: 1 });

    res.json(matches);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch tournament matches', error: err.message });
  }
};

// @desc Schedule a match (Date, Time, Venue, Assigned Scorer)
// @route PUT /api/matches/:id/schedule
exports.scheduleMatch = async (req, res) => {
  try {
    const { id } = req.params;
    const { scheduledDate, venue, assignedScorer } = req.body;

    const match = await Match.findById(id).populate('tournamentId');
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    // Verify organizer or admin authority
    const tournament = match.tournamentId;
    if (tournament && tournament.organizerId.toString() !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized to schedule this match' });
    }

    if (scheduledDate) {
      match.scheduledDate = new Date(scheduledDate);
    }

    if (venue !== undefined) {
      match.venue = venue.trim();
    }

    if (assignedScorer !== undefined) {
      if (!assignedScorer || assignedScorer === 'NONE' || assignedScorer === '') {
        match.assignedScorer = null;
      } else {
        const scorer = await User.findById(assignedScorer);
        if (!scorer || scorer.role !== 'SCORER') {
          return res.status(400).json({ message: 'Selected user is not a valid Field Scorer' });
        }
        match.assignedScorer = assignedScorer;
      }
    }

    await match.save();

    const updatedMatch = await Match.findById(id)
      .populate('teamA', 'name logoUrl players')
      .populate('teamB', 'name logoUrl players')
      .populate('winnerId', 'name logoUrl')
      .populate('assignedScorer', 'name email phone')
      .populate('sourceMatchA', 'matchNumber round')
      .populate('sourceMatchB', 'matchNumber round');

    res.json({
      message: `Match #${match.matchNumber} schedule updated successfully!`,
      match: updatedMatch,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update match schedule', error: err.message });
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
      .populate('winnerId', 'name logoUrl')
      .populate('assignedScorer', 'name email phone')
      .populate('sourceMatchA', 'matchNumber round')
      .populate('sourceMatchB', 'matchNumber round');

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
      .populate('winnerId', 'name logoUrl')
      .populate('assignedScorer', 'name email phone')
      .sort({ scheduledDate: 1 });

    res.json(matches);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch assigned matches', error: err.message });
  }
};
