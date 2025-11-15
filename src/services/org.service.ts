// src/services/org.service.ts
import type { FastifyInstance } from 'fastify';

export class OrgService {
  constructor(private app: FastifyInstance) {}

  async getOrgCard() {
    const org = await this.app.prisma.organization.findFirst({
      include: {
        phones: true,
      },
      orderBy: {
        id: 'asc',
      },
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
      phones: org.phones.map((p) => ({
        type: p.type,
        number: p.number,
        isPrimary: p.isPrimary,
      })),
    };
  }
}
