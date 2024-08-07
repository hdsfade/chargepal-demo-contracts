import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

import { Generator, Recipient } from "../../scripts/generateMerkle";

async function beforeAllFixture() {
  const [owner, notifier, user1, user2] = await ethers.getSigners();
  const ids = [1,2];
  const quotas = [10000, 5999];
  const leavesData = JSON.parse(
    `{"recipients":[{"id":"${ids[0]}","value":"${quotas[0]}"},{"id":"${ids[1]}","value":"${quotas[1]}"}]}`,
  );
  const recipient: Recipient[] = leavesData.recipients;
  const generator = new Generator(recipient);
  const claimMerkleRoot = await generator.process("./testreward.json");

  let proofs = [];
  for (let i = 0; i < 2; i++) {
    let proof = await generator.generateProof(ids[i].toString(), quotas[i].toString());
    proofs.push(proof);
  }

  // deploy ChargeToken contracts
  const chargeTokenFact = await ethers.getContractFactory("ChargepalToken");
  const chargeToken = await chargeTokenFact.connect(owner).deploy();
  const chargeTokenAddress = await chargeToken.getAddress();
  console.log("ChargeToken: ", chargeTokenAddress);

  // deploy Reward contracts
  const rewardFact = await ethers.getContractFactory("ChargeRewardClaim");
  const reward = await rewardFact.connect(owner).deploy();
  const rewardAddress = await reward.getAddress();
  console.log("Reward: ", rewardAddress);

  const chargepalNFTFact = await ethers.getContractFactory("ChargepalNFT");
  const chargepalNFT = await chargepalNFTFact.connect(owner).deploy("Charge NFT", "Charge NFT");
  const chargepalNFTAddress = await chargepalNFT.getAddress();
  console.log("chargepalNFTAddress: ", chargepalNFTAddress);

  // initialize Reward contracts
  await reward.connect(owner).initialize(chargeTokenAddress, chargepalNFTAddress);

  // mint charge token to reward
  let tx = await chargeToken.connect(owner).addMinter(owner);
  await chargeToken.mint(rewardAddress, "15999");

  await chargepalNFT.addMinter(owner);
  await chargepalNFT.mint(user1);
  await chargepalNFT.mint(user2);

  // set  merkle root
  await reward.setNotifier(notifier);
  tx = await reward.connect(notifier).setClaimMerkleRoot(claimMerkleRoot);

  return {
    owner,
    user1,
    user2,
    claimMerkleRoot,
    chargeToken,
    chargepalNFT,
    reward,
    rewardAddress,
    ids,
    quotas,
    proofs,
  };
}

describe("setMerkleRoot", function () {
  it("user set Merkle root", async function () {
    const { user1, reward, claimMerkleRoot } = await loadFixture(beforeAllFixture);

    await expect(reward.connect(user1).setClaimMerkleRoot(claimMerkleRoot)).to.be.revertedWithCustomError(
      reward,
      "NonNotifier",
    );
  });
});

describe("claim", function () {
  it("claim: user and his quota is not valid leaf", async function () {
    const { user1, reward, ids, proofs } = await loadFixture(beforeAllFixture);
    const id = ids[0];
    const quota = ethers.parseEther("1");
    const proof = proofs[0];
    await expect(reward.connect(user1).claim(id, quota, 1000, proof)).to.be.revertedWithCustomError(
      reward,
      "NotInMerkle",
    );
  });

  it("claim: not nft owner", async function () {
    const { user2, chargepalNFT, quotas, ids, proofs, reward } = await loadFixture(beforeAllFixture);

    const id = ids[0];
    const quota = quotas[0];
    const proof = proofs[0];

    await expect(reward.connect(user2).claim(id, quota, "100", proof)).to.be.revertedWithCustomError(
      reward,
      "NonNFTOwner",
    );
  });

  it("claim: successfully claim", async function () {
    const { user1, chargeToken, quotas, ids, proofs, reward, rewardAddress } = await loadFixture(beforeAllFixture);

    const id = ids[0];
    const quota = quotas[0];
    const proof = proofs[0];

    await expect(reward.connect(user1).claim(id, quota, "100", proof)).to.be.changeTokenBalance(
      chargeToken,
      user1,
      100,
    );
  });

  it("claim: Insufficient balance", async function () {
    const { user1, chargeToken, quotas, ids, proofs, reward } = await loadFixture(beforeAllFixture);

    const id = ids[0];
    const quota = quotas[0];
    const proof = proofs[0];

    await reward.connect(user1).claim(id, quota, "1000", proof);
    await reward.connect(user1).claim(id, quota, "3500", proof);

    await expect(reward.connect(user1).claim(id, quota, "6000", proof)).to.be.revertedWithCustomError(
      reward,
      "InsufficientBalance",
    );
  });
});

describe("collect", function () {
  it("owner collect token", async function () {
    const { owner, chargeToken, reward } = await loadFixture(beforeAllFixture);
    const chargeTokenAddress = await chargeToken.getAddress();
    const rewardAddress = await reward.getAddress();
    const amount = 1000;

    await expect(reward.connect(owner).collect(chargeTokenAddress, amount, false)).to.be.changeTokenBalances(
      chargeToken,
      [owner, rewardAddress],
      [1000, -1000],
    );
  });

  it("user collect token", async function () {
    const { user1, chargeToken, reward } = await loadFixture(beforeAllFixture);
    const chargeTokenAddress = await chargeToken.getAddress();
    const amount = 1000;

    await expect(reward.connect(user1).collect(chargeTokenAddress, amount, false)).to.be.revertedWithCustomError(
      reward,
      "OwnableUnauthorizedAccount",
    );
  });
});
