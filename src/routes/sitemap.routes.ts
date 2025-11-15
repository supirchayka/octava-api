import type { FastifyInstance } from 'fastify';

export default async function sitemapRoutes(app: FastifyInstance) {
  app.get('/sitemap.xml', async (_request, reply) => {
    const siteUrl = process.env.SITE_URL ?? 'https://octava-clinic.ru';

    const [categories, services, devices] = await Promise.all([
      app.prisma.serviceCategory.findMany({
        where: { isPublished: true },
        select: { slug: true },
      }),
      app.prisma.service.findMany({
        where: { isPublished: true },
        include: {
          category: {
            select: { slug: true },
          },
        },
      }),
      app.prisma.device.findMany({
        where: { isPublished: true },
        select: { slug: true },
      }),
    ]);

    const urls: string[] = [];

    // Статические страницы
    urls.push(`${siteUrl}/`); // Главная
    urls.push(`${siteUrl}/about`);
    urls.push(`${siteUrl}/contacts`);
    urls.push(`${siteUrl}/org-info`);
    urls.push(`${siteUrl}/personal-data`);
    urls.push(`${siteUrl}/privacy-policy`);
    urls.push(`${siteUrl}/org`); // карточка организации

    // Категории услуг
    for (const category of categories) {
      urls.push(`${siteUrl}/services/${category.slug}`);
    }

    // Услуги
    for (const service of services) {
      if (!service.category) continue;
      urls.push(`${siteUrl}/services/${service.category.slug}/${service.slug}`);
    }

    // Аппараты
    for (const device of devices) {
      urls.push(`${siteUrl}/devices/${device.slug}`);
    }

    const xml =
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
      urls
        .map((loc) => `  <url>\n    <loc>${loc}</loc>\n  </url>`)
        .join('\n') +
      '\n</urlset>';

    reply.header('Content-Type', 'application/xml; charset=utf-8');
    return reply.send(xml);
  });
}
