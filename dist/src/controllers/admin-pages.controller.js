"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminPagesController = void 0;
const admin_pages_service_1 = require("../services/admin-pages.service");
class AdminPagesController {
    constructor(app) {
        this.app = app;
        this.updateHome = async (request, reply) => {
            this.ensureEditor(request);
            const body = request.body;
            await this.service.updateHomePage(body);
            return reply.code(204).send();
        };
        this.updateAbout = async (request, reply) => {
            this.ensureEditor(request);
            const body = request.body;
            await this.service.updateAboutPage(body);
            return reply.code(204).send();
        };
        this.updateContacts = async (request, reply) => {
            this.ensureEditor(request);
            const body = request.body;
            await this.service.updateContactsPage(body);
            return reply.code(204).send();
        };
        this.updatePersonalDataPolicy = async (request, reply) => {
            this.ensureEditor(request);
            const body = request.body;
            await this.service.updatePersonalDataPolicy(body);
            return reply.code(204).send();
        };
        this.updatePrivacyPolicy = async (request, reply) => {
            this.ensureEditor(request);
            const body = request.body;
            await this.service.updatePrivacyPolicy(body);
            return reply.code(204).send();
        };
        this.service = new admin_pages_service_1.AdminPagesService(app);
    }
    ensureEditor(request) {
        const user = request.user;
        if (!user || (user.role !== 'ADMIN' && user.role !== 'EDITOR')) {
            throw this.app.httpErrors.forbidden('Недостаточно прав');
        }
    }
}
exports.AdminPagesController = AdminPagesController;
