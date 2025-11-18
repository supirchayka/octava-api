// src/controllers/admin-files.controller.ts
import type {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from 'fastify';
import { AdminFilesService } from '../services/admin-files.service';

export class AdminFilesController {
  private service: AdminFilesService;

  constructor(private app: FastifyInstance) {
    this.service = new AdminFilesService(app);
  }

  private ensureEditor(request: FastifyRequest) {
    const user = request.user as any;
    if (!user || (user.role !== 'ADMIN' && user.role !== 'EDITOR')) {
      throw this.app.httpErrors.forbidden('Недостаточно прав');
    }
  }

  private async readRawBody(request: FastifyRequest) {
    const chunks: Buffer[] = [];

    for await (const chunk of request.raw) {
      if (!chunk) continue;
      const normalized =
        typeof chunk === 'string'
          ? Buffer.from(chunk)
          : Buffer.isBuffer(chunk)
            ? chunk
            : Buffer.from(chunk);
      chunks.push(normalized);
    }

    return Buffer.concat(chunks);
  }

  upload = async (request: FastifyRequest, reply: FastifyReply) => {
    this.ensureEditor(request);

    const maybeMultipart = request as FastifyRequest & {
      isMultipart?: () => boolean;
      file?: () => Promise<any>;
    };

    const isMultipart = maybeMultipart.isMultipart?.();

    if (isMultipart) {
      const mpFile = await maybeMultipart.file?.();

      if (!mpFile) {
        throw this.app.httpErrors.badRequest('Файл не передан');
      }

      const created = await this.service.saveMultipartFile(mpFile);
      return reply.code(201).send(created);
    }

    const buffer = await this.readRawBody(request);
    if (!buffer.length) {
      throw this.app.httpErrors.badRequest('Файл не передан');
    }

    const filenameHeader = request.headers['x-filename'];
    const created = await this.service.saveBufferFile(buffer, {
      filenameHeader: Array.isArray(filenameHeader)
        ? filenameHeader[0]
        : filenameHeader,
      contentTypeHeader: request.headers['content-type'],
    });

    return reply.code(201).send(created);
  };
}
