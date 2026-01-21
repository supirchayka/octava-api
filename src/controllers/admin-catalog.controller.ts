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
  SpecialistBody,
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

  listCategories = async (request: FastifyRequest, reply: FastifyReply) => {
    this.ensureEditor(request);
    const categories = await this.service.listCategories();
    return reply.send(categories);
  };

  getCategory = async (request: FastifyRequest, reply: FastifyReply) => {
    this.ensureEditor(request);
    const { id } = request.params as { id: string };
    const category = await this.service.getCategoryById(Number(id));
    return reply.send(category);
  };

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

  listServices = async (request: FastifyRequest, reply: FastifyReply) => {
    this.ensureEditor(request);
    const { categoryId } = request.query as { categoryId?: string };
    const services = await this.service.listServices({
      categoryId: categoryId ? Number(categoryId) : undefined,
    });
    return reply.send(services);
  };

  getService = async (request: FastifyRequest, reply: FastifyReply) => {
    this.ensureEditor(request);
    const { id } = request.params as { id: string };
    const service = await this.service.getServiceById(Number(id));
    return reply.send(service);
  };

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

  listDevices = async (request: FastifyRequest, reply: FastifyReply) => {
    this.ensureEditor(request);
    const devices = await this.service.listDevices();
    return reply.send(devices);
  };

  getDevice = async (request: FastifyRequest, reply: FastifyReply) => {
    this.ensureEditor(request);
    const { id } = request.params as { id: string };
    const device = await this.service.getDeviceById(Number(id));
    return reply.send(device);
  };

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

  /* ========== Specialists ========== */

  listSpecialists = async (request: FastifyRequest, reply: FastifyReply) => {
    this.ensureEditor(request);
    const specialists = await this.service.listSpecialists();
    return reply.send(specialists);
  };

  getSpecialist = async (request: FastifyRequest, reply: FastifyReply) => {
    this.ensureEditor(request);
    const { id } = request.params as { id: string };
    const specialist = await this.service.getSpecialistById(Number(id));
    return reply.send(specialist);
  };

  createSpecialist = async (request: FastifyRequest, reply: FastifyReply) => {
    this.ensureEditor(request);
    const body = request.body as SpecialistBody;
    const specialist = await this.service.createSpecialist(body);
    return reply.code(201).send(specialist);
  };

  updateSpecialist = async (request: FastifyRequest, reply: FastifyReply) => {
    this.ensureEditor(request);
    const { id } = request.params as { id: string };
    const body = request.body as SpecialistBody;
    const specialist = await this.service.updateSpecialist(Number(id), body);
    return reply.send(specialist);
  };

  deleteSpecialist = async (request: FastifyRequest, reply: FastifyReply) => {
    this.ensureEditor(request);
    const { id } = request.params as { id: string };
    await this.service.deleteSpecialist(Number(id));
    return reply.code(204).send();
  };
}
