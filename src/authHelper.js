  const bcrypt = require('bcrypt');
  const jwt = require('jsonwebtoken');

  const JWT_SECRET = 'MyV3ry$3cur3&L0ngS3cretKey123!';
  const JWT_REFRESH_SECRET = 'MyV3ry$3cur3&L0ngR3freshS3cretKey456!';

  async function hashPassword(password) {
    return bcrypt.hash(password, 10);
  }

  async function verifyPassword(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
  }

  function generateAccessToken(user) {
    return jwt.sign({ id: user.id, username: user.username,  role: user.role }, JWT_SECRET, { expiresIn: '15m' });
  }

  function generateRefreshToken(user) {
    return jwt.sign({ id: user.id, username: user.username }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
  }

  function verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch {
      return null;
    }
  }

  function verifyRefreshToken(token) {
    try {
      return jwt.verify(token, JWT_REFRESH_SECRET);
    } catch {
      return null;
    }
  }

  module.exports = {
    hashPassword,
    verifyPassword,
    generateAccessToken,
    generateRefreshToken,
    verifyToken,
    verifyRefreshToken
  };
