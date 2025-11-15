// src/routes/admin-files.routes.ts
import type { FastifyInstance } from 'fastify';
import { AdminFilesController } from '../controllers/admin-files.controller';

export default async function adminFilesRoutes(app: FastifyInstance) {
  const controller = new AdminFilesController(app);

  app.post(
    '/admin/files/upload',
    {
      preHandler: [app.authenticate]
    },
    controller.upload,
  );
}
