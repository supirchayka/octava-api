"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CatalogController = void 0;
const catalog_service_1 = require("../services/catalog.service");
class CatalogController {
    constructor(app) {
        // ===== категории услуг =====
        this.getServiceCategories = async (_req, reply) => {
            const categories = await this.service.getServiceCategories();
            return reply.send(categories);
        };
        this.getServiceCategory = async (request, reply) => {
            const { slug } = request.params;
            const data = await this.service.getServiceCategoryBySlug(slug);
            if (!data) {
                return reply
                    .code(404)
                    .send({ message: "Категория услуг не найдена или не опубликована" });
            }
            return reply.send(data);
        };
        // ===== услуга =====
        this.getService = async (request, reply) => {
            const { slug } = request.params;
            const data = await this.service.getServiceBySlug(slug);
            if (!data) {
                return reply
                    .code(404)
                    .send({ message: "Услуга не найдена или не опубликована" });
            }
            return reply.send(data);
        };
        // ===== аппараты =====
        this.getDevicesList = async (_req, reply) => {
            const devices = await this.service.getDevicesList();
            return reply.send(devices);
        };
        this.getDevice = async (request, reply) => {
            const { slug } = request.params;
            const data = await this.service.getDeviceBySlug(slug);
            if (!data) {
                return reply
                    .code(404)
                    .send({ message: "Аппарат не найден или не опубликован" });
            }
            return reply.send(data);
        };
        this.service = new catalog_service_1.CatalogService(app);
    }
}
exports.CatalogController = CatalogController;
