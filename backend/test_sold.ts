import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import { Player } from "./src/models/Player.js";
import { Team } from "./src/models/Team.js";
import { BidHistory } from "./src/models/BidHistory.js";

async function test() {
  await mongoose.connect(process.env.MONGODB_URI || "");
  console.log("Connected");

  try {
    const player = await Player.findOne();
    const team = await Team.findOne();
    if (!player || !team) {
      console.log("Missing player or team");
      process.exit(1);
    }

    console.log("Trying Player update...");
    await Player.findByIdAndUpdate(player._id, {
      status: "sold",
      soldTo: team._id,
      soldPrice: 100,
      soldAt: new Date(),
    });
    console.log("Player update success.");

    console.log("Trying Team update...");
    team.players.push(player._id);
    team.remainingBudget -= 100;
    team.squadSize = team.players.length;
    await team.save();
    console.log("Team update success.");

    console.log("Trying BidHistory create...");
    await BidHistory.create({
      playerId: player._id,
      teamId: team._id,
      amount: 100,
      isWinningBid: true,
    });
    console.log("BidHistory create success.");

  } catch (err) {
    console.error("ERROR:", err);
  } finally {
    process.exit(0);
  }
}

test();
