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

router.get('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const pool = await getPool();
    const [rows] = await pool.query(`
      SELECT r.*,
             rooms.name as room_name,
             users.username,
             users.first_name,
             users.last_name
      FROM reservations r
      JOIN rooms ON r.room_id = rooms.id
      JOIN users ON r.user_id = users.id
      ORDER BY r.start_time DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch reservations' });
  }
});

router.get('/user', authenticateToken, async (req, res) => {
  try {
    console.log('Fetching reservations for user:', req.user.id);
    const pool = await getPool();
    const [rows] = await pool.query(`
      SELECT r.*,
             rooms.name as room_name
      FROM reservations r
      JOIN rooms ON r.room_id = rooms.id
      WHERE r.user_id = ?
      ORDER BY r.start_time DESC
    `, [req.user.id]);
    console.log('Found reservations:', rows.length, rows);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching user reservations:', err);
    res.status(500).json({ error: 'Failed to fetch user reservations' });
  }
});

router.get('/room/:roomId', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    console.log('Fetching reservations for room:', roomId);

    const pool = await getPool();
    const [rows] = await pool.query(`
      SELECT r.*,
             users.username,
             users.first_name,
             users.last_name
      FROM reservations r
      JOIN users ON r.user_id = users.id
      WHERE r.room_id = ? AND r.status != 'cancelled'
      ORDER BY r.start_time ASC
    `, [roomId]);

    console.log('Found room reservations:', rows.length, rows);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching room reservations:', err);
    res.status(500).json({ error: 'Failed to fetch room reservations' });
  }
});

router.get('/my', authenticateToken, async (req, res) => {
  try {
    const pool = await getPool();
    const [rows] = await pool.query(`
      SELECT r.*, rooms.name as room_name, rooms.location
      FROM reservations r
      JOIN rooms ON r.room_id = rooms.id
      WHERE r.user_id = ?
      ORDER BY r.start_time DESC
    `, [req.user.id]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch your reservations' });
  }
});

router.get('/room/:roomId', authenticateToken, async (req, res) => {
  try {
    const pool = await getPool();
    const [rows] = await pool.query(`
      SELECT r.*, users.username, users.first_name, users.last_name
      FROM reservations r
      JOIN users ON r.user_id = users.id
      WHERE r.room_id = ? AND r.status != 'cancelled'
      ORDER BY r.start_time ASC
    `, [req.params.roomId]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch room reservations' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { room_id, start_time, end_time, purpose } = req.body;

    if (!room_id || !start_time || !end_time) {
      return res.status(400).json({ error: 'Room ID, start time, and end time are required' });
    }

    const startDate = new Date(start_time);
    const endDate = new Date(end_time);

    if (startDate >= endDate) {
      return res.status(400).json({ error: 'End time must be after start time' });
    }

    if (startDate < new Date()) {
      return res.status(400).json({ error: 'Cannot book in the past' });
    }

    const pool = await getPool();

    const [roomCheck] = await pool.query('SELECT * FROM rooms WHERE id = ?', [room_id]);
    if (roomCheck.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (!roomCheck[0].availability) {
      return res.status(400).json({ error: 'Room is not available' });
    }

    const [conflicts] = await pool.query(`
      SELECT * FROM reservations
      WHERE room_id = ?
      AND status != 'cancelled'
      AND (
        (start_time <= ? AND end_time > ?) OR
        (start_time < ? AND end_time >= ?) OR
        (start_time >= ? AND end_time <= ?)
      )
    `, [room_id, start_time, start_time, end_time, end_time, start_time, end_time]);

    if (conflicts.length > 0) {
      return res.status(409).json({ error: 'Room is already booked for this time slot' });
    }

    const [result] = await pool.query(`
      INSERT INTO reservations (room_id, user_id, start_time, end_time, purpose, status)
      VALUES (?, ?, ?, ?, ?, 'confirmed')
    `, [room_id, req.user.id, start_time, end_time, purpose || '']);

    console.log('Reservation created:', {
      id: result.insertId,
      room_id,
      user_id: req.user.id,
      start_time,
      end_time,
      purpose,
      status: 'confirmed'
    });

    res.status(201).json({
      id: result.insertId,
      room_id,
      user_id: req.user.id,
      start_time,
      end_time,
      purpose,
      status: 'confirmed',
      message: 'Reservation created successfully'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create reservation' });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { start_time, end_time, purpose, status } = req.body;
    const reservationId = req.params.id;

    const pool = await getPool();

    const [existing] = await pool.query('SELECT * FROM reservations WHERE id = ?', [reservationId]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    if (existing[0].user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You can only modify your own reservations' });
    }

    if (start_time && end_time) {
      const startDate = new Date(start_time);
      const endDate = new Date(end_time);
      
      if (startDate >= endDate) {
        return res.status(400).json({ error: 'End time must be after start time' });
      }

      const [conflicts] = await pool.query(`
        SELECT * FROM reservations 
        WHERE room_id = ? 
        AND id != ?
        AND status != 'cancelled'
        AND (
          (start_time <= ? AND end_time > ?) OR
          (start_time < ? AND end_time >= ?) OR
          (start_time >= ? AND end_time <= ?)
        )
      `, [existing[0].room_id, reservationId, start_time, start_time, end_time, end_time, start_time, end_time]);

      if (conflicts.length > 0) {
        return res.status(409).json({ error: 'Room is already booked for this time slot' });
      }
    }

    const updateFields = [];
    const updateValues = [];

    if (start_time) {
      updateFields.push('start_time = ?');
      updateValues.push(start_time);
    }
    if (end_time) {
      updateFields.push('end_time = ?');
      updateValues.push(end_time);
    }
    if (purpose !== undefined) {
      updateFields.push('purpose = ?');
      updateValues.push(purpose);
    }
    if (status && req.user.role === 'admin') {
      updateFields.push('status = ?');
      updateValues.push(status);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateValues.push(reservationId);

    await pool.query(`
      UPDATE reservations SET ${updateFields.join(', ')} WHERE id = ?
    `, updateValues);

    res.json({ message: 'Reservation updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update reservation' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const reservationId = req.params.id;
    const pool = await getPool();

    const [existing] = await pool.query('SELECT * FROM reservations WHERE id = ?', [reservationId]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    if (existing[0].user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You can only cancel your own reservations' });
    }

    await pool.query('UPDATE reservations SET status = ? WHERE id = ?', ['cancelled', reservationId]);

    res.json({ message: 'Reservation cancelled successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to cancel reservation' });
  }
});

router.get('/availability/:roomId', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const pool = await getPool();
    const [reservations] = await pool.query(`
      SELECT start_time, end_time, purpose, users.username
      FROM reservations r
      JOIN users ON r.user_id = users.id
      WHERE r.room_id = ? 
      AND r.status != 'cancelled'
      AND DATE(r.start_time) BETWEEN ? AND ?
      ORDER BY r.start_time ASC
    `, [roomId, start_date, end_date]);

    res.json(reservations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
});

module.exports = router;