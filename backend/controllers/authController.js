const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    process.env.JWT_SECRET || 'arenaelite_jwt_secret_key_123',
    { expiresIn: '7d' }
  );
};

// @desc Register user
exports.register = async (req, res) => {
  try {
    const { name, email, phone, password, role, district, organizationName } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userRole = role || 'CAPTAIN';
    const approvalStatus = userRole === 'ORGANIZER' ? 'PENDING' : 'APPROVED';

    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role: userRole,
      district,
      organizationName: userRole === 'ORGANIZER' ? organizationName : null,
      approvalStatus,
      isActive: true,
    });

    const token = generateToken(user);

    res.status(201).json({
      message:
        userRole === 'ORGANIZER'
          ? 'Registration successful! Your organizer account is pending Admin approval.'
          : 'Registration successful!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        district: user.district,
        organizationName: user.organizationName,
        approvalStatus: user.approvalStatus,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Your account has been deactivated by the platform administrator.' });
    }

    if (user.role === 'ORGANIZER' && user.approvalStatus !== 'APPROVED') {
      if (user.approvalStatus === 'PENDING') {
        return res.status(403).json({
          message: 'Your organizer account is pending approval by the platform administrator.',
          approvalStatus: 'PENDING',
        });
      }
      if (user.approvalStatus === 'REJECTED') {
        return res.status(403).json({
          message: 'Your organizer registration request was rejected by the administrator.',
          approvalStatus: 'REJECTED',
        });
      }
    }

    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        district: user.district,
        organizationName: user.organizationName,
        approvalStatus: user.approvalStatus,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc Get current user profile
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};