// src/routes/admin-pages.routes.ts
import type { FastifyInstance } from 'fastify';
import { DayGroup } from '@prisma/client';
import { AdminPagesController } from '../controllers/admin-pages.controller';

export default async function adminPagesRoutes(app: FastifyInstance) {
  const controller = new AdminPagesController(app);

  // HOME
  app.get(
    '/admin/pages/home',
    {
      preHandler: [app.authenticate],
    },
    controller.getHome,
  );

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
            heroImages: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  fileId: { type: 'integer' },
                  alt: { type: 'string' },
                  caption: { type: 'string' },
                  order: { type: 'integer' },
                },
                required: ['fileId'],
              },
            },
            interiorImages: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  fileId: { type: 'integer' },
                  alt: { type: 'string' },
                  caption: { type: 'string' },
                  order: { type: 'integer' },
                },
                required: ['fileId'],
              },
            },
            directions: {
              type: 'array',
              minItems: 4,
              maxItems: 4,
              items: {
                type: 'object',
                properties: {
                  serviceId: { type: 'integer' },
                  order: { type: 'integer' },
                },
                required: ['serviceId'],
              },
            },
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
  app.get(
    '/admin/pages/about',
    {
      preHandler: [app.authenticate],
    },
    controller.getAbout,
  );

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
            heroImageFileId: { type: 'integer' },
            facts: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  text: { type: 'string' },
                  order: { type: 'integer' },
                },
              },
            },
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
  app.get(
    '/admin/pages/contacts',
    {
      preHandler: [app.authenticate],
    },
    controller.getContacts,
  );

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
            workingHours: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  group: {
                    type: 'string',
                    enum: Object.values(DayGroup),
                  },
                  open: { type: 'string' },
                  close: { type: 'string' },
                  isClosed: { type: 'boolean' },
                },
                required: ['group'],
              },
            },
            metroStations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  distanceMeters: { type: 'integer' },
                  line: { type: 'string' },
                },
                required: ['name'],
              },
            },
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
  app.get(
    '/admin/pages/personal-data-policy',
    {
      preHandler: [app.authenticate],
    },
    controller.getPersonalDataPolicy,
  );

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
  app.get(
    '/admin/pages/privacy-policy',
    {
      preHandler: [app.authenticate],
    },
    controller.getPrivacyPolicy,
  );

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
