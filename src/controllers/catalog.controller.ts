// src/controllers/catalog.controller.ts
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { CatalogService } from "../services/catalog.service";

export class CatalogController {
  private service: CatalogService;

  constructor(app: FastifyInstance) {
    this.service = new CatalogService(app);
  }

  // ===== категории услуг =====

  getServiceCategories = async (_req: FastifyRequest, reply: FastifyReply) => {
    const categories = await this.service.getServiceCategories();
    return reply.send(categories);
  };

  getServiceCategory = async (
    request: FastifyRequest<{ Params: { slug: string } }>,
    reply: FastifyReply
  ) => {
    const { slug } = request.params;
    const data = await this.service.getServiceCategoryBySlug(slug);
    if (!data) {
      return reply
        .code(404)
        .send({ message: "Категория услуг не найдена или не опубликована" });
    }
    return reply.send(data);
  };

  // ===== услуга =====

  getService = async (
    request: FastifyRequest<{ Params: { slug: string } }>,
    reply: FastifyReply
  ) => {
    const { slug } = request.params;
    const data = await this.service.getServiceBySlug(slug);
    if (!data) {
      return reply
        .code(404)
        .send({ message: "Услуга не найдена или не опубликована" });
    }
    return reply.send(data);
  };

  // ===== аппараты =====

  getDevicesList = async (_req: FastifyRequest, reply: FastifyReply) => {
    const devices = await this.service.getDevicesList();
    return reply.send(devices);
  };

  getDevice = async (
    request: FastifyRequest<{ Params: { slug: string } }>,
    reply: FastifyReply
  ) => {
    const { slug } = request.params;
    const data = await this.service.getDeviceBySlug(slug);
    if (!data) {
      return reply
        .code(404)
        .send({ message: "Аппарат не найден или не опубликован" });
    }
    return reply.send(data);
  };
}
