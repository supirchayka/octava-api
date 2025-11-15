"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("../services/auth.service");
class AuthController {
    constructor(app) {
        this.login = async (request, reply) => {
            const { email, password } = request.body;
            const ip = request.ip;
            const userAgent = request.headers["user-agent"] ?? null;
            const result = await this.service.login(email, password, ip, userAgent);
            return reply.send(result);
        };
        this.refresh = async (request, reply) => {
            const { refreshToken } = request.body;
            const ip = request.ip;
            const userAgent = request.headers["user-agent"] ?? null;
            const result = await this.service.refresh(refreshToken, ip, userAgent);
            return reply.send(result);
        };
        this.me = async (request, reply) => {
            // request.user заполняется fastify-jwt
            const payload = request.user; // { userId, email, role }
            const user = await this.service.getCurrentUser(payload.userId);
            return reply.send(user);
        };
        this.service = new auth_service_1.AuthService(app);
    }
}
exports.AuthController = AuthController;
