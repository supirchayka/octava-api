"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/plugins/jwt.ts
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
const jwt_1 = __importDefault(require("@fastify/jwt"));
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'dev_access_secret';
const ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
exports.default = (0, fastify_plugin_1.default)(async function jwtPlugin(app) {
    await app.register(jwt_1.default, {
        secret: ACCESS_SECRET,
        sign: { expiresIn: ACCESS_EXPIRES_IN },
    });
    app.decorate('authenticate', async (request, reply) => {
        try {
            await request.jwtVerify();
        }
        catch {
            return reply.code(401).send({ message: 'Unauthorized' });
        }
    });
});
