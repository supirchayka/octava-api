"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminOrgController = void 0;
const admin_org_service_1 = require("../services/admin-org.service");
class AdminOrgController {
    constructor(app) {
        this.app = app;
        this.upsertOrg = async (request, reply) => {
            this.ensureEditor(request);
            const body = request.body;
            const org = await this.service.upsertOrganization(body);
            return reply.send(org);
        };
        this.service = new admin_org_service_1.AdminOrgService(app);
    }
    ensureEditor(request) {
        const user = request.user;
        if (!user || (user.role !== 'ADMIN' && user.role !== 'EDITOR')) {
            throw this.app.httpErrors.forbidden('Недостаточно прав');
        }
    }
}
exports.AdminOrgController = AdminOrgController;
