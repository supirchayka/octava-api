// src/services/admin-files.service.ts
import type { FastifyInstance } from 'fastify';
import type { MultipartFile } from '@fastify/multipart';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { Storage, FileKind } from '@prisma/client';

export class AdminFilesService {
  constructor(private app: FastifyInstance) {}

  /**
   * Сохранение одного файла из multipart в файловой системе и в таблице File.
   */
  async saveFile(file: MultipartFile) {
    if (!file.filename) {
      throw this.app.httpErrors.badRequest('Некорректное имя файла');
    }

    const buffer = await file.toBuffer();
    const maxSize = 20 * 1024 * 1024; // 20 MB

    if (buffer.length > maxSize) {
      throw this.app.httpErrors.badRequest(
        'Размер файла превышает 20 МБ',
      );
    }

    const uploadDir = join(process.cwd(), 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });

    const originalName = file.filename;
    const ext = originalName.includes('.')
      ? '.' + originalName.split('.').pop()
      : '';
    const filename = `${randomUUID()}${ext}`;
    const fullPath = join(uploadDir, filename);

    await fs.writeFile(fullPath, buffer);

    const mime = file.mimetype || 'application/octet-stream';
    const kind =
      mime.startsWith('image/') ? FileKind.IMAGE : FileKind.DOCUMENT;

    const created = await this.app.prisma.file.create({
      data: {
        storage: Storage.LOCAL,
        kind,
        originalName,
        path: `uploads/${filename}`, // относительный путь, будет отдаваться fastify-static
        mime,
        sizeBytes: buffer.length,
      },
    });

    return created;
  }
}
