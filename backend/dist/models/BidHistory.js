"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BidHistory = void 0;
const mongoose_1 = require("mongoose");
const bidHistorySchema = new mongoose_1.Schema({
    auctionId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Auction", required: true, index: true },
    playerId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Player", required: true },
    teamId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Team", default: null },
    teamName: { type: String, default: "" },
    amount: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now, index: true },
    isWinningBid: { type: Boolean, default: false },
}, { timestamps: true });
bidHistorySchema.index({ auctionId: 1, timestamp: -1 });
exports.BidHistory = (0, mongoose_1.model)("BidHistory", bidHistorySchema);
