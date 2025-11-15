// src/routes/admin-catalog.routes.ts
import type { FastifyInstance } from 'fastify';
import { AdminCatalogController } from '../controllers/admin-catalog.controller';

export default async function adminCatalogRoutes(app: FastifyInstance) {
  const controller = new AdminCatalogController(app);

  /* ========== Общие куски схемы ========== */

  const seoSchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
      metaTitle: { type: 'string', nullable: true },
      metaDescription: { type: 'string', nullable: true },
      canonicalUrl: { type: 'string', nullable: true },
      robotsIndex: { type: 'boolean' },
      robotsFollow: { type: 'boolean' },
      ogTitle: { type: 'string', nullable: true },
      ogDescription: { type: 'string', nullable: true },
      ogImageId: { type: 'integer', nullable: true },
    },
  };

  const servicePricesExtendedSchema = {
    type: 'array',
    items: {
      type: 'object',
      required: ['title', 'price'],
      properties: {
        title: { type: 'string' },
        price: { type: 'number' },
        durationMinutes: { type: 'integer', nullable: true },
        type: {
          type: 'string',
          enum: ['BASE', 'EXTRA', 'PACKAGE'],
        },
        sessionsCount: { type: 'integer', nullable: true },
        order: { type: 'integer', nullable: true },
        isActive: { type: 'boolean' },
      },
    },
  };

  /* ========== Categories ========== */

  app.post(
    '/admin/catalog/categories',
    {
      preHandler: [app.authenticate],
      schema: {
        body: {
          type: 'object',
          required: ['name', 'slug'],
          properties: {
            name: { type: 'string' },
            slug: { type: 'string' },
            description: { type: 'string', nullable: true },
            sortOrder: { type: 'integer' },
            heroImageFileId: { type: 'integer', nullable: true },
            seo: seoSchema,
          },
        },
      },
    },
    controller.createCategory,
  );

  app.put(
    '/admin/catalog/categories/:id',
    {
      preHandler: [app.authenticate],
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            slug: { type: 'string' },
            description: { type: 'string', nullable: true },
            sortOrder: { type: 'integer' },
            heroImageFileId: { type: 'integer', nullable: true },
            seo: seoSchema,
          },
        },
      },
    },
    controller.updateCategory,
  );

  app.delete(
    '/admin/catalog/categories/:id',
    {
      preHandler: [app.authenticate],
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
      },
    },
    controller.deleteCategory,
  );

  /* ========== Services ========== */

  app.post(
    '/admin/catalog/services',
    {
      preHandler: [app.authenticate],
      schema: {
        body: {
          type: 'object',
          required: ['categoryId', 'name', 'slug', 'shortOffer'],
          properties: {
            categoryId: { type: 'integer' },
            name: { type: 'string' },
            slug: { type: 'string' },
            shortOffer: { type: 'string' },
            priceFrom: { type: 'number', nullable: true },
            durationMinutes: { type: 'integer', nullable: true },
            benefit1: { type: 'string', nullable: true },
            benefit2: { type: 'string', nullable: true },
            ctaText: { type: 'string', nullable: true },
            ctaUrl: { type: 'string', nullable: true },
            sortOrder: { type: 'integer' },

            heroImageFileId: { type: 'integer', nullable: true },
            galleryImageFileIds: {
              type: 'array',
              items: { type: 'integer' },
            },
            usedDeviceIds: {
              type: 'array',
              items: { type: 'integer' },
            },

            servicePricesExtended: servicePricesExtendedSchema,
            seo: seoSchema,
          },
        },
      },
    },
    controller.createService,
  );

  app.put(
    '/admin/catalog/services/:id',
    {
      preHandler: [app.authenticate],
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          properties: {
            categoryId: { type: 'integer' },
            name: { type: 'string' },
            slug: { type: 'string' },
            shortOffer: { type: 'string' },
            priceFrom: { type: 'number', nullable: true },
            durationMinutes: { type: 'integer', nullable: true },
            benefit1: { type: 'string', nullable: true },
            benefit2: { type: 'string', nullable: true },
            ctaText: { type: 'string', nullable: true },
            ctaUrl: { type: 'string', nullable: true },
            sortOrder: { type: 'integer' },

            heroImageFileId: { type: 'integer', nullable: true },
            galleryImageFileIds: {
              type: 'array',
              items: { type: 'integer' },
              nullable: true,
            },
            usedDeviceIds: {
              type: 'array',
              items: { type: 'integer' },
              nullable: true,
            },

            servicePricesExtended: {
              ...servicePricesExtendedSchema,
              nullable: true,
            },
            seo: seoSchema,
          },
        },
      },
    },
    controller.updateService,
  );

  app.delete(
    '/admin/catalog/services/:id',
    {
      preHandler: [app.authenticate],
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
      },
    },
    controller.deleteService,
  );

  /* ========== Devices ========== */

  app.post(
    '/admin/catalog/devices',
    {
      preHandler: [app.authenticate],
      schema: {
        body: {
          type: 'object',
          required: ['brand', 'model', 'slug', 'positioning', 'principle'],
          properties: {
            brand: { type: 'string' },
            model: { type: 'string' },
            slug: { type: 'string' },
            positioning: { type: 'string' },
            principle: { type: 'string' },
            safetyNotes: { type: 'string', nullable: true },
            heroImageFileId: { type: 'integer', nullable: true },
            galleryImageFileIds: {
              type: 'array',
              items: { type: 'integer' },
              nullable: true,
            },
            seo: seoSchema,
          },
        },
      },
    },
    controller.createDevice,
  );

  app.put(
    '/admin/catalog/devices/:id',
    {
      preHandler: [app.authenticate],
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          properties: {
            brand: { type: 'string' },
            model: { type: 'string' },
            slug: { type: 'string' },
            positioning: { type: 'string' },
            principle: { type: 'string' },
            safetyNotes: { type: 'string', nullable: true },
            heroImageFileId: { type: 'integer', nullable: true },
            galleryImageFileIds: {
              type: 'array',
              items: { type: 'integer' },
              nullable: true,
            },
            seo: seoSchema,
          },
        },
      },
    },
    controller.updateDevice,
  );

  app.delete(
    '/admin/catalog/devices/:id',
    {
      preHandler: [app.authenticate],
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
      },
    },
    controller.deleteDevice,
  );
}
