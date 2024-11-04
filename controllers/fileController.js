const fs = require("fs");
const path = require("path");
const { ObjectId } = require("mongodb");
const db = require("../utils/db");
const { encryptFile, decryptFile } = require("../utils/encryption");

const UPLOADS_DIR = path.join(__dirname, "..", "uploads");

// Ensure user and project directories exist
function ensureUserProjectDirectory(userId, projectId) {
    const userDir = path.join(UPLOADS_DIR, `user_${userId}`);
    const projectDir = path.join(userDir, `project_${projectId}`);

    if (!fs.existsSync(userDir)) fs.mkdirSync(userDir);
    if (!fs.existsSync(projectDir)) fs.mkdirSync(projectDir);

    return projectDir;
}

// Upload file
async function uploadFile(req, res) {
    const { userId, projectId } = req.params;
    const projectDir = ensureUserProjectDirectory(userId, projectId);
    const filePath = path.join(projectDir, req.file.originalname);

    const encryptedPath = encryptFile(req.file.path, filePath);
    fs.unlinkSync(req.file.path); // Delete temp upload

    // Store file metadata in MongoDB
    const fileData = {
        userId,
        projectId,
        name: req.file.originalname,
        path: encryptedPath,
        size: req.file.size,
        createdAt: new Date(),
    };
    const result = await db.collection("files").insertOne(fileData);

    res.json({ message: "File uploaded", fileId: result.insertedId });
}

// Get file
async function getFile(req, res) {
    const { fileId } = req.params;
    const file = await db.collection("files").findOne({ _id: new ObjectId(fileId) });

    if (!file) return res.status(404).json({ error: "File not found" });

    const decryptedPath = decryptFile(file.path);
    res.download(decryptedPath, file.name, (err) => {
        if (err) res.status(500).json({ error: "Failed to download file" });
        fs.unlinkSync(decryptedPath); // Clean up decrypted file after download
    });
}

// Rename file
async function renameFile(req, res) {
    const { fileId } = req.params;
    const { newName } = req.body;
    const file = await db.collection("files").findOne({ _id: new ObjectId(fileId) });

    if (!file) return res.status(404).json({ error: "File not found" });

    const newPath = path.join(path.dirname(file.path), newName);
    fs.renameSync(file.path, newPath);

    await db.collection("files").updateOne(
        { _id: new ObjectId(fileId) },
        { $set: { name: newName, path: newPath } }
    );

    res.json({ message: "File renamed successfully" });
}

// Delete file
async function deleteFile(req, res) {
    const { fileId } = req.params;
    const file = await db.collection("files").findOne({ _id: new ObjectId(fileId) });

    if (!file) return res.status(404).json({ error: "File not found" });

    fs.unlinkSync(file.path);
    await db.collection("files").deleteOne({ _id: new ObjectId(fileId) });

    res.json({ message: "File deleted successfully" });
}

// Copy file
async function copyFile(req, res) {
    const { fileId } = req.params;
    const file = await db.collection("files").findOne({ _id: new ObjectId(fileId) });

    if (!file) return res.status(404).json({ error: "File not found" });

    const copyPath = `${file.path}.copy`;
    fs.copyFileSync(file.path, copyPath);

    const fileCopy = {
        ...file,
        _id: undefined,
        path: copyPath,
        createdAt: new Date(),
    };

    const result = await db.collection("files").insertOne(fileCopy);
    res.json({ message: "File copied successfully", fileId: result.insertedId });
}

module.exports = {
    uploadFile,
    getFile,
    renameFile,
    deleteFile,
    copyFile,
};

