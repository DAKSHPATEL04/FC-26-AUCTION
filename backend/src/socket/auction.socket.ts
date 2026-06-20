import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { Player } from "../models/Player.js";
import { Team } from "../models/Team.js";
import { User } from "../models/User.js";
import { Season } from "../models/Season.js";
import { BidHistory } from "../models/BidHistory.js";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretjwtsecretkeyshouldbe32charactersormore!";

// Maximum squad size for validation
const MAX_SQUAD_SIZE = 22;
const OVERTIME_SECONDS = 10; // Sniper protection limit

interface ActiveState {
  currentPlayer: any | null;
  currentBid: number;
  highestBidder: any | null; // Team object
  timer: number;
  maxTimer: number;
  status: "idle" | "bidding" | "paused";
  minBidIncrement: number;
  bidHistory: Array<{
    teamId: string;
    teamName: string;
    color: string;
    amount: number;
    timestamp: Date;
  }>;
}

// In-memory state of the active auction
let state: ActiveState = {
  currentPlayer: null,
  currentBid: 0,
  highestBidder: null,
  timer: 30,
  maxTimer: 30,
  status: "idle",
  minBidIncrement: 10,
  bidHistory: [],
};

let timerInterval: NodeJS.Timeout | null = null;
let ioInstance: Server | null = null;
// Guard to prevent double-firing of sold/unsold transition when timer hits 0
let transitionInProgress = false;

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

