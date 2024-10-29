
const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const cors = require('cors');
const jwt = require('jsonwebtoken');  
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000',  
  methods: 'GET,POST',
  credentials: true
}));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const jwtSecret = process.env.JWT_SECRET || 'supersecretkey';
const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET || 'anothersecretkey'; // Segreto per il refresh token

// Memorizza i refresh token in un array (puoi anche usare un database)
let refreshTokens = []; // In un'applicazione reale, usa un database per memorizzare i refresh token

// Endpoint di login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM "User" WHERE EMAIL = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'User not found' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.hash_pass);

    if (!validPassword) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },  
      jwtSecret,  
      { expiresIn: '15m' }  // Access token scade dopo 15 minuti
    );

    const refreshToken = jwt.sign(
      { id: user.id, email: user.email },  
      refreshTokenSecret,  
      { expiresIn: '100d' }  // Refresh token scade dopo 7 giorni
    );

    
    refreshTokens.push(refreshToken); 
    

    res.status(200).json({ 
      message: 'Login successful', 
      token: token,  
      refreshToken: refreshToken, // Restituisci il refresh token
      user: { id: user.id, email: user.email }
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Endpoint per il rinnovo del token
app.post('/token', (req, res) => {
  const { refreshToken } = req.body;

  // Controlla se il refresh token è valido
  if (!refreshToken || !refreshTokens.includes(refreshToken)) {
    return res.sendStatus(403); // Forbidden
  }

  jwt.verify(refreshToken, refreshTokenSecret, (err, user) => {
    if (err) return res.sendStatus(403); // Forbidden
    
    const newAccessToken = jwt.sign(
      { id: user.id, email: user.email },
      jwtSecret,
      { expiresIn: '15m' } // Scadenza del nuovo access token
    );

    res.json({ accessToken: newAccessToken });
  });
});

// Endpoint per il logout
app.post('/logout', (req, res) => {
  const { refreshToken } = req.body;

  // Rimuovi il refresh token dall'array
  refreshTokens = refreshTokens.filter(token => token !== refreshToken);
  res.sendStatus(204); // No Content
});

app.listen(4002, () => {
  console.log('Login service running on port 4002');
});
