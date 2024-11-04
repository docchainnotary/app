const express = require("express");
const dotenv = require("dotenv");
const config = require("./.env.js"); // Structured JSON configuration
const mysql = require("mysql2");
const mongoose = require("./utils/db"); // Initializes MongoDB connection
const path = require("path");

const projectRoutes = require("./routes/projectRoutes");
const fileRoutes = require("./routes/fileRoutes");
const userRoutes = require("./routes/userRoutes");
const errorHandler = require("./middlewares/errorHandler");

//dotenv.config(); // Load flat environment variables from .env
dotenv.config({ path: `.env.${process.env.NODE_ENV || 'dev'}` });

const app = express();

// MySQL Database Connection for User Data
const dbConnection = mysql.createConnection({
    host: config.db.host,
    user: config.db.user,
    password: config.db.pass,
    database: config.db.db,
});

dbConnection.connect((err) => {
    if (err) {
        console.error("Database connection failed:", err.stack);
        process.exit(1); // Exit if connection fails
    }
    console.log("Connected to MySQL database for user data");
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (e.g., uploaded content)
app.use("/uploads", express.static(path.join(__dirname, config.uploads.baseDir)));

// Mount Routes
app.use("/api/projects", projectRoutes); // Project management routes
app.use("/api/files", fileRoutes);       // File management routes
app.use("/api/users", userRoutes);       // User authentication and management routes

// Error Handling Middleware (placed after all routes)
app.use(errorHandler);

// Define the PORT from .env or default to 3000
const PORT = process.env.PORT || 3000;
app.PORT = PORT;

// Start the Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app; // Export for testing or additional setup