export function initAuctionSocket(io: Server) {
  ioInstance = io;

  // Middleware to authenticate socket connections
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(" ")[1];

    if (!token) {
      return next(new Error("Authentication error: Token missing"));
    }

    jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
      if (err) {
        return next(new Error("Authentication error: Invalid token"));
      }
      socket.data.user = decoded; // Contains id, role, teamId
      next();
    });
  });

  io.on("connection", (socket: Socket) => {
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
    socket.on("bid:place", async (data: { amount: number }) => {
      try {
        const { amount } = data;
        const user = socket.data.user;

        // Step 1: Authentication check
        if (!user) {
          console.log("Bid rejected: No user");
          return socket.emit("bid:error", { message: "Auth Error: You must be logged in to bid." });
        }

        // Step 2: Authorization check
        if (user.role !== "owner") {
          console.log("Bid rejected: Not owner");
          return socket.emit("bid:error", { message: "Auth Error: Only owners can place bids." });
        }

        // Step 3: Active Team check
        if (!user.teamId) {
          console.log("Bid rejected: No teamId");
          return socket.emit("bid:error", { message: "Auth Error: You are not assigned to any team." });
        }

        // Fetch team details to validate
        const team = await Team.findById(user.teamId);
        if (!team) {
          console.log("Bid rejected: Team not found in DB");
          return socket.emit("bid:error", { message: "Database Error: Bidding team not found." });
        }

        // Step 4: Active State check
        if (state.status !== "bidding") {
          console.log("Bid rejected: Status is not bidding");
          return socket.emit("bid:error", { message: "Auction Error: Bidding is closed or paused." });
        }

        // Step 5: Active Player check
        if (!state.currentPlayer) {
          console.log("Bid rejected: No active player");
          return socket.emit("bid:error", { message: "Auction Error: No player is currently up for bidding." });
        }

        // Step 6: Time limit check
        if (state.timer <= 0) {
          console.log("Bid rejected: Timer expired");
          return socket.emit("bid:error", { message: "Auction Error: Timer has expired." });
        }

        // Step 7: Minimum Bid Increment check
        const basePrice = state.currentPlayer.basePrice || 10;
        const minRequired = state.highestBidder ? state.currentBid + state.minBidIncrement : basePrice;
        if (amount < minRequired) {
          console.log("Bid rejected: Amount too low");
          return socket.emit("bid:error", { message: `Bid too low! Minimum required bid is ${minRequired} coins.` });
        }

        // Step 8: Prevent Self-Overbid check
        if (state.highestBidder && state.highestBidder._id.toString() === team._id.toString()) {
          console.log("Bid rejected: Self overbid");
          return socket.emit("bid:error", { message: "Auction Error: You are already the highest bidder." });
        }

        // Step 9: Remaining Budget check
        if (team.remainingBudget < amount) {
          console.log("Bid rejected: Insufficient budget");
          return socket.emit("bid:error", { message: `Insufficient budget! Remaining budget: ${team.remainingBudget} coins.` });
        }

        // Step 10: Squad size check
        if (team.players.length >= MAX_SQUAD_SIZE) {
          console.log("Bid rejected: Squad full");
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

        // Full Timer Reset: Reset the timer back to its maximum duration whenever a bid is placed
        // (Adding a new comment here to trigger an automatic deployment to Railway/Vercel)
        state.timer = state.maxTimer;
        console.log(`[TEST DEPLOY] Timer reset to ${state.maxTimer} after bid`);
        
        // Also restart the countdown loop so we get a full second before the next tick
        startCountdown();

        // Broadcast updated state
        broadcastState();
        io.emit("bid:broadcast", {
          teamName: team.teamName,
          playerName: state.currentPlayer.commonName || state.currentPlayer.name,
          amount,
          color: team.color || "#3B82F6",
        });

      } catch (err: any) {
        console.error("Bid placing error:", err);
        socket.emit("bid:error", { message: "An internal error occurred while placing your bid." });
      }
    });

    // -----------------------------------------------------------------
    // ADMIN CONTROL EVENTS
    // -----------------------------------------------------------------

    // Load next player from pool queue
    socket.on("admin:load_next", async () => {
      if (socket.data.user.role !== "admin") return;
      if (state.status === "bidding") return;

      try {
        // Find player with status "pool" and lowest auctionPoolOrder
        const nextPlayer = await Player.findOne({ status: "pool" }).sort({ auctionPoolOrder: 1 });
        if (!nextPlayer) {
          return socket.emit("admin:error", { message: "No players left in the auction pool queue." });
        }

        state.currentPlayer = nextPlayer;
        state.currentBid = 0;
        state.highestBidder = null;
        state.bidHistory = [];
        state.status = "idle";
        state.timer = state.maxTimer; // Use maxTimer

        broadcastState();
      } catch (err: any) {
        socket.emit("admin:error", { message: err.message });
      }
    });

    // Start bidding
    socket.on("admin:start", () => {
      if (socket.data.user.role !== "admin") return;
      if (!state.currentPlayer || state.status === "bidding") return;

      state.status = "bidding";
      state.timer = state.maxTimer;
      transitionInProgress = false;

      startCountdown();
      broadcastState();
    });

    // Pause bidding
    socket.on("admin:pause", () => {
      if (socket.data.user.role !== "admin") return;
      if (state.status !== "bidding") return;

      state.status = "paused";
      if (timerInterval) clearInterval(timerInterval);

      broadcastState();
    });

    // Resume bidding
    socket.on("admin:resume", () => {
      if (socket.data.user.role !== "admin") return;
      if (state.status !== "paused") return;

      state.status = "bidding";
      startCountdown();

      broadcastState();
    });

    // Set custom timer
    socket.on("admin:set_timer", (data: { duration: number }) => {
      if (socket.data.user.role !== "admin") return;
      const newTimer = Math.max(1, data.duration);
      state.maxTimer = newTimer;
      state.timer = newTimer;

      broadcastState();
    });

    // Force Unsold transition
    socket.on("admin:unsold", async () => {
      if (socket.data.user.role !== "admin") return;
      if (!state.currentPlayer) return;
      // Stop the timer first so it doesn't interfere
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
      await handleUnsoldTransition();
    });

    // Force Sold transition
    socket.on("admin:sold", async () => {
      if (socket.data.user.role !== "admin") return;
      if (!state.currentPlayer) return;
      if (!state.highestBidder) {
        socket.emit("auction:error", "Cannot mark sold: No bids have been placed! Use 'Mark Unsold' instead.");
        return;
      }
      // Stop the timer first so it doesn't interfere
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
      await handleSoldTransition();
    });

    // Admin Undo last draft
    socket.on("admin:undo", async () => {
      if (socket.data.user.role !== "admin") return;

      try {
        // Find last sold player (most recently updated/sold)
        const lastSoldPlayer = await Player.findOne({ status: "sold" }).sort({ soldAt: -1 });
        if (!lastSoldPlayer) {
          return socket.emit("admin:error", { message: "No sold player found to undo." });
        }

        const teamId = lastSoldPlayer.soldTo;
        const refundPrice = lastSoldPlayer.soldPrice || 0;

        if (teamId) {
          // Remove player from team, refund budget, and recalculate statistics
          const team = await Team.findById(teamId);
          if (team) {
            team.players = team.players.filter((id) => id.toString() !== lastSoldPlayer._id.toString());
            team.remainingBudget += refundPrice;
            team.squadSize = team.players.length;

            // Recalculate values
            const draftedPlayers = await Player.find({ _id: { $in: team.players } });
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
        await BidHistory.deleteOne({ playerId: lastSoldPlayer._id, isWinningBid: true });

        // Reset live state
        state.currentPlayer = lastSoldPlayer;
        state.currentBid = 0;
        state.highestBidder = null;
        state.bidHistory = [];
        state.status = "idle";
        state.timer = state.maxTimer;

        if (timerInterval) clearInterval(timerInterval);

        broadcastState();
        io.emit("auction:undo_broadcast", {
          playerName: lastSoldPlayer.commonName || lastSoldPlayer.name,
        });

      } catch (err: any) {
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
  if (timerInterval) clearInterval(timerInterval);
  transitionInProgress = false;

  timerInterval = setInterval(async () => {
    // If already transitioning or no longer bidding, stop immediately
    if (state.status !== "bidding" || transitionInProgress) {
      if (timerInterval) clearInterval(timerInterval);
      return;
    }

    state.timer -= 1;

    // Always broadcast so clients see the timer tick down to 0
    broadcastState();

    if (state.timer <= 0) {
      if (timerInterval) clearInterval(timerInterval);
      timerInterval = null;

      // Set guard immediately so no second tick can sneak in during the async work
      transitionInProgress = true;

      // Small delay so clients see "0s" before the sold/unsold overlay fires
      await new Promise((resolve) => setTimeout(resolve, 400));

      // Timer finished, resolve auction!
      if (state.highestBidder) {
        await handleSoldTransition();
      } else {
        await handleUnsoldTransition();
      }

      transitionInProgress = false;
    }
  }, 1000);
}

// Resolve Auction: SOLD
async function handleSoldTransition() {
  if (!state.currentPlayer || !state.highestBidder || !ioInstance) return;

  // Lock status immediately to prevent any re-entry (bids, timer ticks, etc.)
  state.status = "idle";

  const player = state.currentPlayer;
  const teamId = state.highestBidder._id;
  const finalPrice = state.currentBid;
  // Capture bidder info before any state mutation
  const soldPlayerName = player.commonName || player.name;
  const buyerName = state.highestBidder.teamName;
  const bidderColor = state.highestBidder.color || "#3B82F6";

  try {
    const buyerColor = bidderColor;

    // --- EMIT IMMEDIATELY BEFORE DB OPERATIONS TO TEST IF IT REACHES THE FRONTEND ---
    ioInstance?.emit("auction:sold_broadcast", {
      playerName: soldPlayerName,
      buyerName,
      price: finalPrice,
      playerImage: player.image,
      buyerColor,
      teamId,
      rating: player.rating,
      position: player.position,
      club: player.club,
      nation: player.nation,
    });

    // 1. Update Player document
    await Player.findByIdAndUpdate(player._id, {
      status: "sold",
      soldTo: teamId,
      soldPrice: finalPrice,
      soldAt: new Date(),
    });

    // 2. Update Team document (Add player, deduct budget, update averages)
    const team = await Team.findById(teamId);
    if (team) {
      team.players.push(player._id);
      team.remainingBudget -= finalPrice;
      team.squadSize = team.players.length;

      // Recalculate team statistics
      const draftedPlayers = await Player.find({ _id: { $in: team.players } });
      team.teamValue = draftedPlayers.reduce((sum, p) => sum + (p.soldPrice || 0), 0);
      team.avgRating = draftedPlayers.reduce((sum, p) => sum + p.rating, 0) / draftedPlayers.length;

      await team.save();
    }

    // 3. Log into BidHistory
    await BidHistory.create({
      playerId: player._id,
      teamId: teamId,
      amount: finalPrice,
      isWinningBid: true,
    });

    // 2nd: Now fully clear state (currentPlayer, bid, bidder, history)
    state.currentPlayer = null;
    state.currentBid = 0;
    state.highestBidder = null;
    state.bidHistory = [];
    state.timer = 0;
    // status is already "idle" (set at top)

    // 3rd: Delay broadcastState by 7s so the sold overlay has time to display on all clients
    // (The frontend overlay auto-closes after 6 seconds)
    setTimeout(() => broadcastState(), 7000);

  } catch (err: any) {
    console.error("Failed to complete SOLD transition:", err);
    if (ioInstance) {
      ioInstance.emit("auction:error", err.message || "Failed to complete SOLD transition");
    }
    // On error, still clear to avoid stuck state
    state.currentPlayer = null;
    state.currentBid = 0;
    state.highestBidder = null;
    state.bidHistory = [];
    state.timer = 0;
    setTimeout(() => broadcastState(), 7000);
  }
}

// Resolve Auction: UNSOLD
async function handleUnsoldTransition() {
  if (!state.currentPlayer || !ioInstance) return;

  // Lock status immediately to prevent re-entry
  state.status = "idle";

  const player = state.currentPlayer;
  const unsoldPlayerName = player.commonName || player.name;

  try {
    // Update player status in database
    await Player.findByIdAndUpdate(player._id, {
      status: "unsold",
    });

    // 1st: Broadcast unsold event BEFORE clearing currentPlayer
    ioInstance.emit("auction:unsold_broadcast", {
      playerName: unsoldPlayerName,
    });

    // 2nd: Clear all state
    state.currentPlayer = null;
    state.currentBid = 0;
    state.highestBidder = null;
    state.bidHistory = [];
    state.timer = 0;
    // status is already "idle"

    // 3rd: Broadcast cleared state
    broadcastState();

  } catch (err) {
    console.error("Failed to complete UNSOLD transition:", err);
    // On error, still clear to avoid stuck state
    state.currentPlayer = null;
    state.currentBid = 0;
    state.highestBidder = null;
    state.bidHistory = [];
    state.timer = 0;
    broadcastState();
  }
}
