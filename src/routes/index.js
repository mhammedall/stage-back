const express = require('express');
const router = express.Router();


const authRoutes = require('./auth');
const protectedRoutes = require('./protected');
const roomsRoutes = require('./rooms');
const usersRoutes = require('./users');
const reservationsRoutes = require('./reservations');
const contactRoutes = require('./contact');



router.get('/', (req, res) => {
  res.json({ message: 'Hello from Express API!' });
});

router.use('/auth', authRoutes);
router.use('/protected', protectedRoutes);
router.use('/rooms', roomsRoutes);
router.use('/users', usersRoutes);
router.use('/reservations', reservationsRoutes);
router.use('/contact', contactRoutes);


module.exports = router;