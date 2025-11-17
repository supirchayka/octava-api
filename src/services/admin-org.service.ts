// src/services/admin-org.service.ts
import type { FastifyInstance } from 'fastify';

export interface OrgBody {
  fullName?: string;
  ogrn?: string;
  inn?: string;
  kpp?: string;
  address?: string;
  email?: string;
}

/**
 * Админ-управление карточкой организации.
 * В базе всегда одна запись Organization.
 */
export class AdminOrgService {
  constructor(private app: FastifyInstance) {}

  async getOrganization() {
    const org = await this.app.prisma.organization.findFirst({
      orderBy: { id: 'asc' },
    });

    if (!org) {
      return null;
    }

    return {
      id: org.id,
      fullName: org.fullName,
      ogrn: org.ogrn,
      inn: org.inn,
      kpp: org.kpp,
      address: org.address,
      email: org.email,
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
    };
  }

  async upsertOrganization(input: OrgBody) {
    const existing = await this.app.prisma.organization.findFirst({
      orderBy: { id: 'asc' },
    });

    if (!existing) {
      // Первичное создание
      const org = await this.app.prisma.organization.create({
        data: {
          fullName: input.fullName ?? 'ООО «OCTAVA»',
          ogrn: input.ogrn ?? '',
          inn: input.inn ?? '',
          kpp: input.kpp ?? '',
          address: input.address ?? '',
          email: input.email ?? '',
        },
      });

      return org;
    }

    // Частичное обновление существующей
    const org = await this.app.prisma.organization.update({
      where: { id: existing.id },
      data: {
        fullName: input.fullName ?? existing.fullName,
        ogrn: input.ogrn ?? existing.ogrn,
        inn: input.inn ?? existing.inn,
        kpp: input.kpp ?? existing.kpp,
        address: input.address ?? existing.address,
        email: input.email ?? existing.email,
      },
    });

    return org;
  }
}
