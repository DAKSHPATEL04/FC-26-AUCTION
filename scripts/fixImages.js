/**
 * fixImages.js
 * ------------
 * Patches club logos and nation flags for all players in MongoDB
 * by mapping team/nation names to their known sofifa.net IDs.
 *
 * Run from project root:
 *   node scripts/fixImages.js
 */

const mongoose = require("mongoose");
require("dotenv").config({ path: "./backend/.env" });

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/fc26auction";

const playerSchema = new mongoose.Schema({}, { strict: false });
const Player = mongoose.models.Player || mongoose.model("Player", playerSchema);

// ─── TEAM ID MAP (name → sofifa team id) ─────────────────────────────────────
// sofifa club logo URL: https://cdn.sofifa.net/teams/{id}/60.png
const TEAM_IDS = {
  "Real Madrid": 346, "Manchester City": 9, "Liverpool": 8, "FC Barcelona": 241,
  "Bayern Munich": 21, "Arsenal": 1, "Chelsea": 5, "Manchester United": 10,
  "Paris Saint-Germain": 73, "Juventus": 45, "Inter": 44, "AC Milan": 46,
  "Atletico Madrid": 240, "Borussia Dortmund": 88, "RB Leipzig": 672,
  "Tottenham Hotspur": 6, "Newcastle United": 23, "Aston Villa": 2,
  "Real Sociedad": 457, "Villarreal": 449, "Sevilla": 481, "Valencia": 453,
  "Bayer Leverkusen": 168, "Eintracht Frankfurt": 81, "Freiburg": 84,
  "Lazio": 55, "Roma": 56, "Napoli": 48, "Atalanta": 42,
  "Benfica": 294, "Porto": 295, "Sporting CP": 296,
  "Ajax": 118, "PSV Eindhoven": 672, "Feyenoord": 119,
  "Celtic": 277, "Rangers": 278,
  "Flamengo": 569, "Palmeiras": 568, "Fluminense": 571,
  "River Plate": 536, "Boca Juniors": 535,
  "Al-Hilal": 1792, "Al-Nassr": 1798, "Al-Ahly": 1800,
  "West Ham United": 37, "Brighton": 7, "Fulham": 19,
  "Wolverhampton Wanderers": 38, "Crystal Palace": 14,
  "Leicester City": 26, "Everton": 11, "Nottingham Forest": 31,
  "Brentford": 189, "Burnley": 12, "Luton Town": 27,
  "Sheffield United": 35, "Bournemouth": 3,
  "Real Betis": 543, "Celta Vigo": 544, "Getafe": 449,
  "Osasuna": 463, "Girona": 480, "Las Palmas": 553,
  "Werder Bremen": 96, "Hoffenheim": 100, "Wolfsburg": 97,
  "Borussia Mönchengladbach": 86, "VfB Stuttgart": 80,
  "Marseille": 244, "Lyon": 243, "Monaco": 245, "Lens": 247, "Rennes": 249,
  "Lille": 246, "Nice": 248, "Strasbourg": 250,
  "Torino": 57, "Fiorentina": 51, "Bologna": 41, "Sassuolo": 61,
  "Udinese": 64, "Verona": 65, "Empoli": 52, "Lecce": 53,
};

