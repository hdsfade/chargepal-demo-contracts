import { format } from "date-fns";
import fs from "fs";
import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";
import path from "path";
import * as winston from "winston";

import { readAddressList } from "../scripts/contractAddress";
import { Generator, Recipient } from "../scripts/user/generateMerkle";

export const logger = winston.createLogger({
  level: "info",
  format: winston.format.simple(),
  transports: [new winston.transports.Console(), new winston.transports.File({ filename: "user_generator.log" })],
});

export type RecipientProof = {
  address: string;
  value: string;
  proof: string[];
};

task("generateUserMerkleProof")
  .addParam("user", "account address")
  .addParam("quota", "account quota")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const currentDate = new Date();
    const formattedDate = format(currentDate, "yyyy-MM-dd");
    const filePath = path.join(__dirname, "../info/", `user-reward-${formattedDate}.json`);
    if (!fs.existsSync(filePath)) {
      logger.error(`Missing file: ${filePath}`);
      process.exit(1);
    }

    const leavesFile: Buffer = await fs.readFileSync(filePath);
    const leavesData = JSON.parse(leavesFile.toString());

    if (leavesData["recipients"] === undefined) {
      logger.error("Missing leaves");
      process.exit(1);
    }

    const recipient: Recipient[] = leavesData.recipients;

    const user = taskArguments.user;
    const quota = taskArguments.quota.toString();

    const generator = new Generator(recipient);
    await generator.generateProof(user, quota);
  });

task("generateUserMerkleRoot").setAction(async function (taskArguments: TaskArguments, hre) {
  const filePath = path.join(__dirname, "../info/", `user-reward-output.json`);
  const outputPath = path.join(__dirname, "../info/", `user-merkle-output.json`);
  if (!fs.existsSync(filePath)) {
    logger.error(`Missing file: ${filePath}`);
    process.exit(1);
  }

  const leavesFile: Buffer = await fs.readFileSync(filePath);
  const leavesData = JSON.parse(leavesFile.toString());

  if (leavesData["recipients"] === undefined) {
    logger.error("Missing leaves");
    process.exit(1);
  }

  const recipient: Recipient[] = leavesData.recipients;

  const generator = new Generator(recipient);
  await generator.process(outputPath);
});

task("generateUserMerkleProofs").setAction(async function (taskArguments: TaskArguments, hre) {
  const filePath = path.join(__dirname, "../info/", `user-reward-output.json`);
  if (!fs.existsSync(filePath)) {
    logger.error(`Missing file: ${filePath}`);
    process.exit(1);
  }

  const leavesFile: Buffer = await fs.readFileSync(filePath);
  const leavesData = JSON.parse(leavesFile.toString());

  if (leavesData["recipients"] === undefined) {
    logger.error("Missing leaves");
    process.exit(1);
  }

  const recipients: Recipient[] = leavesData.recipients;
  const generator = new Generator(recipients);
  let recipientProofs: RecipientProof[] = [];
  const len = recipients.length;
  for (let i = 0; i < len; i++) {
    const recipient = recipients[i];
    const proof = await generator.generateProof(recipient.user, recipient.value);
    recipientProofs.push({
      address: recipient.user,
      value: recipient.value,
      proof: proof,
    });
  }

  let recipientProofsJson = JSON.stringify(recipientProofs);
  fs.writeFileSync("userRecipientProofs.json", recipientProofsJson);
});

task("setUserMerkleRoot")
  .addParam("root", "root")
  .setAction(async (taskArguments: TaskArguments, hre) => {
    const { network, ethers } = hre;
    const root = taskArguments.root;

    const addressList = readAddressList();
    const userRewardClaimAddress = addressList[network.name].UserRewardClaim;

    const userRewardClaim = await ethers.getContractAt("UserRewardClaim", userRewardClaimAddress);

    let tx = await userRewardClaim.setClaimMerkleRoot(root);
    console.log("set root tx: ", tx.hash);
    tx.wait();
  });
