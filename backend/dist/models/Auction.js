"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Auction = void 0;
const mongoose_1 = require("mongoose");
const auctionSchema = new mongoose_1.Schema({
    seasonId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Season", required: true },
    name: { type: String, required: true },
    status: {
        type: String,
        enum: ["pending", "active", "paused", "completed"],
        default: "pending",
    },
    currentPlayerId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Player", default: null },
    currentBid: { type: Number, default: 0 },
    highestBidderId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Team", default: null },
    timer: { type: Number, default: 30 },
    timerDuration: { type: Number, default: 30 },
    pool: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Player" }],
    completedPlayers: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Player" }],
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    adminId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    teams: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Team" }],
    minBidIncrement: { type: Number, default: 1 },
}, { timestamps: true });
exports.Auction = (0, mongoose_1.model)("Auction", auctionSchema);
