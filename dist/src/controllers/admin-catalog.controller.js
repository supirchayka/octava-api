"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminCatalogController = void 0;
const admin_catalog_service_1 = require("../services/admin-catalog.service");
class AdminCatalogController {
    constructor(app) {
        this.app = app;
        /* ========== Categories ========== */
        this.createCategory = async (request, reply) => {
            this.ensureEditor(request);
            const body = request.body;
            const category = await this.service.createCategory(body);
            return reply.code(201).send(category);
        };
        this.updateCategory = async (request, reply) => {
            this.ensureEditor(request);
            const { id } = request.params;
            const body = request.body;
            const category = await this.service.updateCategory(Number(id), body);
            return reply.send(category);
        };
        this.deleteCategory = async (request, reply) => {
            this.ensureEditor(request);
            const { id } = request.params;
            await this.service.deleteCategory(Number(id));
            return reply.code(204).send();
        };
        /* ========== Services ========== */
        this.createService = async (request, reply) => {
            this.ensureEditor(request);
            const body = request.body;
            const service = await this.service.createService(body);
            return reply.code(201).send(service);
        };
        this.updateService = async (request, reply) => {
            this.ensureEditor(request);
            const { id } = request.params;
            const body = request.body;
            const service = await this.service.updateService(Number(id), body);
            return reply.send(service);
        };
        this.deleteService = async (request, reply) => {
            this.ensureEditor(request);
            const { id } = request.params;
            await this.service.deleteService(Number(id));
            return reply.code(204).send();
        };
        /* ========== Devices ========== */
        this.createDevice = async (request, reply) => {
            this.ensureEditor(request);
            const body = request.body;
            const device = await this.service.createDevice(body);
            return reply.code(201).send(device);
        };
        this.updateDevice = async (request, reply) => {
            this.ensureEditor(request);
            const { id } = request.params;
            const body = request.body;
            const device = await this.service.updateDevice(Number(id), body);
            return reply.send(device);
        };
        this.deleteDevice = async (request, reply) => {
            this.ensureEditor(request);
            const { id } = request.params;
            await this.service.deleteDevice(Number(id));
            return reply.code(204).send();
        };
        this.service = new admin_catalog_service_1.AdminCatalogService(app);
    }
    ensureEditor(request) {
        const user = request.user;
        if (!user || (user.role !== 'ADMIN' && user.role !== 'EDITOR')) {
            throw this.app.httpErrors.forbidden('Недостаточно прав');
        }
    }
}
exports.AdminCatalogController = AdminCatalogController;
