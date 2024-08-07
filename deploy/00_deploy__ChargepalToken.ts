import { ethers, network } from "hardhat";
import { DeployFunction, ProxyOptions } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { readAddressList, storeAddressList } from "../scripts/contractAddress";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const addressList = readAddressList();

  const chargepal = await deploy("ChargepalToken", {
    from: deployer,
    args: [],
    log: true,
  });

  addressList[network.name].ChargepalToken = chargepal.address;
  console.log(`Mock chargepal contract: `, chargepal.address);
  storeAddressList(addressList);
  const chargepalIns = await ethers.getContractAt("ChargepalToken", chargepal.address)
  let tx = await chargepalIns.addMinter(deployer)
  console.log("tx: ", tx.hash)
  tx.wait()
};
export default func;
func.id = "deploy_mockToken"; // id required to prevent reexecution
func.tags = ["chargepal"];
