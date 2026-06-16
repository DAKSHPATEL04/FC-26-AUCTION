"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Watchlist = void 0;
const mongoose_1 = require("mongoose");
const watchlistSchema = new mongoose_1.Schema({
    ownerId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    seasonId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Season", required: true },
    players: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Player" }],
}, { timestamps: true });
exports.Watchlist = (0, mongoose_1.model)("Watchlist", watchlistSchema);
