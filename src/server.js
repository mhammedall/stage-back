require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const REQUIRE_DB = process.env.REQUIRE_DB !== 'false';

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());
app.use('/', routes);

(async () => {
  try {

    if (REQUIRE_DB) {
      await db.getPool();
      console.log('Database initialized.');
    } else {
      console.log('Database skipped (CI mode).');
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server is running on port ${PORT}`);
    });

  } catch (err) {
    console.error('Startup failed:', err);
    process.exit(1);
  }
})();
