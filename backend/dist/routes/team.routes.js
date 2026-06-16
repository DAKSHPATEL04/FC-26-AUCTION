"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mongoose_1 = __importDefault(require("mongoose"));
const Team_js_1 = require("../models/Team.js");
const User_js_1 = require("../models/User.js");
const Season_js_1 = require("../models/Season.js");
const Player_js_1 = require("../models/Player.js");
const auth_middleware_js_1 = require("../middleware/auth.middleware.js");
const router = (0, express_1.Router)();
// GET /api/teams - Get all teams for the active season
router.get("/", async (req, res) => {
    try {
        // Find latest season or create default
        let season = await Season_js_1.Season.findOne().sort({ createdAt: -1 });
        if (!season) {
            // Create a default system season
            const defaultAdmin = await User_js_1.User.findOne({ role: "admin" });
            season = await Season_js_1.Season.create({
                name: "Default Season",
                status: "setup",
                createdBy: defaultAdmin?._id || new mongoose_1.default.Types.ObjectId(),
            });
        }
        const teams = await Team_js_1.Team.find({ seasonId: season._id })
            .populate("ownerId", "name email role")
            .populate("players")
            .lean();
        res.json(teams);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// POST /api/teams - Admin: Create team
router.post("/", auth_middleware_js_1.authenticateJWT, (0, auth_middleware_js_1.requireRole)(["admin"]), async (req, res) => {
    try {
        const { teamName, logo, ownerId, totalBudget = 1000, color = "#3B82F6" } = req.body;
        if (!teamName) {
            return res.status(400).json({ message: "Team name is required" });
        }
        // Find latest season or create default
        let season = await Season_js_1.Season.findOne().sort({ createdAt: -1 });
        if (!season) {
            season = await Season_js_1.Season.create({
                name: "Default Season",
                status: "setup",
                createdBy: req.user.id,
            });
        }
        const newTeam = new Team_js_1.Team({
            teamName,
            logo,
            ownerId: ownerId || null,
            seasonId: season._id,
            totalBudget,
            remainingBudget: totalBudget,
            color,
        });
        await newTeam.save();
        // If ownerId is provided, link it
        if (ownerId) {
            await User_js_1.User.findByIdAndUpdate(ownerId, { teamId: newTeam._id });
        }
        res.status(201).json(newTeam);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// PUT /api/teams/:id - Admin: Update team details
router.put("/:id", auth_middleware_js_1.authenticateJWT, (0, auth_middleware_js_1.requireRole)(["admin"]), async (req, res) => {
    try {
        const { teamName, logo, ownerId, totalBudget, remainingBudget, color } = req.body;
        const team = await Team_js_1.Team.findById(req.params.id);
        if (!team) {
            return res.status(404).json({ message: "Team not found" });
        }
        const oldOwnerId = team.ownerId?.toString();
        if (teamName !== undefined)
            team.teamName = teamName;
        if (logo !== undefined)
            team.logo = logo;
        if (color !== undefined)
            team.color = color;
        if (totalBudget !== undefined)
            team.totalBudget = totalBudget;
        if (remainingBudget !== undefined)
            team.remainingBudget = remainingBudget;
        if (ownerId !== undefined) {
            team.ownerId = ownerId || null;
        }
        await team.save();
        // If owner changed, update User objects
        if (ownerId !== undefined && oldOwnerId !== ownerId) {
            // Remove teamId from old owner
            if (oldOwnerId) {
                await User_js_1.User.findByIdAndUpdate(oldOwnerId, { teamId: null });
            }
            // Add teamId to new owner
            if (ownerId) {
                await User_js_1.User.findByIdAndUpdate(ownerId, { teamId: team._id });
            }
        }
        res.json(team);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// DELETE /api/teams/:id - Admin: Delete team
router.delete("/:id", auth_middleware_js_1.authenticateJWT, (0, auth_middleware_js_1.requireRole)(["admin"]), async (req, res) => {
    try {
        const team = await Team_js_1.Team.findById(req.params.id);
        if (!team) {
            return res.status(404).json({ message: "Team not found" });
        }
        // 1. Unlink owner user
        if (team.ownerId) {
            await User_js_1.User.findByIdAndUpdate(team.ownerId, { teamId: null });
        }
        // 2. Release players back to available
        if (team.players && team.players.length > 0) {
            await Player_js_1.Player.updateMany({ _id: { $in: team.players } }, { $set: { status: "available", soldTo: null, soldPrice: null, soldAt: null } });
        }
        // 3. Delete Team
        await Team_js_1.Team.deleteOne({ _id: team._id });
        res.json({ message: "Team deleted successfully and players released" });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.default = router;
