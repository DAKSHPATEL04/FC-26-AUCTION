import { Router, Response } from "express";
import { Player } from "../models/Player.js";
import { authenticateJWT, requireRole, AuthRequest } from "../middleware/auth.middleware.js";

const router = Router();

// GET /api/players - Search, filter, and paginate
router.get("/", async (req, res) => {
  try {
    const {
      search,
      position,
      positionGroup,
      ratingMin,
      ratingMax,
      nation,
      club,
      league,
      status,
      sortBy = "rating",
      sortOrder = "desc",
      page = "1",
      limit = "24",
    } = req.query as Record<string, string>;

    const filter: Record<string, any> = {};

    if (search) {
      filter.$text = { $search: search };
    }

    if (position) {
      filter.position = position;
    }

    if (positionGroup) {
      filter.positionGroup = positionGroup;
    }

    if (ratingMin || ratingMax) {
      filter.rating = {};
      if (ratingMin) filter.rating.$gte = Number(ratingMin);
      if (ratingMax) filter.rating.$lte = Number(ratingMax);
    }

    if (nation) filter.nation = nation;
    if (club) filter.club = club;
    if (league) filter.league = league;
    if (status) filter.status = status;

    const sortDirection = sortOrder === "asc" ? 1 : -1;
    const sortMap: Record<string, string> = {
      rating: "rating",
      pace: "pace",
      shooting: "shooting",
      passing: "passing",
      dribbling: "dribbling",
      defending: "defending",
      physical: "physical",
      name: "name",
    };
    const sortField = sortMap[sortBy] || "rating";

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [players, total] = await Promise.all([
      Player.find(filter)
        .sort({ [sortField]: sortDirection })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Player.countDocuments(filter),
    ]);

    res.json({
      players,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/players/filters - Get distinct values for dropdowns
router.get("/filters", async (req, res) => {
  try {
    const [nations, clubs, leagues] = await Promise.all([
      Player.distinct("nation"),
      Player.distinct("club"),
      Player.distinct("league"),
    ]);

    res.json({
      nations: nations.filter(Boolean).sort(),
      clubs: clubs.filter(Boolean).sort(),
      leagues: leagues.filter(Boolean).sort(),
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/players/:id - Single player detail
router.get("/:id", async (req, res) => {
  try {
    const player = await Player.findById(req.params.id).populate("soldTo", "teamName logo color");
    if (!player) {
      return res.status(404).json({ message: "Player not found" });
    }
    res.json(player);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/players/:id/pool - Admin: Add or remove from pool
router.patch("/:id/pool", authenticateJWT as any, requireRole(["admin"]) as any, async (req: AuthRequest, res: Response) => {
  try {
    const { action } = req.body; // "add" or "remove"
    const player = await Player.findById(req.params.id);
    if (!player) {
      return res.status(404).json({ message: "Player not found" });
    }

    if (action === "add") {
      if (player.status !== "available") {
        return res.status(400).json({ message: "Player is not available to add to pool" });
      }
      // Get the next order number
      const maxOrderPlayer = await Player.findOne({ status: "pool" }).sort({ auctionPoolOrder: -1 });
      const nextOrder = (maxOrderPlayer?.auctionPoolOrder ?? -1) + 1;
      player.status = "pool";
      player.auctionPoolOrder = nextOrder;
    } else if (action === "remove") {
      if (player.status !== "pool") {
        return res.status(400).json({ message: "Player is not in the pool" });
      }
      player.status = "available";
      player.auctionPoolOrder = null;
    }

    await player.save();
    res.json({ message: `Player ${action}ed from pool`, player });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/players/pool/order - Admin: Re-order pool queue
router.put("/pool/order", authenticateJWT as any, requireRole(["admin"]) as any, async (req: AuthRequest, res: Response) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids)) {
      return res.status(400).json({ message: "Invalid payload: ids must be an array" });
    }

    const bulkOps = ids.map((id, index) => ({
      updateOne: {
        filter: { _id: id, status: "pool" },
        update: { $set: { auctionPoolOrder: index } },
      },
    }));

    if (bulkOps.length > 0) {
      await Player.bulkWrite(bulkOps);
    }

    res.json({ message: "Auction pool order updated successfully" });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/players/import - Admin: Trigger re-import
router.post("/import", authenticateJWT as any, requireRole(["admin"]) as any, async (req: AuthRequest, res: Response) => {
  res.json({ message: "Run node scripts/importPlayers.js manually from the backend directory to import players." });
});

// PUT /api/players/:id - Admin: Edit player details
router.put("/:id", authenticateJWT as any, requireRole(["admin"]) as any, async (req: AuthRequest, res: Response) => {
  try {
    const { status, basePrice, name, commonName, rating, position, pace, shooting, passing, dribbling, defending, physical, weakFoot, skillMoves, preferredFoot, height, weight } = req.body;
    
    const player = await Player.findById(req.params.id);
    if (!player) {
      return res.status(404).json({ message: "Player not found" });
    }

    // Only allow specific fields to be updated
    if (status !== undefined) {
      player.status = status;
      // If status changes away from pool, clear auctionPoolOrder
      if (status !== "pool") {
        player.auctionPoolOrder = null;
      }
    }
    if (basePrice !== undefined) player.basePrice = basePrice;
    if (name !== undefined) player.name = name;
    if (commonName !== undefined) player.commonName = commonName;
    if (rating !== undefined) player.rating = rating;
    if (position !== undefined) player.position = position;
    if (pace !== undefined) player.pace = pace;
    if (shooting !== undefined) player.shooting = shooting;
    if (passing !== undefined) player.passing = passing;
    if (dribbling !== undefined) player.dribbling = dribbling;
    if (defending !== undefined) player.defending = defending;
    if (physical !== undefined) player.physical = physical;
    if (weakFoot !== undefined) player.weakFoot = weakFoot;
    if (skillMoves !== undefined) player.skillMoves = skillMoves;
    if (preferredFoot !== undefined) player.preferredFoot = preferredFoot;
    if (height !== undefined) player.height = height;
    if (weight !== undefined) player.weight = weight;

    await player.save();
    
    // Return populated player
    const updatedPlayer = await Player.findById(req.params.id).populate("soldTo", "teamName logo color");
    res.json({ message: "Player updated successfully", player: updatedPlayer });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
