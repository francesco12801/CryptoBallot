// const express = require('express');
// const helmet = require('helmet');
// const cors = require('cors');
// const { ethers } = require('ethers');
// const contractABI = require('./abi.json');

// const app = express();
// const port = process.env.PORT || 3000;

// // Middleware
// app.use(helmet());
// app.use(cors());
// app.use(express.json());

// // Contract connection setup
// const provider = new ethers.JsonRpcProvider('https://rpc.sepolia.org');
// const contractAddress = '0x70D4772D570f56AA0DdE57dCA4CbBa72928c7107';
// const contract = new ethers.Contract(
//     contractAddress,
//     contractABI,
//     provider
// );

// // Health check endpoint
// app.get('/health', (req, res) => {
//     res.json({ status: 'healthy' });
// });

// // Example endpoint to read from contract
// app.get('/contract-data', async (req, res) => {
//     try {
//         // Replace with your actual contract method
//         // const data = await contract.yourMethod();
//         res.json({ 
//             message: 'Contract connected successfully',
//             contractAddress 
//         });
//     } catch (error) {
//         console.error('Contract read error:', error);
//         res.status(500).json({ error: error.message });
//     }
// });
// // Example endpoint for contract transaction
// app.post('/contract-transaction', async (req, res) => {
//     try {
//         // Add your transaction logic here
//         res.json({ message: 'Transaction endpoint ready' });
//     } catch (error) {
//         console.error('Transaction error:', error);
//         res.status(500).json({ error: error.message });
//     }
// });

// app.listen(port, () => {
//     console.log(`Server running on port ${port}`);
// });

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