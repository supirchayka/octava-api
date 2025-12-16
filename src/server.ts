import Fastify from 'fastify';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import fastifyStatic from '@fastify/static';
import path from 'node:path';

import prismaPlugin from './plugins/prisma';
import jwtPlugin from './plugins/jwt';

import authRoutes from './routes/auth.routes';
import orgRoutes from './routes/org.routes';
import pagesRoutes from './routes/pages.routes';
import catalogRoutes from './routes/catalog.routes';
import leadRoutes from './routes/lead.routes';
import sitemapRoutes from './routes/sitemap.routes';
import adminCatalogRoutes from './routes/admin-catalog.routes';
import adminOrgRoutes from './routes/admin-org.routes';
import adminPagesRoutes from './routes/admin-pages.routes';
import fastifyMultipart from '@fastify/multipart';
import adminFilesRoutes from './routes/admin-files.routes';

const start = async () => {
  const app = Fastify({
    logger: true,
  });

  // плагины
  await app.register(cors, {
    origin: ['http://localhost:3000', 'http://79.174.86.247:3000'], // админка/фронт
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  await app.register(fastifyMultipart, {
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB
    files: 1,
  },
});

  await app.register(sensible);
  await app.register(prismaPlugin);
  await app.register(jwtPlugin);

  // раздача файлов (картинки / документы)
  const uploadsDir =
    process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads');

  await app.register(fastifyStatic, {
    root: uploadsDir,
    prefix: '/uploads/',
  });

  // роуты
  await app.register(authRoutes);
  await app.register(orgRoutes);
  await app.register(pagesRoutes);
  await app.register(catalogRoutes);
  await app.register(leadRoutes);
  await app.register(sitemapRoutes);

  await app.register(adminCatalogRoutes);
  await app.register(adminOrgRoutes);
  await app.register(adminPagesRoutes);
  await app.register(adminFilesRoutes);

  app.get('/health', async () => ({ status: 'ok' }));

  const port = Number(process.env.PORT) || 3005;
  const host = process.env.HOST || '0.0.0.0';

  try {
    await app.listen({ port, host });
    console.log(`🚀 Server listening on http://${host}:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
