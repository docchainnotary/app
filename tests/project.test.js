const { connectDB, mongoose } = require("../utils/db"); // Import connectDB and mongoose
const request = require("supertest");
const app = require("../app");

let token;
let projectId;

afterAll(async () => {
    await mongoose.connection.close();
});


beforeAll(async () => {
    await connectDB();
    // Log in and retrieve token for authorized requests
    const res = await request(app)
        .post("/api/users/login")
        .send({ email: "test@example.com", password: "password123" });
    token = res.body.token;
});

describe("Project Routes", () => {
    it("should create a new project", async () => {
        const res = await request(app)
            .post("/api/projects")
            .set("Authorization", `Bearer ${token}`)
            .send({
                name: "Test Project",
                description: "A project created during testing"
            });
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty("projectId");
        projectId = res.body.projectId;
    });

    it("should retrieve the created project", async () => {
        const res = await request(app)
            .get(`/api/projects/${projectId}`)
            .set("Authorization", `Bearer ${token}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body.name).toBe("Test Project");
    });

    it("should delete the project", async () => {
        const res = await request(app)
            .delete(`/api/projects/${projectId}`)
            .set("Authorization", `Bearer ${token}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toBe("Project deleted");
    });
});
