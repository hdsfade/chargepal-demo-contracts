import { impersonateAccount, setBalance } from "@nomicfoundation/hardhat-network-helpers";
import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

import { readAddressList } from "../scripts/contractAddress";


task("setNotifier").setAction(async (taskArguments: TaskArguments, hre) => {
    const { network, ethers } = hre;
    const addressList = readAddressList();
    const { deployer } = await hre.getNamedAccounts();
    const signer = await ethers.getSigner(deployer);
    const chargeRewardClaimAddress = addressList[network.name].ChargeRewardClaim;
  
    const chargeRewardClaim = await ethers.getContractAt("ChargeRewardClaim", chargeRewardClaimAddress);
  
    let tx = await chargeRewardClaim.connect(signer).setNotifier(deployer);
    console.log("set tx: ", tx.hash);
    tx.wait();
  
    //   tx.wait();
  });

task("setMerkleRoot")
  .addParam("root", "root")
  .setAction(async (taskArguments: TaskArguments, hre) => {
    const { network, ethers } = hre;
    const root = taskArguments.root;

    const addressList = readAddressList();
    const chargeRewardClaimAddress = addressList[network.name].ChargeRewardClaim;

    const chargeRewardClaim = await ethers.getContractAt("ChargeRewardClaim", chargeRewardClaimAddress);

    let tx = await chargeRewardClaim.setClaimMerkleRoot(root);
    console.log("set root tx: ", tx.hash);
    tx.wait();
  });

task("topup").setAction(async (taskArguments: TaskArguments, hre) => {
  const { network, ethers } = hre;
  const amount = ethers.parseEther("100");
  const addressList = readAddressList();
  const { deployer } = await hre.getNamedAccounts();
  const chargeTokenAddress = addressList[network.name].ChargepalToken;

  const chargeToken = await ethers.getContractAt("ChargepalToken", chargeTokenAddress);

  let tx = await chargeToken.topUp(amount);
  console.log("topup tx: ", tx.hash);
  tx.wait();

  const balance = await chargeToken.balanceOf(deployer);
  console.log("balance: ", balance);
});

task("nftmint")
  .addParam("account", "account")
  .setAction(async (taskArguments: TaskArguments, hre) => {
    const account = taskArguments.account;
    const { network, ethers } = hre;
    const addressList = readAddressList();
    const { deployer } = await hre.getNamedAccounts();
    console.log("deployer: ", deployer);
    const chargepalNFTAddress = addressList[network.name].ChargepalNFT;

    const chargepalNFT = await ethers.getContractAt("ChargepalNFT", chargepalNFTAddress);

    let tx = await chargepalNFT.mint(account);
    console.log("minttoken tx: ", tx.hash);
    tx.wait();
  });

task("addMinterNFT")
  .addParam("account", "account")
  .setAction(async (taskArguments: TaskArguments, hre) => {
    const account = taskArguments.account;
    const { network, ethers } = hre;
    const addressList = readAddressList();
    const { deployer } = await hre.getNamedAccounts();
    console.log("deployer: ", deployer);
    const chargepalNFTAddress = addressList[network.name].ChargepalNFT;

    const chargepalNFT = await ethers.getContractAt("ChargepalNFT", chargepalNFTAddress);

    let tx = await chargepalNFT.addMinter(account);
    console.log("addMinter tx: ", tx.hash);
    tx.wait();
  });

  task("addMinterToken")
  .addParam("account", "account")
  .setAction(async (taskArguments: TaskArguments, hre) => {
    const account = taskArguments.account;
    const { network, ethers } = hre;
    const addressList = readAddressList();
    const { deployer } = await hre.getNamedAccounts();
    console.log("deployer: ", deployer);
    const chargepalTokenAddress = addressList[network.name].ChargepalToken;
  
    const chargepalToken = await ethers.getContractAt("ChargepalToken", chargepalTokenAddress);

    let tx = await chargepalToken.addMinter(account);
    console.log("addMinter tx: ", tx.hash);
    tx.wait();
  });


  task("mint")
  .addParam("account", "account")
  .addParam("amount", "amount")
  .setAction(async (taskArguments: TaskArguments, hre) => {
    const account = taskArguments.account;
    const amount = taskArguments.amount;
    const { network, ethers } = hre;
    const addressList = readAddressList();
    const chargepalTokenAddress = addressList[network.name].ChargepalToken;

    const chargepalToken = await ethers.getContractAt("ChargepalToken", chargepalTokenAddress);

    let tx = await chargepalToken.mint(account, amount);
    console.log("mint token tx: ", tx.hash);
    tx.wait();
  });