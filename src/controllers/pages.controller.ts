// src/controllers/pages.controller.ts
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { PagesService } from "../services/pages.service";

export class PagesController {
  private service: PagesService;

  constructor(app: FastifyInstance) {
    this.service = new PagesService(app);
  }

  home = async (_req: FastifyRequest, reply: FastifyReply) => {
    const data = await this.service.getHome();
    if (!data) {
      return reply.code(404).send({ message: "Главная страница не настроена" });
    }
    return reply.send(data);
  };

  about = async (_req: FastifyRequest, reply: FastifyReply) => {
    const data = await this.service.getAbout();
    if (!data) {
      return reply.code(404).send({ message: "Страница «О нас» не настроена" });
    }
    return reply.send(data);
  };

  contacts = async (_req: FastifyRequest, reply: FastifyReply) => {
    const data = await this.service.getContacts();
    if (!data) {
      return reply
        .code(404)
        .send({ message: "Страница «Контакты» не настроена" });
    }
    return reply.send(data);
  };

  orgInfo = async (_req: FastifyRequest, reply: FastifyReply) => {
    const data = await this.service.getOrgInfo();
    if (!data) {
      return reply
        .code(404)
        .send({ message: "Страница сведений об организации не настроена" });
    }
    return reply.send(data);
  };

  personalDataPolicy = async (_req: FastifyRequest, reply: FastifyReply) => {
    const data = await this.service.getPersonalDataPolicy();
    if (!data) {
      return reply
        .code(404)
        .send({ message: "Страница политики обработки ПДн не настроена" });
    }
    return reply.send(data);
  };

  privacyPolicy = async (_req: FastifyRequest, reply: FastifyReply) => {
    const data = await this.service.getPrivacyPolicy();
    if (!data) {
      return reply
        .code(404)
        .send({ message: "Страница политики конфиденциальности не настроена" });
    }
    return reply.send(data);
  };
}
