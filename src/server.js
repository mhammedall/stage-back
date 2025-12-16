require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const db = require('./db'); 

const app = express();

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());
app.use('/', routes);
app.listen(3000, () => console.log("Server running on port 3000"));

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    await db.getPool();
    console.log('Database initialized.');

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  }
})();
