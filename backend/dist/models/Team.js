"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Team = void 0;
const mongoose_1 = require("mongoose");
const teamSchema = new mongoose_1.Schema({
    teamName: { type: String, required: true, trim: true },
    logo: { type: String, default: "" },
    ownerId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", default: null },
    seasonId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Season", required: true },
    totalBudget: { type: Number, default: 1000000 },
    remainingBudget: { type: Number, default: 1000000 },
    players: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Player" }],
    squadSize: { type: Number, default: 0 },
    teamValue: { type: Number, default: 0 },
    avgRating: { type: Number, default: 0 },
    color: { type: String, default: "#3B82F6" }, // hex code
}, { timestamps: true });
exports.Team = (0, mongoose_1.model)("Team", teamSchema);
