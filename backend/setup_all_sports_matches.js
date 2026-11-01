const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Tournament = require('./models/Tournament');
const Team = require('./models/Team');
const Match = require('./models/Match');
const SportCategory = require('./models/SportCategory');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/arenaelite';

async function setupAllSports() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB for multi-sport setup...');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Scorer@123456', salt);

    // 1. Ensure Scorer exists and is APPROVED
    let scorer = await User.findOne({ email: 'scorer@arenaelite.com' });
    if (!scorer) {
      scorer = await User.create({
        name: 'Pravin Joshi (Official Scorer)',
        email: 'scorer@arenaelite.com',
        phone: '+91 98765 43210',
        password: hashedPassword,
        role: 'SCORER',
        district: 'Ahmedabad',
        approvalStatus: 'APPROVED',
        isActive: true,
      });
      console.log('Created Field Scorer: scorer@arenaelite.com');
    } else {
      scorer.approvalStatus = 'APPROVED';
      scorer.isActive = true;
      await scorer.save();
      console.log('Verified Field Scorer:', scorer.email);
    }

    // 2. Ensure Organizer exists
    let organizer = await User.findOne({ email: 'organizer@arenaelite.com' });
    if (!organizer) {
      const orgPassword = await bcrypt.hash('Organizer@123456', salt);
      organizer = await User.create({
        name: 'Alex Morgan',
        email: 'organizer@arenaelite.com',
        phone: '+91 98765 43211',
        password: orgPassword,
        role: 'ORGANIZER',
        district: 'Ahmedabad',
        organizationName: 'Gujarat State Sports Authority',
        approvalStatus: 'APPROVED',
        isActive: true,
      });
    }

    // Define the 6 sports configurations
    const sportsConfigs = [
      {
        sportCode: 'CRICKET',
        tournamentTitle: 'Gujarat T20 Premier Trophy 2026',
        district: 'Ahmedabad',
        venueName: 'Sardar Patel Stadium, Ground 1',
        format: 'KNOCKOUT',
        teamAName: 'Ahmedabad Lions',
        teamBName: 'Baroda Blasters',
        teamAPlayers: [
          { fullName: 'Rohit Sharma', role: 'Batsman', isCaptain: true, jerseyNumber: 45, studentOrGovtId: 'GOV-CR-A1' },
          { fullName: 'Virat Kohli', role: 'Batsman', jerseyNumber: 18, studentOrGovtId: 'GOV-CR-A2' },
          { fullName: 'Jasprit Bumrah', role: 'Bowler', jerseyNumber: 93, studentOrGovtId: 'GOV-CR-A3' },
          { fullName: 'Ravindra Jadeja', role: 'All-Rounder', jerseyNumber: 8, studentOrGovtId: 'GOV-CR-A4' },
        ],
        teamBPlayers: [
          { fullName: 'Hardik Pandya', role: 'All-Rounder', isCaptain: true, jerseyNumber: 33, studentOrGovtId: 'GOV-CR-B1' },
          { fullName: 'Krunal Pandya', role: 'All-Rounder', jerseyNumber: 24, studentOrGovtId: 'GOV-CR-B2' },
          { fullName: 'Irfan Pathan', role: 'Bowler', jerseyNumber: 77, studentOrGovtId: 'GOV-CR-B3' },
          { fullName: 'Yusuf Pathan', role: 'Batsman', jerseyNumber: 28, studentOrGovtId: 'GOV-CR-B4' },
        ],
        matchData: {
          round: 'Semi-Final 1',
          roundIndex: 1,
          matchNumber: 1,
          venue: 'Sardar Patel Stadium, Ground 1',
          status: 'LIVE',
          score: {
            teamAScore: '156/6 (20.0 ov)',
            teamBScore: '121/4 (15.0 ov)',
            resultSummary: 'Baroda Blasters need 36 runs in 30 balls (CRR: 8.1 • RRR: 7.2)',
            note: 'T20 Innings 2 in progress',
            details: {
              currentInnings: 2,
              target: 157,
              teamA: { runs: 156, wickets: 6, balls: 120, oversFormatted: '20.0' },
              teamB: { runs: 121, wickets: 4, balls: 90, oversFormatted: '15.0' },
              currentOverBalls: ['1', '1', '•', '1', '4', '6'],
            },
            timeline: [
              { event: 'Six by H. Pandya', team: 'Baroda Blasters', time: '14.1 ov' },
              { event: 'Wicket: K. Pandya c & b Bumrah', team: 'Baroda Blasters', time: '12.4 ov' },
              { event: 'Four by Yusuf Pathan', team: 'Baroda Blasters', time: '10.2 ov' },
            ],
          },
        },
      },
      {
        sportCode: 'FOOTBALL',
        tournamentTitle: 'Gujarat Super Cup 2026',
        district: 'Ahmedabad',
        venueName: 'EKA Arena Stadium',
        format: 'KNOCKOUT',
        teamAName: 'Ahmedabad Titans FC',
        teamBName: 'Rajkot Royals FC',
        teamAPlayers: [
          { fullName: 'Sunil Chhetri', role: 'Forward / Striker', isCaptain: true, jerseyNumber: 11, studentOrGovtId: 'GOV-FB-A1' },
          { fullName: 'Sandesh Jhingan', role: 'Center-Back (Defender)', jerseyNumber: 5, studentOrGovtId: 'GOV-FB-A2' },
          { fullName: 'Anirudh Thapa', role: 'Midfielder', jerseyNumber: 7, studentOrGovtId: 'GOV-FB-A3' },
        ],
        teamBPlayers: [
          { fullName: 'Gurpreet Singh', role: 'Goalkeeper', isCaptain: true, jerseyNumber: 1, studentOrGovtId: 'GOV-FB-B1' },
          { fullName: 'Lallianzuala Chhangte', role: 'Winger', jerseyNumber: 17, studentOrGovtId: 'GOV-FB-B2' },
          { fullName: 'Sahal Abdul Samad', role: 'Midfielder', jerseyNumber: 10, studentOrGovtId: 'GOV-FB-B3' },
        ],
        matchData: {
          round: 'Semi-Final 1',
          roundIndex: 1,
          matchNumber: 1,
          venue: 'EKA Arena Stadium, Pitch A',
          status: 'LIVE',
          score: {
            teamAScore: '2',
            teamBScore: '1',
            resultSummary: '2nd Half 74\' • Ahmedabad Titans FC leading 2 - 1',
            note: '2nd Half in progress',
            details: {
              period: '2nd Half',
              minute: 74,
              penaltyA: null,
              penaltyB: null,
            },
            timeline: [
              { event: 'Goal! S. Chhetri (Assist: Thapa)', team: 'Ahmedabad Titans FC', time: '68\'' },
              { event: 'Goal! L. Chhangte header', team: 'Rajkot Royals FC', time: '42\'' },
              { event: 'Goal! S. Chhetri penalty', team: 'Ahmedabad Titans FC', time: '18\'' },
            ],
          },
        },
      },
      {
        sportCode: 'BASKETBALL',
        tournamentTitle: 'Gujarat State Basketball Championship',
        district: 'Surat',
        venueName: 'Surat Indoor Basketball Arena',
        format: 'KNOCKOUT',
        teamAName: 'Surat Shooters',
        teamBName: 'Gandhinagar Giants',
        teamAPlayers: [
          { fullName: 'Amritpal Singh', role: 'Center (C)', isCaptain: true, jerseyNumber: 9, studentOrGovtId: 'GOV-BB-A1' },
          { fullName: 'Amjyot Singh', role: 'Power Forward (PF)', jerseyNumber: 15, studentOrGovtId: 'GOV-BB-A2' },
        ],
        teamBPlayers: [
          { fullName: 'Vishesh Bhriguvanshi', role: 'Point Guard (PG)', isCaptain: true, jerseyNumber: 4, studentOrGovtId: 'GOV-BB-B1' },
          { fullName: 'Prasanna Venkatesh', role: 'Shooting Guard (SG)', jerseyNumber: 7, studentOrGovtId: 'GOV-BB-B2' },
        ],
        matchData: {
          round: 'Semi-Final 1',
          roundIndex: 1,
          matchNumber: 1,
          venue: 'Surat Indoor Basketball Arena, Court 1',
          status: 'LIVE',
          score: {
            teamAScore: '64',
            teamBScore: '58',
            resultSummary: 'Q3 in progress • Surat Shooters leading 64 - 58',
            note: 'Q3 04:12 remaining',
            details: {
              quarter: 'Q3',
              teamAScore: 64,
              teamBScore: 58,
            },
            timeline: [
              { event: '3-Pointer by Amjyot Singh', team: 'Surat Shooters', time: 'Q3 04:22' },
              { event: 'Fast Break Layup by Vishesh', team: 'Gandhinagar Giants', time: 'Q3 06:10' },
            ],
          },
        },
      },
      {
        sportCode: 'BADMINTON',
        tournamentTitle: 'Ahmedabad Badminton Open 2026',
        district: 'Ahmedabad',
        venueName: 'Racquet Club Ahmedabad',
        format: 'KNOCKOUT',
        teamAName: 'Vadodara Smashers',
        teamBName: 'Kutch Shuttlers',
        teamAPlayers: [
          { fullName: 'Kidambi Srikanth', role: 'Singles Specialist', isCaptain: true, jerseyNumber: 1, studentOrGovtId: 'GOV-BM-A1' },
          { fullName: 'Chirag Shetty', role: 'Doubles - Front Court Attacker', jerseyNumber: 2, studentOrGovtId: 'GOV-BM-A2' },
        ],
        teamBPlayers: [
          { fullName: 'Lakshya Sen', role: 'Singles Specialist', isCaptain: true, jerseyNumber: 1, studentOrGovtId: 'GOV-BM-B1' },
          { fullName: 'Satwiksairaj Rankireddy', role: 'Doubles - Back Court Smasher', jerseyNumber: 2, studentOrGovtId: 'GOV-BM-B2' },
        ],
        matchData: {
          round: 'Semi-Final 1',
          roundIndex: 1,
          matchNumber: 1,
          venue: 'Racquet Club Ahmedabad, Court 2',
          status: 'LIVE',
          score: {
            teamAScore: '1 [21-17]',
            teamBScore: '0',
            resultSummary: 'Set 2 in progress • Vadodara leads 1-0 sets (Current: 16 - 13)',
            note: 'Best of 3 sets',
            details: {
              setsA: 1,
              setsB: 0,
              currentSetPointsA: 16,
              currentSetPointsB: 13,
              completedSets: ['21-17'],
            },
            timeline: [
              { event: 'Smash Winner by K. Srikanth', team: 'Vadodara Smashers', time: 'Set 2 (16-13)' },
              { event: 'Set 1 won 21-17 by Vadodara', team: 'Vadodara Smashers', time: 'Set 1 End' },
            ],
          },
        },
      },
      {
        sportCode: 'VOLLEYBALL',
        tournamentTitle: 'Gujarat Pro Volleyball Trophy',
        district: 'Mehsana',
        venueName: 'Mehsana Spikers Arena',
        format: 'KNOCKOUT',
        teamAName: 'Mehsana Spikers',
        teamBName: 'Jamnagar Strikers',
        teamAPlayers: [
          { fullName: 'Jerome Vinith', role: 'Outside Hitter', isCaptain: true, jerseyNumber: 7, studentOrGovtId: 'GOV-VB-A1' },
          { fullName: 'Muthusamy Appavu', role: 'Setter', jerseyNumber: 3, studentOrGovtId: 'GOV-VB-A2' },
        ],
        teamBPlayers: [
          { fullName: 'Akhin GS', role: 'Middle Blocker', isCaptain: true, jerseyNumber: 11, studentOrGovtId: 'GOV-VB-B1' },
          { fullName: 'Amit Gulia', role: 'Opposite Hitter', jerseyNumber: 9, studentOrGovtId: 'GOV-VB-B2' },
        ],
        matchData: {
          round: 'Semi-Final 1',
          roundIndex: 1,
          matchNumber: 1,
          venue: 'Mehsana Spikers Arena, Court A',
          status: 'LIVE',
          score: {
            teamAScore: '1 [25-22, 21-25]',
            teamBScore: '1',
            resultSummary: 'Set 3 in progress • 1-1 sets (Current: 20 - 18)',
            note: 'Best of 5 sets',
            details: {
              setsA: 1,
              setsB: 1,
              currentSetPointsA: 20,
              currentSetPointsB: 18,
              completedSets: ['25-22', '21-25'],
            },
            timeline: [
              { event: 'Spike kill by Jerome', team: 'Mehsana Spikers', time: 'Set 3 (20-18)' },
              { event: 'Set 2 won 25-21 by Jamnagar', team: 'Jamnagar Strikers', time: 'Set 2 End' },
              { event: 'Set 1 won 25-22 by Mehsana', team: 'Mehsana Spikers', time: 'Set 1 End' },
            ],
          },
        },
      },
      {
        sportCode: 'KABADDI',
        tournamentTitle: 'Gujarat Kabaddi Maha-Sangram',
        district: 'Patan',
        venueName: 'Patan Mat Arena',
        format: 'KNOCKOUT',
        teamAName: 'Patan Panthers',
        teamBName: 'Bhavnagar Brawlers',
        teamAPlayers: [
          { fullName: 'Pardeep Narwal', role: 'Main Raider', isCaptain: true, jerseyNumber: 9, studentOrGovtId: 'GOV-KB-A1' },
          { fullName: 'Fazel Atrachali', role: 'Left Corner Defender', jerseyNumber: 1, studentOrGovtId: 'GOV-KB-A2' },
          { fullName: 'Surjeet Singh', role: 'Right Cover Defender', jerseyNumber: 4, studentOrGovtId: 'GOV-KB-A3' },
        ],
        teamBPlayers: [
          { fullName: 'Pawan Sehrawat', role: 'Main Raider', isCaptain: true, jerseyNumber: 17, studentOrGovtId: 'GOV-KB-B1' },
          { fullName: 'Nitesh Kumar', role: 'Right Corner Defender', jerseyNumber: 2, studentOrGovtId: 'GOV-KB-B2' },
          { fullName: 'Vishal Bhardwaj', role: 'Left Corner Defender', jerseyNumber: 5, studentOrGovtId: 'GOV-KB-B3' },
        ],
        matchData: {
          round: 'Semi-Final 1',
          roundIndex: 1,
          matchNumber: 1,
          venue: 'Patan Mat Arena, Mat 1',
          status: 'LIVE',
          score: {
            teamAScore: '31',
            teamBScore: '27',
            resultSummary: '2nd Half in progress • Patan Panthers lead 31 - 27 (Raids: 20, Tackles: 7)',
            note: '2nd Half 07:15 remaining',
            details: {
              period: '2nd Half',
              teamA: { raidPoints: 20, tacklePoints: 7, allOutPoints: 4, bonusPoints: 0, total: 31 },
              teamB: { raidPoints: 17, tacklePoints: 8, allOutPoints: 2, bonusPoints: 0, total: 27 },
            },
            timeline: [
              { event: 'Super Raid (+3 pts) by Pardeep Narwal', team: 'Patan Panthers', time: '2nd Half 08:30' },
              { event: 'Super Tackle (+2 pts) by Bhavnagar', team: 'Bhavnagar Brawlers', time: '2nd Half 11:15' },
              { event: 'All-Out inflicted (+2 pts)', team: 'Patan Panthers', time: '1st Half End' },
            ],
          },
        },
      },
    ];

    console.log(`Setting up ${sportsConfigs.length} multi-sport matches assigned to ${scorer.email}...`);

    for (const conf of sportsConfigs) {
      // 1. Create or update Tournament
      let tournament = await Tournament.findOne({ title: conf.tournamentTitle });
      if (!tournament) {
        tournament = await Tournament.create({
          title: conf.tournamentTitle,
          description: `Premier state-level ${conf.sportCode} championship.`,
          sportCategory: conf.sportCode,
          district: conf.district,
          venueName: conf.venueName,
          startDate: new Date(),
          endDate: new Date(Date.now() + 7 * 86400000),
          registrationDeadline: new Date(Date.now() - 86400000),
          maxTeams: 4,
          approvedTeamsCount: 2,
          organizerId: organizer._id,
          format: conf.format,
          status: 'ONGOING',
          isRegistrationOpen: false,
        });
        console.log(`Created tournament: ${conf.tournamentTitle} (${conf.sportCode})`);
      } else {
        tournament.status = 'ONGOING';
        await tournament.save();
      }

      // 2. Create or find Team A
      let teamA = await Team.findOne({ name: conf.teamAName, tournamentId: tournament._id });
      if (!teamA) {
        teamA = await Team.create({
          name: conf.teamAName,
          tournamentId: tournament._id,
          sport: conf.sportCode,
          captainId: organizer._id,
          contactEmail: `captain.${conf.sportCode.toLowerCase()}A@arenaelite.com`,
          contactPhone: '+91 98765 00001',
          district: conf.district,
          players: conf.teamAPlayers,
          status: 'APPROVED',
          stats: { matchesPlayed: 3, wins: 2, losses: 1, winRate: 67 },
        });
      } else {
        teamA.sport = conf.sportCode;
        teamA.status = 'APPROVED';
        await teamA.save();
      }

      // 3. Create or find Team B
      let teamB = await Team.findOne({ name: conf.teamBName, tournamentId: tournament._id });
      if (!teamB) {
        teamB = await Team.create({
          name: conf.teamBName,
          tournamentId: tournament._id,
          sport: conf.sportCode,
          captainId: organizer._id,
          contactEmail: `captain.${conf.sportCode.toLowerCase()}B@arenaelite.com`,
          contactPhone: '+91 98765 00002',
          district: conf.district,
          players: conf.teamBPlayers,
          status: 'APPROVED',
          stats: { matchesPlayed: 3, wins: 1, losses: 2, winRate: 33 },
        });
      } else {
        teamB.sport = conf.sportCode;
        teamB.status = 'APPROVED';
        await teamB.save();
      }

      // 4. Create or update Match
      let match = await Match.findOne({
        tournamentId: tournament._id,
        sportCategory: conf.sportCode,
        matchNumber: conf.matchData.matchNumber,
      });

      if (!match) {
        match = await Match.create({
          tournamentId: tournament._id,
          round: conf.matchData.round,
          roundIndex: conf.matchData.roundIndex,
          matchNumber: conf.matchData.matchNumber,
          teamA: teamA._id,
          teamB: teamB._id,
          sportCategory: conf.sportCode,
          assignedScorer: scorer._id,
          scheduledDate: new Date(),
          venue: conf.matchData.venue,
          status: conf.matchData.status,
          score: conf.matchData.score,
          isBye: false,
        });
        console.log(`Created match #${match.matchNumber} for ${conf.sportCode} assigned to ${scorer.email}`);
      } else {
        match.teamA = teamA._id;
        match.teamB = teamB._id;
        match.assignedScorer = scorer._id;
        match.status = conf.matchData.status;
        match.score = conf.matchData.score;
        match.venue = conf.matchData.venue;
        match.scheduledDate = new Date();
        await match.save();
        console.log(`Updated match #${match.matchNumber} for ${conf.sportCode}`);
      }
    }

    console.log('\n--- SUCCESS ---');
    console.log(`All 6 sport matches successfully created and assigned to ${scorer.email}`);
    process.exit(0);
  } catch (err) {
    console.error('Failed to setup all sports matches:', err);
    process.exit(1);
  }
}

setupAllSports();