// ─── NATION ID MAP (name → sofifa flag code) ──────────────────────────────────
// sofifa flag URL: https://cdn.sofifa.net/flags/{code}.png
const NATION_FLAGS = {
  "France": "fr", "Brazil": "br", "England": "gb-eng", "Spain": "es",
  "Germany": "de", "Argentina": "ar", "Portugal": "pt", "Netherlands": "nl",
  "Belgium": "be", "Norway": "no", "Egypt": "eg", "Denmark": "dk",
  "Italy": "it", "Croatia": "hr", "Austria": "at", "Switzerland": "ch",
  "Uruguay": "uy", "Colombia": "co", "Chile": "cl", "Mexico": "mx",
  "United States": "us", "Canada": "ca", "Japan": "jp", "South Korea": "kr",
  "Senegal": "sn", "Morocco": "ma", "Ivory Coast": "ci", "Ghana": "gh",
  "Nigeria": "ng", "Cameroon": "cm", "Algeria": "dz", "Tunisia": "tn",
  "Poland": "pl", "Czech Republic": "cz", "Slovakia": "sk", "Hungary": "hu",
  "Serbia": "rs", "Slovenia": "si", "Turkey": "tr", "Greece": "gr",
  "Sweden": "se", "Finland": "fi", "Scotland": "gb-sct", "Wales": "gb-wls",
  "Ireland": "ie", "Northern Ireland": "gb-nir",
  "Australia": "au", "New Zealand": "nz",
  "Ecuador": "ec", "Venezuela": "ve", "Peru": "pe", "Bolivia": "bo",
  "Costa Rica": "cr", "Honduras": "hn", "Jamaica": "jm",
  "Saudi Arabia": "sa", "Iran": "ir", "Iraq": "iq", "Qatar": "qa",
  "China PR": "cn", "Thailand": "th", "Indonesia": "id",
  "South Africa": "za", "Congo DR": "cd",
  "Russia": "ru", "Ukraine": "ua", "Romania": "ro", "Bulgaria": "bg",
};

async function fixImages() {
  console.log("🔗  Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("✅  Connected.\n");

  // Get all players missing clubLogo or nationFlag
  const players = await Player.find({
    $or: [{ clubLogo: "" }, { nationFlag: "" }, { clubLogo: null }, { nationFlag: null }]
  }).select("_id club nation clubLogo nationFlag").lean();

  console.log(`Found ${players.length} players needing image updates...\n`);

  let updated = 0;
  let notFound = { clubs: new Set(), nations: new Set() };
  const BATCH = 500;
  const ops = [];

  for (const p of players) {
    const set = {};

    if (!p.clubLogo && p.club && TEAM_IDS[p.club]) {
      set.clubLogo = `https://cdn.sofifa.net/teams/${TEAM_IDS[p.club]}/60.png`;
    } else if (!p.clubLogo && p.club) {
      notFound.clubs.add(p.club);
    }

    if (!p.nationFlag && p.nation && NATION_FLAGS[p.nation]) {
      set.nationFlag = `https://cdn.sofifa.net/flags/${NATION_FLAGS[p.nation]}.png`;
    } else if (!p.nationFlag && p.nation) {
      notFound.nations.add(p.nation);
    }

    if (Object.keys(set).length > 0) {
      ops.push({ updateOne: { filter: { _id: p._id }, update: { $set: set } } });
    }

    if (ops.length >= BATCH) {
      await Player.bulkWrite(ops, { ordered: false });
      updated += ops.length;
      ops.length = 0;
      process.stdout.write(`\r  ✍  Updated: ${updated}`);
    }
  }

  if (ops.length > 0) {
    await Player.bulkWrite(ops, { ordered: false });
    updated += ops.length;
  }

  console.log(`\n\n✅  Done! Updated ${updated} players.\n`);

  if (notFound.clubs.size > 0) {
    console.log(`⚠️  ${notFound.clubs.size} club(s) not in map (no logo added):`);
    [...notFound.clubs].slice(0, 20).forEach(c => console.log(`   - ${c}`));
    if (notFound.clubs.size > 20) console.log(`   ... and ${notFound.clubs.size - 20} more`);
  }

  if (notFound.nations.size > 0) {
    console.log(`\n⚠️  ${notFound.nations.size} nation(s) not in map (no flag added):`);
    [...notFound.nations].forEach(n => console.log(`   - ${n}`));
  }

  await mongoose.disconnect();
  process.exit(0);
}

fixImages().catch(err => {
  console.error("❌  Failed:", err.message);
  process.exit(1);
});
