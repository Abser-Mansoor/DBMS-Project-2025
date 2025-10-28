const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');

// Register a new user
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('role').isIn(['student', 'admin']).withMessage('Invalid role'),
  body('rollNumber').if(body('role').equals('student')).notEmpty().withMessage('Roll number is required for students'),
  body('employeeId').if(body('role').equals('admin')).notEmpty().withMessage('Employee ID is required for admins')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role, rollNumber, employeeId } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Check for duplicate roll number or employee ID
    if (role === 'student' && rollNumber) {
      const existingRollNumber = await User.findOne({ rollNumber });
      if (existingRollNumber) {
        return res.status(400).json({ message: 'Roll number already registered' });
      }
    }

    if (role === 'admin' && employeeId) {
      const existingEmployeeId = await User.findOne({ employeeId });
      if (existingEmployeeId) {
        return res.status(400).json({ message: 'Employee ID already registered' });
      }
    }

    // Create new user
    user = new User({
      name,
      email,
      password,
      role,
      ...(role === 'student' && { rollNumber }),
      ...(role === 'admin' && { employeeId })
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        ...(user.role === 'student' && { rollNumber: user.rollNumber }),
        ...(user.role === 'admin' && { employeeId: user.employeeId })
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login user
router.post('/login', [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
  body('role').isIn(['student', 'admin']).withMessage('Invalid role'),
  body('rollNumber').if(body('role').equals('student')).notEmpty().withMessage('Roll number is required for students'),
  body('employeeId').if(body('role').equals('admin')).notEmpty().withMessage('Employee ID is required for admins')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, role, rollNumber, employeeId } = req.body;

    // Find user by email and role
    const user = await User.findOne({ 
      email,
      role,
      ...(role === 'student' ? { rollNumber } : {}),
      ...(role === 'admin' ? { employeeId } : {})
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        ...(user.role === 'student' && { rollNumber: user.rollNumber }),
        ...(user.role === 'admin' && { employeeId: user.employeeId })
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 