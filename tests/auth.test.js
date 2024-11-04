const { connectDB, mongoose } = require("../utils/db"); // Import connectDB and mongoose
const request = require("supertest");
const app = require("../app"); // Import the Express app

beforeAll(async () => {
    await connectDB();
});

afterAll(async () => {
    await mongoose.connection.close();
});

describe("Auth Routes", () => {
    let token;

    it("should register a new user", async () => {
        const res = await request(app)
            .post("/api/users/register")
            .send({
                username: "testuser",
                email: "test@example.com",
                password: "password123"
            });
        expect(res.statusCode).toEqual(201);
        expect(res.body.message).toBe("User registered successfully");
    });

    it("should log in an existing user", async () => {
        const res = await request(app)
            .post("/api/users/login")
            .send({
                email: "test@example.com",
                password: "password123"
            });
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty("token");
        token = res.body.token; // Store token for authorized requests
    });

    it("should get the user profile with valid token", async () => {
        const res = await request(app)
            .get("/api/users/profile")
            .set("Authorization", `Bearer ${token}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body.email).toBe("test@example.com");
    });
});
