// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Ballot is ERC721, ERC721Pausable, Ownable {
    uint256 private _nextBallotId = 1;
    bool private transfersDisabled = true;
    uint256 public totalUsers;
    uint256[] private allBallotsAB;
    uint256[] private allBallotsME;

    struct BallotAB {
        string ballotType;
        uint256 ballotId;
        address creatorAddress;
        string ballotName;
        string option0;
        string option1;
        uint256 option0votes;
        uint256 option1votes;
        uint256 totalVotes;
        address[] voters;
        uint256 startTime;
        uint256 endTime;
        uint256 durationHours;
    }

    struct BallotME {
        string ballotType;
        uint256 ballotId;
        address creatorAddress;
        string ballotName;
        string[10] options;
        uint256[10] votes;
        uint256 totalVotes;
        address[] voters;
        uint256 startTime;
        uint256 endTime;
        uint256 durationHours;
    }

    struct User {
        bool isUser;
        bool isAdmin;
        uint256 totalVotes;
        uint256 lastVotedBallotId;
        uint256 lastVotedTime;
        uint256[] ballotsCreated;
    }

    mapping(address => User) private _users; 
    mapping(uint256 => BallotAB) private _ballotsAB; 
    mapping(uint256 => BallotME) private _ballotsME; 

    constructor(address initialOwner)
        ERC721("Ballot NFT", "BALLOT")
        Ownable(initialOwner)
    {}

    // ****************************** User ******************************

    function startUser() public {
        User storage user = _users[msg.sender];
        require(!user.isUser, "User already started");

        user.isUser = true;
        user.isAdmin = false;

        if (msg.sender == owner()) {
            user.isAdmin = true;
        }

        totalUsers += 1;
    }

    function getUserInfo(address userAddress)
        public
        view
        returns (User memory user)
    {
        
        user = _users[userAddress];
    }

    // ****************************** Ballot AB ******************************

    function createBallotAB(
        string memory ballotName,
        string memory option0,
        string memory option1,
        uint256 durationHours
    ) public {
        User storage user = _users[msg.sender];
        require(user.isUser, "User not started yet");
        require(
            user.isAdmin || msg.sender == owner(),
            "No permissions to do this"
        );
        require(durationHours >= 1, "Min ballot duration is 1h");
        _internalMintAB(user, ballotName, option0, option1, durationHours);
    }

    function _internalMintAB(
        User storage user,
        string memory ballotName,
        string memory option0,
        string memory option1,
        uint256 durationHours
    ) internal returns (uint256 ballotId) {
        ballotId = _nextBallotId++;
        allBallotsAB.push(ballotId);

        _safeMint(msg.sender, ballotId);

        BallotAB storage ballotAB = _ballotsAB[ballotId];
        ballotAB.ballotType = "AB";
        ballotAB.ballotId = ballotId;
        ballotAB.creatorAddress = msg.sender;
        ballotAB.ballotName = ballotName;
        ballotAB.option0 = option0;
        ballotAB.option1 = option1;
        ballotAB.startTime = block.timestamp;
        ballotAB.durationHours = durationHours * 60; //* 60;
        ballotAB.endTime = block.timestamp + (durationHours * 60);// * 60);

        user.ballotsCreated.push(ballotId);
    }

    function voteBallotAB(uint256 ballotId, uint256 option) public {
        User storage user = _users[msg.sender];
        require(user.isUser, "User not started yet");
        require(ballotId > 0 && ballotId <= _nextBallotId, "invalid ID");
        require(isBallot(ballotId, allBallotsAB), "The id is not a BallotAB");
        require(option == 0 || option == 1, "Please choose 0 or 1");

        BallotAB storage ballot = _ballotsAB[ballotId];
        require(isBallotActive(ballot.endTime), "Ballot ended!");
        require(!isVoter(msg.sender, ballot.voters), "The user already voted!");

        if (option == 0) {
            ballot.option0votes += 1;
        } else if (option == 1) {
            ballot.option1votes += 1;
        }

        ballot.totalVotes += 1;
        ballot.voters.push(msg.sender);
        user.lastVotedTime = block.timestamp;
            user.lastVotedBallotId = ballotId;

    }

    function getBallotAB(uint256 ballotId)
        public
        view
        returns (BallotAB memory ballot)
    {
        require(ballotId > 0 && ballotId <= _nextBallotId, "invalid ID");
        require(isBallot(ballotId, allBallotsAB), "The id is not a BallotAB");
        ballot = _ballotsAB[ballotId];
    }

    // ****************************** Ballot ME ******************************

    function createBallotME(
        string memory ballotName,
        string[] memory options,
        uint256 durationHours
    ) public {
        User storage user = _users[msg.sender];
        require(user.isUser, "User not started yet");
        require(durationHours >= 1, "Min ballot duration is 1h");
        _internalMintME(user, ballotName, options, durationHours);
    }

    function _internalMintME(
        User storage user,
        string memory ballotName,
        string[] memory options,
        uint256 durationHours
    ) internal returns (uint256 ballotId) {
        ballotId = _nextBallotId++;
        allBallotsME.push(ballotId);
        _safeMint(msg.sender, ballotId);

        BallotME storage ballotME = _ballotsME[ballotId];
        ballotME.ballotType = "ME";
        ballotME.ballotId = ballotId;
        ballotME.creatorAddress = msg.sender;
        ballotME.ballotName = ballotName;
        ballotME.options = setArray(options);
        ballotME.startTime = block.timestamp;
        ballotME.durationHours = durationHours * 60;// * 60;
        ballotME.endTime = block.timestamp + (durationHours * 60);// * 60);

        user.ballotsCreated.push(ballotId);
    }

    function voteBallotME(uint256 ballotId, uint256 optionIndex) public {
        User storage user = _users[msg.sender];
        require(user.isUser, "User not started yet");
        require(ballotId > 0 && ballotId <= _nextBallotId, "invalid ID");
        require(isBallot(ballotId, allBallotsME), "The id is not a BallotME");
        require(optionIndex <= 9, "Please choose an index <= 9");

        BallotME storage ballot = _ballotsME[ballotId];

        require(isBallotActive(ballot.endTime), "Ballot ended!");
        require(!isVoter(msg.sender, ballot.voters), "The user already voted!");

        ballot.votes[optionIndex] += 1;
        ballot.totalVotes += 1;
        ballot.voters.push(msg.sender);
        user.lastVotedTime = block.timestamp;
        user.lastVotedBallotId = ballotId;
    }

    function getBallotME(uint256 ballotId)
        public
        view
        returns (BallotME memory ball)
    {
        require(ballotId > 0 && ballotId <= _nextBallotId, "invalid ID");
        require(isBallot(ballotId, allBallotsME), "The id is not a BallotME");

        ball = _ballotsME[ballotId];
    }

    // ****************************** Admins ******************************

    function setAdmin(address newAdminAddress, bool state) public  {
        User storage user = _users[newAdminAddress];
        User storage sender = _users[msg.sender];
        require(user.isUser, "User does not exist");
        require(sender.isAdmin, "No permissions to do this");

        user.isAdmin = state;
    }

    // ****************************** Utils ******************************

    function setArray(string[] memory inputArray)
        private
        pure
        returns (string[10] memory)
    {
        require(inputArray.length <= 20, "Array exceeds maximum length");

        string[10] memory resultArray;

        for (uint256 i = 0; i < inputArray.length; i++) {
            require(bytes(inputArray[i]).length <= 40, "String too long");
            resultArray[i] = inputArray[i];
        }

        return resultArray;
    }

    function isBallotActive(uint256 endTime)
        private
        view
        returns (bool isActive)
    {
        if (block.timestamp >= endTime) {
            return false;
        } else {
            return true;
        }
    }

    function isVoter(address voterAddress, address[] memory voters)
        private
        pure
        returns (bool)
    {
        for (uint256 i = 0; i < voters.length; i++) {
            if (voters[i] == voterAddress) {
                return true;
            }
        }
        return false;
    }

    function isBallot(uint256 ballotId, uint256[] memory ballotList)
        private
        pure
        returns (bool)
    {
        for (uint256 i = 0; i < ballotList.length; i++) {
            if (ballotList[i] == ballotId) {
                return true;
            }
        }
        return false;
    }

    // CONTRACT SETTINGS

    // Function to pause the contract.
    function pause() public onlyOwner {
        _pause();
    }

    // Function to unpause the contract.
    function unpause() public onlyOwner {
        _unpause();
    }

    // Function to disable or enable NFT transfers.
    function TransfersPaused(bool _setPause) public onlyOwner {
        transfersDisabled = _setPause;
    }



    // Override required by solidity for pause functions.

    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override(ERC721, ERC721Pausable) returns (address) {
        return super._update(to, tokenId, auth);
    }
}
