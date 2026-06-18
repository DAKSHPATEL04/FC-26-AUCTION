import { Router, Response } from "express";
import mongoose from "mongoose";
import { Team } from "../models/Team.js";
import { User } from "../models/User.js";
import { Season } from "../models/Season.js";
import { Player } from "../models/Player.js";
import { BidHistory } from "../models/BidHistory.js";
import { authenticateJWT, requireRole, AuthRequest } from "../middleware/auth.middleware.js";

const router = Router();

// GET /api/teams - Get all teams for the active season
router.get("/", async (req, res) => {
  try {
    // Find latest season or create default
    let season = await Season.findOne().sort({ createdAt: -1 });
    if (!season) {
      // Create a default system season
      const defaultAdmin = await User.findOne({ role: "admin" });
      season = await Season.create({
        name: "Default Season",
        status: "setup",
        createdBy: defaultAdmin?._id || new mongoose.Types.ObjectId(),
      });
    }

    const teams = await Team.find({ seasonId: season._id })
      .populate("ownerId", "name email role")
      .populate("players")
      .lean();

    res.json(teams);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/teams - Admin: Create team
router.post("/", authenticateJWT as any, requireRole(["admin"]) as any, async (req: AuthRequest, res: Response) => {
  try {
    const { teamName, logo, ownerId, totalBudget = 1000, color = "#3B82F6" } = req.body;

    if (!teamName) {
      return res.status(400).json({ message: "Team name is required" });
    }

    // Find latest season or create default
    let season = await Season.findOne().sort({ createdAt: -1 });
    if (!season) {
      season = await Season.create({
        name: "Default Season",
        status: "setup",
        createdBy: req.user!.id,
      });
    }

    const newTeam = new Team({
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
      await User.findByIdAndUpdate(ownerId, { teamId: newTeam._id });
    }

    res.status(201).json(newTeam);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/teams/:id - Admin: Update team details
router.put("/:id", authenticateJWT as any, requireRole(["admin"]) as any, async (req: AuthRequest, res: Response) => {
  try {
    const { teamName, logo, ownerId, totalBudget, remainingBudget, color } = req.body;
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    const oldOwnerId = team.ownerId?.toString();

    if (teamName !== undefined) team.teamName = teamName;
    if (logo !== undefined) team.logo = logo;
    if (color !== undefined) team.color = color;
    if (totalBudget !== undefined) team.totalBudget = totalBudget;
    if (remainingBudget !== undefined) team.remainingBudget = remainingBudget;

    if (ownerId !== undefined) {
      team.ownerId = ownerId || null;
    }

    await team.save();

    // If owner changed, update User objects
    if (ownerId !== undefined && oldOwnerId !== ownerId) {
      // Remove teamId from old owner
      if (oldOwnerId) {
        await User.findByIdAndUpdate(oldOwnerId, { teamId: null });
      }
      // Add teamId to new owner
      if (ownerId) {
        await User.findByIdAndUpdate(ownerId, { teamId: team._id });
      }
    }

    res.json(team);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/teams/:id - Admin: Delete team
router.delete("/:id", authenticateJWT as any, requireRole(["admin"]) as any, async (req: AuthRequest, res: Response) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    // 1. Unlink owner user
    if (team.ownerId) {
      await User.findByIdAndUpdate(team.ownerId, { teamId: null });
    }

    // 2. Release players back to available
    if (team.players && team.players.length > 0) {
      await Player.updateMany(
        { _id: { $in: team.players } },
        { $set: { status: "available", soldTo: null, soldPrice: null, soldAt: null } }
      );
    }

    // 3. Delete Team
    await Team.deleteOne({ _id: team._id });

    res.json({ message: "Team deleted successfully and players released" });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/teams/:teamId/players/:playerId - Admin: Remove player from team
router.delete("/:teamId/players/:playerId", authenticateJWT as any, requireRole(["admin"]) as any, async (req: AuthRequest, res: Response) => {
  try {
    const { teamId, playerId } = req.params;
    
    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: "Team not found" });

    const player = await Player.findById(playerId);
    if (!player) return res.status(404).json({ message: "Player not found" });

    // Check if player is actually in this team
    if (!team.players.includes(player._id)) {
      return res.status(400).json({ message: "Player is not in this team's squad" });
    }

    // Refund and remove
    const refundPrice = player.soldPrice || 0;
    team.players = team.players.filter((id) => id.toString() !== playerId);
    team.remainingBudget += refundPrice;
    team.squadSize = team.players.length;

    // Recalculate team stats
    const draftedPlayers = await Player.find({ _id: { $in: team.players } });
    team.teamValue = draftedPlayers.reduce((sum, p) => sum + (p.soldPrice || 0), 0);
    team.avgRating = draftedPlayers.length > 0 
      ? draftedPlayers.reduce((sum, p) => sum + p.rating, 0) / draftedPlayers.length 
      : 0;

    await team.save();

    // Reset Player
    player.status = "pool";
    player.soldTo = null;
    player.soldPrice = null;
    player.soldAt = null;
    await player.save();

    // Remove Winning Bid from BidHistory
    await BidHistory.deleteOne({ playerId: player._id, isWinningBid: true });

    res.json({ message: "Player removed from squad and refunded successfully." });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
