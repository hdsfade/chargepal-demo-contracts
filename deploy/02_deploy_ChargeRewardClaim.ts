import { ethers, network } from "hardhat";
import { DeployFunction, ProxyOptions } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { readAddressList, storeAddressList } from "../scripts/contractAddress";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const addressList = readAddressList();
  const proxyOptions: ProxyOptions = {
    proxyContract: "OpenZeppelinTransparentProxy",
  };
  const chargeRewardClaim = await deploy("ChargeRewardClaim", {
    contract: "ChargeRewardClaim",
    from: deployer,
    proxy: proxyOptions,
    args: [],
    log: true,
  });
  addressList[network.name].ChargeRewardClaim = chargeRewardClaim.address;
  const chargepalAddress = addressList[network.name].ChargepalToken;
  const ChargepalNFTAddress = addressList[network.name].ChargepalNFT;
  const chargeRewardClaimIns = await ethers.getContractAt("ChargeRewardClaim", chargeRewardClaim.address);
  let tx = await chargeRewardClaimIns.initialize(chargepalAddress, ChargepalNFTAddress);
  console.log("tx: ", tx.hash);
  tx.wait();

  storeAddressList(addressList);
  tx = await chargeRewardClaimIns.setNotifier(deployer);
  console.log("set notifier tx: ", tx.hash);
  tx.wait();
};
export default func;
func.id = "deploy_chargeRewardClaim"; // id required to prevent reexecution
func.tags = ["chargeRewardClaim"];
