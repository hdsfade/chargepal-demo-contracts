import { impersonateAccount, loadFixture, setBalance } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers, network } from "hardhat";

async function beforeAllFixture() {
  const [owner, signer, user1, user2] = await ethers.getSigners();
  const chargepalNFTFact = await ethers.getContractFactory("ChargepalNFT");
  const chargepalNFT = await chargepalNFTFact.connect(owner).deploy("ChargepalNFT", "ChargepalNFT");
  const chargepalNFTAddress = await chargepalNFT.getAddress();

  // check addSinger func
  await chargepalNFT.addMinter(signer);

  const domain = {
    name: "mintpermit",
    version: "1",
    chainId: network.config.chainId,
    verifyingContract: chargepalNFTAddress,
  };

  const types = {
    MintPermit: [
      { name: "to", type: "address" },
      { name: "txid", type: "string" },
    ],
  };

  return {
    chargepalNFT,
    domain,
    types,
    owner,
    signer,
    user1,
    user2,
  };
}

describe("mintPermit", function () {
  const txid = "1";

  it("successful mint", async function () {
    const { chargepalNFT, domain, types, signer, user1, user2 } = await loadFixture(beforeAllFixture);
    const value = {
      to: user2.address,
      txid: txid,
    };

    const signature = await signer.signTypedData(domain, types, value);
    const { r, s, v } = ethers.Signature.from(signature);
    await chargepalNFT.connect(user2).mintPermit(user2, txid, v, r, s);

    expect(await chargepalNFT.balanceOf(user2)).to.be.equal(1);
    expect(await chargepalNFT.ownerOf(1)).to.be.equal(user2);
  });

  it("reused signature", async function () {
    const { chargepalNFT, domain, types, signer, user1, user2 } = await loadFixture(beforeAllFixture);
    const value = {
      to: user2.address,
      txid: txid,
    };

    const signature = await signer.signTypedData(domain, types, value);
    const { r, s, v } = ethers.Signature.from(signature);
    await chargepalNFT.connect(user2).mintPermit(user2, txid, v, r, s);

    await expect(chargepalNFT.connect(user2).mintPermit(user2, txid, v, r, s)).to.be.revertedWithCustomError(
      chargepalNFT,
      "Reuse",
    );
  });

  it("invalid signature", async function () {
    const { chargepalNFT, domain, types, signer, user1, user2 } = await loadFixture(beforeAllFixture);
    const value = {
      to: user2.address,
      txid: txid,
    };

    const signature = await user1.signTypedData(domain, types, value);
    const { r, s, v } = ethers.Signature.from(signature);

    await expect(chargepalNFT.connect(user2).mintPermit(user2, txid, v, r, s)).to.be.revertedWithCustomError(
      chargepalNFT,
      "InvalidSigner",
    );
  });

  it("mis match", async function () {
    const { chargepalNFT, domain, types, signer, user1, user2 } = await loadFixture(beforeAllFixture);
    const value = {
      to: user2.address,
      txid: txid,
    };

    const signature = await signer.signTypedData(domain, types, value);
    const { r, s, v } = ethers.Signature.from(signature);

    await expect(chargepalNFT.connect(user1).mintPermit(user2, txid, v, r, s)).to.be.revertedWithCustomError(
      chargepalNFT,
      "MisMatch",
    );
  });
  it("duplicate mint", async function () {
    const { chargepalNFT, domain, types, signer, user1, user2 } = await loadFixture(beforeAllFixture);
    let value = {
      to: user2.address,
      txid: txid,
    };

    let signature = await signer.signTypedData(domain, types, value);
    let { r, s, v } = ethers.Signature.from(signature);
    await chargepalNFT.connect(user2).mintPermit(user2, txid, v, r, s);

    value = {
      to: user2.address,
      txid: txid + 1,
    };

    signature = await signer.signTypedData(domain, types, value);
    let { r: r1, s: s1, v: v1 } = ethers.Signature.from(signature);

    await expect(chargepalNFT.connect(user2).mintPermit(user2, txid + 1, v1, r1, s1)).to.be.revertedWithCustomError(
      chargepalNFT,
      "DuplicateMint",
    );
  });
});

describe("mint", function () {
  it("successfully mint", async function () {
    const { owner, user1, chargepalNFT } = await loadFixture(beforeAllFixture);
    await chargepalNFT.connect(owner).addMinter(owner);
    await expect(chargepalNFT.connect(owner).mint(user1)).to.be.changeTokenBalance(chargepalNFT, user1, 1);
  });
});

describe("burn", function () {
  it("successfully burn", async function () {
    const { owner, user1, chargepalNFT } = await loadFixture(beforeAllFixture);
    await chargepalNFT.connect(owner).addMinter(owner);
    await chargepalNFT.connect(owner).mint(user1);

    await chargepalNFT.connect(owner).addBurner(owner);

    await expect(chargepalNFT.connect(owner).burn(1)).to.be.changeTokenBalance(chargepalNFT, user1, -1);
  });
});

describe("access control", function () {
  it("user add minter", async function () {
    const { chargepalNFT, user1, user2 } = await loadFixture(beforeAllFixture);

    await expect(chargepalNFT.connect(user1).addMinter(user2)).to.be.revertedWithCustomError(
      chargepalNFT,
      "OwnableUnauthorizedAccount",
    );
  });

  it("user remove minter", async function () {
    const { chargepalNFT, owner, user1, user2 } = await loadFixture(beforeAllFixture);
    await chargepalNFT.connect(owner).addMinter(user2);
    await expect(chargepalNFT.connect(user1).removeMinter(user2)).to.be.revertedWithCustomError(
      chargepalNFT,
      "OwnableUnauthorizedAccount",
    );
  });

  it("user add burner", async function () {
    const { chargepalNFT, user1, user2 } = await loadFixture(beforeAllFixture);

    await expect(chargepalNFT.connect(user1).addBurner(user2)).to.be.revertedWithCustomError(
      chargepalNFT,
      "OwnableUnauthorizedAccount",
    );
  });

  it("user remove burner", async function () {
    const { chargepalNFT, owner, user1, user2 } = await loadFixture(beforeAllFixture);
    await chargepalNFT.connect(owner).addBurner(user2);
    await expect(chargepalNFT.connect(user1).removeBurner(user2)).to.be.revertedWithCustomError(
      chargepalNFT,
      "OwnableUnauthorizedAccount",
    );
  });

  it("setBaseURI", async function () {
    const { user1, chargepalNFT } = await loadFixture(beforeAllFixture);
    await expect(chargepalNFT.connect(user1).setBaseURI("testuri")).to.be.revertedWithCustomError(
      chargepalNFT,
      "OwnableUnauthorizedAccount",
    );
  });

  it("mint", async function () {
    const { user1, chargepalNFT } = await loadFixture(beforeAllFixture);
    await expect(chargepalNFT.connect(user1).mint(user1)).to.be.revertedWithCustomError(chargepalNFT, "NonMinter");
  });

  it("burn", async function () {
    const { owner, user1, chargepalNFT } = await loadFixture(beforeAllFixture);
    await chargepalNFT.connect(owner).addMinter(owner);
    await chargepalNFT.connect(owner).mint(user1);

    await expect(chargepalNFT.connect(owner).burn(0)).to.be.revertedWithCustomError(chargepalNFT, "NonBurner");
  });
});
