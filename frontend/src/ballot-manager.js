import { ethers } from 'ethers';

class BallotManager {
    constructor(contractAddress, abi, signer) {
        this.contract = new ethers.Contract(contractAddress, abi, signer);        
    }

    async startUser(){
        return await this.contract.startUser();
    }

    async getUserInfo(address){
        return await this.contract.getUserInfo(address);
    }

}

export default BallotManager;