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

  getHome = async (request: FastifyRequest, reply: FastifyReply) => {
    this.ensureEditor(request);
    const data = await this.service.getHomePage();
    return reply.send(data);
  };

  updateHome = async (request: FastifyRequest, reply: FastifyReply) => {
    this.ensureEditor(request);
    const body = request.body as HomePageBody;
    await this.service.updateHomePage(body);
    return reply.code(204).send();
  };

  getAbout = async (request: FastifyRequest, reply: FastifyReply) => {
    this.ensureEditor(request);
    const data = await this.service.getAboutPage();
    return reply.send(data);
  };

  updateAbout = async (request: FastifyRequest, reply: FastifyReply) => {
    this.ensureEditor(request);
    const body = request.body as AboutPageBody;
    await this.service.updateAboutPage(body);
    return reply.code(204).send();
  };

  getContacts = async (request: FastifyRequest, reply: FastifyReply) => {
    this.ensureEditor(request);
    const data = await this.service.getContactsPage();
    return reply.send(data);
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

  getPersonalDataPolicy = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => {
    this.ensureEditor(request);
    const data = await this.service.getPersonalDataPolicy();
    return reply.send(data);
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

  getPrivacyPolicy = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => {
    this.ensureEditor(request);
    const data = await this.service.getPrivacyPolicy();
    return reply.send(data);
  };
}
