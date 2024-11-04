const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "default_jwt_secret"; // Use a strong secret stored in .env

// Middleware to authenticate JWT
function authenticateToken(req, res, next) {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(401).json({ error: "Access denied. No token provided." });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: "Invalid or expired token" });
        }

        req.user = user; // Attach user info from token to request
        next();
    });
}

// Middleware to check for admin role
function checkAdminRole(req, res, next) {
    if (req.user && req.user.role === "admin") {
        next();
    } else {
        res.status(403).json({ error: "Admin access required" });
    }
}

module.exports = {
    authenticateToken,
    checkAdminRole,
};

