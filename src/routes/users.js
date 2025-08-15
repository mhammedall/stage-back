const express = require('express');
const router = express.Router();
const { getPool } = require('../db');
const { verifyToken } = require('../authHelper');

async function adminOnly(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const payload = verifyToken(token);
  if (!payload) return res.status(403).json({ error: 'Invalid token' });

  if (payload.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

  req.user = payload;
  next();
}

router.get('/', adminOnly, async (req, res) => {
  try {
    const pool = await getPool();
    const [users] = await pool.query(
      'SELECT id, first_name, last_name, email, username, role, num_tel, entreprise, created_at FROM users'
    );
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.get('/:id', adminOnly, async (req, res) => {
  try {
    const pool = await getPool();
    const [users] = await pool.query(
      'SELECT id, first_name, last_name, email, username, role, num_tel, entreprise, created_at FROM users WHERE id = ?',
      [req.params.id]
    );
    if (users.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(users[0]);
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

router.delete('/:id', adminOnly, async (req, res) => {
  try {
    const pool = await getPool();
    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

router.put('/:id', adminOnly, async (req, res) => {
  const { first_name, last_name, email, username, role, num_tel, entreprise } = req.body;

  if (!first_name || !last_name || !email || !username || !role) {
    return res.status(400).json({ error: 'All fields except phone and company are required' });
  }

  try {
    const pool = await getPool();
    const [result] = await pool.query(
      `UPDATE users 
       SET first_name = ?, last_name = ?, email = ?, username = ?, role = ?, num_tel = ?, entreprise = ?
       WHERE id = ?`,
      [first_name, last_name, email, username, role, num_tel || null, entreprise || null, req.params.id]
    );

    if (result.affectedRows === 0) return res.status(404).json({ error: 'User not found' });

    res.json({ message: 'User updated successfully' });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

module.exports = router;
