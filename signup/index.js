const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000',
  methods: 'GET,POST',
  credentials: true
}));

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not defined in .env file');
  process.exit(1); 
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
  } else {
    console.log('Connected to the database');
  }
});

app.post('/', async (req, res) => {
  try {
    const { name, surname, email, password } = req.body;

    // Controlla se l'email è già utilizzata
    const existingUser = await pool.query('SELECT * FROM "User" WHERE EMAIL = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Crea un hash della password
    const hashPass = await bcrypt.hash(password, 10);

    // Inserisci l'utente nel database
    const result = await pool.query(
      'INSERT INTO "User" (NAME, SURNAME, EMAIL, HASH_PASS) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, surname, email, hashPass]
    );

    res.status(201).json({
      id: result.rows[0].id,
      name: result.rows[0].name,
      surname: result.rows[0].surname,
      email: result.rows[0].email,
      createdAt: result.rows[0].created_at,
    });
  } catch (error) {
    console.error('Error handling request:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.listen(4001, () => {
  console.log('Signup service running on port 4001');
});
