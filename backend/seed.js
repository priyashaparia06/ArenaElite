const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const SportCategory = require('./models/SportCategory');
const Venue = require('./models/Venue');
const Team = require('./models/Team');
const Tournament = require('./models/Tournament');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/arenaelite';

async function seedDatabase() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB for seeding...');

    // 1. Seed Admin User
    const adminEmail = 'admin@arenaelite.com';
    let admin = await User.findOne({ email: adminEmail });
    const salt = await bcrypt.genSalt(10);

    if (!admin) {
      const hashedPassword = await bcrypt.hash('Admin@123456', salt);
      admin = await User.create({
        name: 'Arena Elite Super Admin',
        email: adminEmail,
        phone: '+1 800 555 0199',
        password: hashedPassword,
        role: 'ADMIN',
        district: 'Global HQ',
        approvalStatus: 'APPROVED',
        isActive: true,
      });
      console.log('Seeded Admin User: admin@arenaelite.com / Admin@123456');
    } else {
      console.log('Admin user already exists');
    }

    // 2. Seed Approved Organizer
    const orgEmail = 'organizer@arenaelite.com';
    let organizer = await User.findOne({ email: orgEmail });
    if (!organizer) {
      const hashedPassword = await bcrypt.hash('Organizer@123456', salt);
      organizer = await User.create({
        name: 'Alex Morgan',
        email: orgEmail,
        phone: '+1 800 555 0144',
        password: hashedPassword,
        role: 'ORGANIZER',
        district: 'Boston',
        organizationName: 'Varsity Sports League',
        approvalStatus: 'APPROVED',
        isActive: true,
      });
      console.log('Seeded Approved Organizer: organizer@arenaelite.com / Organizer@123456');
    }

    // 3. Seed Pending Organizer (for Admin approval testing)
    const pendingOrgEmail = 'pending.org@arenaelite.com';
    let pendingOrg = await User.findOne({ email: pendingOrgEmail });
    if (!pendingOrg) {
      const hashedPassword = await bcrypt.hash('Pending@123456', salt);
      pendingOrg = await User.create({
        name: 'Robert Sterling',
        email: pendingOrgEmail,
        phone: '+1 800 555 0188',
        password: hashedPassword,
        role: 'ORGANIZER',
        district: 'Rajkot',
        organizationName: 'Gujarat Club Federation',
        approvalStatus: 'PENDING',
        isActive: true,
      });
      console.log('Seeded Pending Organizer: pending.org@arenaelite.com / Pending@123456');
    }

    // 4. Seed Captain
    const captainEmail = 'captain@arenaelite.com';
    let captain = await User.findOne({ email: captainEmail });
    if (!captain) {
      const hashedPassword = await bcrypt.hash('Captain@123456', salt);
      captain = await User.create({
        name: 'David Beckham',
        email: captainEmail,
        phone: '+1 800 555 0111',
        password: hashedPassword,
        role: 'CAPTAIN',
        district: 'Boston',
        approvalStatus: 'APPROVED',
        isActive: true,
      });
      console.log('Seeded Captain User: captain@arenaelite.com / Captain@123456');
    }

    // 5. Seed Sports Categories with Rule Configurations
    const sportsData = [
      {
        name: 'Football',
        code: 'FOOTBALL',
        icon: '⚽',
        playersPerTeam: 11,
        minSquadSize: 11,
        maxSquadSize: 22,
        formatType: 'TIME_BASED',
        defaultMatchDuration: 90,
        rulesDescription: '11 vs 11, 2 halves of 45 mins. Offside rule applies. 5 substitutions allowed.',
        isActive: true,
      },
      {
        name: 'Cricket',
        code: 'CRICKET',
        icon: '🏏',
        playersPerTeam: 11,
        minSquadSize: 11,
        maxSquadSize: 16,
        formatType: 'OVERS_BASED',
        defaultMatchDuration: 20,
        rulesDescription: 'T20 format: 20 overs per innings. Max 4 overs per bowler. Powerplay in overs 1-6.',
        isActive: true,
      },
      {
        name: 'Basketball',
        code: 'BASKETBALL',
        icon: '🏀',
        playersPerTeam: 5,
        minSquadSize: 5,
        maxSquadSize: 12,
        formatType: 'TIME_BASED',
        defaultMatchDuration: 40,
        rulesDescription: '5 on 5 full court. 4 quarters of 10 minutes. 24-second shot clock.',
        isActive: true,
      },
      {
        name: 'Badminton',
        code: 'BADMINTON',
        icon: '🏸',
        playersPerTeam: 2,
        minSquadSize: 2,
        maxSquadSize: 4,
        formatType: 'SETS_BASED',
        defaultMatchDuration: 3,
        rulesDescription: 'Doubles match: Best of 3 sets to 21 points. Rally point scoring system.',
        isActive: true,
      },
      {
        name: 'Kabaddi',
        code: 'KABADDI',
        icon: '🤼',
        playersPerTeam: 7,
        minSquadSize: 7,
        maxSquadSize: 14,
        formatType: 'TIME_BASED',
        defaultMatchDuration: 40,
        rulesDescription: '7 on field. 2 halves of 20 minutes each. 30-second raid clock. Bonus and Do-or-Die rules active.',
        isActive: true,
      },
      {
        name: 'Volleyball',
        code: 'VOLLEYBALL',
        icon: '🏐',
        playersPerTeam: 6,
        minSquadSize: 6,
        maxSquadSize: 12,
        formatType: 'SETS_BASED',
        defaultMatchDuration: 5,
        rulesDescription: '6 players on court. Best of 5 sets. First 4 sets to 25 points, 5th set to 15 points.',
        isActive: true,
      },
    ];

    for (const sport of sportsData) {
      await SportCategory.findOneAndUpdate({ code: sport.code }, sport, { upsert: true, new: true });
    }
    console.log('Seeded Sport Categories with Rule Configurations');

    // 6. Seed Venues / Grounds
    const venuesData = [
      {
        name: 'Boston Stadium',
        district: 'Boston',
        address: '100 Legends Way, Boston, MA',
        supportedSports: ['FOOTBALL', 'BASKETBALL'],
        contactPerson: 'Marcus Vance',
        contactPhone: '+1 617 555 9011',
        facilities: ['Floodlights', 'VIP Lounge', 'Media Room', 'Medical Center', 'Dressing Rooms'],
        isActive: true,
      },
      {
        name: 'Sardar Patel Sports Complex',
        district: 'Rajkot',
        address: 'Race Course Ring Road, Rajkot, Gujarat',
        supportedSports: ['CRICKET', 'FOOTBALL', 'VOLLEYBALL'],
        contactPerson: 'Kishore Joshi',
        contactPhone: '+91 98250 12345',
        facilities: ['Turf Pitch', 'Floodlights', 'Pavilion', 'Drinking Water', 'Parking'],
        isActive: true,
      },
      {
        name: 'Elite Indoor Badminton Academy',
        district: 'Rajkot',
        address: 'Kalawad Road, Rajkot, Gujarat',
        supportedSports: ['BADMINTON'],
        contactPerson: 'Sneha Patel',
        contactPhone: '+91 94280 67890',
        facilities: ['Wooden Synthetic Courts', 'Air Conditioning', 'Physio Bay'],
        isActive: true,
      },
      {
        name: 'Gujarat University Athletic Ground',
        district: 'Ahmedabad',
        address: 'Navrangpura, Ahmedabad, Gujarat',
        supportedSports: ['FOOTBALL', 'KABADDI', 'CRICKET'],
        contactPerson: 'Dr. Hardik Shah',
        contactPhone: '+91 98791 44321',
        facilities: ['Standard 400m Track', 'Locker Rooms', 'Spectator Bleachers'],
        isActive: true,
      },
    ];

    for (const v of venuesData) {
      await Venue.findOneAndUpdate({ name: v.name }, v, { upsert: true, new: true });
    }
    console.log('Seeded Venues & Grounds');

    // 7. Seed Sample Tournament created by the Approved Organizer
    let sampleTournament = await Tournament.findOne({ title: 'Boston Collegiate Cup 2026' });
    if (!sampleTournament) {
      const bostonVenue = await Venue.findOne({ name: 'Boston Stadium' });
      sampleTournament = await Tournament.create({
        title: 'Boston Collegiate Cup 2026',
        description: 'Annual inter-college championship tournament featuring top football squads.',
        organizerId: organizer._id,
        sportCategory: 'FOOTBALL',
        district: 'Boston',
        venueId: bostonVenue?._id || null,
        venueName: 'Boston Stadium',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // In 7 days
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        registrationDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        maxTeams: 8,
        format: 'KNOCKOUT',
        rules: 'Standard FIFA rules apply. Extra time (2x15 mins) followed by penalty shootout on draw.',
        status: 'REGISTRATION_OPEN',
        registeredTeams: [],
      });
      console.log('Seeded Sample Tournament: Boston Collegiate Cup 2026');
    }

    console.log('✅ Seeding completed successfully!');
    if (require.main === module) {
      process.exit(0);
    }
  } catch (err) {
    console.error('Seeding error:', err);
    if (require.main === module) {
      process.exit(1);
    }
  }
}

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
