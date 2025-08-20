const express = require('express');
const router = express.Router();
const { getPool } = require('../db');
const { verifyToken } = require('../authHelper');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }

  req.user = payload;
  next();
}

function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

router.get('/', async (req, res) => {
  try {
    const pool = await getPool();
    const [rows] = await pool.query(`
      SELECT r.*,
             COUNT(res.id) as total_reservations,
             COUNT(CASE WHEN res.status = 'confirmed' AND res.start_time > NOW() THEN 1 END) as upcoming_reservations
      FROM rooms r
      LEFT JOIN reservations res ON r.id = res.room_id
      GROUP BY r.id
      ORDER BY r.name ASC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const pool = await getPool();
    const [rows] = await pool.query('SELECT * FROM rooms WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Room not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch room' });
  }
});

router.post('/', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { name, capacity, floor, room_type, location, amenities, image } = req.body;
    if (!name || !capacity || !floor) {
      return res.status(400).json({ error: 'Name, capacity, and floor are required' });
    }

    const validTypes = ['meeting', 'conference', 'training', 'office', 'break_room'];
    if (room_type && !validTypes.includes(room_type)) {
      return res.status(400).json({ error: 'Invalid room type' });
    }

    const pool = await getPool();

    const [existing] = await pool.query('SELECT id FROM rooms WHERE name = ?', [name]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Room name already exists' });
    }

    const [result] = await pool.query(
      'INSERT INTO rooms (name, capacity, floor, room_type, location, amenities, image, availability) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, capacity, floor, room_type || 'meeting', location || '', amenities || '', image || '', true]
    );

    res.status(201).json({
      id: result.insertId,
      name,
      capacity,
      floor,
      room_type: room_type || 'meeting',
      location,
      amenities,
      image,
      availability: true,
      message: 'Room created successfully'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

router.put('/:id', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { name, capacity, floor, room_type, availability, location, amenities, image } = req.body;
    const pool = await getPool();

    const [existing] = await pool.query('SELECT id FROM rooms WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (name) {
      const [nameCheck] = await pool.query('SELECT id FROM rooms WHERE name = ? AND id != ?', [name, req.params.id]);
      if (nameCheck.length > 0) {
        return res.status(409).json({ error: 'Room name already exists' });
      }
    }

    if (room_type) {
      const validTypes = ['meeting', 'conference', 'training', 'office', 'break_room'];
      if (!validTypes.includes(room_type)) {
        return res.status(400).json({ error: 'Invalid room type' });
      }
    }

    const [result] = await pool.query(
      'UPDATE rooms SET name = ?, capacity = ?, floor = ?, room_type = ?, availability = ?, location = ?, amenities = ?, image = ? WHERE id = ?',
      [name, capacity, floor, room_type, availability, location, amenities, image, req.params.id]
    );

    res.json({ message: 'Room updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update room' });
  }
});

router.delete('/:id', authenticateToken, adminOnly, async (req, res) => {
  try {
    const pool = await getPool();

    const [activeReservations] = await pool.query(`
      SELECT COUNT(*) as count
      FROM reservations
      WHERE room_id = ? AND status = 'confirmed' AND end_time > NOW()
    `, [req.params.id]);

    if (activeReservations[0].count > 0) {
      return res.status(409).json({
        error: 'Cannot delete room with active reservations. Please cancel all reservations first.'
      });
    }

    const [result] = await pool.query('DELETE FROM rooms WHERE id = ?', [req.params.id]);

    if (result.affectedRows === 0) return res.status(404).json({ error: 'Room not found' });
    res.json({ message: 'Room deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete room' });
  }
});

module.exports = router;