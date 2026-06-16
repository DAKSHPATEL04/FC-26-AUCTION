const mongoose = require("mongoose");
require("dotenv").config({ path: "./backend/.env" });

// Import schemas using require (since this is a plain Node.js run script)
const playerSchema = new mongoose.Schema({
  futdbId: { type: Number, unique: true, sparse: true, index: true },
  name: { type: String, required: true },
  commonName: { type: String, default: "" },
  image: { type: String, default: "" },
  nation: { type: String, default: "" },
  nationFlag: { type: String, default: "" },
  club: { type: String, default: "" },
  clubLogo: { type: String, default: "" },
  league: { type: String, default: "" },
  position: { type: String, required: true },
  positionGroup: { type: String, enum: ["GK", "DEF", "MID", "FWD"], required: true },
  rating: { type: Number, required: true, index: true },
  age: { type: Number, default: 0 },
  height: { type: Number, default: 0 },
  weight: { type: Number, default: 0 },
  preferredFoot: { type: String, enum: ["Right", "Left"], default: "Right" },
  weakFoot: { type: Number, default: 1 },
  skillMoves: { type: Number, default: 1 },
  pace: { type: Number, default: 0 },
  shooting: { type: Number, default: 0 },
  passing: { type: Number, default: 0 },
  dribbling: { type: Number, default: 0 },
  defending: { type: Number, default: 0 },
  physical: { type: Number, default: 0 },
  playStyles: [{ type: String }],
  status: { type: String, enum: ["available", "pool", "sold", "unsold"], default: "available", index: true },
  auctionPoolOrder: { type: Number, default: null },
  soldTo: { type: mongoose.Schema.Types.ObjectId, ref: "Team", default: null },
  soldPrice: { type: Number, default: null },
  soldAt: { type: Date, default: null },
  basePrice: { type: Number, default: 10 },
});

const Player = mongoose.models.Player || mongoose.model("Player", playerSchema);

