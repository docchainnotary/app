const { connectDB, mongoose } = require("../utils/db"); // Import connectDB and mongoose
const request = require("supertest");
const app = require("../app");
const path = require("path");

beforeAll(async () => {
    await connectDB();
});

afterAll(async () => {
    await mongoose.connection.close();
});


let token;
let projectId;
let fileId;

beforeAll(async () => {
    // Log in and create a project for file management tests
    const loginRes = await request(app)
        .post("/api/users/login")
        .send({ email: "test@example.com", password: "password123" });
    token = loginRes.body.token;

    const projectRes = await request(app)
        .post("/api/projects")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "File Test Project", description: "Project for file testing" });
    projectId = projectRes.body.projectId;
});

describe("File Routes", () => {
    it("should upload a file", async () => {
        const res = await request(app)
            .post(`/api/projects/${projectId}/files`)
            .set("Authorization", `Bearer ${token}`)
            .attach("file", path.join(__dirname, "sample.txt"));
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty("fileId");
        fileId = res.body.fileId;
    });

    it("should retrieve the uploaded file", async () => {
        const res = await request(app)
            .get(`/api/files/${fileId}`)
            .set("Authorization", `Bearer ${token}`);
        expect(res.statusCode).toEqual(200);
        expect(res.headers["content-type"]).toBe("text/plain; charset=UTF-8");
    });

    it("should delete the uploaded file", async () => {
        const res = await request(app)
            .delete(`/api/files/${fileId}`)
            .set("Authorization", `Bearer ${token}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toBe("File deleted successfully");
    });
});
