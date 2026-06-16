const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: "./backend/.env" });

async function main() {
  const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/fc26auction";
  
  try {
    console.log("Connecting to MongoDB to create Admin user...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected.");

    const existingAdmin = await mongoose.connection.collection("users").findOne({ email: "admin@fc26.com" });
    if (existingAdmin) {
      console.log("Admin account (admin@fc26.com) already exists. Skipping creation.");
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash("admin123", 12);
    
    await mongoose.connection.collection("users").insertOne({
      name: "Admin User",
      email: "admin@fc26.com",
      password: hashedPassword,
      role: "admin",
      teamId: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log("Admin account created successfully.");
    console.log("Email: admin@fc26.com");
    console.log("Password: admin123");
  } catch (err) {
    console.error("Error creating Admin user:", err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

main();
