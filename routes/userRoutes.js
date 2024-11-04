const express = require("express");
const authController = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

// Register a new user
router.post("/register", authController.register);

// Login a user and get a JWT
router.post("/login", authController.login);

// Get the authenticated user's profile
router.get("/profile", authMiddleware.authenticateToken, authController.getProfile);

module.exports = router;
