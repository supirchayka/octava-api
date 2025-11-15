// src/controllers/admin-catalog.controller.ts
import type {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from 'fastify';
import {
  AdminCatalogService,
  CategoryBody,
  ServiceBody,
  DeviceBody,
} from '../services/admin-catalog.service';

export class AdminCatalogController {
  private service: AdminCatalogService;

  constructor(private app: FastifyInstance) {
    this.service = new AdminCatalogService(app);
  }

  private ensureEditor(request: FastifyRequest) {
    const user = request.user as any;
    if (!user || (user.role !== 'ADMIN' && user.role !== 'EDITOR')) {
      throw this.app.httpErrors.forbidden('Недостаточно прав');
    }
  }

  /* ========== Categories ========== */

  createCategory = async (request: FastifyRequest, reply: FastifyReply) => {
    this.ensureEditor(request);
    const body = request.body as CategoryBody;
    const category = await this.service.createCategory(body);
    return reply.code(201).send(category);
  };

  updateCategory = async (request: FastifyRequest, reply: FastifyReply) => {
    this.ensureEditor(request);
    const { id } = request.params as { id: string };
    const body = request.body as CategoryBody;
    const category = await this.service.updateCategory(Number(id), body);
    return reply.send(category);
  };

  deleteCategory = async (request: FastifyRequest, reply: FastifyReply) => {
    this.ensureEditor(request);
    const { id } = request.params as { id: string };
    await this.service.deleteCategory(Number(id));
    return reply.code(204).send();
  };

  /* ========== Services ========== */

  createService = async (request: FastifyRequest, reply: FastifyReply) => {
    this.ensureEditor(request);
    const body = request.body as ServiceBody;
    const service = await this.service.createService(body);
    return reply.code(201).send(service);
  };

  updateService = async (request: FastifyRequest, reply: FastifyReply) => {
    this.ensureEditor(request);
    const { id } = request.params as { id: string };
    const body = request.body as ServiceBody;
    const service = await this.service.updateService(Number(id), body);
    return reply.send(service);
  };

  deleteService = async (request: FastifyRequest, reply: FastifyReply) => {
    this.ensureEditor(request);
    const { id } = request.params as { id: string };
    await this.service.deleteService(Number(id));
    return reply.code(204).send();
  };

  /* ========== Devices ========== */

  createDevice = async (request: FastifyRequest, reply: FastifyReply) => {
    this.ensureEditor(request);
    const body = request.body as DeviceBody;
    const device = await this.service.createDevice(body);
    return reply.code(201).send(device);
  };

  updateDevice = async (request: FastifyRequest, reply: FastifyReply) => {
    this.ensureEditor(request);
    const { id } = request.params as { id: string };
    const body = request.body as DeviceBody;
    const device = await this.service.updateDevice(Number(id), body);
    return reply.send(device);
  };

  deleteDevice = async (request: FastifyRequest, reply: FastifyReply) => {
    this.ensureEditor(request);
    const { id } = request.params as { id: string };
    await this.service.deleteDevice(Number(id));
    return reply.code(204).send();
  };
}
