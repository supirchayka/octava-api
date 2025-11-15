"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const crypto_1 = require("../utils/crypto");
const password_1 = require("../utils/password");
const ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || "15m";
const REFRESH_TTL_DAYS = Number(process.env.JWT_REFRESH_TTL_DAYS || "30");
class AuthService {
    constructor(app) {
        this.app = app;
    }
    signAccessToken(user) {
        return this.app.jwt.sign({
            userId: user.id,
            email: user.email,
            role: user.role,
        }, { expiresIn: ACCESS_EXPIRES_IN });
    }
    async createRefreshToken(user, ip, userAgent) {
        const token = (0, crypto_1.generateRandomToken)(32);
        const tokenHash = (0, crypto_1.hashToken)(token);
        const expiresAt = new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);
        await this.app.prisma.refreshToken.create({
            data: {
                userId: user.id,
                tokenHash,
                expiresAt,
                ip,
                userAgent: userAgent ?? null,
            },
        });
        return token;
    }
    async login(email, password, ip, userAgent) {
        const user = await this.app.prisma.user.findUnique({ where: { email } });
        if (!user || !user.isActive) {
            throw this.app.httpErrors.unauthorized("Неверный логин или пароль");
        }
        const ok = await (0, password_1.verifyPassword)(password, user.passwordHash);
        if (!ok) {
            throw this.app.httpErrors.unauthorized("Неверный логин или пароль");
        }
        const accessToken = this.signAccessToken(user);
        const refreshToken = await this.createRefreshToken(user, ip, userAgent);
        return {
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
            },
            accessToken,
            refreshToken,
        };
    }
    async refresh(refreshToken, ip, userAgent) {
        if (!refreshToken) {
            throw this.app.httpErrors.badRequest("Токен обновления не передан");
        }
        const tokenHash = (0, crypto_1.hashToken)(refreshToken);
        const record = await this.app.prisma.refreshToken.findFirst({
            where: {
                tokenHash,
                revokedAt: null,
                expiresAt: { gt: new Date() },
            },
            include: {
                user: true,
            },
        });
        if (!record || !record.user || !record.user.isActive) {
            throw this.app.httpErrors.unauthorized("Недействительный токен обновления");
        }
        // ревокаем старый refresh
        await this.app.prisma.refreshToken.update({
            where: { id: record.id },
            data: { revokedAt: new Date() },
        });
        const user = record.user;
        const accessToken = this.signAccessToken(user);
        const newRefreshToken = await this.createRefreshToken(user, ip, userAgent);
        return {
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
            },
            accessToken,
            refreshToken: newRefreshToken,
        };
    }
    async getCurrentUser(userId) {
        const user = await this.app.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user || !user.isActive) {
            throw this.app.httpErrors.unauthorized("Пользователь не найден или отключен");
        }
        return {
            id: user.id,
            email: user.email,
            role: user.role,
        };
    }
}
exports.AuthService = AuthService;
