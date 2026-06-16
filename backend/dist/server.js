"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const socket_io_1 = require("socket.io");
const auth_routes_js_1 = __importDefault(require("./routes/auth.routes.js"));
const player_routes_js_1 = __importDefault(require("./routes/player.routes.js"));
const watchlist_routes_js_1 = __importDefault(require("./routes/watchlist.routes.js"));
const team_routes_js_1 = __importDefault(require("./routes/team.routes.js"));
const stats_routes_js_1 = __importDefault(require("./routes/stats.routes.js"));
const auction_socket_js_1 = require("./socket/auction.socket.js");
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
// Initialize Socket.IO
const io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:4000",
        credentials: true,
    }
});
(0, auction_socket_js_1.initAuctionSocket)(io);
const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/fc26auction";
// Middleware
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || "http://localhost:4000",
    credentials: true,
}));
app.use(express_1.default.json());
// Routes
app.use("/api/auth", auth_routes_js_1.default);
app.use("/api/players", player_routes_js_1.default);
app.use("/api/watchlist", watchlist_routes_js_1.default);
app.use("/api/teams", team_routes_js_1.default);
app.use("/api/stats", stats_routes_js_1.default);
// Health Check
app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "FC 26 Auction Platform Backend is active" });
});
// Database Connection
mongoose_1.default
    .connect(MONGODB_URI)
    .then(() => {
    console.log("Connected to MongoDB Atlas / Local successfully.");
    server.listen(PORT, () => {
        console.log(`Backend Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
    });
})
    .catch((err) => {
    console.error("MongoDB connection error:", err);
});
