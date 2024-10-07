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
      { expiresIn: '1h' }  
    );

    
    res.status(200).json({ 
      message: 'Login successful', 
      token: token,  
      user: { id: user.id, email: user.email }
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.listen(4002, () => {
  console.log('Login service running on port 4002');
});
