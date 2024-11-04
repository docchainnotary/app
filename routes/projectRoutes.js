const express = require("express");
const projectController = require("../controllers/projectController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

// Create a new project
router.post("/users/:userId/projects", authMiddleware.authenticateToken, projectController.createProject);

// Get all projects for a user
router.get("/users/:userId/projects", authMiddleware.authenticateToken, projectController.getProjects);

// Get a specific project by ID
router.get("/projects/:projectId", authMiddleware.authenticateToken, projectController.getProject);

// Update project details
router.put("/projects/:projectId", authMiddleware.authenticateToken, projectController.updateProject);

// Delete a project and its associated files
router.delete("/projects/:projectId", authMiddleware.authenticateToken, projectController.deleteProject);

// Get all files within a specific project
router.get("/projects/:projectId/files", authMiddleware.authenticateToken, projectController.getProjectFiles);

module.exports = router;
