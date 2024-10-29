

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const votingRoutes = require('./votingRoutes');

const app = express();
const port = process.env.PORT || 4005;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/voting', votingRoutes);

// Health check
app.get('/health', (req, res) => {
    console.log('Health check');
    res.json({ status: 'healthy' });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});