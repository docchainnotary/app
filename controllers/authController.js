const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../utils/db"); // MySQL database connection module
const config = require("../config"); // Configuration file with JWT secret and settings

// Register function to create a new user
async function register(req, res) {
    const { username, email, password } = req.body;

    // Check if all fields are provided
    if (!username || !email || !password) {
        return res.status(400).json({ error: "All fields are required" });
    }

    // Check if the user already exists
    db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
        if (err) {
            console.error("Database query error:", err);
            return res.status(500).json({ error: "Database query failed" });
        }

        if (results.length > 0) {
            return res.status(400).json({ error: "User already exists" });
        }

        try {
            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert the new user
            db.query(
                "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
                [username, email, hashedPassword],
                (err, results) => {
                    if (err) {
                        console.error("Error inserting user:", err);
                        return res.status(500).json({ error: "Failed to create user" });
                    }

                    res.status(201).json({ message: "User registered successfully" });
                }
            );
        } catch (hashError) {
            console.error("Error hashing password:", hashError);
            res.status(500).json({ error: "Failed to hash password" });
        }
    });
}

// Login function to authenticate a user and provide a JWT
async function login(req, res) {
    const { email, password } = req.body;

    // Check if both email and password are provided
    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
    }

    // Check if the user exists
    db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
        if (err) {
            console.error("Database query error:", err);
            return res.status(500).json({ error: "Database query failed" });
        }

        if (results.length === 0) {
            return res.status(400).json({ error: "Invalid credentials" });
        }

        const user = results[0];

        // Compare passwords
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Invalid credentials" });
        }

        // Generate JWT
        const token = jwt.sign(
            { userId: user.id, username: user.username },
            config.jwt.key, // JWT secret from config
            { expiresIn: config.jwt.expiresIn || "1h" } // Default expiration if not set in config
        );

        res.json({ message: "Login successful", token });
    });
}

// Profile function to fetch authenticated user’s profile information
async function profile(req, res) {
    const userId = req.user.userId; // `userId` is added to `req.user` by auth middleware

    // Query the database for the user's profile data
    db.query("SELECT id, username, email, created_at FROM users WHERE id = ?", [userId], (err, results) => {
        if (err) {
            console.error("Database query error:", err);
            return res.status(500).json({ error: "Failed to retrieve user profile" });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const userProfile = results[0];
        res.json(userProfile);
    });
}

module.exports = { register, login, profile };

