import type { FastifyInstance } from "fastify";
import type { User } from "@prisma/client";
import { generateRandomToken, hashToken } from "../utils/crypto";
import { verifyPassword } from "../utils/password";

const ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || "15m";
const REFRESH_TTL_DAYS = Number(process.env.JWT_REFRESH_TTL_DAYS || "30");

export class AuthService {
  constructor(private app: FastifyInstance) {}

  private signAccessToken(user: User): string {
    return this.app.jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      { expiresIn: ACCESS_EXPIRES_IN }
    );
  }

  private async createRefreshToken(
    user: User,
    ip: string,
    userAgent?: string | null
  ): Promise<string> {
    const token = generateRandomToken(32);
    const tokenHash = hashToken(token);
    const expiresAt = new Date(
      Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000
    );

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

  async login(
    email: string,
    password: string,
    ip: string,
    userAgent?: string | null
  ) {
    const user = await this.app.prisma.user.findUnique({ where: { email } });

    if (!user || !user.isActive) {
      throw this.app.httpErrors.unauthorized("Неверный логин или пароль");
    }

    const ok = await verifyPassword(password, user.passwordHash);
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

  async refresh(refreshToken: string, ip: string, userAgent?: string | null) {
    if (!refreshToken) {
      throw this.app.httpErrors.badRequest("Токен обновления не передан");
    }

    const tokenHash = hashToken(refreshToken);

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
      throw this.app.httpErrors.unauthorized(
        "Недействительный токен обновления"
      );
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

  async getCurrentUser(userId: number) {
    const user = await this.app.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.isActive) {
      throw this.app.httpErrors.unauthorized(
        "Пользователь не найден или отключен"
      );
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }
}
