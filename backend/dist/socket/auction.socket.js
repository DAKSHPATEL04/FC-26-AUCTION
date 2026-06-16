"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initAuctionSocket = initAuctionSocket;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const Player_js_1 = require("../models/Player.js");
const Team_js_1 = require("../models/Team.js");
const BidHistory_js_1 = require("../models/BidHistory.js");
const JWT_SECRET = process.env.JWT_SECRET || "supersecretjwtsecretkeyshouldbe32charactersormore!";
// Maximum squad size for validation
const MAX_SQUAD_SIZE = 15;
const OVERTIME_SECONDS = 10; // Sniper protection limit
// In-memory state of the active auction
let state = {
    currentPlayer: null,
    currentBid: 0,
    highestBidder: null,
    timer: 30,
    maxTimer: 30,
    status: "idle",
    minBidIncrement: 10,
    bidHistory: [],
};
let timerInterval = null;
let ioInstance = null;
// Helper to broadcast state to all clients
function broadcastState() {
    if (ioInstance) {
        ioInstance.emit("auction:state", {
            currentPlayer: state.currentPlayer,
            currentBid: state.currentBid,
            highestBidder: state.highestBidder,
            timer: state.timer,
            status: state.status,
            minBidIncrement: state.minBidIncrement,
            bidHistory: state.bidHistory,
        });
    }
}
function initAuctionSocket(io) {
    ioInstance = io;
    // Middleware to authenticate socket connections
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(" ")[1];
        if (!token) {
            return next(new Error("Authentication error: Token missing"));
        }
        jsonwebtoken_1.default.verify(token, JWT_SECRET, (err, decoded) => {
            if (err) {
                return next(new Error("Authentication error: Invalid token"));
            }
            socket.data.user = decoded; // Contains id, role, teamId
            next();
        });
    });
    io.on("connection", (socket) => {
        console.log(`User connected to auction socket: ${socket.data.user.id} (${socket.data.user.role})`);
        // Always send current auction state immediately upon joining
        socket.emit("auction:state", {
            currentPlayer: state.currentPlayer,
            currentBid: state.currentBid,
            highestBidder: state.highestBidder,
            timer: state.timer,
            status: state.status,
            minBidIncrement: state.minBidIncrement,
            bidHistory: state.bidHistory,
        });
        // -----------------------------------------------------------------
        // OWNER EVENTS
        // -----------------------------------------------------------------
        // Event: Place a bid
        socket.on("bid:place", async (data) => {
            try {
                const { amount } = data;
                const user = socket.data.user;
                // Step 1: Authentication check
                if (!user) {
                    return socket.emit("bid:error", { message: "Auth Error: You must be logged in to bid." });
                }
                // Step 2: Authorization check
                if (user.role !== "owner") {
                    return socket.emit("bid:error", { message: "Auth Error: Only owners can place bids." });
                }
                // Step 3: Active Team check
                if (!user.teamId) {
                    return socket.emit("bid:error", { message: "Auth Error: You are not assigned to any team." });
                }
                // Fetch team details to validate
                const team = await Team_js_1.Team.findById(user.teamId);
                if (!team) {
                    return socket.emit("bid:error", { message: "Database Error: Bidding team not found." });
                }
                // Step 4: Active State check
                if (state.status !== "bidding") {
                    return socket.emit("bid:error", { message: "Auction Error: Bidding is closed or paused." });
                }
                // Step 5: Active Player check
                if (!state.currentPlayer) {
                    return socket.emit("bid:error", { message: "Auction Error: No player is currently up for bidding." });
                }
                // Step 6: Time limit check
                if (state.timer <= 0) {
                    return socket.emit("bid:error", { message: "Auction Error: Timer has expired." });
                }
                // Step 7: Minimum Bid Increment check
                const basePrice = state.currentPlayer.basePrice || 10;
                const minRequired = state.highestBidder ? state.currentBid + state.minBidIncrement : basePrice;
                if (amount < minRequired) {
                    return socket.emit("bid:error", { message: `Bid too low! Minimum required bid is ${minRequired} coins.` });
                }
                // Step 8: Prevent Self-Overbid check
                if (state.highestBidder && state.highestBidder._id.toString() === team._id.toString()) {
                    return socket.emit("bid:error", { message: "Auction Error: You are already the highest bidder." });
                }
                // Step 9: Remaining Budget check
                if (team.remainingBudget < amount) {
                    return socket.emit("bid:error", { message: `Insufficient budget! Remaining budget: ${team.remainingBudget} coins.` });
                }
                // Step 10: Squad size check
                if (team.players.length >= MAX_SQUAD_SIZE) {
                    return socket.emit("bid:error", { message: `Squad is full! Maximum size is ${MAX_SQUAD_SIZE} players.` });
                }
                // --- ATOMIC ACTION ---
                // Save the bid details in memory (Node.js single-thread execution guarantees atomic process here)
                state.currentBid = amount;
                state.highestBidder = {
                    _id: team._id.toString(),
                    teamName: team.teamName,
                    logo: team.logo,
                    color: team.color,
                };
                // Add to live bid history feed
                state.bidHistory.unshift({
                    teamId: team._id.toString(),
                    teamName: team.teamName,
                    color: team.color || "#3B82N6",
                    amount,
                    timestamp: new Date(),
                });
                // Overtime / Sniper Protection: Reset timer back to 10 seconds if bid placed in last 10 seconds
                if (state.timer < OVERTIME_SECONDS) {
                    state.timer = OVERTIME_SECONDS;
                }
                // Broadcast updated state
                broadcastState();
                io.emit("bid:broadcast", {
                    teamName: team.teamName,
                    playerName: state.currentPlayer.commonName || state.currentPlayer.name,
                    amount,
                });
            }
            catch (err) {
                console.error("Bid placing error:", err);
                socket.emit("bid:error", { message: "An internal error occurred while placing your bid." });
            }
        });
        // -----------------------------------------------------------------
        // ADMIN CONTROL EVENTS
        // -----------------------------------------------------------------
        // Load next player from pool queue
        socket.on("admin:load_next", async () => {
            if (socket.data.user.role !== "admin")
                return;
            if (state.status === "bidding")
                return;
            try {
                // Find player with status "pool" and lowest auctionPoolOrder
                const nextPlayer = await Player_js_1.Player.findOne({ status: "pool" }).sort({ auctionPoolOrder: 1 });
                if (!nextPlayer) {
                    return socket.emit("admin:error", { message: "No players left in the auction pool queue." });
                }
                state.currentPlayer = nextPlayer;
                state.currentBid = 0;
                state.highestBidder = null;
                state.bidHistory = [];
                state.status = "idle";
                state.timer = 30; // default initial timer
                broadcastState();
            }
            catch (err) {
                socket.emit("admin:error", { message: err.message });
            }
        });
        // Start bidding
        socket.on("admin:start", () => {
            if (socket.data.user.role !== "admin")
                return;
            if (!state.currentPlayer || state.status === "bidding")
                return;
            state.status = "bidding";
            state.timer = 30;
            startCountdown();
            broadcastState();
        });
        // Pause bidding
        socket.on("admin:pause", () => {
            if (socket.data.user.role !== "admin")
                return;
            if (state.status !== "bidding")
                return;
            state.status = "paused";
            if (timerInterval)
                clearInterval(timerInterval);
            broadcastState();
        });
        // Resume bidding
        socket.on("admin:resume", () => {
            if (socket.data.user.role !== "admin")
                return;
            if (state.status !== "paused")
                return;
            state.status = "bidding";
            startCountdown();
            broadcastState();
        });
        // Force Unsold transition
        socket.on("admin:unsold", async () => {
            if (socket.data.user.role !== "admin")
                return;
            if (!state.currentPlayer)
                return;
            await handleUnsoldTransition();
        });
        // Force Sold transition
        socket.on("admin:sold", async () => {
            if (socket.data.user.role !== "admin")
                return;
            if (!state.currentPlayer || !state.highestBidder)
                return;
            await handleSoldTransition();
        });
        // Admin Undo last draft
        socket.on("admin:undo", async () => {
            if (socket.data.user.role !== "admin")
                return;
            try {
                // Find last sold player (most recently updated/sold)
                const lastSoldPlayer = await Player_js_1.Player.findOne({ status: "sold" }).sort({ soldAt: -1 });
                if (!lastSoldPlayer) {
                    return socket.emit("admin:error", { message: "No sold player found to undo." });
                }
                const teamId = lastSoldPlayer.soldTo;
                const refundPrice = lastSoldPlayer.soldPrice || 0;
                if (teamId) {
                    // Remove player from team, refund budget, and recalculate statistics
                    const team = await Team_js_1.Team.findById(teamId);
                    if (team) {
                        team.players = team.players.filter((id) => id.toString() !== lastSoldPlayer._id.toString());
                        team.remainingBudget += refundPrice;
                        team.squadSize = team.players.length;
                        // Recalculate values
                        const draftedPlayers = await Player_js_1.Player.find({ _id: { $in: team.players } });
                        team.teamValue = draftedPlayers.reduce((sum, p) => sum + (p.soldPrice || 0), 0);
                        team.avgRating = draftedPlayers.length > 0
                            ? draftedPlayers.reduce((sum, p) => sum + p.rating, 0) / draftedPlayers.length
                            : 0;
                        await team.save();
                    }
                }
                // Update player model back to "pool" status
                lastSoldPlayer.status = "pool";
                lastSoldPlayer.soldTo = null;
                lastSoldPlayer.soldPrice = null;
                lastSoldPlayer.soldAt = null;
                await lastSoldPlayer.save();
                // Also delete any bid history item for this sale
                await BidHistory_js_1.BidHistory.deleteOne({ playerId: lastSoldPlayer._id, isWinningBid: true });
                // Reset live state
                state.currentPlayer = lastSoldPlayer;
                state.currentBid = 0;
                state.highestBidder = null;
                state.bidHistory = [];
                state.status = "idle";
                state.timer = 30;
                if (timerInterval)
                    clearInterval(timerInterval);
                broadcastState();
                io.emit("auction:undo_broadcast", {
                    playerName: lastSoldPlayer.commonName || lastSoldPlayer.name,
                });
            }
            catch (err) {
                socket.emit("admin:error", { message: err.message });
            }
        });
        socket.on("disconnect", () => {
            console.log(`User disconnected: ${socket.data.user.id}`);
        });
    });
}
// Timer Countdown Loop
function startCountdown() {
    if (timerInterval)
        clearInterval(timerInterval);
    timerInterval = setInterval(async () => {
        if (state.status !== "bidding") {
            if (timerInterval)
                clearInterval(timerInterval);
            return;
        }
        state.timer -= 1;
        if (state.timer <= 0) {
            if (timerInterval)
                clearInterval(timerInterval);
            // Timer finished, resolve auction!
            if (state.highestBidder) {
                await handleSoldTransition();
            }
            else {
                await handleUnsoldTransition();
            }
        }
        else {
            broadcastState();
        }
    }, 1000);
}
// Resolve Auction: SOLD
async function handleSoldTransition() {
    if (!state.currentPlayer || !state.highestBidder || !ioInstance)
        return;
    const player = state.currentPlayer;
    const teamId = state.highestBidder._id;
    const finalPrice = state.currentBid;
    try {
        // 1. Update Player document
        await Player_js_1.Player.findByIdAndUpdate(player._id, {
            status: "sold",
            soldTo: teamId,
            soldPrice: finalPrice,
            soldAt: new Date(),
        });
        // 2. Update Team document (Add player, deduct budget, update averages)
        const team = await Team_js_1.Team.findById(teamId);
        if (team) {
            team.players.push(player._id);
            team.remainingBudget -= finalPrice;
            team.squadSize = team.players.length;
            // Recalculate team statistics
            const draftedPlayers = await Player_js_1.Player.find({ _id: { $in: team.players } });
            team.teamValue = draftedPlayers.reduce((sum, p) => sum + (p.soldPrice || 0), 0);
            team.avgRating = draftedPlayers.reduce((sum, p) => sum + p.rating, 0) / draftedPlayers.length;
            await team.save();
        }
        // 3. Log into BidHistory
        await BidHistory_js_1.BidHistory.create({
            playerId: player._id,
            teamId: teamId,
            amount: finalPrice,
            isWinningBid: true,
        });
        // Reset Live Auction state
        const soldPlayerName = player.commonName || player.name;
        const buyerName = state.highestBidder.teamName;
        state.currentPlayer = null;
        state.currentBid = 0;
        state.highestBidder = null;
        state.bidHistory = [];
        state.status = "idle";
        state.timer = 0;
        broadcastState();
        // Broadcast Sold success event to trigger effects (Confetti!)
        ioInstance.emit("auction:sold_broadcast", {
            playerName: soldPlayerName,
            buyerName,
            price: finalPrice,
            playerImage: player.image,
        });
    }
    catch (err) {
        console.error("Failed to complete SOLD transition:", err);
    }
}
// Resolve Auction: UNSOLD
async function handleUnsoldTransition() {
    if (!state.currentPlayer || !ioInstance)
        return;
    const player = state.currentPlayer;
    try {
        // Update player status in database
        await Player_js_1.Player.findByIdAndUpdate(player._id, {
            status: "unsold",
        });
        const unsoldPlayerName = player.commonName || player.name;
        // Reset Live state
        state.currentPlayer = null;
        state.currentBid = 0;
        state.highestBidder = null;
        state.bidHistory = [];
        state.status = "idle";
        state.timer = 0;
        broadcastState();
        // Broadcast Unsold event
        ioInstance.emit("auction:unsold_broadcast", {
            playerName: unsoldPlayerName,
        });
    }
    catch (err) {
        console.error("Failed to complete UNSOLD transition:", err);
    }
}
