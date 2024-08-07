import { ethers, network } from "hardhat";
import { DeployFunction, ProxyOptions } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { readAddressList, storeAddressList } from "../scripts/contractAddress";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const addressList = readAddressList();

  const chargepalNFT = await deploy("ChargepalNFT", {
    from: deployer,
    args: ["Mock ChargepalNFT", "Mock ChargepalNFT"],
    log: true,
  });

  addressList[network.name].ChargepalNFT = chargepalNFT.address;
  console.log(`Mock chargepalNFT contract: `, chargepalNFT.address);
  storeAddressList(addressList);
  const chargepalNFTIns = await ethers.getContractAt("ChargepalNFT", chargepalNFT.address)
  let tx = await chargepalNFTIns.addMinter(deployer)
  console.log("tx: ", tx.hash)
  tx.wait()
};
export default func;
func.id = "deploy_NFT"; // id required to prevent reexecution
func.tags = ["chargepalNFT"];
