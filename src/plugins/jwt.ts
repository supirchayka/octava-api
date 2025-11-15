// src/plugins/jwt.ts
import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { Role } from '@prisma/client';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'dev_access_secret';
const ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { userId: number; email: string; role: Role };
    user: { userId: number; email: string; role: Role };
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => Promise<void>;
  }
}

export default fp(async function jwtPlugin(app: FastifyInstance) {
  await app.register(jwt, {
    secret: ACCESS_SECRET,
    sign: { expiresIn: ACCESS_EXPIRES_IN },
  });

  app.decorate(
    'authenticate',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();
      } catch {
        return reply.code(401).send({ message: 'Unauthorized' });
      }
    },
  );
});
