// src/controllers/org.controller.ts
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { OrgService } from "../services/org.service";

export class OrgController {
  private service: OrgService;

  constructor(app: FastifyInstance) {
    this.service = new OrgService(app);
  }

  getOrg = async (_req: FastifyRequest, reply: FastifyReply) => {
    const card = await this.service.getOrgCard();
    if (!card) {
      return reply.code(404).send({
        message: "Организация не настроена",
      });
    }
    return reply.send(card);
  };
}
