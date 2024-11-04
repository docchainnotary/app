const { ObjectId } = require("mongodb");
const db = require("../utils/db");
const fs = require("fs");
const path = require("path");

const UPLOADS_DIR = path.join(__dirname, "..", "uploads");

// Ensure user directory exists
function ensureUserDirectory(userId) {
    const userDir = path.join(UPLOADS_DIR, `user_${userId}`);
    if (!fs.existsSync(userDir)) fs.mkdirSync(userDir);
    return userDir;
}

// Create a new project for a user
async function createProject(req, res) {
    const { userId } = req.params;
    const { name, description } = req.body;

    // Check if project with the same name already exists for the user
    const existingProject = await db.collection("projects").findOne({ userId, name });
    if (existingProject) {
        return res.status(400).json({ error: "Project with this name already exists" });
    }

    // Insert project metadata into MongoDB
    const projectData = {
        userId,
        name,
        description,
        createdAt: new Date(),
    };
    const result = await db.collection("projects").insertOne(projectData);

    // Create the project directory
    const userDir = ensureUserDirectory(userId);
    const projectDir = path.join(userDir, `project_${result.insertedId}`);
    fs.mkdirSync(projectDir);

    res.json({ message: "Project created", projectId: result.insertedId });
}

// Get all projects for a user
async function getProjects(req, res) {
    const { userId } = req.params;
    const projects = await db.collection("projects").find({ userId }).toArray();
    res.json(projects);
}

// Get a specific project by ID
async function getProject(req, res) {
    const { projectId } = req.params;
    const project = await db.collection("projects").findOne({ _id: new ObjectId(projectId) });

    if (!project) return res.status(404).json({ error: "Project not found" });

    res.json(project);
}

// Update project details
async function updateProject(req, res) {
    const { projectId } = req.params;
    const { name, description } = req.body;

    // Check if project exists
    const project = await db.collection("projects").findOne({ _id: new ObjectId(projectId) });
    if (!project) return res.status(404).json({ error: "Project not found" });

    // Update project metadata in MongoDB
    await db.collection("projects").updateOne(
        { _id: new ObjectId(projectId) },
        { $set: { name, description, updatedAt: new Date() } }
    );

    res.json({ message: "Project updated" });
}

// Delete a project and its associated files
async function deleteProject(req, res) {
    const { projectId } = req.params;
    const project = await db.collection("projects").findOne({ _id: new ObjectId(projectId) });

    if (!project) return res.status(404).json({ error: "Project not found" });

    // Delete project metadata from MongoDB
    await db.collection("projects").deleteOne({ _id: new ObjectId(projectId) });

    // Delete project directory and its contents
    const projectDir = path.join(UPLOADS_DIR, `user_${project.userId}`, `project_${projectId}`);
    fs.rmSync(projectDir, { recursive: true, force: true });

    res.json({ message: "Project deleted" });
}

// Get all files in a project
async function getProjectFiles(req, res) {
    const { projectId } = req.params;

    // Check if project exists
    const project = await db.collection("projects").findOne({ _id: new ObjectId(projectId) });
    if (!project) return res.status(404).json({ error: "Project not found" });

    const files = await db.collection("files").find({ projectId }).toArray();
    res.json(files);
}

module.exports = {
    createProject,
    getProjects,
    getProject,
    updateProject,
    deleteProject,
    getProjectFiles,
};
