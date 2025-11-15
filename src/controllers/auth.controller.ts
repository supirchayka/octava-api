import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { AuthService } from "../services/auth.service";

interface LoginBody {
  email: string;
  password: string;
}

interface RefreshBody {
  refreshToken: string;
}

export class AuthController {
  private service: AuthService;

  constructor(app: FastifyInstance) {
    this.service = new AuthService(app);
  }

  login = async (
    request: FastifyRequest<{ Body: LoginBody }>,
    reply: FastifyReply
  ) => {
    const { email, password } = request.body;
    const ip = request.ip;
    const userAgent = request.headers["user-agent"] ?? null;

    const result = await this.service.login(email, password, ip, userAgent);
    return reply.send(result);
  };

  refresh = async (
    request: FastifyRequest<{ Body: RefreshBody }>,
    reply: FastifyReply
  ) => {
    const { refreshToken } = request.body;
    const ip = request.ip;
    const userAgent = request.headers["user-agent"] ?? null;

    const result = await this.service.refresh(refreshToken, ip, userAgent);
    return reply.send(result);
  };

  me = async (request: FastifyRequest, reply: FastifyReply) => {
    // request.user заполняется fastify-jwt
    const payload = request.user; // { userId, email, role }

    const user = await this.service.getCurrentUser(payload.userId);
    return reply.send(user);
  };
}
