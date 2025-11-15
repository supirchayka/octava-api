// src/controllers/admin-pages.controller.ts
import type {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from 'fastify';
import {
  AdminPagesService,
  type HomePageBody,
  type AboutPageBody,
  type ContactsPageBody,
  type PolicyPageBody,
} from '../services/admin-pages.service';

export class AdminPagesController {
  private service: AdminPagesService;

  constructor(private app: FastifyInstance) {
    this.service = new AdminPagesService(app);
  }

  private ensureEditor(request: FastifyRequest) {
    const user = request.user as any;
    if (!user || (user.role !== 'ADMIN' && user.role !== 'EDITOR')) {
      throw this.app.httpErrors.forbidden('Недостаточно прав');
    }
  }

  updateHome = async (request: FastifyRequest, reply: FastifyReply) => {
    this.ensureEditor(request);
    const body = request.body as HomePageBody;
    await this.service.updateHomePage(body);
    return reply.code(204).send();
  };

  updateAbout = async (request: FastifyRequest, reply: FastifyReply) => {
    this.ensureEditor(request);
    const body = request.body as AboutPageBody;
    await this.service.updateAboutPage(body);
    return reply.code(204).send();
  };

  updateContacts = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => {
    this.ensureEditor(request);
    const body = request.body as ContactsPageBody;
    await this.service.updateContactsPage(body);
    return reply.code(204).send();
  };

  updatePersonalDataPolicy = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => {
    this.ensureEditor(request);
    const body = request.body as PolicyPageBody;
    await this.service.updatePersonalDataPolicy(body);
    return reply.code(204).send();
  };

  updatePrivacyPolicy = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => {
    this.ensureEditor(request);
    const body = request.body as PolicyPageBody;
    await this.service.updatePrivacyPolicy(body);
    return reply.code(204).send();
  };
}
