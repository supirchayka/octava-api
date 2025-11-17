// src/services/admin-files.service.ts
import type { FastifyInstance } from 'fastify';
import type { MultipartFile } from '@fastify/multipart';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { Storage, FileKind } from '@prisma/client';

type BinaryFileMeta = {
  filenameHeader?: string;
  contentTypeHeader?: string | string[];
};

export class AdminFilesService {
  private readonly uploadDir: string;
  private readonly maxSize = 20 * 1024 * 1024; // 20 MB

  constructor(private app: FastifyInstance) {
    this.uploadDir = process.env.UPLOADS_DIR || join(process.cwd(), 'uploads');
  }

  private async ensureUploadDir() {
    await fs.mkdir(this.uploadDir, { recursive: true });
  }

  private detectMime(buffer: Buffer) {
    const header3 = buffer.subarray(0, 3);
    const header4 = buffer.subarray(0, 4);
    const header8 = buffer.subarray(0, 8);

    if (header3.length === 3 && header3[0] === 0xff && header3[1] === 0xd8 && header3[2] === 0xff) {
      return { mime: 'image/jpeg', ext: '.jpg' } as const;
    }

    if (
      header8.length === 8 &&
      header8[0] === 0x89 &&
      header8[1] === 0x50 &&
      header8[2] === 0x4e &&
      header8[3] === 0x47 &&
      header8[4] === 0x0d &&
      header8[5] === 0x0a &&
      header8[6] === 0x1a &&
      header8[7] === 0x0a
    ) {
      return { mime: 'image/png', ext: '.png' } as const;
    }

    if (
      header4.length === 4 &&
      header4[0] === 0x47 &&
      header4[1] === 0x49 &&
      header4[2] === 0x46 &&
      header4[3] === 0x38
    ) {
      return { mime: 'image/gif', ext: '.gif' } as const;
    }

    if (
      header4.length === 4 &&
      header4[0] === 0x52 &&
      header4[1] === 0x49 &&
      header4[2] === 0x46 &&
      header4[3] === 0x46 &&
      buffer.subarray(8, 12).toString() === 'WEBP'
    ) {
      return { mime: 'image/webp', ext: '.webp' } as const;
    }

    if (buffer.subarray(0, 4).toString() === '%PDF') {
      return { mime: 'application/pdf', ext: '.pdf' } as const;
    }

    return null;
  }

  private normalizeFilename(name?: string | null) {
    if (!name) return undefined;
    const trimmed = name.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  private extensionFromName(name?: string) {
    if (!name) return '';
    const idx = name.lastIndexOf('.');
    return idx >= 0 ? name.slice(idx) : '';
  }

  private extensionFromMime(mime?: string) {
    if (!mime) return '';
    const map: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'application/pdf': '.pdf',
    };
    return map[mime] || '';
  }

  private determineMime(header?: string | string[]) {
    if (!header) return undefined;
    const value = Array.isArray(header) ? header[0] : header;
    if (!value) return undefined;
    return value.split(';')[0]?.trim() || undefined;
  }

  private determineKind(mime: string) {
    return mime.startsWith('image/') ? FileKind.IMAGE : FileKind.DOCUMENT;
  }

  private enforceSize(buffer: Buffer) {
    if (buffer.length > this.maxSize) {
      throw this.app.httpErrors.badRequest('Размер файла превышает 20 МБ');
    }
  }

  private async persist(buffer: Buffer, originalName: string, mime: string, forcedExt?: string) {
    await this.ensureUploadDir();

    const ext = forcedExt ?? this.extensionFromName(originalName);
    const filename = `${randomUUID()}${ext}`;
    const fullPath = join(this.uploadDir, filename);

    await fs.writeFile(fullPath, buffer);

    return this.app.prisma.file.create({
      data: {
        storage: Storage.LOCAL,
        kind: this.determineKind(mime),
        originalName,
        path: `uploads/${filename}`,
        mime,
        sizeBytes: buffer.length,
      },
    });
  }

  /**
   * Сохранение файла, полученного через multipart/form-data
   */
  async saveMultipartFile(file: MultipartFile) {
    if (!file.filename) {
      throw this.app.httpErrors.badRequest('Некорректное имя файла');
    }

    const buffer = await file.toBuffer();
    this.enforceSize(buffer);

    const mime = file.mimetype || 'application/octet-stream';
    return this.persist(buffer, file.filename, mime);
  }

  /**
   * Сохранение файла из «сырого» тела запроса (например, fetch + Blob)
   */
  async saveBufferFile(buffer: Buffer, meta: BinaryFileMeta) {
    this.enforceSize(buffer);

    const sanitizedHeader = this.determineMime(meta.contentTypeHeader);
    const detection = this.detectMime(buffer);
    const mime = detection?.mime || sanitizedHeader || 'application/octet-stream';

    const providedName = this.normalizeFilename(meta.filenameHeader);
    const extFromName = this.extensionFromName(providedName);
    const ext = detection?.ext || extFromName || this.extensionFromMime(mime);

    const originalName =
      providedName || `upload${ext || '.bin'}`;

    return this.persist(buffer, originalName, mime, ext);
  }
}
