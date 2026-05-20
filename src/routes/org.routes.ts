// src/routes/org.routes.ts
import type { FastifyInstance } from 'fastify';
import { OrgController } from '../controllers/org.controller';

export default async function orgRoutes(app: FastifyInstance) {
  const controller = new OrgController(app);

  app.get('/org/summary', controller.getOrgSummary);

  // Публичный метод /org — карточка предприятия
  app.get('/org', controller.getOrg);
}
