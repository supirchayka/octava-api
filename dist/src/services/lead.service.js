"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeadService = void 0;
class LeadService {
    constructor(app) {
        this.app = app;
    }
    async createLead(input, meta) {
        const { sourceType } = input;
        if (!input.pdnConsent) {
            throw this.app.httpErrors.badRequest("Для отправки заявки необходимо согласие на обработку персональных данных");
        }
        let serviceId;
        let deviceId;
        // Если источник — услуга, требуем serviceSlug и валидируем
        if (sourceType === "SERVICE") {
            if (!input.serviceSlug) {
                throw this.app.httpErrors.badRequest("serviceSlug обязателен для sourceType=SERVICE");
            }
            const service = await this.app.prisma.service.findUnique({
                where: { slug: input.serviceSlug },
            });
            if (!service || !service.isPublished) {
                throw this.app.httpErrors.badRequest("Услуга с указанным slug не найдена или не опубликована");
            }
            serviceId = service.id;
        }
        // Если источник — аппарат, требуем deviceSlug и валидируем
        if (sourceType === "DEVICE") {
            if (!input.deviceSlug) {
                throw this.app.httpErrors.badRequest("deviceSlug обязателен для sourceType=DEVICE");
            }
            const device = await this.app.prisma.device.findUnique({
                where: { slug: input.deviceSlug },
            });
            if (!device || !device.isPublished) {
                throw this.app.httpErrors.badRequest("Аппарат с указанным slug не найден или не опубликован");
            }
            deviceId = device.id;
        }
        const lead = await this.app.prisma.lead.create({
            data: {
                sourceType,
                serviceId: serviceId ?? null,
                deviceId: deviceId ?? null,
                name: input.name,
                phone: input.phone,
                message: input.message ?? null,
                utmSource: input.utmSource ?? null,
                utmMedium: input.utmMedium ?? null,
                utmCampaign: input.utmCampaign ?? null,
                referer: meta.referer ?? null,
                ipAddress: meta.ip,
                pdnConsent: input.pdnConsent,
                // status по умолчанию NEW в схеме
            },
        });
        return {
            id: lead.id,
            status: lead.status,
            createdAt: lead.createdAt,
        };
    }
}
exports.LeadService = LeadService;
