"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const http_1 = __importDefault(require("http"));
const https_1 = __importDefault(require("https"));
const router = (0, express_1.Router)();
// Simple image proxy to work around hotlinking / CORS for external CDNs.
// Usage: /api/image-proxy?url=<encoded-url>
router.get("/", async (req, res) => {
    const url = req.query.url;
    if (!url)
        return res.status(400).send("Missing url query param");
    let parsed;
    try {
        parsed = new URL(url);
    }
    catch (err) {
        return res.status(400).send("Invalid url");
    }
    if (!["http:", "https:"].includes(parsed.protocol)) {
        return res.status(400).send("Invalid protocol");
    }
    // Whitelist common image CDN hosts to avoid becoming an open proxy.
    const ALLOWED_HOSTS = ["cdn.sofifa.net", "cdn.jsdelivr.net", "media.futdb.app"];
    if (!ALLOWED_HOSTS.includes(parsed.hostname)) {
        return res.status(403).send("Host not allowed");
    }
    const lib = parsed.protocol === "https:" ? https_1.default : http_1.default;
    const proxyReq = lib.get(parsed, { headers: { "User-Agent": "FC26-Auction-Image-Proxy" } }, (proxyRes) => {
        if (!proxyRes.statusCode || proxyRes.statusCode >= 400) {
            res.status(proxyRes.statusCode || 502).end();
            return;
        }
        // Forward common headers
        const contentType = proxyRes.headers["content-type"] || "image/*";
        res.setHeader("Content-Type", contentType);
        if (proxyRes.headers["cache-control"]) {
            res.setHeader("Cache-Control", proxyRes.headers["cache-control"]);
        }
        proxyRes.pipe(res);
    });
    proxyReq.on("error", (err) => {
        console.error("Image proxy error:", err);
        if (!res.headersSent)
            res.status(502).send("Failed to fetch image");
    });
});
exports.default = router;
