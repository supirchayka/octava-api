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

  app.get(
    '/admin/catalog/categories',
    {
      preHandler: [app.authenticate],
    },
    controller.listCategories,
  );

  app.get(
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
    controller.getCategory,
  );

  app.post(
    '/admin/catalog/categories',
    {
      preHandler: [app.authenticate],
      schema: {
        body: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string' },
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

  app.get(
    '/admin/catalog/services',
    {
      preHandler: [app.authenticate],
      schema: {
        querystring: {
          type: 'object',
          properties: {
            categoryId: { type: 'integer' },
          },
        },
      },
    },
    controller.listServices,
  );

  app.get(
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
    controller.getService,
  );

  app.post(
    '/admin/catalog/services',
    {
      preHandler: [app.authenticate],
      schema: {
        body: {
          type: 'object',
          required: ['categoryId', 'name', 'shortOffer'],
          properties: {
            categoryId: { type: 'integer' },
            name: { type: 'string' },
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
            specialistIds: {
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
            specialistIds: {
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

  app.get(
    '/admin/catalog/devices',
    {
      preHandler: [app.authenticate],
    },
    controller.listDevices,
  );

  app.get(
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
    controller.getDevice,
  );

  app.post(
    '/admin/catalog/devices',
    {
      preHandler: [app.authenticate],
      schema: {
        body: {
          type: 'object',
          required: ['brand', 'model', 'positioning', 'principle'],
          properties: {
            brand: { type: 'string' },
            model: { type: 'string' },
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

  /* ========== Specialists ========== */

  app.get(
    '/admin/catalog/specialists',
    {
      preHandler: [app.authenticate],
    },
    controller.listSpecialists,
  );

  app.get(
    '/admin/catalog/specialists/:id',
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
    controller.getSpecialist,
  );

  app.post(
    '/admin/catalog/specialists',
    {
      preHandler: [app.authenticate],
      schema: {
        body: {
          type: 'object',
          required: [
            'firstName',
            'lastName',
            'specialization',
            'biography',
            'experienceYears',
            'photoFileId',
          ],
          properties: {
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            specialization: { type: 'string' },
            biography: { type: 'string' },
            experienceYears: { type: 'integer' },
            photoFileId: { type: 'integer' },
            serviceIds: {
              type: 'array',
              items: { type: 'integer' },
            },
          },
        },
      },
    },
    controller.createSpecialist,
  );

  app.put(
    '/admin/catalog/specialists/:id',
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
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            specialization: { type: 'string' },
            biography: { type: 'string' },
            experienceYears: { type: 'integer' },
            photoFileId: { type: 'integer' },
            serviceIds: {
              type: 'array',
              items: { type: 'integer' },
            },
          },
        },
      },
    },
    controller.updateSpecialist,
  );

  app.delete(
    '/admin/catalog/specialists/:id',
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
    controller.deleteSpecialist,
  );
}
