// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

contract Vote {
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

    // Cấu trúc để lưu tên ứng cử viên và số phiếu bầu
    struct CandidateVotes {
        string name;
        uint256 votes;
    }

    address public owner;
    uint256 public electionID;
    mapping(uint256 => Election) public elections;

    uint256[] public electionIDs;

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
        electionIDs.push(electionID);
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

    function getAllElectionNames() public view returns (string[] memory) {
        string[] memory names = new string[](electionIDs.length);
        for (uint256 i = 0; i < electionIDs.length; i++) {
            names[i] = elections[electionIDs[i]].name;
        }
        return names;
    }

    function deleteElection(
        uint256 electionId
    ) public onlyOwner electionExists(electionId) {
        // Lấy thông tin của cuộc bầu cử cần xóa
        Election storage election = elections[electionId];

        // Xóa các mapping liên quan đến cuộc bầu cử
        for (uint256 i = 0; i < election.allowedVotersArray.length; i++) {
            address voter = election.allowedVotersArray[i];
            delete election.allowedVoters[voter]; // Xóa quyền bầu cử của cử tri
        }
        delete election.allowedVotersArray; // Xóa danh sách cử tri cho phép

        // Xóa các mapping khác nếu có (votes, hasVoted)
        for (uint256 i = 0; i < election.candidates.length; i++) {
            string memory candidate = election.candidates[i];
            delete election.votes[candidate]; // Xóa số phiếu bầu của ứng viên
        }
        for (uint256 i = 0; i < election.allowedVotersArray.length; i++) {
            address voter = election.allowedVotersArray[i];
            delete election.hasVoted[voter]; // Xóa trạng thái đã bầu của cử tri
        }

        // Xóa các trường dữ liệu khác của cuộc bầu cử
        delete election.name;
        delete election.endTime;
        delete election.candidates;
        delete election.describe;

        // Đánh dấu cuộc bầu cử không còn tồn tại
        election.exists = false;

        for (uint i = 0; i < electionIDs.length; i++) {
            if (electionIDs[i] == electionId) {
                electionIDs[i] = electionIDs[electionIDs.length - 1];
                electionIDs.pop();
                break;
            }
        }

        // Cuối cùng, xóa election từ mapping
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
        require(
            isCandidate(candidate, elections[electionId].candidates),
            "Invalid candidate"
        );
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
    ) public view electionExists(electionId) returns (CandidateVotes[] memory) {
        Election storage election = elections[electionId];

        CandidateVotes[] memory candidatesWithVotes = new CandidateVotes[](
            election.candidates.length
        );

        for (uint256 i = 0; i < election.candidates.length; i++) {
            candidatesWithVotes[i] = CandidateVotes({
                name: election.candidates[i],
                votes: election.votes[election.candidates[i]]
            });
        }

        return candidatesWithVotes;
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
            return ("", 0); // Trả về chuỗi rỗng và 0 phiếu nếu hòa
        }

        return (winner, highestVotes);
    }
}
