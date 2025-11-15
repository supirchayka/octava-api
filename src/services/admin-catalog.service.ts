// src/services/admin-catalog.service.ts
import type { FastifyInstance } from 'fastify';
import { ImagePurpose, ServicePriceType } from '@prisma/client';

/**
 * Базовый SEO-дто для категорий/услуг/аппаратов.
 * Все поля опциональны, внутри сервиса мы уже решаем, что писать по умолчанию.
 */
export interface SeoCommonBody {
  metaTitle?: string | null;
  metaDescription?: string | null;
  canonicalUrl?: string | null;
  robotsIndex?: boolean;
  robotsFollow?: boolean;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImageId?: number | null;
}

// на всякий случай алиасы, если где-то уже использовались старые названия
export type SeoCategoryBody = SeoCommonBody;
export type SeoServiceBody = SeoCommonBody;
export type SeoDeviceBody = SeoCommonBody;

/* ========== Категория услуг ========== */

export interface CategoryBody {
  name: string;
  slug: string;
  description?: string | null;
  sortOrder?: number;
  heroImageFileId?: number | null;
  seo?: SeoCategoryBody;
}

/* ========== Расширенные цены услуги ========== */

export interface ServicePriceExtendedBody {
  title: string;
  price: number;
  durationMinutes?: number | null;
  type?: ServicePriceType;
  sessionsCount?: number | null;
  order?: number | null;
  isActive?: boolean;
}

/* ========== Услуга ========== */

export interface ServiceBody {
  categoryId: number;
  name: string;
  slug: string;
  shortOffer: string;
  priceFrom?: number | null;
  durationMinutes?: number | null;
  benefit1?: string | null;
  benefit2?: string | null;
  ctaText?: string | null;
  ctaUrl?: string | null;
  sortOrder?: number;

  // Привязки
  heroImageFileId?: number | null; // файл для HERO
  galleryImageFileIds?: number[] | null; // файлы для галереи
  usedDeviceIds?: number[];        // какие аппараты используются

  servicePricesExtended?: ServicePriceExtendedBody[];
  seo?: SeoServiceBody;
}

/* ========== Аппарат ========== */

export interface DeviceBody {
  brand: string;
  model: string;
  slug: string;
  positioning: string;
  principle: string;
  safetyNotes?: string | null;
  heroImageFileId?: number | null;
  galleryImageFileIds?: number[] | null;
  seo?: SeoDeviceBody;
}

/**
 * Сервис админского каталога (категории, услуги, аппараты).
 */
export class AdminCatalogService {
  constructor(private app: FastifyInstance) {}

  /* ===================== CATEGORY ===================== */

  async createCategory(body: CategoryBody) {
    const category = await this.app.prisma.serviceCategory.create({
      data: {
        name: body.name,
        slug: body.slug,
        description: body.description ?? null,
        sortOrder: body.sortOrder ?? 0,
      },
    });

    if (body.heroImageFileId !== undefined && body.heroImageFileId !== null) {
      await this.app.prisma.categoryImage.create({
        data: {
          categoryId: category.id,
          fileId: body.heroImageFileId,
          purpose: ImagePurpose.HERO,
          order: 0,
        },
      });
    }

    if (body.seo) {
      await this.upsertCategorySeo(category.id, body.seo);
    }

    return category;
  }

