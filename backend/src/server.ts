import express from "express";
import http from "http";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { Server } from "socket.io";
import authRoutes from "./routes/auth.routes.js";
import playerRoutes from "./routes/player.routes.js";
import watchlistRoutes from "./routes/watchlist.routes.js";
import teamRoutes from "./routes/team.routes.js";
import statsRoutes from "./routes/stats.routes.js";
import imageRoutes from "./routes/image.routes.js";
import { initAuctionSocket } from "./socket/auction.socket.js";

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }
});
initAuctionSocket(io);

const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/fc26auction";

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.options("*", cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/players", playerRoutes);
app.use("/api/watchlist", watchlistRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/image-proxy", imageRoutes);

// Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "FC 26 Auction Platform Backend is active" });
});

// Database Connection
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB Atlas / Local successfully.");
    server.listen(Number(PORT), "0.0.0.0", () => {
      console.log(`Backend Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });
