const { Pool } = require('pg');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const Web3 = require('web3');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Check database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error connecting to the database:', err);
  } else {
    console.log('Connected to the database at:', res.rows[0].now);
  }
});

// Create User table if it doesn't exist
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
  origin: 'http://localhost:3000',
}));


// Endpoint per connettere il 