const express = require('express');
const router = express.Router();
const authenticateJWT = require('../middleware/authenticate'); 

router.get('/profile', authenticateJWT, (req, res) => {
  res.json({ message: 'Protected data', user: req.user });
});

module.exports = router;  
    