// Fallback high-quality dataset if FUTDB key is missing
const fallbackPlayers = [
  {
    futdbId: 1,
    name: "Kylian Mbappé",
    commonName: "Mbappé",
    image: "https://cdn.sofifa.net/players/231/747/25_120.png",
    nation: "France",
    nationFlag: "https://cdn.sofifa.net/flags/fr.png",
    club: "Real Madrid",
    clubLogo: "https://cdn.sofifa.net/teams/346/60.png",
    league: "La Liga",
    position: "ST",
    positionGroup: "FWD",
    rating: 91,
    age: 26,
    height: 182,
    weight: 75,
    preferredFoot: "Right",
    weakFoot: 4,
    skillMoves: 5,
    pace: 97,
    shooting: 90,
    passing: 80,
    dribbling: 92,
    defending: 36,
    physical: 78,
    playStyles: ["Quick Step", "Rapid", "Finesse Shot"],
    basePrice: 50,
  },
  {
    futdbId: 2,
    name: "Erling Haaland",
    commonName: "Haaland",
    image: "https://cdn.sofifa.net/players/239/085/25_120.png",
    nation: "Norway",
    nationFlag: "https://cdn.sofifa.net/flags/no.png",
    club: "Manchester City",
    clubLogo: "https://cdn.sofifa.net/teams/9/60.png",
    league: "Premier League",
    position: "ST",
    positionGroup: "FWD",
    rating: 91,
    age: 25,
    height: 194,
    weight: 94,
    preferredFoot: "Left",
    weakFoot: 3,
    skillMoves: 3,
    pace: 89,
    shooting: 92,
    passing: 65,
    dribbling: 80,
    defending: 45,
    physical: 88,
    playStyles: ["Power Header", "Acrobatic", "Power Shot"],
    basePrice: 50,
  },
  {
    futdbId: 3,
    name: "Kevin De Bruyne",
    commonName: "De Bruyne",
    image: "https://cdn.sofifa.net/players/192/985/25_120.png",
    nation: "Belgium",
    nationFlag: "https://cdn.sofifa.net/flags/be.png",
    club: "Manchester City",
    clubLogo: "https://cdn.sofifa.net/teams/9/60.png",
    league: "Premier League",
    position: "CAM",
    positionGroup: "MID",
    rating: 90,
    age: 34,
    height: 181,
    weight: 75,
    preferredFoot: "Right",
    weakFoot: 5,
    skillMoves: 4,
    pace: 67,
    shooting: 87,
    passing: 94,
    dribbling: 87,
    defending: 65,
    physical: 78,
    playStyles: ["Pinged Pass", "Incisive Pass", "Whipped Pass"],
    basePrice: 40,
  },
  {
    futdbId: 4,
    name: "Jude Bellingham",
    commonName: "Bellingham",
    image: "https://cdn.sofifa.net/players/252/371/25_120.png",
    nation: "England",
    nationFlag: "https://cdn.sofifa.net/flags/gb-eng.png",
    club: "Real Madrid",
    clubLogo: "https://cdn.sofifa.net/teams/346/60.png",
    league: "La Liga",
    position: "CAM",
    positionGroup: "MID",
    rating: 90,
    age: 22,
    height: 186,
    weight: 75,
    preferredFoot: "Right",
    weakFoot: 4,
    skillMoves: 4,
    pace: 80,
    shooting: 87,
    passing: 83,
    dribbling: 88,
    defending: 78,
    physical: 85,
    playStyles: ["Relentless", "Technical", "Anticipate"],
    basePrice: 40,
  },
  {
    futdbId: 5,
    name: "Virgil van Dijk",
    commonName: "van Dijk",
    image: "https://cdn.sofifa.net/players/203/376/25_120.png",
    nation: "Netherlands",
    nationFlag: "https://cdn.sofifa.net/flags/nl.png",
    club: "Liverpool",
    clubLogo: "https://cdn.sofifa.net/teams/8/60.png",
    league: "Premier League",
    position: "CB",
    positionGroup: "DEF",
    rating: 89,
    age: 34,
    height: 193,
    weight: 92,
    preferredFoot: "Right",
    weakFoot: 3,
    skillMoves: 2,
    pace: 79,
    shooting: 60,
    passing: 71,
    dribbling: 72,
    defending: 89,
    physical: 86,
    playStyles: ["Bruiser", "Block", "Aerial Command"],
    basePrice: 35,
  },
  {
    futdbId: 6,
    name: "Mohamed Salah",
    commonName: "Salah",
    image: "https://cdn.sofifa.net/players/209/331/25_120.png",
    nation: "Egypt",
    nationFlag: "https://cdn.sofifa.net/flags/eg.png",
    club: "Liverpool",
    clubLogo: "https://cdn.sofifa.net/teams/8/60.png",
    league: "Premier League",
    position: "RW",
    positionGroup: "FWD",
    rating: 89,
    age: 33,
    height: 175,
    weight: 71,
    preferredFoot: "Left",
    weakFoot: 3,
    skillMoves: 4,
    pace: 89,
    shooting: 87,
    passing: 82,
    dribbling: 88,
    defending: 45,
    physical: 75,
    playStyles: ["Finesse Shot", "Technical", "First Touch"],
    basePrice: 35,
  },
  {
    futdbId: 7,
    name: "Vinícius Júnior",
    commonName: "Vinícius Jr.",
    image: "https://cdn.sofifa.net/players/238/794/25_120.png",
    nation: "Brazil",
    nationFlag: "https://cdn.sofifa.net/flags/br.png",
    club: "Real Madrid",
    clubLogo: "https://cdn.sofifa.net/teams/346/60.png",
    league: "La Liga",
    position: "LW",
    positionGroup: "FWD",
    rating: 90,
    age: 25,
    height: 176,
    weight: 73,
    preferredFoot: "Right",
    weakFoot: 4,
    skillMoves: 5,
    pace: 95,
    shooting: 84,
    passing: 81,
    dribbling: 91,
    defending: 29,
    physical: 68,
    playStyles: ["Trickster", "Quick Step", "First Touch"],
    basePrice: 40,
  },
  {
    futdbId: 8,
    name: "Marc-André ter Stegen",
    commonName: "ter Stegen",
    image: "https://cdn.sofifa.net/players/192/448/25_120.png",
    nation: "Germany",
    nationFlag: "https://cdn.sofifa.net/flags/de.png",
    club: "FC Barcelona",
    clubLogo: "https://cdn.sofifa.net/teams/241/60.png",
    league: "La Liga",
    position: "GK",
    positionGroup: "GK",
    rating: 89,
    age: 33,
    height: 187,
    weight: 85,
    preferredFoot: "Right",
    weakFoot: 4,
    skillMoves: 1,
    pace: 85,
    shooting: 84,
    passing: 89,
    dribbling: 90,
    defending: 48,
    physical: 85,
    playStyles: ["Far Throw", "Footwork"],
    basePrice: 30,
  }
];

