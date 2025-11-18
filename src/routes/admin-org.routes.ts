// src/routes/admin-org.routes.ts
import type { FastifyInstance } from 'fastify';
import { AdminOrgController } from '../controllers/admin-org.controller';

export default async function adminOrgRoutes(app: FastifyInstance) {
  const controller = new AdminOrgController(app);

  // Текущая карточка организации
  app.get(
    '/admin/org',
    {
      preHandler: [app.authenticate],
    },
    controller.getOrg,
  );

  // Обновление/создание карточки организации
  app.put(
    '/admin/org',
    {
      preHandler: [app.authenticate],
      schema: {
        body: {
          type: 'object',
          properties: {
            fullName: { type: 'string' },
            ogrn: { type: 'string' },
            inn: { type: 'string' },
            kpp: { type: 'string' },
            address: { type: 'string' },
            email: { type: 'string' },
          },
        },
      },
    },
    controller.upsertOrg,
  );
}
