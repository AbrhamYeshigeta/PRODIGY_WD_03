// src/controllers/authController.js
const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma'); // Our Prisma instance
const { signToken, cookieOptions } = require('../utils/token.js');

/* ============================================
   REGISTER — POST /api/auth/register
   ============================================ */
const register = async (req, res, next) => {
  try {
    // 1. Destructure BOTH name and username
    const { name, username, email, password } = req.body;

    // 2. Check if email exists
    const emailExists = await prisma.user.findUnique({ where: { email } });
    if (emailExists) {
      return res.status(409).json({ success: false, message: 'Email already in use' });
    }

    // 3. Check if username exists (ONLY if a username was provided)
    if (username) {
      const usernameExists = await prisma.user.findUnique({ where: { username } });
      if (usernameExists) {
        return res.status(409).json({ success: false, message: 'This username is already taken' });
      }
    }

    // 4. Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 5. Create User
    const user = await prisma.user.create({
      data: {
        name: name, 
        username: username || null, // Saves as NULL if not provided (like for merchants)
        email,
        password: hashedPassword,
        role: 'customer', 
      },
    });

    res.status(201).json({ success: true, user: { id: user.id, name: user.name, role: user.role } });
  } catch (err) {
    next(err);
  }
};

/* ============================================
   LOGIN — POST /api/auth/login
   ============================================ */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Find User
    const user = await prisma.user.findUnique({ where: { email } });

    // 2. Check password
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // 3. Generate Token
    const token = signToken({ id: user.id, role: user.role });
    res.cookie('token', token, cookieOptions);

    // 4. Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    res.json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

/* ============================================
   LOGOUT & GET ME
   ============================================ */
const logout = (req, res) => {
  res.clearCookie('token', { ...cookieOptions, maxAge: 0 });
  res.json({ success: true, message: 'Logged out successfully' });
};

const getMe = async (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      phone: req.user.phone || '',
    },
  });
};

module.exports = { register, login, logout, getMe };