import { Schema, model } from "mongoose";

const teamSchema = new Schema(
  {
    teamName: { type: String, required: true, trim: true },
    logo: { type: String, default: "" },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    seasonId: { type: Schema.Types.ObjectId, ref: "Season", required: true },
    totalBudget: { type: Number, default: 1000 },
    remainingBudget: { type: Number, default: 1000 },
    players: [{ type: Schema.Types.ObjectId, ref: "Player" }],
    squadSize: { type: Number, default: 0 },
    teamValue: { type: Number, default: 0 },
    avgRating: { type: Number, default: 0 },
    color: { type: String, default: "#3B82F6" }, // hex code
  },
  { timestamps: true }
);

export const Team = model("Team", teamSchema);
