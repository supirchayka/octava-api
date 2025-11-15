"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = leadRoutes;
const lead_controller_1 = require("../controllers/lead.controller");
async function leadRoutes(app) {
    const controller = new lead_controller_1.LeadController(app);
    app.post("/leads", {
        schema: {
            body: {
                type: "object",
                required: ["sourceType", "name", "phone", "pdnConsent"],
                properties: {
                    sourceType: {
                        type: "string",
                        enum: ["HOME", "CONTACTS", "SERVICE", "DEVICE", "OTHER"],
                    },
                    serviceSlug: { type: "string" },
                    deviceSlug: { type: "string" },
                    name: { type: "string", minLength: 1 },
                    phone: { type: "string", minLength: 5 },
                    message: { type: "string" },
                    utmSource: { type: "string" },
                    utmMedium: { type: "string" },
                    utmCampaign: { type: "string" },
                    pdnConsent: { type: "boolean" },
                },
                allOf: [
                    {
                        if: {
                            properties: { sourceType: { const: "SERVICE" } },
                        },
                        then: {
                            required: ["serviceSlug"],
                        },
                    },
                    {
                        if: {
                            properties: { sourceType: { const: "DEVICE" } },
                        },
                        then: {
                            required: ["deviceSlug"],
                        },
                    },
                ],
            },
        },
    }, controller.createLead);
}
