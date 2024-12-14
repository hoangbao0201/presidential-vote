const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Voting Contract", function () {
    let Voting;
    let votting;
    let owner;
    let voter1;
    let voter2;
    let voter3;

    beforeEach(async function () {
        // Lấy thông tin về các tài khoản
        [owner, voter1, voter2, voter3] = await ethers.getSigners();

        // Deploy hợp đồng
        const VotingFactory = await ethers.getContractFactory("Voting");
        votting = await VotingFactory.deploy();
    });

    it("Nên tạo cuộc bầu cử và lưu trữ thông tin đúng", async function () {
        await votting.createElection(
            "Election 1",
            60,
            ["Alice", "Bob"],
            [voter1.address, voter2.address],
            "Bầu cử Tổng thống"
        );

        const election = await votting.elections(1);
        expect(election.name).to.equal("Election 1");
        expect(election.duration).to.equal(60);
        expect(election.candidates.length).to.equal(2);
        expect(election.voters.length).to.equal(2);
    });

    it("Nên cho phép bỏ phiếu và ngăn ngừa bỏ phiếu hai lần", async function () {
        await votting.createElection(
            "Election 1",
            60,
            ["Alice", "Bob"],
            [voter1.address, voter2.address],
            "Bầu cử Tổng thống"
        );

        await votting.connect(voter1).vote(1, "Alice");

        // Voter1 đã bỏ phiếu, không thể bỏ phiếu lần nữa
        await expect(votting.connect(voter1).vote(1, "Bob")).to.be.revertedWith("You have already voted");

        // Voter2 bỏ phiếu cho Bob
        await votting.connect(voter2).vote(1, "Bob");

        // Kiểm tra số phiếu của các ứng cử viên
        const candidates = await votting.getCandidates(1);
        expect(candidates[0].votes).to.equal(1); // Alice có 1 phiếu
        expect(candidates[1].votes).to.equal(1); // Bob có 1 phiếu
    });

    it("Nên trả về danh sách ứng cử viên với số phiếu bầu của họ", async function () {
        await votting.createElection(
            "Election 1",
            60,
            ["Alice", "Bob"],
            [voter1.address, voter2.address],
            "Bầu cử Tổng thống"
        );

        // Voter1 bỏ phiếu cho Alice
        await votting.connect(voter1).vote(1, "Alice");

        // Voter2 bỏ phiếu cho Bob
        await votting.connect(voter2).vote(1, "Bob");

        // Lấy danh sách ứng cử viên và số phiếu bầu của họ
        const candidates = await votting.getCandidates(1);

        // Kiểm tra các ứng cử viên và số phiếu bầu của họ
        expect(candidates.length).to.equal(2);
        expect(candidates[0].name).to.equal("Alice");
        expect(candidates[0].votes).to.equal(1);
        expect(candidates[1].name).to.equal("Bob");
        expect(candidates[1].votes).to.equal(1);
    });

    it("Nên trả về người thắng cuộc sau khi bầu cử kết thúc", async () => {
        // Tạo cuộc bầu cử
        await voting.createElection("Election 1", 60, candidates, allowedVoters, "Election Description");
    
        // Cử tri bỏ phiếu
        await voting.vote(1, "Alice");
        await voting.vote(1, "Bob");
    
        // Kiểm tra người thắng cuộc
        const [winner, votes] = await voting.getElectionWinner(1);
        assert.equal(winner, "Alice", "Winner should be Alice");
        assert.equal(votes, 1, "Alice should have 1 vote");
    });
    

    it("Nên cập nhật cử tri mới được phép bỏ phiếu", async () => {
        // Tạo cuộc bầu cử
        await voting.createElection("Election 1", 60, candidates, allowedVoters, "Election Description");

        // Cập nhật cử tri mới
        const newAllowedVoters = [accounts[4], accounts[5]];
        await voting.setAllowedVoters(1, newAllowedVoters);

        // Kiểm tra lại danh sách cử tri
        const electionDetails = await voting.detailElection(1);
        assert.equal(electionDetails.allowedVoters_.length, 4, "There should be 4 allowed voters");
    });

});
