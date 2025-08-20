const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const {
  hashPassword,
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken
} = require('../authHelper');

const RESET_SECRET = process.env.RESET_SECRET;

let refreshTokens = new Set();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});


router.post('/register', async (req, res) => {
  const { first_name, last_name, email, username, password, num_tel, entreprise, role } = req.body;

  if (!first_name || !last_name || !email || !username || !password) {
    return res.status(400).json({
      error: 'First name, last name, email, username and password are required'
    });
  }

  try {
    const pool = await db.getPool();

    const [existing] = await pool.query(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Username or email already taken' });
    }

    const hashed = await hashPassword(password);

    await pool.query(
      `INSERT INTO users (first_name, last_name, email, username, password, role, num_tel, entreprise)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        first_name,
        last_name,
        email,
        username,
        hashed,
        role || 'user',
        num_tel || null,
        entreprise || null
      ]
    );

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('Error during register:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body; 
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password required' });

  try {
    const pool = await db.getPool();

    const [users] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    if (users.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

    const user = users[0];
    const valid = await verifyPassword(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    refreshTokens.add(refreshToken);

    res.json({
      username: user.username,
      email: user.email,
      role: user.role,
      accessToken,
      refreshToken
    });
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/refresh', (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ error: 'Refresh token required' });

  if (!refreshTokens.has(refreshToken)) {
    return res.status(403).json({ error: 'Invalid refresh token' });
  }

  const payload = verifyRefreshToken(refreshToken);
  if (!payload) return res.status(403).json({ error: 'Invalid or expired refresh token' });

  const newAccessToken = generateAccessToken(payload);
  res.json({ accessToken: newAccessToken });
});

router.post('/logout', (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });

  refreshTokens.delete(refreshToken);

  res.json({ message: 'Logged out successfully' });
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });

  try {
    const pool = await db.getPool();
    const [users] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);

    if (users.length === 0) {
      return res.json({ message: "If that email exists, a reset link has been sent" });
    }

    const user = users[0];
    const token = jwt.sign({ id: user.id }, RESET_SECRET, { expiresIn: "15m" });

    const resetLink = `http://localhost:5173/reset-password?token=${token}`;
    console.log("RESET LINK (send via email):", resetLink);

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset Request",
      text: `Click here to reset your password: ${resetLink}`,
      html: `<p>Click <a href="${resetLink}">here</a> to reset your password. This link expires in 15 minutes.</p>`
    });

    res.json({ message: "If that email exists, a reset link has been sent" });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res.status(400).json({ error: "Token and new password required" });
  }

  try {
    const decoded = jwt.verify(token, RESET_SECRET);
    const hashed = await hashPassword(newPassword);

    const pool = await db.getPool();
    await pool.query("UPDATE users SET password = ? WHERE id = ?", [hashed, decoded.id]);

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(400).json({ error: "Invalid or expired token" });
  }
});

module.exports = router;
