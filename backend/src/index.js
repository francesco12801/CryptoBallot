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


// Endpoint per connettere il wallet
app.post('/connect-wallet', async (req, res) => {
  const { walletAddress, email } = req.body; // Assicurati di avere anche l'email qui

  if (!walletAddress || !email) {
    return res.status(400).json({ message: 'Wallet address and email are required.' });
  }
  try {
    // Controlla se l'indirizzo del wallet esiste già
    const existingWallet = await pool.query(
      'SELECT * FROM "User" WHERE wallet = $1',
      [walletAddress]
    );

    if (existingWallet.rows.length > 0) {
      return res.status(200).json({ message: 'Wallet already connected', wallet: walletAddress });
    }

    // Controlla se l'email esiste nel database
    const user = await pool.query(
      'SELECT * FROM "User" WHERE email = $1',
      [email]
    );

    if (user.rows.length > 0) {
      return res.status(200).json({ message: 'Email exists and wallet is', email: email, existingWallet: existingWallet });
    }

    if (user.rows.length === 0) {
      return res.status(404).json({ message: 'User with this email not found' });
    }

    // Se il wallet non esiste, aggiorna l'utente con il nuovo indirizzo
    const result = await pool.query(
      'UPDATE "User" SET wallet = $1 WHERE email = $2 RETURNING *',
      [walletAddress, email]
    );
    console.log('user inserted with wallet: ', wall); 

    res.status(200).json({ message: 'Wallet connected successfully', user: result.rows[0] });
  } catch (error) {
    console.error('Error connecting wallet:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/profile', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1]; 
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    // Verifica e decodifica il token per ottenere l'email
    const decoded = jwt.verify(token, 'supersecretkey'); 
    const email = decoded.email; // Ottieni l'email dal token

    // Recupera solo il nome e l'email dell'utente dal database
    const user = await pool.query('SELECT name, email FROM "User" WHERE email = $1', [email]);

    if (user.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Invia solo il nome e l'email come risposta
    const { name, email: userEmail } = user.rows[0];
    res.json({ name, email: userEmail });
  } catch (error) {
    console.error('Error retrieving profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Hello from the backend!' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Backend is running on port ${PORT}`);
});
