"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminOrgService = void 0;
/**
 * Админ-управление карточкой организации.
 * В базе всегда одна запись Organization.
 */
class AdminOrgService {
    constructor(app) {
        this.app = app;
    }
    async upsertOrganization(input) {
        const existing = await this.app.prisma.organization.findFirst({
            orderBy: { id: 'asc' },
        });
        if (!existing) {
            // Первичное создание
            const org = await this.app.prisma.organization.create({
                data: {
                    fullName: input.fullName ?? 'ООО «OCTAVA»',
                    ogrn: input.ogrn ?? '',
                    inn: input.inn ?? '',
                    kpp: input.kpp ?? '',
                    address: input.address ?? '',
                    email: input.email ?? '',
                },
            });
            return org;
        }
        // Частичное обновление существующей
        const org = await this.app.prisma.organization.update({
            where: { id: existing.id },
            data: {
                fullName: input.fullName ?? existing.fullName,
                ogrn: input.ogrn ?? existing.ogrn,
                inn: input.inn ?? existing.inn,
                kpp: input.kpp ?? existing.kpp,
                address: input.address ?? existing.address,
                email: input.email ?? existing.email,
            },
        });
        return org;
    }
}
exports.AdminOrgService = AdminOrgService;