async function importPlayers() {
  const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/fc26auction";
  
  try {
    console.log("Connecting to MongoDB for player import...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB.");

    const apiKey = process.env.FUTDB_API_KEY;
    if (apiKey && apiKey.trim() !== "") {
      console.log("FUTDB API Key found. Fetching from futdb.app API...");
      let page = 1;
      let totalPages = 1;
      let totalImported = 0;

      while (page <= totalPages) {
        console.log(`Fetching page ${page}...`);
        const response = await fetch(`https://futdb.app/api/players?page=${page}&limit=50`, {
          headers: { "X-AUTH-TOKEN": apiKey }
        });

        const data = await response.json();
        const apiPlayers = data.items || [];
        totalPages = data.pagination.pageTotal || 1;

        if (apiPlayers.length === 0) break;

        const bulkOps = apiPlayers.map(p => {
          const positionGroup = ["ST", "CF", "LW", "RW"].includes(p.position) ? "FWD" :
                                ["GK"].includes(p.position) ? "GK" :
                                ["CB", "LB", "RB", "LWB", "RWB"].includes(p.position) ? "DEF" : "MID";

          return {
            updateOne: {
              filter: { futdbId: p.id },
              update: {
                $set: {
                  futdbId: p.id,
                  name: p.name,
                  commonName: p.common_name || p.name,
                  image: `https://cdn.sofifa.net/players/${p.id.toString().substring(0,3)}/${p.id.toString().substring(3)}/25_120.png`,
                  nation: p.nation?.name || "",
                  nationFlag: p.nation?.image_url || "",
                  club: p.club?.name || "",
                  clubLogo: p.club?.image_url || "",
                  league: p.league?.name || "",
                  position: p.position,
                  positionGroup,
                  rating: p.rating,
                  age: p.age,
                  height: p.height,
                  weight: p.weight,
                  preferredFoot: p.foot === "left" ? "Left" : "Right",
                  weakFoot: p.weak_foot,
                  skillMoves: p.skill_moves,
                  pace: p.pace || p.stats?.pace || 0,
                  shooting: p.shooting || p.stats?.shooting || 0,
                  passing: p.passing || p.stats?.passing || 0,
                  dribbling: p.dribbling || p.stats?.dribbling || 0,
                  defending: p.defending || p.stats?.defending || 0,
                  physical: p.physical || p.stats?.physical || 0,
                  playStyles: p.playstyles || [],
                  basePrice: p.rating >= 90 ? 50 : p.rating >= 85 ? 35 : p.rating >= 80 ? 20 : 10
                }
              },
              upsert: true
            }
          };
        });

        await Player.bulkWrite(bulkOps);
        totalImported += apiPlayers.length;
        console.log(`Upserted ${apiPlayers.length} players. Total imported: ${totalImported}`);

        page++;
      }
      console.log(`Successfully completed FUTDB API import of ${totalImported} players.`);
    } else {
      console.log("No FUTDB API Key. Seeding high-quality default players...");
      const bulkOps = fallbackPlayers.map(p => ({
        updateOne: {
          filter: { futdbId: p.futdbId },
          update: { $set: p },
          upsert: true
        }
      }));

      await Player.bulkWrite(bulkOps);
      console.log("Successfully seeded fallback players.");
    }
  } catch (err) {
    console.error("Error importing players:", err.message);
  } finally {
    await mongoose.disconnect();
    console.log("Mongoose disconnected.");
    process.exit(0);
  }
}

importPlayers();
