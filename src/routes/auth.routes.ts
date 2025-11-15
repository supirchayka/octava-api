import type { FastifyInstance } from "fastify";
import { AuthController } from "../controllers/auth.controller";

export default async function authRoutes(app: FastifyInstance) {
  const controller = new AuthController(app);

  app.post(
    "/auth/login",
    {
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
    },
    controller.login
  );

  app.post(
    "/auth/refresh",
    {
      schema: {
        body: {
          type: "object",
          required: ["refreshToken"],
          properties: {
            refreshToken: { type: "string", minLength: 16 },
          },
        },
      },
    },
    controller.refresh
  );

  app.get(
    "/auth/me",
    {
      preHandler: [app.authenticate], // JWT bearer
    },
    controller.me
  );
}
