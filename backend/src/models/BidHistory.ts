import { Schema, model } from "mongoose";

const bidHistorySchema = new Schema(
  {
    auctionId: { type: Schema.Types.ObjectId, ref: "Auction", required: true, index: true },
    playerId: { type: Schema.Types.ObjectId, ref: "Player", required: true },
    teamId: { type: Schema.Types.ObjectId, ref: "Team", default: null },
    teamName: { type: String, default: "" },
    amount: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now, index: true },
    isWinningBid: { type: Boolean, default: false },
  },
  { timestamps: true }
);

bidHistorySchema.index({ auctionId: 1, timestamp: -1 });

export const BidHistory = model("BidHistory", bidHistorySchema);
