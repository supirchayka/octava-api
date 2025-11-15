import '@fastify/jwt';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: number; role: 'ADMIN' | 'EDITOR' };
    user: { id: number; role: 'ADMIN' | 'EDITOR' };
  }
}
