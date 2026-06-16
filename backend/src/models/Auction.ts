import { Schema, model } from "mongoose";

const auctionSchema = new Schema(
  {
    seasonId: { type: Schema.Types.ObjectId, ref: "Season", required: true },
    name: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "active", "paused", "completed"],
      default: "pending",
    },
    currentPlayerId: { type: Schema.Types.ObjectId, ref: "Player", default: null },
    currentBid: { type: Number, default: 0 },
    highestBidderId: { type: Schema.Types.ObjectId, ref: "Team", default: null },
    timer: { type: Number, default: 30 },
    timerDuration: { type: Number, default: 30 },
    pool: [{ type: Schema.Types.ObjectId, ref: "Player" }],
    completedPlayers: [{ type: Schema.Types.ObjectId, ref: "Player" }],
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    adminId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    teams: [{ type: Schema.Types.ObjectId, ref: "Team" }],
    minBidIncrement: { type: Number, default: 1 },
  },
  { timestamps: true }
);

export const Auction = model("Auction", auctionSchema);
