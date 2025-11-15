// src/controllers/admin-org.controller.ts
import type {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from 'fastify';
import { AdminOrgService, type OrgBody } from '../services/admin-org.service';

export class AdminOrgController {
  private service: AdminOrgService;

  constructor(private app: FastifyInstance) {
    this.service = new AdminOrgService(app);
  }

  private ensureEditor(request: FastifyRequest) {
    const user = request.user as any;
    if (!user || (user.role !== 'ADMIN' && user.role !== 'EDITOR')) {
      throw this.app.httpErrors.forbidden('Недостаточно прав');
    }
  }

  upsertOrg = async (request: FastifyRequest, reply: FastifyReply) => {
    this.ensureEditor(request);
    const body = request.body as OrgBody;
    const org = await this.service.upsertOrganization(body);
    return reply.send(org);
  };
}
