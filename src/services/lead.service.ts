import type { FastifyInstance } from "fastify";
import type { Prisma, LeadStatus, LeadSourceType } from "@prisma/client";

export interface BaseLeadBody {
  name: string;
  phone: string;
  message?: string | null;
  pdnConsent?: boolean;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
}

export interface GenericLeadBody extends BaseLeadBody {
  source: "HOME" | "CONTACTS" | "OTHER";
}

export interface ServiceLeadBody extends BaseLeadBody {
  serviceId?: number;
  serviceSlug?: string;
}

export interface DeviceLeadBody extends BaseLeadBody {
  deviceId?: number;
  deviceSlug?: string;
}

export interface LeadListQuery {
  page?: number;
  limit?: number;
  status?: LeadStatus;
  sourceType?: LeadSourceType;
  serviceId?: number;
  deviceId?: number;
  search?: string;
  from?: Date;
  to?: Date;
}

export interface LeadRequestContext {
  ip: string;
  referer?: string;
}

export class LeadsService {
  constructor(private app: FastifyInstance) {}

  // -------- Публичные формы --------

  async createGenericLead(body: GenericLeadBody, ctx: LeadRequestContext) {
    const sourceTypeMap: Record<GenericLeadBody["source"], LeadSourceType> = {
      HOME: "HOME",
      CONTACTS: "CONTACTS",
      OTHER: "OTHER",
    };

    const sourceType = sourceTypeMap[body.source];

    return this.app.prisma.lead.create({
      data: {
        sourceType,
        name: body.name,
        phone: body.phone,
        message: body.message ?? null,
        utmSource: body.utmSource ?? null,
        utmMedium: body.utmMedium ?? null,
        utmCampaign: body.utmCampaign ?? null,
        referer: ctx.referer ?? null,
        ipAddress: ctx.ip,
        pdnConsent: body.pdnConsent ?? false,
      },
    });
  }

  async createServiceLead(body: ServiceLeadBody, ctx: LeadRequestContext) {
    let serviceId = body.serviceId;

    if (!serviceId && body.serviceSlug) {
      const service = await this.app.prisma.service.findUnique({
        where: { slug: body.serviceSlug },
        select: { id: true },
      });

      if (!service) {
        throw this.app.httpErrors.badRequest("Услуга не найдена");
      }

      serviceId = service.id;
    }

    if (!serviceId) {
      throw this.app.httpErrors.badRequest(
        "Не указан serviceId или serviceSlug",
      );
    }

    return this.app.prisma.lead.create({
      data: {
        sourceType: "SERVICE",
        serviceId,
        name: body.name,
        phone: body.phone,
        message: body.message ?? null,
        utmSource: body.utmSource ?? null,
        utmMedium: body.utmMedium ?? null,
        utmCampaign: body.utmCampaign ?? null,
        referer: ctx.referer ?? null,
        ipAddress: ctx.ip,
        pdnConsent: body.pdnConsent ?? false,
      },
    });
  }

  async createDeviceLead(body: DeviceLeadBody, ctx: LeadRequestContext) {
    let deviceId = body.deviceId;

    if (!deviceId && body.deviceSlug) {
      const device = await this.app.prisma.device.findUnique({
        where: { slug: body.deviceSlug },
        select: { id: true },
      });

      if (!device) {
        throw this.app.httpErrors.badRequest("Аппарат не найден");
      }

      deviceId = device.id;
    }

    if (!deviceId) {
      throw this.app.httpErrors.badRequest(
        "Не указан deviceId или deviceSlug",
      );
    }

    return this.app.prisma.lead.create({
      data: {
        sourceType: "DEVICE",
        deviceId,
        name: body.name,
        phone: body.phone,
        message: body.message ?? null,
        utmSource: body.utmSource ?? null,
        utmMedium: body.utmMedium ?? null,
        utmCampaign: body.utmCampaign ?? null,
        referer: ctx.referer ?? null,
        ipAddress: ctx.ip,
        pdnConsent: body.pdnConsent ?? false,
      },
    });
  }

  // -------- Админка: листинг --------

  async getLeads(query: LeadListQuery) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit =
      query.limit && query.limit > 0 && query.limit <= 100
        ? query.limit
        : 20;

    const where: Prisma.LeadWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.sourceType) {
      where.sourceType = query.sourceType;
    }

    if (typeof query.serviceId === "number") {
      where.serviceId = query.serviceId;
    }

    if (typeof query.deviceId === "number") {
      where.deviceId = query.deviceId;
    }

    if (query.search) {
      const search = query.search.trim();
      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { phone: { contains: search, mode: "insensitive" } },
          { utmSource: { contains: search, mode: "insensitive" } },
          { utmCampaign: { contains: search, mode: "insensitive" } },
        ];
      }
    }

    // Фильтр по дате создания
    if (query.from || query.to) {
      const createdAt: Prisma.DateTimeFilter = {};
      if (query.from) {
        createdAt.gte = query.from;
      }
      if (query.to) {
        createdAt.lte = query.to;
      }
      where.createdAt = createdAt;
    }

    const [total, items] = await this.app.prisma.$transaction([
      this.app.prisma.lead.count({ where }),
      this.app.prisma.lead.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          service: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          device: {
            select: {
              id: true,
              brand: true,
              model: true,
              slug: true,
            },
          },
        },
      }),
    ]);

    const pages = total === 0 ? 0 : Math.ceil(total / limit);

    return {
      items,
      total,
      page,
      limit,
      pages,
    };
  }

  // -------- Админка: статус лида --------

  async updateLeadStatus(id: number, status: LeadStatus) {
    const existing = await this.app.prisma.lead.findUnique({
      where: { id },
    });

    if (!existing) {
      throw this.app.httpErrors.notFound("Лид не найден");
    }

    return this.app.prisma.lead.update({
      where: { id },
      data: { status },
    });
  }
}
