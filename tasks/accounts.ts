import { task, vars } from "hardhat/config";

task("accounts", "Prints the list of accounts", async (_taskArgs, hre) => {
  const mnemonic: string = vars.get("MNEMONIC_Chargepal");
  const wallet = hre.ethers.Wallet.fromPhrase(mnemonic);
  console.log(wallet.privateKey);
});
