"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Player = void 0;
const mongoose_1 = require("mongoose");
const playerSchema = new mongoose_1.Schema({
    futdbId: { type: Number, unique: true, sparse: true, index: true },
    name: { type: String, required: true },
    commonName: { type: String, default: "" },
    image: { type: String, default: "" },
    nation: { type: String, default: "" },
    nationFlag: { type: String, default: "" },
    club: { type: String, default: "" },
    clubLogo: { type: String, default: "" },
    league: { type: String, default: "" },
    position: { type: String, required: true },
    positionGroup: { type: String, enum: ["GK", "DEF", "MID", "FWD"], required: true },
    rating: { type: Number, required: true, index: true },
    age: { type: Number, default: 0 },
    height: { type: Number, default: 0 }, // cm
    weight: { type: Number, default: 0 }, // kg
    preferredFoot: { type: String, enum: ["Right", "Left"], default: "Right" },
    weakFoot: { type: Number, default: 1 },
    skillMoves: { type: Number, default: 1 },
    pace: { type: Number, default: 0 },
    shooting: { type: Number, default: 0 },
    passing: { type: Number, default: 0 },
    dribbling: { type: Number, default: 0 },
    defending: { type: Number, default: 0 },
    physical: { type: Number, default: 0 },
    playStyles: [{ type: String }],
    status: {
        type: String,
        enum: ["available", "pool", "sold", "unsold"],
        default: "available",
        index: true,
    },
    auctionPoolOrder: { type: Number, default: null },
    soldTo: { type: mongoose_1.Schema.Types.ObjectId, ref: "Team", default: null },
    soldPrice: { type: Number, default: null },
    soldAt: { type: Date, default: null },
    basePrice: { type: Number, default: 10 },
}, { timestamps: true });
// Indexes
playerSchema.index({ name: "text", commonName: "text" });
playerSchema.index({ position: 1, rating: -1 });
exports.Player = (0, mongoose_1.model)("Player", playerSchema);
