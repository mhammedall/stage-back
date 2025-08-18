const express = require('express');
const router = express.Router();
const authenticateJWT = require('../middleware/authenticate');
const { getPool } = require('../db');
const { hashPassword, verifyPassword } = require('../authHelper');

router.get('/profile', authenticateJWT, async (req, res) => {
  try {
    const pool = await getPool();
    const [users] = await pool.query(
      'SELECT id, first_name, last_name, email, username, role, num_tel, entreprise, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(users[0]);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

router.put('/profile', authenticateJWT, async (req, res) => {
  const { first_name, last_name, email, username, num_tel, entreprise } = req.body;

  if (!first_name || !last_name || !email || !username) {
    return res.status(400).json({ error: 'First name, last name, email, and username are required' });
  }

  try {
    const pool = await getPool();

    const [existing] = await pool.query(
      'SELECT id FROM users WHERE (email = ? OR username = ?) AND id != ?',
      [email, username, req.user.id]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: 'Email or username already taken by another user' });
    }

    const [result] = await pool.query(
      `UPDATE users
       SET first_name = ?, last_name = ?, email = ?, username = ?, num_tel = ?, entreprise = ?
       WHERE id = ?`,
      [first_name, last_name, email, username, num_tel || null, entreprise || null, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const [updatedUser] = await pool.query(
      'SELECT id, first_name, last_name, email, username, role, num_tel, entreprise, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser[0]
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

router.put('/change-password', authenticateJWT, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters long' });
  }

  try {
    const pool = await getPool();

    const [users] = await pool.query(
      'SELECT id, password FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];

    const isCurrentPasswordValid = await verifyPassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const hashedNewPassword = await hashPassword(newPassword);

    const [result] = await pool.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedNewPassword, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

module.exports = router;
    