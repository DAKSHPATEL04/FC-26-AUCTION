"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Team_js_1 = require("../models/Team.js");
const Player_js_1 = require("../models/Player.js");
// @ts-ignore
const json2csv_1 = require("json2csv");
const jspdf_1 = require("jspdf");
require("jspdf-autotable");
const router = (0, express_1.Router)();
// GET /api/stats - Live statistics overview
router.get("/", async (req, res) => {
    try {
        const [teams, totalPlayers, soldPlayers, unsoldPlayers] = await Promise.all([
            Team_js_1.Team.find().populate("players").lean(),
            Player_js_1.Player.countDocuments(),
            Player_js_1.Player.countDocuments({ status: "sold" }),
            Player_js_1.Player.countDocuments({ status: "unsold" }),
        ]);
        // Format individual team metrics
        const teamStats = teams.map((t) => ({
            _id: t._id,
            teamName: t.teamName,
            color: t.color || "#3B82F6",
            remainingBudget: t.remainingBudget,
            totalBudget: t.totalBudget,
            spent: t.totalBudget - t.remainingBudget,
            squadSize: t.players?.length || 0,
            teamValue: t.teamValue || 0,
            avgRating: t.avgRating || 0,
        }));
        // Top 5 expensive players
        const expensivePlayers = await Player_js_1.Player.find({ status: "sold" })
            .sort({ soldPrice: -1 })
            .limit(5)
            .populate("soldTo", "teamName color")
            .lean();
        res.json({
            teamStats,
            general: {
                totalTeams: teams.length,
                totalPlayers,
                soldPlayers,
                unsoldPlayers,
                availablePlayers: totalPlayers - soldPlayers - unsoldPlayers,
            },
            expensivePlayers,
        });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// GET /api/stats/export/csv - Export drafts to CSV format
router.get("/export/csv", async (req, res) => {
    try {
        const players = await Player_js_1.Player.find({ status: "sold" })
            .populate("soldTo", "teamName")
            .sort({ soldPrice: -1 })
            .lean();
        const fields = [
            { label: "Player Name", value: "name" },
            { label: "Rating", value: "rating" },
            { label: "Position", value: "position" },
            { label: "Club", value: "club" },
            { label: "Nation", value: "nation" },
            { label: "Drafted Team", value: "soldTo.teamName" },
            { label: "Sold Price", value: "soldPrice" },
        ];
        const json2csvParser = new json2csv_1.Parser({ fields });
        const csv = json2csvParser.parse(players);
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", "attachment; filename=draft-summary.csv");
        return res.status(200).send(csv);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// GET /api/stats/export/pdf - Export drafts to PDF report
router.get("/export/pdf", async (req, res) => {
    try {
        const players = await Player_js_1.Player.find({ status: "sold" })
            .populate("soldTo", "teamName")
            .sort({ soldPrice: -1 })
            .lean();
        // Create instance of jsPDF
        const doc = new jspdf_1.jsPDF();
        // Header styling
        doc.setFont("helvetica", "bold");
        doc.setFontSize(20);
        doc.text("FC 26 Auction Platform Draft Summary", 14, 22);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`Report Generated On: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 14, 28);
        doc.text(`Total Drafted Players: ${players.length}`, 14, 34);
        const headers = [["Player", "Rating", "Pos", "Club", "Assigned Team", "Price"]];
        const data = players.map((p) => [
            p.commonName || p.name,
            p.rating.toString(),
            p.position,
            p.club || "N/A",
            p.soldTo ? p.soldTo.teamName : "Unassigned",
            `${p.soldPrice} coins`,
        ]);
        // Add table to PDF document
        doc.autoTable({
            head: headers,
            body: data,
            startY: 40,
            theme: "grid",
            headStyles: { fillColor: [59, 130, 246] }, // blue theme
            styles: { fontSize: 9 },
        });
        const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "attachment; filename=draft-summary.pdf");
        return res.status(200).send(pdfBuffer);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.default = router;
