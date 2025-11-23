const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { verifyToken } = require('../middleware/auth');
const bcrypt = require('bcrypt');
const db = require('../SQL/db');

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
    const existinguser = await db.query("SELECT * FROM users WHERE email = $1", [email]);
    if (existinguser.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Check for duplicate roll number or employee ID
    if (role === 'student' && rollNumber) {
      const existingRollNumber = await db.query('SELECT * from users WHERE roll_number = $1', [rollNumber]);
      if (existingRollNumber.rows.length > 0) {
        return res.status(400).json({ message: 'Roll number already registered' });
      }
    }

    if (role === 'admin' && employeeId) {
      const existingEmployeeId = await db.query('SELECT * from users WHERE employee_id = $1', [employeeId]);
      if (existingEmployeeId.rows.length > 0) {
        return res.status(400).json({ message: 'Employee ID already registered' });
      }
    }

    // Create new user
    const hashedPassword = await bcrypt.hash(password, 10);
    const { rows } = await db.query(
      "INSERT INTO users (name, email, password, role, roll_number, employee_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [name, email, hashedPassword, role, rollNumber, employeeId]
    );
    const user = rows[0];

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
    let sql = "SELECT * FROM users WHERE email = $1 AND role = $2";
    let params = [email, role];

    if (role === "student") {
      sql += " AND roll_number = $3";
      params.push(rollNumber);
    }

    if (role === "admin") {
      sql += " AND employee_id = $3";
      params.push(employeeId);
    }

    const{ rows } = await db.query(sql, params);
    const user = rows[0];

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
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
    const { rows } = await db.query("SELECT * FROM users WHERE _id = $1", [req.user.userId]);
    const user = rows[0];
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