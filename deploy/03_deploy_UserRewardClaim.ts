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
  const userRewardClaim = await deploy("UserRewardClaim", {
    contract: "UserRewardClaim",
    from: deployer,
    proxy: proxyOptions,
    args: [],
    log: true,
  });
  addressList[network.name].UserRewardClaim = userRewardClaim.address;
  const chargepalAddress = addressList[network.name].ChargepalToken;
  const ChargepalNFTAddress = addressList[network.name].ChargepalNFT;
  const userRewardClaimIns = await ethers.getContractAt("UserRewardClaim", userRewardClaim.address);
  let tx = await userRewardClaimIns.initialize(chargepalAddress);
  console.log("tx: ", tx.hash);
  tx.wait();

  storeAddressList(addressList);
  tx = await userRewardClaimIns.setNotifier(deployer);
  console.log("set notifier tx: ", tx.hash);
  tx.wait();
};
export default func;
func.id = "deploy_userRewardClaim"; // id required to prevent reexecution
func.tags = ["userRewardClaim"];
