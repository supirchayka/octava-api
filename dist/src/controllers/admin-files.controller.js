"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminFilesController = void 0;
const admin_files_service_1 = require("../services/admin-files.service");
class AdminFilesController {
    constructor(app) {
        this.app = app;
        this.upload = async (request, reply) => {
            this.ensureEditor(request);
            // метод .file() добавляется fastify-multipart
            const mpFile = await request.file();
            if (!mpFile) {
                throw this.app.httpErrors.badRequest('Файл не передан');
            }
            const created = await this.service.saveFile(mpFile);
            // Можно просто вернуть запись File — фронт сам построит URL из path
            return reply.code(201).send(created);
        };
        this.service = new admin_files_service_1.AdminFilesService(app);
    }
    ensureEditor(request) {
        const user = request.user;
        if (!user || (user.role !== 'ADMIN' && user.role !== 'EDITOR')) {
            throw this.app.httpErrors.forbidden('Недостаточно прав');
        }
    }
}
exports.AdminFilesController = AdminFilesController;
