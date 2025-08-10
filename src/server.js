// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const db = require('./db'); // Import DB module

const app = express();
app.use(cors());
app.use(express.json());
app.use('/', routes);

const PORT = process.env.PORT || 3000;
console.log('db module:', db);
console.log('typeof db.getPool:', typeof db.getPool);


(async () => {
  try {
    // Ensure database and connection pool are ready before starting the server
    await db.getPool();
    console.log('✅ Database initialized.');

    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error('❌ Failed to initialize database:', err);
    process.exit(1);
  }
})();
