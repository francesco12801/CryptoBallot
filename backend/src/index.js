const { Pool } = require('pg');
const express = require('express');
const cors = require('cors');

const jwt = require('jsonwebtoken');
const Web3 = require('web3');
const app = express();
const PORT = process.env.PORT || 4000;
const jwtSecret = process.env.JWT_SECRET || 'supersecretkey';


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

// Create Friends table if it doesn't exist
pool.query(
  `CREATE TABLE IF NOT EXISTS Friends (
            USER_ID INT REFERENCES "User"(ID) ON DELETE CASCADE,
            FRIEND_ID INT REFERENCES "User"(ID) ON DELETE CASCADE,
            CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (USER_ID, FRIEND_ID)
        )`,
  (err, res) => {
    if (err) {
      console.error('Error creating the friends table:', err);
    } else {
      console.log('Friends table created successfully');
    }
  }
);

// Create Friends table if it doesn't exist
pool.query(
  ` CREATE TABLE IF NOT EXISTS "FriendRequests" (
    ID SERIAL PRIMARY KEY,
    REQUESTER_ID INT REFERENCES "User"(ID) ON DELETE CASCADE,
    RECEIVER_ID INT REFERENCES "User"(ID) ON DELETE CASCADE,
    STATUS VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', or 'rejected'
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`,
  (err, res) => {
    if (err) {
      console.error('Error creating the friends table:', err);
    } else {
      console.log('Friends table created successfully');
    }
  }
);

app.use(cors({
  origin: 'http://localhost:3000',
}));

// Route to get your friends
app.get('/friends', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    const userId = decoded.id;

    const friends = await pool.query(
      'SELECT u.ID, u.NAME, u.EMAIL FROM "friends" f JOIN "User" u ON f.FRIEND_ID = u.ID WHERE f.USER_ID = $1',
      [userId]
    );

    res.status(200).json(friends.rows);
  } catch (error) {
    console.error('Error fetching friends:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Route to get your pending requests
app.get('/friends/requests', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    const userId = decoded.id;

    const requests = await pool.query(
      'SELECT fr.ID, u.NAME, u.EMAIL FROM "FriendRequests" fr JOIN "User" u ON fr.REQUESTER_ID = $1 WHERE fr.RECEIVER_ID = u.ID AND fr.STATUS = $2',
      [userId, 'pending']
    );

    res.status(200).json(requests.rows);
  } catch (error) {
    console.error('Error fetching friend requests:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Route to send a friend request
app.post('/friends/request', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { friendId } = req.body;

  try {
    const decoded = jwt.verify(token, jwtSecret);
    const userId = decoded.id;

    // Check if the friendId exists
    const friendExists = await pool.query('SELECT * FROM "User" WHERE ID = $1', [friendId]);
    if (friendExists.rows.length === 0) {
      return res.status(404).json({ error: 'Friend not found', friendId: friendId });
    }

    // Check if a friend request already exists (pending or accepted)
    const existingRequest = await pool.query(
      'SELECT * FROM "FriendRequests" WHERE REQUESTER_ID = $1 AND RECEIVER_ID = $2 AND STATUS = $3',
      [userId, friendId, 'pending']
    );
    if (existingRequest.rows.length > 0) {
      return res.status(400).json({ error: 'Friend request already sent' });
    }

    // Insert a new pending friend request
    await pool.query(
      'INSERT INTO "FriendRequests" (REQUESTER_ID, RECEIVER_ID, STATUS) VALUES ($1, $2, $3)',
      [userId, friendId, 'pending']
    );

    res.status(200).json({ message: 'Friend request sent successfully' });
  } catch (error) {
    console.error('Error sending friend request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



// Route to accept a friend request
app.post('/friends/accept', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { requestId } = req.body;

  try {
    const decoded = jwt.verify(token, jwtSecret);
    const userId = decoded.id;

    // Check if the friend request exists and is pending
    const request = await pool.query(
      'SELECT * FROM "FriendRequests" WHERE ID = $1 AND RECEIVER_ID = $2 AND STATUS = $3',
      [requestId, userId, 'pending']
    );
    if (request.rows.length === 0) {
      return res.status(404).json({ error: 'Friend request not found or already processed' });
    }

    const requesterId = request.rows[0].requester_id;

    // Update the request to accepted
    await pool.query(
      'UPDATE "FriendRequests" SET STATUS = $1 WHERE ID = $2',
      ['accepted', requestId]
    );

    // Insert the friendship into the Friends table
    await pool.query(
      'INSERT INTO "friends" (USER_ID, FRIEND_ID) VALUES ($1, $2), ($2, $1)', // Mutual friendship
      [userId, requesterId]
    );

    res.status(200).json({ message: 'Friend request accepted' });
  } catch (error) {
    console.error('Error accepting friend request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Route to get pending friend requests
app.get('/friends/pending', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    const userId = decoded.id;

    const pendingRequests = await pool.query(
      'SELECT fr.ID, u.NAME, u.EMAIL FROM "FriendRequests" fr JOIN "User" u ON fr.REQUESTER_ID = u.ID WHERE fr.RECEIVER_ID = $1 AND fr.STATUS = $2',
      [userId, 'pending']
    );

    res.status(200).json(pendingRequests.rows);
  } catch (error) {
    console.error('Error retrieving pending requests:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Route to reject a friend request
app.post('/friends/reject', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { requestId } = req.body;

  try {
    const decoded = jwt.verify(token, jwtSecret);
    const userId = decoded.id;

    // Check if the friend request exists and is pending
    const request = await pool.query(
      'SELECT * FROM "FriendRequests" WHERE ID = $1 AND RECEIVER_ID = $2 AND STATUS = $3',
      [requestId, userId, 'pending']
    );
    if (request.rows.length === 0) {
      return res.status(404).json({ error: 'Friend request not found or already processed' });
    }

    // Update the request to rejected
    await pool.query(
      'UPDATE "FriendRequests" SET STATUS = $1 WHERE ID = $2',
      ['rejected', requestId]
    );

    res.status(200).json({ message: 'Friend request rejected' });
  } catch (error) {
    console.error('Error rejecting friend request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/friends/check/:id', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const { id } = req.params;
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    const userId = decoded.id;

    const friends = await pool.query(
      'SELECT * FROM "friends" f JOIN "User" u ON f.FRIEND_ID = $1 WHERE f.USER_ID = $2',
      [id, userId]
    );
    if (friends.rows.length === 0) {
      return res.status(404).json({ message: 'false' });
    } else {
      return res.status(200).json({ message: 'true' });
    }
  } catch (error) {
    console.error('Error fetching friends:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

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

    console.log("Trying to make a call to the contract service");



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

// Route to get user details
app.get('/profile/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('SELECT * FROM "User" WHERE ID = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});




// Start the server
app.listen(PORT, () => {
  console.log(`Backend is running on port ${PORT}`);
});
