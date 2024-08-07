import { format } from "date-fns";
import fs from "fs";
import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";
import path from "path";
import * as winston from "winston";

import { Generator, Recipient } from "../scripts/generateMerkle";

export const logger = winston.createLogger({
  level: "info",
  format: winston.format.simple(),
  transports: [new winston.transports.Console(), new winston.transports.File({ filename: "generator.log" })],
});

export type RecipientProof = {
  id: string;
  value: string;
  proof: string[];
};

task("generateMerkleProof")
  .addParam("id", "account address")
  .addParam("quota", "account quota")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const currentDate = new Date();
    const formattedDate = format(currentDate, "yyyy-MM-dd");
    const filePath = path.join(__dirname, "../info/", `reward-${formattedDate}.json`);
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

    const id = taskArguments.id;
    const quota = taskArguments.quota.toString();

    const generator = new Generator(recipient);
    await generator.generateProof(id, quota);
  });

task("generateMerkleRoot").setAction(async function (taskArguments: TaskArguments, hre) {
  const filePath = path.join(__dirname, "../info/", `reward-output.json`);
  const outputPath = path.join(__dirname, "../info/", `merkle-output.json`);
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

task("generateMerkleProofs").setAction(async function (taskArguments: TaskArguments, hre) {
  const filePath = path.join(__dirname, "../info/", `reward-output.json`);
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
    const proof = await generator.generateProof(recipient.id, recipient.value);
    recipientProofs.push({
      id: recipient.id,
      value: recipient.value,
      proof: proof,
    });
  }

  let recipientProofsJson = JSON.stringify(recipientProofs);
  fs.writeFileSync("recipientProofs.json", recipientProofsJson);
});
