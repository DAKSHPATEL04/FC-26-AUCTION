/**
 * FC 26 / FC 25 Player CSV Importer
 * ------------------------------------
 * Downloads and imports all players from the Kaggle EA Sports FC 25 dataset.
 *
 * SETUP:
 *   1. Go to: https://www.kaggle.com/datasets/stefanoleone992/ea-sports-fc-25-complete-player-dataset
 *   2. Download the dataset (free Kaggle account required)
 *   3. Extract and copy  "male_players.csv"  into  scripts/male_players.csv
 *   4. From the project ROOT run:
 *        node scripts/importFromCSV.js
 *
 * OPTIONS (env vars or edit the CONFIG block below):
 *   MIN_RATING   - only import players rated >= this value (default: 65)
 *   BATCH_SIZE   - MongoDB bulkWrite batch size (default: 500)
 */

const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const readline = require("readline");
require("dotenv").config({ path: "./backend/.env" });

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const CSV_PATH = path.join(__dirname, "male_players.csv");
const MIN_RATING = parseInt(process.env.MIN_RATING || "65", 10);
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || "500", 10);
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/fc26auction";
// ─────────────────────────────────────────────────────────────────────────────

// Mongoose schema (mirrors backend/src/models/Player.ts)
const playerSchema = new mongoose.Schema({
  sofifaId:     { type: Number, unique: true, sparse: true, index: true },
  futdbId:      { type: Number, unique: true, sparse: true, index: true },
  name:         { type: String, required: true },
  commonName:   { type: String, default: "" },
  image:        { type: String, default: "" },
  nation:       { type: String, default: "" },
  nationFlag:   { type: String, default: "" },
  club:         { type: String, default: "" },
  clubLogo:     { type: String, default: "" },
  league:       { type: String, default: "" },
  position:     { type: String, required: true },
  positionGroup:{ type: String, enum: ["GK","DEF","MID","FWD"], required: true },
  rating:       { type: Number, required: true, index: true },
  age:          { type: Number, default: 0 },
  height:       { type: Number, default: 0 },
  weight:       { type: Number, default: 0 },
  preferredFoot:{ type: String, enum: ["Right","Left"], default: "Right" },
  weakFoot:     { type: Number, default: 1 },
  skillMoves:   { type: Number, default: 1 },
  pace:         { type: Number, default: 0 },
  shooting:     { type: Number, default: 0 },
  passing:      { type: Number, default: 0 },
  dribbling:    { type: Number, default: 0 },
  defending:    { type: Number, default: 0 },
  physical:     { type: Number, default: 0 },
  playStyles:   [{ type: String }],
  status:       { type: String, enum: ["available","pool","sold","unsold"], default: "available", index: true },
  auctionPoolOrder: { type: Number, default: null },
  soldTo:       { type: mongoose.Schema.Types.ObjectId, ref: "Team", default: null },
  soldPrice:    { type: Number, default: null },
  soldAt:       { type: Date, default: null },
  basePrice:    { type: Number, default: 10 },
}, { timestamps: true });

playerSchema.index({ name: "text", commonName: "text" });
playerSchema.index({ position: 1, rating: -1 });

const Player = mongoose.models.Player || mongoose.model("Player", playerSchema);

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function getPositionGroup(pos) {
  if (!pos) return "MID";
  const p = pos.toUpperCase();
  if (p === "GK") return "GK";
  if (["CB","LB","RB","LWB","RWB","LCB","RCB"].includes(p)) return "DEF";
  if (["ST","CF","LW","RW","LS","RS","LF","RF"].includes(p)) return "FWD";
  return "MID";
}

function buildImageUrl(sofifaId) {
  if (!sofifaId) return "";
  const id = String(sofifaId);
  // sofifa player image pattern: /players/AAA/BBB/25_120.png
  const part1 = id.slice(0, 3);
  const part2 = id.slice(3);
  return `https://cdn.sofifa.net/players/${part1}/${part2}/25_120.png`;
}

function buildClubLogoUrl(teamId) {
  if (!teamId) return "";
  return `https://cdn.sofifa.net/teams/${teamId}/60.png`;
}

function buildFlagUrl(nationId) {
  if (!nationId) return "";
  return `https://cdn.sofifa.net/flags/${nationId}.png`;
}

function calcBasePrice(rating) {
  if (rating >= 90) return 50;
  if (rating >= 85) return 35;
  if (rating >= 80) return 20;
  if (rating >= 75) return 15;
  return 10;
}

