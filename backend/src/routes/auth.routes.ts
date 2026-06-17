import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { authenticateJWT, AuthRequest } from "../middleware/auth.middleware.js";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "supersecretjwtsecretkeyshouldbe32charactersormore!";

// Register endpoint
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "Email is already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Default to owner/guest unless specifically requested (guests can watch, owners can bid)
    const userRole = role && ["admin", "owner", "guest"].includes(role) ? role : "guest";

    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: userRole,
    });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Login endpoint
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Keep it generic to avoid revealing existence
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Account is deactivated" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, teamId: user.teamId },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        teamId: user.teamId,
      },
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Current User profile endpoint
router.get("/me", authenticateJWT as any, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/refresh-token - Re-issue JWT with latest role + teamId from DB
// Needed when admin assigns a team/role after the user already logged in
router.post("/refresh-token", authenticateJWT as any, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Account is deactivated" });
    }

    // Issue a fresh token with latest role and teamId from DB
    const token = jwt.sign(
      { id: user._id, role: user.role, teamId: user.teamId },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        teamId: user.teamId,
      },
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/users - Get users (optional filter by role)
router.get("/users", authenticateJWT as any, async (req: AuthRequest, res: Response) => {
  try {
    const { role } = req.query;
    const filter: Record<string, any> = {};
    if (role) {
      filter.role = role;
    }
    const users = await User.find(filter).select("-password").lean();
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
