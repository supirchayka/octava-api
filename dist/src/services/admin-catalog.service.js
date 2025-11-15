"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminCatalogService = void 0;
const client_1 = require("@prisma/client");
/**
 * Сервис админского каталога (категории, услуги, аппараты).
 */
class AdminCatalogService {
    constructor(app) {
        this.app = app;
    }
    /* ===================== CATEGORY ===================== */
    async createCategory(body) {
        const category = await this.app.prisma.serviceCategory.create({
            data: {
                name: body.name,
                slug: body.slug,
                description: body.description ?? null,
                isPublished: body.isPublished ?? false,
                sortOrder: body.sortOrder ?? 0,
            },
        });
        if (body.seo) {
            await this.upsertCategorySeo(category.id, body.seo);
        }
        return category;
    }
    async updateCategory(id, body) {
        const existing = await this.app.prisma.serviceCategory.findUnique({
            where: { id },
        });
        if (!existing) {
            throw this.app.httpErrors.notFound('Категория не найдена');
        }
        const category = await this.app.prisma.serviceCategory.update({
            where: { id },
            data: {
                ...(body.name !== undefined && { name: body.name }),
                ...(body.slug !== undefined && { slug: body.slug }),
                ...(body.description !== undefined && {
                    description: body.description ?? null,
                }),
                ...(body.isPublished !== undefined && {
                    isPublished: body.isPublished,
                }),
                ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
            },
        });
        if (body.seo) {
            await this.upsertCategorySeo(category.id, body.seo);
        }
        return category;
    }
    async deleteCategory(id) {
        await this.app.prisma.serviceCategory.delete({ where: { id } });
    }
    async upsertCategorySeo(categoryId, seo) {
        const updateData = {};
        if (seo.metaTitle !== undefined) {
            updateData.metaTitle = seo.metaTitle ?? '';
        }
        if (seo.metaDescription !== undefined) {
            updateData.metaDescription = seo.metaDescription ?? '';
        }
        if (seo.canonicalUrl !== undefined) {
            updateData.canonicalUrl = seo.canonicalUrl;
        }
        if (seo.robotsIndex !== undefined) {
            updateData.robotsIndex = seo.robotsIndex;
        }
        if (seo.robotsFollow !== undefined) {
            updateData.robotsFollow = seo.robotsFollow;
        }
        if (seo.ogTitle !== undefined) {
            updateData.ogTitle = seo.ogTitle;
        }
        if (seo.ogDescription !== undefined) {
            updateData.ogDescription = seo.ogDescription;
        }
        if (seo.ogImageId !== undefined) {
            updateData.ogImageId = seo.ogImageId;
        }
        await this.app.prisma.seoCategory.upsert({
            where: { categoryId },
            update: updateData,
            create: {
                categoryId,
                metaTitle: seo.metaTitle ?? 'Категория услуг OCTAVA',
                metaDescription: seo.metaDescription ?? '',
                canonicalUrl: seo.canonicalUrl ?? null,
                robotsIndex: seo.robotsIndex ?? true,
                robotsFollow: seo.robotsFollow ?? true,
                ogTitle: seo.ogTitle ?? null,
                ogDescription: seo.ogDescription ?? null,
                ogImageId: seo.ogImageId ?? null,
            },
        });
    }
    /* ===================== SERVICE ===================== */
    async upsertServiceSeo(serviceId, seo) {
        const updateData = {};
        if (seo.metaTitle !== undefined) {
            updateData.metaTitle = seo.metaTitle ?? '';
        }
        if (seo.metaDescription !== undefined) {
            updateData.metaDescription = seo.metaDescription ?? '';
        }
        if (seo.canonicalUrl !== undefined) {
            updateData.canonicalUrl = seo.canonicalUrl;
        }
        if (seo.robotsIndex !== undefined) {
            updateData.robotsIndex = seo.robotsIndex;
        }
        if (seo.robotsFollow !== undefined) {
            updateData.robotsFollow = seo.robotsFollow;
        }
        if (seo.ogTitle !== undefined) {
            updateData.ogTitle = seo.ogTitle;
        }
        if (seo.ogDescription !== undefined) {
            updateData.ogDescription = seo.ogDescription;
        }
        if (seo.ogImageId !== undefined) {
            updateData.ogImageId = seo.ogImageId;
        }
        await this.app.prisma.seoService.upsert({
            where: { serviceId },
            update: updateData,
            create: {
                serviceId,
                metaTitle: seo.metaTitle ?? 'Услуга клиники OCTAVA',
                metaDescription: seo.metaDescription ?? '',
                canonicalUrl: seo.canonicalUrl ?? null,
                robotsIndex: seo.robotsIndex ?? true,
                robotsFollow: seo.robotsFollow ?? true,
                ogTitle: seo.ogTitle ?? null,
                ogDescription: seo.ogDescription ?? null,
                ogImageId: seo.ogImageId ?? null,
            },
        });
    }
    async createService(body) {
        return this.app.prisma.$transaction(async (tx) => {
            const service = await tx.service.create({
                data: {
                    categoryId: body.categoryId,
                    name: body.name,
                    slug: body.slug,
                    shortOffer: body.shortOffer,
                    priceFrom: body.priceFrom ?? null,
                    durationMinutes: body.durationMinutes ?? null,
                    benefit1: body.benefit1 ?? null,
                    benefit2: body.benefit2 ?? null,
                    ctaText: body.ctaText ?? null,
                    ctaUrl: body.ctaUrl ?? null,
                    isPublished: body.isPublished ?? false,
                    sortOrder: body.sortOrder ?? 0,
                },
            });
            // HERO изображение
            if (body.heroImageFileId) {
                await tx.serviceImage.create({
                    data: {
                        serviceId: service.id,
                        fileId: body.heroImageFileId,
                        purpose: client_1.ImagePurpose.HERO,
                        order: 0,
                    },
                });
            }
            // Галерея
            if (body.galleryImageFileIds?.length) {
                for (let i = 0; i < body.galleryImageFileIds.length; i++) {
                    await tx.serviceImage.create({
                        data: {
                            serviceId: service.id,
                            fileId: body.galleryImageFileIds[i],
                            purpose: client_1.ImagePurpose.GALLERY,
                            order: i,
                        },
                    });
                }
            }
            // Аппараты
            if (body.usedDeviceIds?.length) {
                for (const deviceId of body.usedDeviceIds) {
                    await tx.serviceDevice.create({
                        data: {
                            serviceId: service.id,
                            deviceId,
                        },
                    });
                }
            }
            // Расширенные цены
            if (body.servicePricesExtended?.length) {
                for (let i = 0; i < body.servicePricesExtended.length; i++) {
                    const p = body.servicePricesExtended[i];
                    await tx.servicePriceExtended.create({
                        data: {
                            serviceId: service.id,
                            title: p.title,
                            price: p.price,
                            durationMinutes: p.durationMinutes ?? null,
                            type: p.type ?? client_1.ServicePriceType.EXTRA,
                            sessionsCount: p.sessionsCount ?? null,
                            order: p.order ?? i,
                            isActive: p.isActive ?? true,
                        },
                    });
                }
            }
            // SEO
            if (body.seo) {
                await this.upsertServiceSeo(service.id, body.seo);
            }
            const full = await tx.service.findUnique({
                where: { id: service.id },
                include: {
                    pricesExtended: true,
                    devices: { include: { device: true } },
                    images: { include: { file: true } },
                    seo: true,
                },
            });
            return full;
        });
    }
    async updateService(id, body) {
        return this.app.prisma.$transaction(async (tx) => {
            const existing = await tx.service.findUnique({ where: { id } });
            if (!existing) {
                throw this.app.httpErrors.notFound('Услуга не найдена');
            }
            await tx.service.update({
                where: { id },
                data: {
                    ...(body.categoryId !== undefined && { categoryId: body.categoryId }),
                    ...(body.name !== undefined && { name: body.name }),
                    ...(body.slug !== undefined && { slug: body.slug }),
                    ...(body.shortOffer !== undefined && {
                        shortOffer: body.shortOffer,
                    }),
                    ...(body.priceFrom !== undefined && {
                        priceFrom: body.priceFrom,
                    }),
                    ...(body.durationMinutes !== undefined && {
                        durationMinutes: body.durationMinutes,
                    }),
                    ...(body.benefit1 !== undefined && {
                        benefit1: body.benefit1 ?? null,
                    }),
                    ...(body.benefit2 !== undefined && {
                        benefit2: body.benefit2 ?? null,
                    }),
                    ...(body.ctaText !== undefined && {
                        ctaText: body.ctaText ?? null,
                    }),
                    ...(body.ctaUrl !== undefined && {
                        ctaUrl: body.ctaUrl ?? null,
                    }),
                    ...(body.isPublished !== undefined && {
                        isPublished: body.isPublished,
                    }),
                    ...(body.sortOrder !== undefined && {
                        sortOrder: body.sortOrder,
                    }),
                },
            });
            // HERO: если heroImageFileId передан — полностью переопределяем
            if (body.heroImageFileId !== undefined) {
                await tx.serviceImage.deleteMany({
                    where: { serviceId: id, purpose: client_1.ImagePurpose.HERO },
                });
                if (body.heroImageFileId !== null) {
                    await tx.serviceImage.create({
                        data: {
                            serviceId: id,
                            fileId: body.heroImageFileId,
                            purpose: client_1.ImagePurpose.HERO,
                            order: 0,
                        },
                    });
                }
            }
            // Галерея: если массив передан — пересобираем
            if (body.galleryImageFileIds !== undefined) {
                await tx.serviceImage.deleteMany({
                    where: { serviceId: id, purpose: client_1.ImagePurpose.GALLERY },
                });
                if (body.galleryImageFileIds?.length) {
                    for (let i = 0; i < body.galleryImageFileIds.length; i++) {
                        await tx.serviceImage.create({
                            data: {
                                serviceId: id,
                                fileId: body.galleryImageFileIds[i],
                                purpose: client_1.ImagePurpose.GALLERY,
                                order: i,
                            },
                        });
                    }
                }
            }
            // Аппараты: если массив передан — пересобираем связи
            if (body.usedDeviceIds !== undefined) {
                await tx.serviceDevice.deleteMany({ where: { serviceId: id } });
                if (body.usedDeviceIds?.length) {
                    for (const deviceId of body.usedDeviceIds) {
                        await tx.serviceDevice.create({
                            data: {
                                serviceId: id,
                                deviceId,
                            },
                        });
                    }
                }
            }
            // Расширенные цены: если массив передан — пересобираем
            if (body.servicePricesExtended !== undefined) {
                await tx.servicePriceExtended.deleteMany({ where: { serviceId: id } });
                if (body.servicePricesExtended?.length) {
                    for (let i = 0; i < body.servicePricesExtended.length; i++) {
                        const p = body.servicePricesExtended[i];
                        await tx.servicePriceExtended.create({
                            data: {
                                serviceId: id,
                                title: p.title,
                                price: p.price,
                                durationMinutes: p.durationMinutes ?? null,
                                type: p.type ?? client_1.ServicePriceType.EXTRA,
                                sessionsCount: p.sessionsCount ?? null,
                                order: p.order ?? i,
                                isActive: p.isActive ?? true,
                            },
                        });
                    }
                }
            }
            // SEO
            if (body.seo) {
                await this.upsertServiceSeo(id, body.seo);
            }
            const full = await tx.service.findUnique({
                where: { id },
                include: {
                    pricesExtended: true,
                    devices: { include: { device: true } },
                    images: { include: { file: true } },
                    seo: true,
                },
            });
            return full;
        });
    }
    async deleteService(id) {
        await this.app.prisma.service.delete({ where: { id } });
    }
    /* ===================== DEVICE ===================== */
    async upsertDeviceSeo(deviceId, seo) {
        const updateData = {};
        if (seo.metaTitle !== undefined) {
            updateData.metaTitle = seo.metaTitle ?? '';
        }
        if (seo.metaDescription !== undefined) {
            updateData.metaDescription = seo.metaDescription ?? '';
        }
        if (seo.canonicalUrl !== undefined) {
            updateData.canonicalUrl = seo.canonicalUrl;
        }
        if (seo.robotsIndex !== undefined) {
            updateData.robotsIndex = seo.robotsIndex;
        }
        if (seo.robotsFollow !== undefined) {
            updateData.robotsFollow = seo.robotsFollow;
        }
        if (seo.ogTitle !== undefined) {
            updateData.ogTitle = seo.ogTitle;
        }
        if (seo.ogDescription !== undefined) {
            updateData.ogDescription = seo.ogDescription;
        }
        if (seo.ogImageId !== undefined) {
            updateData.ogImageId = seo.ogImageId;
        }
        await this.app.prisma.seoDevice.upsert({
            where: { deviceId },
            update: updateData,
            create: {
                deviceId,
                metaTitle: seo.metaTitle ?? 'Аппарат клиники OCTAVA',
                metaDescription: seo.metaDescription ?? '',
                canonicalUrl: seo.canonicalUrl ?? null,
                robotsIndex: seo.robotsIndex ?? true,
                robotsFollow: seo.robotsFollow ?? true,
                ogTitle: seo.ogTitle ?? null,
                ogDescription: seo.ogDescription ?? null,
                ogImageId: seo.ogImageId ?? null,
            },
        });
    }
    async createDevice(body) {
        const device = await this.app.prisma.device.create({
            data: {
                brand: body.brand,
                model: body.model,
                slug: body.slug,
                positioning: body.positioning,
                principle: body.principle,
                safetyNotes: body.safetyNotes ?? null,
                isPublished: body.isPublished ?? false,
            },
        });
        if (body.seo) {
            await this.upsertDeviceSeo(device.id, body.seo);
        }
        return device;
    }
    async updateDevice(id, body) {
        const existing = await this.app.prisma.device.findUnique({ where: { id } });
        if (!existing) {
            throw this.app.httpErrors.notFound('Аппарат не найден');
        }
        const device = await this.app.prisma.device.update({
            where: { id },
            data: {
                ...(body.brand !== undefined && { brand: body.brand }),
                ...(body.model !== undefined && { model: body.model }),
                ...(body.slug !== undefined && { slug: body.slug }),
                ...(body.positioning !== undefined && {
                    positioning: body.positioning,
                }),
                ...(body.principle !== undefined && {
                    principle: body.principle,
                }),
                ...(body.safetyNotes !== undefined && {
                    safetyNotes: body.safetyNotes ?? null,
                }),
                ...(body.isPublished !== undefined && {
                    isPublished: body.isPublished,
                }),
            },
        });
        if (body.seo) {
            await this.upsertDeviceSeo(device.id, body.seo);
        }
        return device;
    }
    async deleteDevice(id) {
        await this.app.prisma.device.delete({ where: { id } });
    }
}
exports.AdminCatalogService = AdminCatalogService;
