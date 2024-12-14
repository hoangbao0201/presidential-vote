const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Votting Contract", function () {
    let Votting, votting;
    let owner, voter1, voter2;

    beforeEach(async function () {
        // Deploy the contract before each test
        Votting = await ethers.getContractFactory("Votting");
        votting = await Votting.deploy();

        // Get the owner and some test accounts
        [owner, voter1, voter2] = await ethers.getSigners();
    });

    it("Should create an election successfully", async function () {
        await votting.createElection(
            "Election 1",
            60, // Duration in minutes
            ["Alice", "Bob"], // Candidates
            [voter1.address, voter2.address], // Allowed voters
            "Presidential Election"
        );

        const electionDetails = await votting.detailElection(1);
        expect(electionDetails[0]).to.equal("Election 1"); // Name
        expect(electionDetails[4]).to.equal("Presidential Election"); // Description
    });

    it("Should allow voting and count votes correctly", async function () {
        await votting.createElection(
            "Election 1",
            60,
            ["Alice", "Bob"],
            [voter1.address, voter2.address],
            "Presidential Election"
        );

        // Voter1 votes for Alice
        await votting.connect(voter1).vote(1, "Alice");

        // Voter2 votes for Bob
        await votting.connect(voter2).vote(1, "Bob");

        const aliceVotes = await votting.getVotes(1, "Alice");
        const bobVotes = await votting.getVotes(1, "Bob");

        expect(aliceVotes).to.equal(1);
        expect(bobVotes).to.equal(1);
    });

    it("Should not allow double voting", async function () {
        await votting.createElection(
            "Election 1",
            60,
            ["Alice", "Bob"],
            [voter1.address],
            "Presidential Election"
        );

        await votting.connect(voter1).vote(1, "Alice");
        await expect(votting.connect(voter1).vote(1, "Alice")).to.be.revertedWith("You have already voted");
    });

    it("Should not allow voting after election ends", async function () {
        await votting.createElection(
            "Election 1",
            1, // Duration of 1 minute
            ["Alice", "Bob"],
            [voter1.address],
            "Presidential Election"
        );

        // Fast-forward time to after the election ends
        await ethers.provider.send("evm_increaseTime", [60 * 2]);
        await ethers.provider.send("evm_mine");

        await expect(votting.connect(voter1).vote(1, "Alice")).to.be.revertedWith("Election has ended");
    });

    it("Should allow updating allowed voters", async function () {
        await votting.createElection(
            "Election 1",
            60,
            ["Alice", "Bob"],
            [voter1.address],
            "Presidential Election"
        );

        await votting.setAllowedVoters(1, [voter2.address]);

        // Voter1 should not be allowed to vote
        await expect(votting.connect(voter1).vote(1, "Alice")).to.be.revertedWith("You are not allowed to vote in this election");

        // Voter2 should be allowed to vote
        await votting.connect(voter2).vote(1, "Alice");
        const aliceVotes = await votting.getVotes(1, "Alice");
        expect(aliceVotes).to.equal(1);
    });

    it("Should delete an election successfully", async function () {
        await votting.createElection(
            "Election 1",
            60,
            ["Alice", "Bob"],
            [voter1.address, voter2.address],
            "Presidential Election"
        );

        await votting.deleteElection(1);
        await expect(votting.detailElection(1)).to.be.revertedWith("Election does not exist");
    });

    it("Should get the correct winner of an election", async function () {
        await votting.createElection(
            "Election 1",
            60,
            ["Alice", "Bob"],
            [voter1.address, voter2.address],
            "Presidential Election"
        );

        // Voter1 votes for Alice
        await votting.connect(voter1).vote(1, "Alice");

        // Voter2 votes for Alice
        await votting.connect(voter2).vote(1, "Alice");

        const [winner, votes] = await votting.getElectionWinner(1);
        expect(winner).to.equal("Alice");
        expect(votes).to.equal(2);
    });

    it("Should handle a tie in votes correctly", async function () {
        await votting.createElection(
            "Election 1",
            60,
            ["Alice", "Bob"],
            [voter1.address, voter2.address],
            "Presidential Election"
        );

        // Voter1 votes for Alice
        await votting.connect(voter1).vote(1, "Alice");

        // Voter2 votes for Bob
        await votting.connect(voter2).vote(1, "Bob");

        const [winner, votes] = await votting.getElectionWinner(1);
        expect(winner).to.equal(""); // No winner in case of a tie
        expect(votes).to.equal(0);
    });
});
