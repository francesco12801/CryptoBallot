const { ethers } = require('ethers');
const contractABI = require('./abi.json');

class VotingService {
    constructor() {
        this.provider = new ethers.JsonRpcProvider('https://rpc.sepolia.org');
        this.contractAddress = '0x70D4772D570f56AA0DdE57dCA4CbBa72928c7107';
        this.contract = new ethers.Contract(this.contractAddress, contractABI, this.provider);
    }

    async startUser(userAddress) {
        
        const signer = this.provider.getSigner(userAddress);

        
        const contractWithSigner = this.contract.connect(signer);

        
        try {
            const transaction = await contractWithSigner.startUser(); 
            const receipt = await transaction.wait();

            return {
                transactionHash: receipt.transactionHash,
                blockNumber: receipt.blockNumber,
            };
        } catch (error) {
            console.error('Error executing contract function:', error);
            throw new Error('Transaction failed');
        }
    }



    async getUserInfo(address) {
        try {
            console.log('Getting user info for address:', address); 
            const userInfo = await this.contract.getUserInfo(address);
            return {
                isUser: userInfo.isUser,
                isAdmin: userInfo.isAdmin,
                totalVotes: userInfo.totalVotes.toString(),
                lastVotedBallotId: userInfo.lastVotedBallotId.toString(),
                lastVotedTime: userInfo.lastVotedTime.toString(),
                ballotsCreated: userInfo.ballotsCreated.map(id => id.toString())
            };
        } catch (error) {
            console.error('Error getting user info:', error);
            throw error;
        }
    }


}

module.exports = VotingService;
