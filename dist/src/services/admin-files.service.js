"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminFilesService = void 0;
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const node_crypto_1 = require("node:crypto");
const client_1 = require("@prisma/client");
class AdminFilesService {
    constructor(app) {
        this.app = app;
    }
    /**
     * Сохранение одного файла из multipart в файловой системе и в таблице File.
     */
    async saveFile(file) {
        if (!file.filename) {
            throw this.app.httpErrors.badRequest('Некорректное имя файла');
        }
        const buffer = await file.toBuffer();
        const maxSize = 20 * 1024 * 1024; // 20 MB
        if (buffer.length > maxSize) {
            throw this.app.httpErrors.badRequest('Размер файла превышает 20 МБ');
        }
        const uploadDir = (0, node_path_1.join)(process.cwd(), 'uploads');
        await node_fs_1.promises.mkdir(uploadDir, { recursive: true });
        const originalName = file.filename;
        const ext = originalName.includes('.')
            ? '.' + originalName.split('.').pop()
            : '';
        const filename = `${(0, node_crypto_1.randomUUID)()}${ext}`;
        const fullPath = (0, node_path_1.join)(uploadDir, filename);
        await node_fs_1.promises.writeFile(fullPath, buffer);
        const mime = file.mimetype || 'application/octet-stream';
        const kind = mime.startsWith('image/') ? client_1.FileKind.IMAGE : client_1.FileKind.DOCUMENT;
        const created = await this.app.prisma.file.create({
            data: {
                storage: client_1.Storage.LOCAL,
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
exports.AdminFilesService = AdminFilesService;
