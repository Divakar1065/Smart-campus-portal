/**
 * Academic Progress and Achievement Tracking System (ATS)
 * Authentication Controller
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { JWT_SECRET } = require('../middleware/authMiddleware');
const demoDataService = require('../services/demoDataService');

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

async function login(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide both username and password.',
    });
  }

  try {
    const users = await db.query(
      `SELECT u.id, u.username, u.email, u.password_hash, u.role,
              s.id AS student_id, s.name AS student_name, s.register_no,
              d.dept_name, s.current_semester
       FROM users u
       LEFT JOIN students s ON u.id = s.user_id
       LEFT JOIN departments d ON s.dept_id = d.id
       WHERE u.username = ? OR u.email = ?
       LIMIT 1`,
      [username.trim(), username.trim()]
    );

    if (!users || users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password.',
      });
    }

    const user = users[0];
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password.',
      });
    }

    const payload = {
      id: user.id,
      username: user.username,
      role: user.role,
      student_id: user.student_id || null,
      name: user.student_name || user.username,
      department: user.dept_name || null,
      semester: user.current_semester || null,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    return res.status(200).json({
      success: true,
      message: 'Authentication successful.',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        student_id: user.student_id || null,
        name: user.student_name || user.username,
        register_no: user.register_no || null,
        department: user.dept_name || null,
        semester: user.current_semester || null,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    if (err.status === 503) {
      const demoUser = demoDataService.findDemoUser(username);
      if (demoUser && demoDataService.verifyDemoPassword(demoUser, password)) {
        const payload = {
          id: demoUser.id,
          username: demoUser.username,
          role: demoUser.role,
          student_id: demoUser.student_id || null,
          name: demoUser.name,
          department: demoUser.dept_name || null,
          semester: demoUser.current_semester || null,
          isOfflineDemo: true,
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

        return res.status(200).json({
          success: true,
          message: 'Authentication successful (Offline Demo Mode).',
          isOfflineDemo: true,
          token,
          user: {
            id: demoUser.id,
            username: demoUser.username,
            email: demoUser.email,
            role: demoUser.role,
            student_id: demoUser.student_id || null,
            name: demoUser.name,
            register_no: demoUser.register_no || null,
            department: demoUser.dept_name || null,
            semester: demoUser.current_semester || null,
          },
        });
      }

      return res.status(503).json({
        success: false,
        message: 'Authentication service temporarily unavailable: Cloud database not connected.',
      });
    }
    return res.status(500).json({
      success: false,
      message: 'An error occurred during authentication.',
    });
  }
}

async function register(req, res) {
  const { username, email, password, role = 'student', name, register_no, dept_id = 1, semester = 1 } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Username, email, and password are required.',
    });
  }

  try {
    const existingUsers = await db.query(
      'SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1',
      [username.trim(), email.trim()]
    );

    if (existingUsers && existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Username or email already exists.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const userResult = await db.query(
      'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [username.trim(), email.trim(), passwordHash, role]
    );

    const userId = userResult.insertId;
    let studentId = null;

    if (role === 'student' && register_no && name) {
      const studentResult = await db.query(
        `INSERT INTO students (user_id, register_no, name, dept_id, current_semester, email)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, register_no.trim(), name.trim(), dept_id, semester, email.trim()]
      );
      studentId = studentResult.insertId;
    }

    return res.status(201).json({
      success: true,
      message: 'Account successfully registered.',
      userId,
      studentId,
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to complete registration.',
    });
  }
}

async function getMe(req, res) {
  try {
    const users = await db.query(
      `SELECT u.id, u.username, u.email, u.role,
              s.id AS student_id, s.name, s.register_no, d.dept_name, s.current_semester, s.avatar_url
       FROM users u
       LEFT JOIN students s ON u.id = s.user_id
       LEFT JOIN departments d ON s.dept_id = d.id
       WHERE u.id = ?
       LIMIT 1`,
      [req.user.id]
    );

    if (!users || users.length === 0) {
      return res.status(404).json({ success: false, message: 'User record not found.' });
    }

    return res.status(200).json({
      success: true,
      user: users[0],
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile.',
    });
  }
}

async function logout(req, res) {
  // Stateless JWT logout is handled client-side by discarding the token
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
}

module.exports = {
  login,
  register,
  getMe,
  logout,
};
