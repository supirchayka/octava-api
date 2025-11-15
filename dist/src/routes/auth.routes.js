"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = authRoutes;
const auth_controller_1 = require("../controllers/auth.controller");
async function authRoutes(app) {
    const controller = new auth_controller_1.AuthController(app);
    app.post("/auth/login", {
        schema: {
            body: {
                type: "object",
                required: ["email", "password"],
                properties: {
                    email: { type: "string", format: "email" },
                    password: { type: "string", minLength: 6 },
                },
            },
        },
    }, controller.login);
    app.post("/auth/refresh", {
        schema: {
            body: {
                type: "object",
                required: ["refreshToken"],
                properties: {
                    refreshToken: { type: "string", minLength: 16 },
                },
            },
        },
    }, controller.refresh);
    app.get("/auth/me", {
        preHandler: [app.authenticate], // JWT bearer
    }, controller.me);
}
