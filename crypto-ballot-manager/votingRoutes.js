const express = require('express');
const { ethers } = require('ethers');
const router = express.Router();
const VotingService = require('./votingService');

const votingService = new VotingService();

// User routes
router.post('/start-user', async (req, res) => {
    try {        
        const result = await votingService.startUser();
        res.json({ success: true, transaction: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/user/:address', async (req, res) => {
    try {
        const userInfo = await votingService.getUserInfo(req.params.address);
        res.json(userInfo);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});




module.exports = router;