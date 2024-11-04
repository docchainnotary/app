const express = require("express");
const multer = require("multer");
const fileController = require("../controllers/fileController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();
const upload = multer({ dest: "temp_uploads/" }); // Temporary storage before encryption

// Upload a new file to a project
router.post(
    "/users/:userId/projects/:projectId/files",
    authMiddleware.authenticateToken,
    upload.single("file"),
    fileController.uploadFile
);

// Get a specific file by ID
router.get("/files/:fileId", authMiddleware.authenticateToken, fileController.getFile);

// Rename a file
router.put("/files/:fileId", authMiddleware.authenticateToken, fileController.renameFile);

// Delete a file
router.delete("/files/:fileId", authMiddleware.authenticateToken, fileController.deleteFile);

// Copy a file
router.post("/files/:fileId/copy", authMiddleware.authenticateToken, fileController.copyFile);

module.exports = router;
