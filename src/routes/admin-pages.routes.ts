// src/routes/admin-pages.routes.ts
import type { FastifyInstance } from 'fastify';
import { AdminPagesController } from '../controllers/admin-pages.controller';

export default async function adminPagesRoutes(app: FastifyInstance) {
  const controller = new AdminPagesController(app);

  // HOME
  app.put(
    '/admin/pages/home',
    {
      preHandler: [app.authenticate],
      schema: {
        body: {
          type: 'object',
          properties: {
            heroTitle: { type: 'string' },
            heroSubtitle: { type: 'string' },
            heroCtaText: { type: 'string' },
            heroCtaUrl: { type: 'string' },
            subheroTitle: { type: 'string' },
            subheroSubtitle: { type: 'string' },
            interiorText: { type: 'string' },
            seo: {
              type: 'object',
              properties: {
                metaTitle: { type: 'string' },
                metaDescription: { type: 'string' },
                canonicalUrl: { type: 'string' },
                robotsIndex: { type: 'boolean' },
                robotsFollow: { type: 'boolean' },
                ogTitle: { type: 'string' },
                ogDescription: { type: 'string' },
                ogImageId: { type: 'integer' },
              },
            },
          },
        },
      },
    },
    controller.updateHome,
  );

  // ABOUT
  app.put(
    '/admin/pages/about',
    {
      preHandler: [app.authenticate],
      schema: {
        body: {
          type: 'object',
          properties: {
            heroTitle: { type: 'string' },
            heroDescription: { type: 'string' },
            howWeAchieveText: { type: 'string' },
            heroCtaTitle: { type: 'string' },
            heroCtaSubtitle: { type: 'string' },
            seo: {
              type: 'object',
              properties: {
                metaTitle: { type: 'string' },
                metaDescription: { type: 'string' },
                canonicalUrl: { type: 'string' },
                robotsIndex: { type: 'boolean' },
                robotsFollow: { type: 'boolean' },
                ogTitle: { type: 'string' },
                ogDescription: { type: 'string' },
                ogImageId: { type: 'integer' },
              },
            },
          },
        },
      },
    },
    controller.updateAbout,
  );

  // CONTACTS
  app.put(
    '/admin/pages/contacts',
    {
      preHandler: [app.authenticate],
      schema: {
        body: {
          type: 'object',
          properties: {
            phoneMain: { type: 'string' },
            email: { type: 'string' },
            telegramUrl: { type: 'string' },
            whatsappUrl: { type: 'string' },
            addressText: { type: 'string' },
            yandexMapUrl: { type: 'string' },
            seo: {
              type: 'object',
              properties: {
                metaTitle: { type: 'string' },
                metaDescription: { type: 'string' },
                canonicalUrl: { type: 'string' },
                robotsIndex: { type: 'boolean' },
                robotsFollow: { type: 'boolean' },
                ogTitle: { type: 'string' },
                ogDescription: { type: 'string' },
                ogImageId: { type: 'integer' },
              },
            },
          },
        },
      },
    },
    controller.updateContacts,
  );

  // PERSONAL DATA POLICY
  app.put(
    '/admin/pages/personal-data-policy',
    {
      preHandler: [app.authenticate],
      schema: {
        body: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            body: { type: 'string' },
            seo: {
              type: 'object',
              properties: {
                metaTitle: { type: 'string' },
                metaDescription: { type: 'string' },
                canonicalUrl: { type: 'string' },
                robotsIndex: { type: 'boolean' },
                robotsFollow: { type: 'boolean' },
                ogTitle: { type: 'string' },
                ogDescription: { type: 'string' },
                ogImageId: { type: 'integer' },
              },
            },
          },
        },
      },
    },
    controller.updatePersonalDataPolicy,
  );

  // PRIVACY POLICY
  app.put(
    '/admin/pages/privacy-policy',
    {
      preHandler: [app.authenticate],
      schema: {
        body: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            body: { type: 'string' },
            seo: {
              type: 'object',
              properties: {
                metaTitle: { type: 'string' },
                metaDescription: { type: 'string' },
                canonicalUrl: { type: 'string' },
                robotsIndex: { type: 'boolean' },
                robotsFollow: { type: 'boolean' },
                ogTitle: { type: 'string' },
                ogDescription: { type: 'string' },
                ogImageId: { type: 'integer' },
              },
            },
          },
        },
      },
    },
    controller.updatePrivacyPolicy,
  );
}
