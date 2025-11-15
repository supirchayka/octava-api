"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = adminOrgRoutes;
const admin_org_controller_1 = require("../controllers/admin-org.controller");
async function adminOrgRoutes(app) {
    const controller = new admin_org_controller_1.AdminOrgController(app);
    // Обновление/создание карточки организации
    app.put('/admin/org', {
        preHandler: [app.authenticate],
        schema: {
            body: {
                type: 'object',
                properties: {
                    fullName: { type: 'string' },
                    ogrn: { type: 'string' },
                    inn: { type: 'string' },
                    kpp: { type: 'string' },
                    address: { type: 'string' },
                    email: { type: 'string' },
                },
            },
        },
    }, controller.upsertOrg);
}
