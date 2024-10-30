import { ethers } from 'ethers';
const { BigNumber } = require('ethers');
const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000';

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

    async getAllBallots(){
        console.log("fetching ballots");
        let i= 1;
        let error = false;
        let ballots = [];
        let expiredBallots = [];
        let currentTime = BigNumber.from(Math.floor(Date.now() / 1000));
        console.log("Current time:", currentTime);
        while (!error) {
            try {
                let ballot = await this.contract.getBallotAB(i);
                
                if (ballot.endTime.gt(currentTime)) {
                    ballots.push({
                        id: ballot.ballotId.toNumber(),
                        type: ballot.ballotType,
                        title: ballot.ballotName,
                        creatorAddress: ballot.creatorAddress,
                        endTime: ballot.endTime.toString(),
                        expiresIn: ballot.endTime.sub(currentTime).toNumber(),
                    });
                } else {
                    expiredBallots.push({
                        id: ballot.ballotId.toNumber(),
                        type: ballot.ballotType,
                        title: ballot.ballotName,
                        creatorAddress: ballot.creatorAddress,
                        endTime: ballot.endTime.toString(),
                        expiresIn: ballot.endTime.sub(currentTime).toNumber(),
                    });
                }
                i++;
            } catch (err) {
                if (err.error.code === -32603) {
                    error = false;
                    console.log("Not AB ballot, try to get ME")
                    try {
                        let ballot = await this.contract.getBallotME(i);
                        /* console.log("start time", ballot.startTime.toString());
                        console.log("end time", ballot.endTime.toString());
                        let duration = ballot.endTime.sub(ballot.startTime);
                        console.log("duration", duration.toString());
                        console.log("current time", currentTime.toString());
                        console.log("expires in ", ballot.endTime.sub(currentTime).toNumber()); */
                        if (ballot.endTime.gt(currentTime)) {
                            ballots.push({
                                id: ballot.ballotId.toNumber(),
                                type: ballot.ballotType,
                                title: ballot.ballotName,
                                creatorAddress: ballot.creatorAddress,
                                endTime: ballot.endTime.toString(),
                                expiresIn: ballot.endTime.sub(currentTime).toNumber(),
                            });
                        } else {
                            expiredBallots.push({
                                id: ballot.ballotId.toNumber(),
                                type: ballot.ballotType,
                                title: ballot.ballotName,
                                creatorAddress: ballot.creatorAddress,
                                endTime: ballot.endTime.toString(),
                            });
                        }
                        i++;
                    } catch (err) {
                        error = true;
                        console.error("Error getting ME ballot");
                    }
                } else {
                    error = true;
                    console.error("Error getting AB ballot");
                }
            }
        }
        return { ballots, expiredBallots };
    }

    async getBallot(id){
        let currentTime = BigNumber.from(Math.floor(Date.now() / 1000));
        try {
            let ballot = await this.contract.getBallotAB(id);
            console.log("Ballot info:", ballot);
            return {
                id: ballot.ballotId.toNumber(),
                type: ballot.ballotType,
                title: ballot.ballotName,
                creatorAddress: ballot.creatorAddress,
                endTime: ballot.endTime.toString(),
                expiresIn: ballot.endTime.sub(currentTime).toNumber(),
                option0: ballot.option0,
                option1: ballot.option1,
                votes0: ballot.option0votes.toNumber(),
                votes1: ballot.option1votes.toNumber(),
                totalVotes: ballot.totalVotes,
            };
        } catch (err) {
            if (err.error.code === -32603) {
                console.log("Not AB ballot, try to get ME")
                try {
                    let ballot = await this.contract.getBallotME(id);
                    return {
                        id: ballot.ballotId.toNumber(),
                        type: ballot.ballotType,
                        title: ballot.ballotName,
                        creatorAddress: ballot.creatorAddress,
                        endTime: ballot.endTime.toString(),
                        expiresIn: ballot.endTime.sub(currentTime).toNumber(),
                        options: ballot.options,
                        votes: ballot.votes.map(vote => vote.toNumber()),
                        totalVotes: ballot.totalVotes.toNumber(),
                    };
                } catch (err) {
                    console.error("Error getting ME ballot");
                }
            } else {
                console.error("Error getting AB ballot");
            }
        }
    }

    async createBallotAB(title, option0, option1, duration){
        let tx = await this.contract.createBallotAB(title, option0, option1, duration);
        await tx.wait();
        console.log("Transaction completed! Hash:", tx.hash);
        return tx.hash;
    }

    async createBallotME(title, options, duration){
        let tx = await this.contract.createBallotME(title, options, duration);
        await tx.wait();
        console.log("Transaction completed! Hash:", tx.hash);
        return tx.hash;
    }
}

export default BallotManager;