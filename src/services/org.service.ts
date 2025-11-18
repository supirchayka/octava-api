// src/services/org.service.ts
import type { FastifyInstance } from 'fastify';
import { buildFileUrl } from '../utils/files';

export class OrgService {
  constructor(private app: FastifyInstance) {}

  private mapFile(file: any | null) {
    if (!file) return null;

    return {
      id: file.id,
      url: buildFileUrl(file.path),
      originalName: file.originalName,
      mime: file.mime,
      sizeBytes: file.sizeBytes,
      width: file.width ?? null,
      height: file.height ?? null,
    };
  }

  async getOrgCard() {
    const org = await this.app.prisma.organization.findFirst({
      include: {
        phones: true,
        licenses: {
          include: { file: true },
        },
        documents: true,
        certificates: {
          include: { file: true },
        },
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
      licenses: org.licenses.map((lic) => ({
        id: lic.id,
        number: lic.licenseNumber,
        issuedAt: lic.issuedAt,
        issuedBy: lic.issuedBy,
        file: this.mapFile(lic.file),
      })),
      documents: org.documents.map((doc) => ({
        id: doc.id,
        type: doc.docType,
        title: doc.title,
        htmlBody: doc.htmlBody,
        publishedAt: doc.publishedAt,
      })),
      certificates: org.certificates.map((cert) => ({
        id: cert.id,
        title: cert.title,
        issuedBy: cert.issuedBy,
        issuedAt: cert.issuedAt,
        file: this.mapFile(cert.file),
      })),
    };
  }
}
