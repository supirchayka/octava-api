"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = sitemapRoutes;
const client_1 = require("@prisma/client");
function escapeXml(str) {
    return str.replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<':
                return '&lt;';
            case '>':
                return '&gt;';
            case '&':
                return '&amp;';
            case "'":
                return '&apos;';
            case '"':
                return '&quot;';
            default:
                return c;
        }
    });
}
async function sitemapRoutes(app) {
    app.get('/sitemap.xml', async (_req, reply) => {
        const base = (process.env.SITE_URL || 'http://localhost:3000').replace(/\/+$/, '');
        const [pages, categories, services, devices] = await Promise.all([
            app.prisma.staticPage.findMany({
                where: { isPublished: true },
                orderBy: { id: 'asc' },
            }),
            app.prisma.serviceCategory.findMany({
                where: { isPublished: true },
                orderBy: { id: 'asc' },
            }),
            app.prisma.service.findMany({
                where: { isPublished: true },
                orderBy: { id: 'asc' },
            }),
            app.prisma.device.findMany({
                where: { isPublished: true },
                orderBy: { id: 'asc' },
            }),
        ]);
        const urls = [];
        // Статические страницы сайта
        for (const p of pages) {
            let path;
            if (p.type === client_1.StaticPageType.HOME) {
                path = '/';
            }
            else {
                path = `/${p.slug}`;
            }
            urls.push({
                loc: base + path,
                // предполагаем наличие updatedAt; если в схеме его нет — можно заменить на createdAt
                lastmod: p.updatedAt ?? p.createdAt ?? null,
                changefreq: p.type === client_1.StaticPageType.HOME ? 'daily' : 'weekly',
                priority: p.type === client_1.StaticPageType.HOME ? 1.0 : 0.8,
            });
        }
        // Категории услуг (предполагаемый путь на фронте: /services/category/:slug)
        for (const c of categories) {
            urls.push({
                loc: `${base}/services/category/${c.slug}`,
                lastmod: c.updatedAt ?? c.createdAt ?? null,
                changefreq: 'weekly',
                priority: 0.7,
            });
        }
        // Услуги: /services/:slug
        for (const s of services) {
            urls.push({
                loc: `${base}/services/${s.slug}`,
                lastmod: s.updatedAt ?? s.createdAt ?? null,
                changefreq: 'weekly',
                priority: 0.9,
            });
        }
        // Аппараты: /devices/:slug
        for (const d of devices) {
            urls.push({
                loc: `${base}/devices/${d.slug}`,
                lastmod: d.updatedAt ?? d.createdAt ?? null,
                changefreq: 'weekly',
                priority: 0.8,
            });
        }
        const xml = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
            ...urls.map((u) => {
                const lastmodStr = u.lastmod
                    ? new Date(u.lastmod).toISOString()
                    : null;
                return [
                    '  <url>',
                    `    <loc>${escapeXml(u.loc)}</loc>`,
                    u.changefreq ? `    <changefreq>${u.changefreq}</changefreq>` : '',
                    typeof u.priority === 'number'
                        ? `    <priority>${u.priority.toFixed(1)}</priority>`
                        : '',
                    lastmodStr ? `    <lastmod>${lastmodStr}</lastmod>` : '',
                    '  </url>',
                ]
                    .filter(Boolean)
                    .join('\n');
            }),
            '</urlset>',
        ].join('\n');
        return reply
            .type('application/xml; charset=utf-8')
            .header('Cache-Control', 'public, max-age=3600')
            .send(xml);
    });
}
