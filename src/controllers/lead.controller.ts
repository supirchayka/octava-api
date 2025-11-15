import type {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import type { LeadStatus, LeadSourceType } from "@prisma/client";
import {
  LeadsService,
  GenericLeadBody,
  ServiceLeadBody,
  DeviceLeadBody,
} from "../services/lead.service";

export class LeadsController {
  private service: LeadsService;

  constructor(private app: FastifyInstance) {
    this.service = new LeadsService(app);
  }

  // Только ADMIN / EDITOR
  private ensureManager(request: FastifyRequest) {
    const user = (request as any).user as { role?: string } | undefined;
    if (!user || (user.role !== "ADMIN" && user.role !== "EDITOR")) {
      throw this.app.httpErrors.forbidden("Недостаточно прав");
    }
  }

  // -------- Публичные формы --------

  createGenericLead = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => {
    const body = request.body as GenericLeadBody;
    const ip = request.ip;
    const referer = request.headers["referer"] as string | undefined;

    await this.service.createGenericLead(body, { ip, referer });
    return reply.code(201).send({ ok: true });
  };

  createServiceLead = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => {
    const body = request.body as ServiceLeadBody;
    const ip = request.ip;
    const referer = request.headers["referer"] as string | undefined;

    await this.service.createServiceLead(body, { ip, referer });
    return reply.code(201).send({ ok: true });
  };

  createDeviceLead = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => {
    const body = request.body as DeviceLeadBody;
    const ip = request.ip;
    const referer = request.headers["referer"] as string | undefined;

    await this.service.createDeviceLead(body, { ip, referer });
    return reply.code(201).send({ ok: true });
  };

  // -------- Админка: GET /admin/leads --------

  private parseDate(value?: string): Date | undefined {
    if (!value) return undefined;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return undefined;
    return d;
  }

  getLeads = async (request: FastifyRequest, reply: FastifyReply) => {
    this.ensureManager(request);

    const {
      page,
      limit,
      status,
      sourceType,
      serviceId,
      deviceId,
      search,
      from,
      to,
    } = (request.query ?? {}) as {
      page?: string;
      limit?: string;
      status?: string;
      sourceType?: string;
      serviceId?: string;
      deviceId?: string;
      search?: string;
      from?: string;
      to?: string;
    };

    const parsedPage = page ? Number(page) : undefined;
    const parsedLimit = limit ? Number(limit) : undefined;

    const parsedServiceId =
      serviceId && !Number.isNaN(Number(serviceId))
        ? Number(serviceId)
        : undefined;
    const parsedDeviceId =
      deviceId && !Number.isNaN(Number(deviceId))
        ? Number(deviceId)
        : undefined;

    let parsedStatus: LeadStatus | undefined;
    if (status && ["NEW", "IN_PROGRESS", "DONE"].includes(status)) {
      parsedStatus = status as LeadStatus;
    }

    let parsedSourceType: LeadSourceType | undefined;
    if (
      sourceType &&
      ["HOME", "CONTACTS", "SERVICE", "DEVICE", "OTHER"].includes(sourceType)
    ) {
      parsedSourceType = sourceType as LeadSourceType;
    }

    const fromDate = this.parseDate(from);
    const toDate = this.parseDate(to);

    const result = await this.service.getLeads({
      page: parsedPage,
      limit: parsedLimit,
      status: parsedStatus,
      sourceType: parsedSourceType,
      serviceId: parsedServiceId,
      deviceId: parsedDeviceId,
      search: search ?? undefined,
      from: fromDate,
      to: toDate,
    });

    return reply.send(result);
  };

  // -------- Админка: PATCH /admin/leads/:id/status --------

  updateLeadStatus = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => {
    this.ensureManager(request);

    const params = request.params as { id?: string };
    const body = request.body as { status?: string };

    const id = params.id ? Number(params.id) : NaN;
    if (!id || Number.isNaN(id)) {
      throw this.app.httpErrors.badRequest("Некорректный id лида");
    }

    if (!body.status || !["NEW", "IN_PROGRESS", "DONE"].includes(body.status)) {
      throw this.app.httpErrors.badRequest("Некорректный статус");
    }

    const lead = await this.service.updateLeadStatus(
      id,
      body.status as LeadStatus,
    );

    return reply.send(lead);
  };
}
