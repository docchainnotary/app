const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { ObjectId } = require("mongodb");
const db = require("../utils/db");

const JWT_SECRET = process.env.JWT_SECRET || "default_jwt_secret"; // Use a secure secret in .env

// Register a new user
async function register(req, res) {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await db.collection("users").findOne({ email });
    if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
    const user = {
        username,
        email,
        password: hashedPassword,
        createdAt: new Date(),
    };

    const result = await db.collection("users").insertOne(user);

    res.status(201).json({ message: "User registered successfully", userId: result.insertedId });
}

// Login user and generate a JWT
async function login(req, res) {
    const { email, password } = req.body;

    // Find the user
    const user = await db.collection("users").findOne({ email });
    if (!user) {
        return res.status(400).json({ error: "Invalid credentials" });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(400).json({ error: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
        { userId: user._id, username: user.username },
        JWT_SECRET,
        { expiresIn: "1h" }
    );

    res.json({ message: "Login successful", token });
}

// Get the authenticated user's profile
async function getProfile(req, res) {
    const userId = req.user.userId;
    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });

    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }

    // Exclude password from response
    const { password, ...userData } = user;
    res.json(userData);
}

// Middleware to authenticate JWT
function authenticateToken(req, res, next) {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(401).json({ error: "Access denied. No token provided." });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: "Invalid token" });
        }

        req.user = user;
        next();
    });
}

module.exports = {
    register,
    login,
    getProfile,
    authenticateToken,
};
