const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');

const ALLOWED_ROLES = ['hostel', 'ngo', 'admin'];

const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'name, email, password, and role are required',
      });
    }

    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Allowed roles: hostel, ngo, admin',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const query =
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)';
    await db.execute(query, [name, email, hashedPassword, role]);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'Email already exists',
      });
    }

    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'email and password are required',
      });
    }

    const query = 'SELECT id, email, password, role FROM users WHERE email = ?';
    const [rows] = await db.execute(query, [email]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Email not found',
      });
    }

    const user = rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password',
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: 'JWT_SECRET is not configured',
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      role: user.role,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  register,
  login,
};
