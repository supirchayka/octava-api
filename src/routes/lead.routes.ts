import type { FastifyInstance } from "fastify";
import { LeadsController } from "../controllers/lead.controller";

export default async function leadsRoutes(app: FastifyInstance) {
  const controller = new LeadsController(app);

  // -------- Публичные формы --------

  app.post(
    "/forms/contact",
    {
      schema: {
        body: {
          type: "object",
          required: ["name", "phone", "source"],
          properties: {
            name: { type: "string", minLength: 1 },
            phone: { type: "string", minLength: 3 },
            message: { type: "string" },
            source: {
              type: "string",
              enum: ["HOME", "CONTACTS", "OTHER"],
            },
            pdnConsent: { type: "boolean" },
            utmSource: { type: "string" },
            utmMedium: { type: "string" },
            utmCampaign: { type: "string" },
          },
        },
      },
    },
    controller.createGenericLead,
  );

  app.post(
    "/forms/service",
    {
      schema: {
        body: {
          type: "object",
          required: ["name", "phone"],
          properties: {
            name: { type: "string", minLength: 1 },
            phone: { type: "string", minLength: 3 },
            message: { type: "string" },
            serviceId: { type: "number" },
            serviceSlug: { type: "string" },
            pdnConsent: { type: "boolean" },
            utmSource: { type: "string" },
            utmMedium: { type: "string" },
            utmCampaign: { type: "string" },
          },
        },
      },
    },
    controller.createServiceLead,
  );

  app.post(
    "/forms/device",
    {
      schema: {
        body: {
          type: "object",
          required: ["name", "phone"],
          properties: {
            name: { type: "string", minLength: 1 },
            phone: { type: "string", minLength: 3 },
            message: { type: "string" },
            deviceId: { type: "number" },
            deviceSlug: { type: "string" },
            pdnConsent: { type: "boolean" },
            utmSource: { type: "string" },
            utmMedium: { type: "string" },
            utmCampaign: { type: "string" },
          },
        },
      },
    },
    controller.createDeviceLead,
  );

  // -------- Админка: лиды --------

  app.get(
    "/admin/leads",
    {
      preHandler: [app.authenticate],
      schema: {
        querystring: {
          type: "object",
          properties: {
            page: { type: "string" },
            limit: { type: "string" },
            status: {
              type: "string",
              enum: ["NEW", "IN_PROGRESS", "DONE"],
            },
            sourceType: {
              type: "string",
              enum: ["HOME", "CONTACTS", "SERVICE", "DEVICE", "OTHER"],
            },
            serviceId: { type: "string" },
            deviceId: { type: "string" },
            search: { type: "string" },
            from: { type: "string" }, // ISO-дату/дату-время передаём строкой
            to: { type: "string" },
          },
        },
      },
    },
    controller.getLeads,
  );

  app.patch(
    "/admin/leads/:id/status",
    {
      preHandler: [app.authenticate],
      schema: {
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string" },
          },
        },
        body: {
          type: "object",
          required: ["status"],
          properties: {
            status: {
              type: "string",
              enum: ["NEW", "IN_PROGRESS", "DONE"],
            },
          },
        },
      },
    },
    controller.updateLeadStatus,
  );
}
