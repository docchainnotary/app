const app = require("../app");
const mongoose = require("mongoose");
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/docchain";


async function connectDB() {
    try {
        await mongoose.connect(MONGO_URI, { });
        console.log("Connected to MongoDB successfully");
    } catch (error) {
        console.error("Failed to connect to MongoDB:", error);
        process.exit(1); // Exit on failure
    }
}

connectDB();

module.exports = { connectDB, mongoose };
