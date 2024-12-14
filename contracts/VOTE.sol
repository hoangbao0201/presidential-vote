// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract Votting {
    struct Election {
        string name;
        uint256 endTime;
        string[] candidates;
        mapping(string => uint256) votes;
        mapping(address => bool) hasVoted;
        mapping(address => bool) allowedVoters;
        address[] allowedVotersArray;
        string describe;
        bool exists;
    }

    address public owner;
    uint256 public electionID;
    mapping(uint256 => Election) public elections;

    string[] electionNames;

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }

    modifier electionExists(uint256 electionId) {
        require(elections[electionId].exists, "Election does not exist");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function createElection(
        string memory name,
        uint256 durationInMinutes,
        string[] memory candidates,
        address[] memory allowedVoters,
        string memory _describe
    ) public onlyOwner {
        require(candidates.length > 0, "There must be at least one candidate");
        require(
            allowedVoters.length > 0,
            "There must be at least one allowed voter"
        );

        electionID++;

        Election storage newElection = elections[electionID];
        newElection.name = name;
        newElection.endTime = block.timestamp + durationInMinutes * 1 minutes;
        newElection.exists = true;
        newElection.candidates = candidates;
        newElection.describe = _describe;

        for (uint256 i = 0; i < allowedVoters.length; i++) {
            newElection.allowedVoters[allowedVoters[i]] = true;
            newElection.allowedVotersArray.push(allowedVoters[i]);
        }

        electionNames.push(name);
    }

    function setCandidates(
        uint256 electionId,
        string[] memory newCandidates
    ) public onlyOwner electionExists(electionId) returns (bool) {
        require(
            newCandidates.length > 0,
            "There must be at least one candidate"
        );
        Election storage election = elections[electionId];
        delete election.candidates;
        for (uint256 i = 0; i < newCandidates.length; i++) {
            election.candidates.push(newCandidates[i]);
        }
        return true;
    }

    function setAllowedVoters(
        uint256 _electionID,
        address[] memory newAllowedVoters
    ) public onlyOwner electionExists(_electionID) returns (bool) {
        require(
            newAllowedVoters.length > 0,
            "There must be at least one allowed voter"
        );

        Election storage election = elections[_electionID];

        for (uint256 i = 0; i < election.allowedVotersArray.length; i++) {
            address oldVoter = election.allowedVotersArray[i];
            delete election.allowedVoters[oldVoter];
        }
        delete election.allowedVotersArray;

        for (uint256 i = 0; i < newAllowedVoters.length; i++) {
            address newVoter = newAllowedVoters[i];
            election.allowedVoters[newVoter] = true;
            election.allowedVotersArray.push(newVoter);
        }

        return true;
    }

    function deleteElection(
        uint256 electionId
    ) public onlyOwner electionExists(electionId) {
        for (uint256 i = 0; i < electionNames.length; i++) {
            if (
                keccak256(abi.encodePacked(electionNames[i])) ==
                keccak256(abi.encodePacked(elections[electionId].name))
            ) {
                electionNames[i] = electionNames[electionNames.length - 1];
                electionNames.pop();
                break;
            }
        }
        delete elections[electionId];
    }

    function vote(
        uint256 electionId,
        string memory candidate
    ) public electionExists(electionId) {
        Election storage election = elections[electionId];

        require(block.timestamp <= election.endTime, "Election has ended");
        require(
            election.allowedVoters[msg.sender],
            "You are not allowed to vote in this election"
        );
        require(!election.hasVoted[msg.sender], "You have already voted");
        require(
            isCandidate(candidate, election.candidates),
            "Invalid candidate"
        );

        election.votes[candidate]++;
        election.hasVoted[msg.sender] = true;
    }

    function getVotes(
        uint256 electionId,
        string memory candidate
    ) public view electionExists(electionId) returns (uint256) {
        return elections[electionId].votes[candidate];
    }

    function isCandidate(
        string memory candidate,
        string[] memory candidates
    ) internal pure returns (bool) {
        for (uint256 i = 0; i < candidates.length; i++) {
            if (
                keccak256(abi.encodePacked(candidates[i])) ==
                keccak256(abi.encodePacked(candidate))
            ) {
                return true;
            }
        }
        return false;
    }

    function getCandidates(
        uint256 electionId
    ) public view electionExists(electionId) returns (string[] memory) {
        return elections[electionId].candidates;
    }

    function detailElection(
        uint256 electionId
    )
        public
        view
        electionExists(electionId)
        returns (
            string memory name_,
            uint256 endTime_,
            string[] memory candidates_,
            address[] memory allowedVoters_,
            string memory describe_
        )
    {
        name_ = elections[electionId].name;
        endTime_ = elections[electionId].endTime;
        candidates_ = elections[electionId].candidates;
        describe_ = elections[electionId].describe;
        allowedVoters_ = elections[electionId].allowedVotersArray;
    }

    function getAllElectionName() public view returns (string[] memory) {
        return electionNames;
    }

    function getElectionWinner(
        uint _electionId
    ) public view returns (string memory, uint) {
        Election storage election = elections[_electionId];

        uint highestVotes = 0;
        string memory winner = "";
        bool isTie = false;

        for (uint i = 0; i < election.candidates.length; i++) {
            if (election.votes[election.candidates[i]] > highestVotes) {
                highestVotes = election.votes[election.candidates[i]];
                winner = election.candidates[i];
                isTie = false;
            } else if (election.votes[election.candidates[i]] == highestVotes) {
                isTie = true;
            }
        }

        if (isTie) {
            return ("", 0);
        }

        return (winner, highestVotes);
    }
}
