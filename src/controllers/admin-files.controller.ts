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

  upload = async (request: FastifyRequest, reply: FastifyReply) => {
    this.ensureEditor(request);

    // метод .file() добавляется fastify-multipart
    const mpFile = await (request as any).file();

    if (!mpFile) {
      throw this.app.httpErrors.badRequest('Файл не передан');
    }

    const created = await this.service.saveFile(mpFile);

    // Можно просто вернуть запись File — фронт сам построит URL из path
    return reply.code(201).send(created);
  };
}