// Simple CSV line parser that handles quoted fields
function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function importFromCSV() {
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`\n❌  CSV file not found at: ${CSV_PATH}`);
    console.error(`\n   Please download it from:`);
    console.error(`   https://www.kaggle.com/datasets/stefanoleone992/ea-sports-fc-25-complete-player-dataset`);
    console.error(`   Extract and place  male_players.csv  in the scripts/ folder.\n`);
    process.exit(1);
  }

  console.log(`\n🔗  Connecting to MongoDB...`);
  await mongoose.connect(MONGODB_URI);
  console.log(`✅  Connected.\n`);
  console.log(`📂  Reading CSV: ${CSV_PATH}`);
  console.log(`🔢  Min rating filter: ${MIN_RATING}`);
  console.log(`📦  Batch size: ${BATCH_SIZE}\n`);

  const rl = readline.createInterface({
    input: fs.createReadStream(CSV_PATH, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });

  let headers = null;
  let batch = [];
  let totalProcessed = 0;
  let totalSkipped = 0;
  let totalUpserted = 0;

  const flushBatch = async () => {
    if (batch.length === 0) return;
    const ops = batch.map(p => ({
      updateOne: {
        filter: { sofifaId: p.sofifaId },
        update: { $set: p },
        upsert: true,
      },
    }));
    const result = await Player.bulkWrite(ops, { ordered: false });
    totalUpserted += result.upsertedCount + result.modifiedCount;
    process.stdout.write(`\r  ✍  Upserted: ${totalUpserted}  |  Skipped (low rating): ${totalSkipped}  |  Processed: ${totalProcessed}`);
    batch = [];
  };

  for await (const line of rl) {
    if (!line.trim()) continue;

    // First line is the header row
    if (!headers) {
      headers = parseCSVLine(line);
      continue;
    }

    const cols = parseCSVLine(line);
    const row = {};
    headers.forEach((h, i) => { row[h.trim()] = (cols[i] || "").trim(); });

    // This CSV uses "OVR" for overall rating
    const rating = parseInt(row.OVR || row.overall || row.rating || "0", 10);
    if (isNaN(rating) || rating < MIN_RATING) {
      totalSkipped++;
      totalProcessed++;
      continue;
    }

    // Extract sofifaId from the EA URL: .../player-ratings/kylian-mbappe/231747
    const urlField = row.url || "";
    const urlMatch = urlField.match(/\/(\d+)$/);
    const sofifaId = urlMatch ? parseInt(urlMatch[1], 10) : (totalProcessed + 100000);

    // Primary position (first in "Alternative positions" or "Position")
    const pos = (row.Position || row.position || "CM").trim().toUpperCase();

    // Build image URL from sofifaId  e.g. 231747 → /players/231/747/25_120.png
    const idStr = String(sofifaId);
    const image = idStr.length >= 6
      ? `https://cdn.sofifa.net/players/${idStr.slice(0, 3)}/${idStr.slice(3)}/25_120.png`
      : "";

    // Nation flag — CSV has "Nation" as text name, no flag URL
    // Map common nations to their sofifa flag codes
    const nationName = row.Nation || row.nationality_name || "";
    const nationFlag = ""; // no flag URL in this CSV; will show initials fallback

    // Club logo — CSV has "Team" as text, no logo URL
    const clubName = row.Team || row.club_name || "";
    const clubLogo = ""; // no logo URL in this CSV

    // Parse height: "182cm / 6'0"" → 182
    const heightRaw = row.Height || row.height || "0";
    const heightMatch = heightRaw.match(/(\d+)cm/);
    const height = heightMatch ? parseInt(heightMatch[1], 10) : 0;

    // Parse weight: "75kg / 165lb" → 75
    const weightRaw = row.Weight || row.weight || "0";
    const weightMatch = weightRaw.match(/(\d+)kg/);
    const weight = weightMatch ? parseInt(weightMatch[1], 10) : 0;

    // Play styles: "Quick Step+, Acrobatic, Finesse Shot" → array, strip "+"
    const playStylesRaw = row["play style"] || row.playStyles || "";
    const playStyles = playStylesRaw
      ? playStylesRaw.split(",").map(s => s.trim().replace(/\+$/, "")).filter(Boolean)
      : [];

    const player = {
      sofifaId,
      name: row.Name || row.long_name || "Unknown",
      commonName: row.Name || "",
      image,
      nation: nationName,
      nationFlag,
      club: clubName,
      clubLogo,
      league: row.League || row.league_name || "",
      position: pos,
      positionGroup: getPositionGroup(pos),
      rating,
      age: parseInt(row.Age || row.age || "0", 10) || 0,
      height,
      weight,
      preferredFoot: (row["Preferred foot"] || row.preferred_foot || "Right") === "Left" ? "Left" : "Right",
      weakFoot:    parseInt(row["Weak foot"]  || row.weak_foot   || "1", 10) || 1,
      skillMoves:  parseInt(row["Skill moves"]|| row.skill_moves || "1", 10) || 1,
      pace:        parseInt(row.PAC || row.pace      || "0", 10) || 0,
      shooting:    parseInt(row.SHO || row.shooting  || "0", 10) || 0,
      passing:     parseInt(row.PAS || row.passing   || "0", 10) || 0,
      dribbling:   parseInt(row.DRI || row.dribbling || "0", 10) || 0,
      defending:   parseInt(row.DEF || row.defending || "0", 10) || 0,
      physical:    parseInt(row.PHY || row.physic    || row.physical || "0", 10) || 0,
      playStyles,
      status: "available",
      auctionPoolOrder: null,
      soldTo: null,
      soldPrice: null,
      soldAt: null,
      basePrice: calcBasePrice(rating),
    };

    batch.push(player);
    totalProcessed++;

    if (batch.length >= BATCH_SIZE) {
      await flushBatch();
    }
  }

  // Flush remaining
  await flushBatch();

  console.log(`\n\n✅  Import complete!`);
  console.log(`   Total rows processed : ${totalProcessed}`);
  console.log(`   Skipped (< ${MIN_RATING} rating): ${totalSkipped}`);
  console.log(`   Upserted into MongoDB: ${totalUpserted}\n`);

  await mongoose.disconnect();
  process.exit(0);
}

importFromCSV().catch(err => {
  console.error("\n❌  Import failed:", err.message);
  process.exit(1);
});
