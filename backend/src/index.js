const { Pool } = require('pg');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const app = express();
const PORT = process.env.PORT || 4000;
const jwtSecret = process.env.JWT_SECRET || 'supersecretkey';


const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

//TODO: INITIAL SETUP OF THE DATABASE
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error connecting to the database:', err);
  } else {
    console.log('Connected to the database at:', res.rows[0].now);
  }
});

pool.query(
  `CREATE TABLE IF NOT EXISTS "User" (
            ID SERIAL PRIMARY KEY,
            NAME VARCHAR(100) NOT NULL,
            SURNAME VARCHAR(100) NOT NULL,
            EMAIL VARCHAR(255) UNIQUE NOT NULL,
            HASH_PASS VARCHAR(255) NOT NULL,
            WALLET VARCHAR(255),
            CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
  (err, res) => {
    if (err) {
      console.error('Error creating the users table:', err);
    } else {
      console.log('Users table created successfully');
    }
  }
);

app.use(cors({
    origin: 'http://localhost:3000'
  }));


// Route to get user's name
app.get('/username', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    const userId = decoded.id;

    const result = await pool.query('SELECT NAME FROM "User" WHERE ID = $1', [userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ name: result.rows[0].name });
  } catch (error) {
    console.error('Error fetching user name:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend is running on port ${PORT}`);
});