  async updateCategory(id: number, body: CategoryBody) {
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
        ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
      },
    });

    if (body.seo) {
      await this.upsertCategorySeo(category.id, body.seo);
    }

    if (body.heroImageFileId !== undefined) {
      await this.app.prisma.categoryImage.deleteMany({
        where: { categoryId: id, purpose: ImagePurpose.HERO },
      });

      if (body.heroImageFileId !== null) {
        await this.app.prisma.categoryImage.create({
          data: {
            categoryId: id,
            fileId: body.heroImageFileId,
            purpose: ImagePurpose.HERO,
            order: 0,
          },
        });
      }
    }

    return category;
  }

  async deleteCategory(id: number) {
    await this.app.prisma.serviceCategory.delete({ where: { id } });
  }

  private async upsertCategorySeo(categoryId: number, seo: SeoCategoryBody) {
    const updateData: any = {};

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

  private async upsertServiceSeo(serviceId: number, seo: SeoServiceBody) {
    const updateData: any = {};

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

  async createService(body: ServiceBody) {
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
          sortOrder: body.sortOrder ?? 0,
        },
      });

      // HERO изображение
      if (body.heroImageFileId !== undefined && body.heroImageFileId !== null) {
        await tx.serviceImage.create({
          data: {
            serviceId: service.id,
            fileId: body.heroImageFileId,
            purpose: ImagePurpose.HERO,
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
              purpose: ImagePurpose.GALLERY,
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
              type: p.type ?? ServicePriceType.EXTRA,
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

      return full!;
    });
  }

  async updateService(id: number, body: ServiceBody) {
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
          ...(body.sortOrder !== undefined && {
            sortOrder: body.sortOrder,
          }),
        },
      });

      // HERO: если heroImageFileId передан — полностью переопределяем
      if (body.heroImageFileId !== undefined) {
        await tx.serviceImage.deleteMany({
          where: { serviceId: id, purpose: ImagePurpose.HERO },
        });

        if (body.heroImageFileId !== null) {
          await tx.serviceImage.create({
            data: {
              serviceId: id,
              fileId: body.heroImageFileId,
              purpose: ImagePurpose.HERO,
              order: 0,
            },
          });
        }
      }

      // Галерея: если массив передан — пересобираем
      if (body.galleryImageFileIds !== undefined) {
        await tx.serviceImage.deleteMany({
          where: { serviceId: id, purpose: ImagePurpose.GALLERY },
        });

        if (body.galleryImageFileIds?.length) {
          for (let i = 0; i < body.galleryImageFileIds.length; i++) {
            await tx.serviceImage.create({
              data: {
                serviceId: id,
                fileId: body.galleryImageFileIds[i],
                purpose: ImagePurpose.GALLERY,
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
                type: p.type ?? ServicePriceType.EXTRA,
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

      return full!;
    });
  }

  async deleteService(id: number) {
    await this.app.prisma.service.delete({ where: { id } });
  }

  /* ===================== DEVICE ===================== */

  private async upsertDeviceSeo(deviceId: number, seo: SeoDeviceBody) {
    const updateData: any = {};

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

  async createDevice(body: DeviceBody) {
    const device = await this.app.prisma.device.create({
      data: {
        brand: body.brand,
        model: body.model,
        slug: body.slug,
        positioning: body.positioning,
        principle: body.principle,
        safetyNotes: body.safetyNotes ?? null,
      },
    });

      if (body.heroImageFileId !== undefined && body.heroImageFileId !== null) {
        await tx.deviceImage.create({
          data: {
            deviceId: device.id,
            fileId: body.heroImageFileId,
            purpose: ImagePurpose.HERO,
            order: 0,
          },
        });
      }

      if (body.galleryImageFileIds?.length) {
        for (let i = 0; i < body.galleryImageFileIds.length; i++) {
          await tx.deviceImage.create({
            data: {
              deviceId: device.id,
              fileId: body.galleryImageFileIds[i],
              purpose: ImagePurpose.GALLERY,
              order: i,
            },
          });
        }
      }

      if (body.seo) {
        await this.upsertDeviceSeo(device.id, body.seo);
      }

      const full = await tx.device.findUnique({
        where: { id: device.id },
        include: {
          images: { include: { file: true } },
          seo: true,
        },
      });

      return full!;
    });
  }

  async updateDevice(id: number, body: DeviceBody) {
    return this.app.prisma.$transaction(async (tx) => {
      const existing = await tx.device.findUnique({ where: { id } });
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
      },
    });

      if (body.heroImageFileId !== undefined) {
        await tx.deviceImage.deleteMany({
          where: { deviceId: id, purpose: ImagePurpose.HERO },
        });

        if (body.heroImageFileId !== null) {
          await tx.deviceImage.create({
            data: {
              deviceId: id,
              fileId: body.heroImageFileId,
              purpose: ImagePurpose.HERO,
              order: 0,
            },
          });
        }
      }

      if (body.galleryImageFileIds !== undefined) {
        await tx.deviceImage.deleteMany({
          where: { deviceId: id, purpose: ImagePurpose.GALLERY },
        });

        if (body.galleryImageFileIds?.length) {
          for (let i = 0; i < body.galleryImageFileIds.length; i++) {
            await tx.deviceImage.create({
              data: {
                deviceId: id,
                fileId: body.galleryImageFileIds[i],
                purpose: ImagePurpose.GALLERY,
                order: i,
              },
            });
          }
        }
      }

      if (body.seo) {
        await this.upsertDeviceSeo(id, body.seo);
      }

      const full = await tx.device.findUnique({
        where: { id },
        include: {
          images: { include: { file: true } },
          seo: true,
        },
      });

      return full!;
    });
  }

  async deleteDevice(id: number) {
    await this.app.prisma.device.delete({ where: { id } });
  }
}
