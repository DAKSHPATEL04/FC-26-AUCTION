import { Schema, model } from "mongoose";

const watchlistSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    seasonId: { type: Schema.Types.ObjectId, ref: "Season", required: true },
    players: [{ type: Schema.Types.ObjectId, ref: "Player" }],
  },
  { timestamps: true }
);

export const Watchlist = model("Watchlist", watchlistSchema);
