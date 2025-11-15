import 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    httpErrors: {
      badRequest(message?: string): Error;
      unauthorized(message?: string): Error;
    };
  }
}
