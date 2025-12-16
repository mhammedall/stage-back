require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());
app.use('/', routes);

(async () => {
  try {

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });

  } catch (err) {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  }
})();
console.log("PR smoke test");
