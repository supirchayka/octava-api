"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const sensible_1 = __importDefault(require("@fastify/sensible"));
const static_1 = __importDefault(require("@fastify/static"));
const node_path_1 = __importDefault(require("node:path"));
const prisma_1 = __importDefault(require("./plugins/prisma"));
const jwt_1 = __importDefault(require("./plugins/jwt"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const org_routes_1 = __importDefault(require("./routes/org.routes"));
const pages_routes_1 = __importDefault(require("./routes/pages.routes"));
const catalog_routes_1 = __importDefault(require("./routes/catalog.routes"));
const lead_routes_1 = __importDefault(require("./routes/lead.routes"));
const sitemap_routes_1 = __importDefault(require("./routes/sitemap.routes"));
const admin_catalog_routes_1 = __importDefault(require("./routes/admin-catalog.routes"));
const admin_org_routes_1 = __importDefault(require("./routes/admin-org.routes"));
const admin_pages_routes_1 = __importDefault(require("./routes/admin-pages.routes"));
const multipart_1 = __importDefault(require("@fastify/multipart"));
const admin_files_routes_1 = __importDefault(require("./routes/admin-files.routes"));
const start = async () => {
    const app = (0, fastify_1.default)({
        logger: true,
    });
    // плагины
    await app.register(cors_1.default, {
        origin: true,
        credentials: true,
    });
    await app.register(multipart_1.default, {
        limits: {
            fileSize: 20 * 1024 * 1024, // 20 MB
            files: 1,
        },
    });
    await app.register(sensible_1.default);
    await app.register(prisma_1.default);
    await app.register(jwt_1.default);
    // раздача файлов (картинки / документы)
    const uploadsDir = process.env.UPLOADS_DIR || node_path_1.default.join(process.cwd(), 'uploads');
    await app.register(static_1.default, {
        root: uploadsDir,
        prefix: '/uploads/',
    });
    // роуты
    await app.register(auth_routes_1.default);
    await app.register(org_routes_1.default);
    await app.register(pages_routes_1.default);
    await app.register(catalog_routes_1.default);
    await app.register(lead_routes_1.default);
    await app.register(sitemap_routes_1.default);
    await app.register(admin_catalog_routes_1.default);
    await app.register(admin_org_routes_1.default);
    await app.register(admin_pages_routes_1.default);
    await app.register(admin_files_routes_1.default);
    app.get('/health', async () => ({ status: 'ok' }));
    const port = Number(process.env.PORT) || 3000;
    const host = process.env.HOST || '0.0.0.0';
    try {
        await app.listen({ port, host });
        console.log(`🚀 Server listening on http://${host}:${port}`);
    }
    catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};
start();
