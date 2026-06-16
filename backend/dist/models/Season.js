"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Season = void 0;
const mongoose_1 = require("mongoose");
const seasonSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    status: {
        type: String,
        enum: ["setup", "active", "completed"],
        default: "setup",
    },
    teams: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Team" }],
    auctions: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Auction" }],
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    settings: {
        defaultBudget: { type: Number, default: 1000 },
        timerDuration: { type: Number, default: 30 },
        minBid: { type: Number, default: 10 },
    },
}, { timestamps: true });
exports.Season = (0, mongoose_1.model)("Season", seasonSchema);
