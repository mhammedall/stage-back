require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const REQUIRE_DB = process.env.REQUIRE_DB !== 'false';

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

const routes = require('./routes');
app.use('/', routes);

(async () => {
  try {
    if (REQUIRE_DB) {
      const db = require('./db'); // ⬅️ import ici seulement
      await db.getPool();
      console.log('Database initialized');
    } else {
      console.log('Database skipped (CI mode)');
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });

  } catch (err) {
    console.error('Startup failed:', err);
    process.exit(1);
  }
})();
// ⬅️ import ici seulement