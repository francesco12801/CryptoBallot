const { Pool } = require('pg');
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 4000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error connecting to the database:', err);
  } else {
    console.log('Connected to the database at:', res.rows[0].now);
  }
});

app.use(cors({
    origin: 'http://localhost:3000'
  }));

// Route
app.get('/', (req, res) => {
  res.json({ message: 'Hello from the backend!' });
});

app.listen(PORT, () => {
  console.log(`Backend is running on port ${PORT}`);
});
