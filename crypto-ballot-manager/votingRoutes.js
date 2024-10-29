const express = require('express');
const { ethers } = require('ethers');
const router = express.Router();
const VotingService = require('./votingService');


// const privateKey = "90a8fc6fd5ccc2e5a601d396807098495bf5c5df2804ee86fd1f470b27350e30"; 
// const privateKey2 = "9c3b32275f6f5834acdbeef8ca6da702f666af49861c044c42f7a210c6348b0f"; 


// User routes

router.post('/start-user', async (req, res) => {
    
    try {
        
        
        // Crea un'istanza di ethers.Wallet utilizzando la chiave privata dell'utente
        const privateKey = '37a2751860b8ef5cf2b02b329de16417db28b1b7a03a2898596996dcf8c0cbeb';
        const wallet = new ethers.Wallet(privateKey, new ethers.JsonRpcProvider('https://rpc.sepolia.org'));

        // Crea un'istanza di VotingService utilizzando il wallet
        const votingService = new VotingService(wallet);


        // Chiama la funzione startUser()
        const result = await votingService.startUser();

        res.json({
            success: true,
            transactionHash: result.transactionHash,
            blockNumber: result.blockNumber
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/user/:address', async (req, res) => {
    const { address } = req.params;
    console.log('Getting user info for address, we are in routes:', address);
    try {
        const votingService = new VotingService();
        const userInfo = await votingService.getUserInfo(address);
        res.json(userInfo);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});






module.exports = router;