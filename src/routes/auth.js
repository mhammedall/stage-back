const express = require('express');
const router = express.Router();
const db = require('../db');
const {
  hashPassword,
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken
} = require('../authHelper'); 

console.log('Imported from authHelper:', {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
});

let refreshTokens = new Set();


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

module.exports = router;
