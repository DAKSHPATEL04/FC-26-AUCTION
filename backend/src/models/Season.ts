import { Schema, model } from "mongoose";

const seasonSchema = new Schema(
  {
    name: { type: String, required: true },
    status: {
      type: String,
      enum: ["setup", "active", "completed"],
      default: "setup",
    },
    teams: [{ type: Schema.Types.ObjectId, ref: "Team" }],
    auctions: [{ type: Schema.Types.ObjectId, ref: "Auction" }],
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    settings: {
      defaultBudget: { type: Number, default: 1000 },
      timerDuration: { type: Number, default: 30 },
      minBid: { type: Number, default: 10 },
    },
  },
  { timestamps: true }
);

export const Season = model("Season", seasonSchema);
