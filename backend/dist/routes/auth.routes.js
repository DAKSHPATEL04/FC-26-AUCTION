"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_js_1 = require("../models/User.js");
const auth_middleware_js_1 = require("../middleware/auth.middleware.js");
const router = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET || "supersecretjwtsecretkeyshouldbe32charactersormore!";
// Register endpoint
router.post("/register", async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: "Name, email, and password are required" });
        }
        const existingUser = await User_js_1.User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ message: "Email is already registered" });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 12);
        // Default to owner/guest unless specifically requested (guests can watch, owners can bid)
        const userRole = role && ["admin", "owner", "guest"].includes(role) ? role : "guest";
        const newUser = await User_js_1.User.create({
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
    }
    catch (err) {
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
        const user = await User_js_1.User.findOne({ email: email.toLowerCase() });
        if (!user) {
            // Keep it generic to avoid revealing existence
            return res.status(400).json({ message: "Invalid credentials" });
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }
        if (!user.isActive) {
            return res.status(403).json({ message: "Account is deactivated" });
        }
        const token = jsonwebtoken_1.default.sign({ id: user._id, role: user.role, teamId: user.teamId }, JWT_SECRET, { expiresIn: "7d" });
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
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// Current User profile endpoint
router.get("/me", auth_middleware_js_1.authenticateJWT, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const user = await User_js_1.User.findById(req.user.id).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json(user);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// POST /api/auth/refresh-token - Re-issue JWT with latest role + teamId from DB
// Needed when admin assigns a team/role after the user already logged in
router.post("/refresh-token", auth_middleware_js_1.authenticateJWT, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const user = await User_js_1.User.findById(req.user.id).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if (!user.isActive) {
            return res.status(403).json({ message: "Account is deactivated" });
        }
        // Issue a fresh token with latest role and teamId from DB
        const token = jsonwebtoken_1.default.sign({ id: user._id, role: user.role, teamId: user.teamId }, JWT_SECRET, { expiresIn: "7d" });
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
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// GET /api/auth/users - Get users (optional filter by role)
router.get("/users", auth_middleware_js_1.authenticateJWT, async (req, res) => {
    try {
        const { role } = req.query;
        const filter = {};
        if (role) {
            filter.role = role;
        }
        const users = await User_js_1.User.find(filter).select("-password").lean();
        res.json(users);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.default = router;
