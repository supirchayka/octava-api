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
import { MAX_UPLOAD_SIZE_BYTES } from './utils/upload-limits';

const start = async () => {
  const app = Fastify({
    logger: true,
  });

  // РїР»Р°РіРёРЅС‹
  await app.register(cors, {
    origin: ['http://localhost:3000', 'http://79.174.86.247:3000', 'http://95.163.226.212:3000', 'https://clinica-octava.ru', 'https://www.clinica-octava.ru'], // Р°РґРјРёРЅРєР°/С„СЂРѕРЅС‚
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

await app.register(fastifyMultipart, {
  limits: {
    fileSize: MAX_UPLOAD_SIZE_BYTES,
    files: 1,
  },
});

  await app.register(sensible);
  await app.register(prismaPlugin);
  await app.register(jwtPlugin);

  app.addHook('onSend', async (_request, reply, payload) => {
    reply.header(
      'X-Robots-Tag',
      'noindex, nofollow, noarchive, nosnippet',
    );
    return payload;
  });

  // СЂР°Р·РґР°С‡Р° С„Р°Р№Р»РѕРІ (РєР°СЂС‚РёРЅРєРё / РґРѕРєСѓРјРµРЅС‚С‹)
  const uploadsDir =
    process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads');

  await app.register(fastifyStatic, {
    root: uploadsDir,
    prefix: '/uploads/',
  });

  // СЂРѕСѓС‚С‹
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

  app.get('/robots.txt', async (_request, reply) => {
    reply.type('text/plain; charset=utf-8');
    return reply.send('User-agent: *\nDisallow: /\n');
  });

  app.get('/health', async () => ({ status: 'ok' }));

  const port = Number(process.env.PORT) || 3005;
  const host = process.env.HOST || '0.0.0.0';

  try {
    await app.listen({ port, host });
    console.log(`рџљЂ Server listening on http://${host}:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();

