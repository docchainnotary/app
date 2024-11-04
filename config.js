require("dotenv").config(); // Load environment variables from .env

module.exports = {
    db: {
        uri: process.env.MONGO_URI || "mongodb://localhost:27017/notary_db",
        options: {
        },
    },
    jwt: {
        secret: process.env.JWT_SECRET || "default_jwt_secret", // Replace with a strong secret in production
        expiresIn: process.env.JWT_EXPIRES_IN || "1h", // Token expiration
    },
    encryption: {
        key: process.env.ENCRYPTION_KEY || crypto.randomBytes(32), // Secure 256-bit encryption key
        ivLength: 16, // IV length for AES-256
    },
    server: {
        port: process.env.PORT || 3000, // Default port for the server
    },
    uploads: {
        baseDir: "uploads", // Directory to store uploaded files
        tempDir: "temp_uploads", // Temporary storage before encryption
    },
};
