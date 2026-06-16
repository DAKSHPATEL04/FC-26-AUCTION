"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Watchlist_js_1 = require("../models/Watchlist.js");
const Season_js_1 = require("../models/Season.js");
const auth_middleware_js_1 = require("../middleware/auth.middleware.js");
const router = (0, express_1.Router)();
// GET /api/watchlist - Get active user's watchlist
router.get("/", auth_middleware_js_1.authenticateJWT, async (req, res) => {
    try {
        const ownerId = req.user?.id;
        if (!ownerId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        // Find latest season or create a default one
        let season = await Season_js_1.Season.findOne().sort({ createdAt: -1 });
        if (!season) {
            season = await Season_js_1.Season.create({
                name: "Default Season",
                status: "setup",
                createdBy: ownerId,
            });
        }
        let watchlist = await Watchlist_js_1.Watchlist.findOne({ ownerId, seasonId: season._id }).populate("players");
        if (!watchlist) {
            watchlist = await Watchlist_js_1.Watchlist.create({
                ownerId,
                seasonId: season._id,
                players: [],
            });
        }
        res.json(watchlist);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// POST /api/watchlist/toggle - Toggle a player in user's watchlist
router.post("/toggle", auth_middleware_js_1.authenticateJWT, async (req, res) => {
    try {
        const ownerId = req.user?.id;
        const { playerId } = req.body;
        if (!ownerId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (!playerId) {
            return res.status(400).json({ message: "Player ID is required" });
        }
        // Find latest season or create a default one
        let season = await Season_js_1.Season.findOne().sort({ createdAt: -1 });
        if (!season) {
            season = await Season_js_1.Season.create({
                name: "Default Season",
                status: "setup",
                createdBy: ownerId,
            });
        }
        let watchlist = await Watchlist_js_1.Watchlist.findOne({ ownerId, seasonId: season._id });
        if (!watchlist) {
            watchlist = await Watchlist_js_1.Watchlist.create({
                ownerId,
                seasonId: season._id,
                players: [],
            });
        }
        const index = watchlist.players.indexOf(playerId);
        let added = false;
        if (index === -1) {
            watchlist.players.push(playerId);
            added = true;
        }
        else {
            watchlist.players.splice(index, 1);
        }
        await watchlist.save();
        res.json({
            message: added ? "Player added to watchlist" : "Player removed from watchlist",
            watchlist,
            added,
        });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.default = router;
