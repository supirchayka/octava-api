// src/services/admin-catalog.service.ts
import type { FastifyInstance } from 'fastify';
import type { Prisma, PrismaClient } from '@prisma/client';
import { ImagePurpose, ServiceCategoryGender, ServicePriceType } from '@prisma/client';
import { buildFileUrl } from '../utils/files';
import { randomSlugSuffix, slugify } from '../utils/slug';

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
  description?: string | null;
  gender?: ServiceCategoryGender;
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
  specialistIds?: number[];        // какие специалисты привязаны

  servicePricesExtended?: ServicePriceExtendedBody[];
  seo?: SeoServiceBody;
}

/* ========== Аппарат ========== */

export interface DeviceBody {
  brand: string;
  model: string;
  positioning: string;
  principle: string;
  safetyNotes?: string | null;
  heroImageFileId?: number | null;
  galleryImageFileIds?: number[] | null;
  seo?: SeoDeviceBody;
}

/* ========== Специалист ========== */

export interface SpecialistBody {
  firstName: string;
  lastName: string;
  specialization: string;
  biography: string;
  experienceYears: number;
  photoFileId: number;
  serviceIds?: number[];
}

type PrismaClientLike = PrismaClient | Prisma.TransactionClient;

const categoryInclude = {
  images: { include: { file: true } },
  seo: { include: { ogImage: true } },
} as const;

type CategoryWithRelations = Prisma.ServiceCategoryGetPayload<{
  include: typeof categoryInclude;
}>;

/**
 * Сервис админского каталога (категории, услуги, аппараты).
 */
export class AdminCatalogService {
  constructor(private app: FastifyInstance) {}

  private mapFile(file?: {
    id: number;
    path: string;
    originalName: string;
    mime: string;
    sizeBytes: number;
    width: number | null;
    height: number | null;
  } | null) {
    if (!file) return null;

    return {
      id: file.id,
      url: buildFileUrl(file.path),
      originalName: file.originalName,
      mime: file.mime,
      sizeBytes: file.sizeBytes,
      width: file.width ?? null,
      height: file.height ?? null,
    };
  }

  private mapImage(image?: {
    id: number;
    fileId: number;
    purpose: ImagePurpose;
    order: number;
    alt: string | null;
    caption: string | null;
    file: {
      id: number;
      path: string;
      originalName: string;
      mime: string;
      sizeBytes: number;
      width: number | null;
      height: number | null;
    };
  } | null) {
    if (!image) return null;

    return {
      id: image.id,
      fileId: image.fileId,
      purpose: image.purpose,
      order: image.order,
      alt: image.alt ?? null,
      caption: image.caption ?? null,
      file: this.mapFile(image.file),
    };
  }

  private mapSpecialistSummary(specialist: {
    id: number;
    firstName: string;
    lastName: string;
    specialization: string;
    experienceYears: number;
    photo: {
      id: number;
      path: string;
      originalName: string;
      mime: string;
      sizeBytes: number;
      width: number | null;
      height: number | null;
    };
  }) {
    return {
      id: specialist.id,
      firstName: specialist.firstName,
      lastName: specialist.lastName,
      specialization: specialist.specialization,
      experienceYears: specialist.experienceYears,
      photo: this.mapFile(specialist.photo),
    };
  }

  private mapSeoEntity(seo?: {
    metaTitle: string | null;
    metaDescription: string | null;
    canonicalUrl: string | null;
    robotsIndex: boolean | null;
    robotsFollow: boolean | null;
    ogTitle: string | null;
    ogDescription: string | null;
    ogImageId: number | null;
    ogImage?: {
      id: number;
      path: string;
      originalName: string;
      mime: string;
      sizeBytes: number;
      width: number | null;
      height: number | null;
    } | null;
  } | null) {
    if (!seo) return null;

    return {
      metaTitle: seo.metaTitle,
      metaDescription: seo.metaDescription,
      canonicalUrl: seo.canonicalUrl,
      robotsIndex: seo.robotsIndex ?? null,
      robotsFollow: seo.robotsFollow ?? null,
      ogTitle: seo.ogTitle,
      ogDescription: seo.ogDescription,
      ogImageId: seo.ogImageId ?? null,
      ogImage: this.mapFile(seo.ogImage ?? null),
    };
  }

  private mapCategoryResponse(category: CategoryWithRelations) {
    const heroImage = category.images.find(
      (img) => img.purpose === ImagePurpose.HERO,
    );

    return {
      id: category.id,
      slug: category.slug,
      name: category.name,
      description: category.description,
      gender: category.gender,
      sortOrder: category.sortOrder,
      heroImageFileId: heroImage?.fileId ?? null,
      heroImage: this.mapImage(heroImage) ?? null,
      seo: this.mapSeoEntity(category.seo),
    };
  }

  private async slugExists(
    db: PrismaClientLike,
    entity: 'category' | 'service' | 'device',
    slug: string,
    excludeId?: number,
  ) {
    const where: any = { slug };
    if (excludeId !== undefined) {
      where.id = { not: excludeId };
    }

    if (entity === 'category') {
      const found = await db.serviceCategory.findFirst({ where });
      return Boolean(found);
    }

    if (entity === 'service') {
      const found = await db.service.findFirst({ where });
      return Boolean(found);
    }

    const found = await db.device.findFirst({ where });
    return Boolean(found);
  }

  private async generateEntitySlug(
    db: PrismaClientLike,
    entity: 'category' | 'service' | 'device',
    source: string,
    excludeId?: number,
  ) {
    const base = slugify(source.trim());
    let candidate = base;

    while (await this.slugExists(db, entity, candidate, excludeId)) {
      candidate = `${base}-${randomSlugSuffix()}`;
    }

    return candidate;
  }

  private async syncCategoryHero(
    db: PrismaClientLike,
    categoryId: number,
    heroImageFileId?: number | null,
  ) {
    if (heroImageFileId === undefined) {
      return;
    }

    await db.categoryImage.deleteMany({
      where: { categoryId, purpose: ImagePurpose.HERO },
    });

    if (heroImageFileId === null) {
      return;
    }

    await db.categoryImage.create({
      data: {
        categoryId,
        fileId: heroImageFileId,
        purpose: ImagePurpose.HERO,
        order: 0,
      },
    });
  }

  /* ===================== CATEGORY ===================== */

  async listCategories() {
    const categories = await this.app.prisma.serviceCategory.findMany({
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      include: categoryInclude,
    });

    return categories.map((category) => this.mapCategoryResponse(category));
  }

  async getCategoryById(id: number) {
    const category = await this.app.prisma.serviceCategory.findUnique({
      where: { id },
      include: categoryInclude,
    });

    if (!category) {
      throw this.app.httpErrors.notFound('Категория не найдена');
    }

    return this.mapCategoryResponse(category);
  }

  async createCategory(body: CategoryBody) {
    return this.app.prisma.$transaction(async (tx) => {
      const slug = await this.generateEntitySlug(tx, 'category', body.name);
      const category = await tx.serviceCategory.create({
        data: {
          name: body.name,
          slug,
          description: body.description ?? null,
          gender: body.gender,
          sortOrder: body.sortOrder ?? 0,
        },
      });

      await this.syncCategoryHero(tx, category.id, body.heroImageFileId);

      if (body.seo) {
        await this.upsertCategorySeo(category.id, body.seo, tx);
      }

      const full = await tx.serviceCategory.findUnique({
        where: { id: category.id },
        include: categoryInclude,
      });

      return this.mapCategoryResponse(full!);
    });
  }

  async updateCategory(id: number, body: CategoryBody) {
    return this.app.prisma.$transaction(async (tx) => {
      const existing = await tx.serviceCategory.findUnique({ where: { id } });

      if (!existing) {
        throw this.app.httpErrors.notFound('Категория не найдена');
      }

      let slugToUpdate: string | undefined;
      if (body.name !== undefined && body.name.trim() !== existing.name.trim()) {
        slugToUpdate = await this.generateEntitySlug(tx, 'category', body.name, id);
      }

      await tx.serviceCategory.update({
        where: { id },
        data: {
          ...(body.name !== undefined && { name: body.name }),
          ...(slugToUpdate && { slug: slugToUpdate }),
          ...(body.description !== undefined && {
            description: body.description ?? null,
          }),
          ...(body.gender !== undefined && { gender: body.gender }),
          ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
        },
      });

      await this.syncCategoryHero(tx, id, body.heroImageFileId);

      if (body.seo) {
        await this.upsertCategorySeo(id, body.seo, tx);
      }

      const full = await tx.serviceCategory.findUnique({
        where: { id },
        include: categoryInclude,
      });

      return this.mapCategoryResponse(full!);
    });
  }

  async deleteCategory(id: number) {
    await this.app.prisma.serviceCategory.delete({ where: { id } });
  }

  private async upsertCategorySeo(
    categoryId: number,
    seo: SeoCategoryBody,
    db: PrismaClientLike = this.app.prisma,
  ) {
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

    await db.seoCategory.upsert({
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

  private async upsertServiceSeo(
    serviceId: number,
    seo: SeoServiceBody,
    db: PrismaClientLike = this.app.prisma,
  ) {
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

    await db.seoService.upsert({
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
      const slug = await this.generateEntitySlug(tx, 'service', body.name);
      const service = await tx.service.create({
        data: {
          categoryId: body.categoryId,
          name: body.name,
          slug,
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

      // Специалисты
      if (body.specialistIds?.length) {
        for (const specialistId of body.specialistIds) {
          await tx.serviceSpecialist.create({
            data: {
              serviceId: service.id,
              specialistId,
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
        await this.upsertServiceSeo(service.id, body.seo, tx);
      }

      const full = await tx.service.findUnique({
        where: { id: service.id },
        include: {
          pricesExtended: true,
          devices: { include: { device: true } },
          specialists: { include: { specialist: { include: { photo: true } } } },
          images: { include: { file: true } },
          seo: true,
        },
      });

      return full!;
    });
  }

  private mapServiceResponse(service: Prisma.ServiceGetPayload<{
    include: {
      category: true;
      images: { include: { file: true } };
      devices: true;
      specialists: {
        include: {
          specialist: {
            include: {
              photo: true;
            };
          };
        };
      };
      pricesExtended: true;
      seo: { include: { ogImage: true } };
    };
  }>) {
    const heroImage = service.images.find(
      (img) => img.purpose === ImagePurpose.HERO,
    );
    const galleryImages = service.images.filter(
      (img) => img.purpose === ImagePurpose.GALLERY,
    );

    return {
      id: service.id,
      slug: service.slug,
      categoryId: service.categoryId,
      categoryName: service.category.name,
      name: service.name,
      shortOffer: service.shortOffer,
      priceFrom:
        service.priceFrom !== null
          ? Number(service.priceFrom)
          : null,
      durationMinutes: service.durationMinutes,
      benefit1: service.benefit1,
      benefit2: service.benefit2,
      ctaText: service.ctaText,
      ctaUrl: service.ctaUrl,
      sortOrder: service.sortOrder,
      heroImageFileId: heroImage?.fileId ?? null,
      heroImage: this.mapImage(heroImage) ?? null,
      galleryImageFileIds: galleryImages.map((img) => img.fileId),
      galleryImages: galleryImages.map((img) => this.mapImage(img)!),
      usedDeviceIds: service.devices.map((device) => device.deviceId),
      specialistIds: service.specialists.map((link) => link.specialistId),
      specialists: service.specialists.map((link) =>
        this.mapSpecialistSummary(link.specialist),
      ),
      servicePricesExtended: service.pricesExtended.map((price) => ({
        id: price.id,
        title: price.title,
        price: Number(price.price),
        durationMinutes: price.durationMinutes,
        type: price.type,
        sessionsCount: price.sessionsCount,
        order: price.order,
        isActive: price.isActive,
      })),
      seo: this.mapSeoEntity(service.seo),
    };
  }

  async listServices(params: { categoryId?: number } = {}) {
    const services = await this.app.prisma.service.findMany({
      where: {
        ...(params.categoryId !== undefined && {
          categoryId: params.categoryId,
        }),
      },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      include: {
        category: true,
        images: { include: { file: true } },
        devices: true,
        specialists: {
          include: { specialist: { include: { photo: true } } },
        },
        pricesExtended: { orderBy: { order: 'asc' } },
        seo: { include: { ogImage: true } },
      },
    });

    return services.map((service) => this.mapServiceResponse(service));
  }

  async getServiceById(id: number) {
    const service = await this.app.prisma.service.findUnique({
      where: { id },
      include: {
        category: true,
        images: { include: { file: true } },
        devices: true,
        specialists: {
          include: { specialist: { include: { photo: true } } },
        },
        pricesExtended: { orderBy: { order: 'asc' } },
        seo: { include: { ogImage: true } },
      },
    });

    if (!service) {
      throw this.app.httpErrors.notFound('Услуга не найдена');
    }

    return this.mapServiceResponse(service);
  }

  async updateService(id: number, body: ServiceBody) {
    return this.app.prisma.$transaction(async (tx) => {
      const existing = await tx.service.findUnique({ where: { id } });
      if (!existing) {
        throw this.app.httpErrors.notFound('Услуга не найдена');
      }

      let slugToUpdate: string | undefined;
      if (body.name !== undefined) {
        slugToUpdate = await this.generateEntitySlug(tx, 'service', body.name, id);
      }

      await tx.service.update({
        where: { id },
        data: {
          ...(body.categoryId !== undefined && { categoryId: body.categoryId }),
          ...(body.name !== undefined && { name: body.name }),
          ...(slugToUpdate && { slug: slugToUpdate }),
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

      // Специалисты: если массив передан — пересобираем связи
      if (body.specialistIds !== undefined) {
        await tx.serviceSpecialist.deleteMany({ where: { serviceId: id } });

        if (body.specialistIds?.length) {
          for (const specialistId of body.specialistIds) {
            await tx.serviceSpecialist.create({
              data: {
                serviceId: id,
                specialistId,
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
        await this.upsertServiceSeo(id, body.seo, tx);
      }

      const full = await tx.service.findUnique({
        where: { id },
        include: {
          pricesExtended: true,
          devices: { include: { device: true } },
          specialists: { include: { specialist: { include: { photo: true } } } },
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

  private async upsertDeviceSeo(
    deviceId: number,
    seo: SeoDeviceBody,
    db: PrismaClientLike = this.app.prisma,
  ) {
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

    await db.seoDevice.upsert({
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
    return this.app.prisma.$transaction(async (tx) => {
      const slug = await this.generateEntitySlug(
        tx,
        'device',
        `${body.brand} ${body.model}`,
      );
      const device = await tx.device.create({
        data: {
          brand: body.brand,
          model: body.model,
          slug,
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
        await this.upsertDeviceSeo(device.id, body.seo, tx);
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

  private mapDeviceResponse(device: Prisma.DeviceGetPayload<{
    include: {
      images: { include: { file: true } };
      seo: { include: { ogImage: true } };
    };
  }>) {
    const heroImage = device.images.find(
      (img) => img.purpose === ImagePurpose.HERO,
    );
    const galleryImages = device.images.filter(
      (img) => img.purpose === ImagePurpose.GALLERY,
    );

    return {
      id: device.id,
      slug: device.slug,
      brand: device.brand,
      model: device.model,
      positioning: device.positioning,
      principle: device.principle,
      safetyNotes: device.safetyNotes,
      heroImageFileId: heroImage?.fileId ?? null,
      heroImage: this.mapImage(heroImage) ?? null,
      galleryImageFileIds: galleryImages.map((img) => img.fileId),
      galleryImages: galleryImages.map((img) => this.mapImage(img)!),
      seo: this.mapSeoEntity(device.seo),
    };
  }

  async listDevices() {
    const devices = await this.app.prisma.device.findMany({
      orderBy: [{ brand: 'asc' }, { model: 'asc' }],
      include: {
        images: { include: { file: true } },
        seo: { include: { ogImage: true } },
      },
    });

    return devices.map((device) => this.mapDeviceResponse(device));
  }

  async getDeviceById(id: number) {
    const device = await this.app.prisma.device.findUnique({
      where: { id },
      include: {
        images: { include: { file: true } },
        seo: { include: { ogImage: true } },
      },
    });

    if (!device) {
      throw this.app.httpErrors.notFound('Аппарат не найден');
    }

    return this.mapDeviceResponse(device);
  }

  async updateDevice(id: number, body: DeviceBody) {
    return this.app.prisma.$transaction(async (tx) => {
      const existing = await tx.device.findUnique({ where: { id } });
      if (!existing) {
        throw this.app.httpErrors.notFound('Аппарат не найден');
      }

      let slugToUpdate: string | undefined;
      if (body.brand !== undefined || body.model !== undefined) {
        const brand = body.brand ?? existing.brand;
        const model = body.model ?? existing.model;
        slugToUpdate = await this.generateEntitySlug(
          tx,
          'device',
          `${brand} ${model}`,
          id,
        );
      }

      await tx.device.update({
        where: { id },
        data: {
          ...(body.brand !== undefined && { brand: body.brand }),
          ...(body.model !== undefined && { model: body.model }),
          ...(slugToUpdate && { slug: slugToUpdate }),
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
        await this.upsertDeviceSeo(id, body.seo, tx);
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

  /* ===================== SPECIALISTS ===================== */

  private mapSpecialistResponse(
    specialist: Prisma.SpecialistGetPayload<{
      include: {
        photo: true;
        services: { include: { service: true } };
      };
    }>,
  ) {
    return {
      id: specialist.id,
      firstName: specialist.firstName,
      lastName: specialist.lastName,
      specialization: specialist.specialization,
      biography: specialist.biography,
      experienceYears: specialist.experienceYears,
      photoFileId: specialist.photoFileId,
      photo: this.mapFile(specialist.photo),
      serviceIds: specialist.services.map((link) => link.serviceId),
      services: specialist.services.map((link) => ({
        id: link.service.id,
        slug: link.service.slug,
        name: link.service.name,
        shortOffer: link.service.shortOffer,
      })),
    };
  }

  async listSpecialists() {
    const specialists = await this.app.prisma.specialist.findMany({
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }, { id: 'asc' }],
      include: {
        photo: true,
        services: { include: { service: true } },
      },
    });

    return specialists.map((specialist) =>
      this.mapSpecialistResponse(specialist),
    );
  }

  async getSpecialistById(id: number) {
    const specialist = await this.app.prisma.specialist.findUnique({
      where: { id },
      include: {
        photo: true,
        services: { include: { service: true } },
      },
    });

    if (!specialist) {
      throw this.app.httpErrors.notFound('Специалист не найден');
    }

    return this.mapSpecialistResponse(specialist);
  }

  async createSpecialist(body: SpecialistBody) {
    return this.app.prisma.$transaction(async (tx) => {
      const specialist = await tx.specialist.create({
        data: {
          firstName: body.firstName,
          lastName: body.lastName,
          specialization: body.specialization,
          biography: body.biography,
          experienceYears: body.experienceYears,
          photoFileId: body.photoFileId,
        },
      });

      if (body.serviceIds?.length) {
        for (const serviceId of body.serviceIds) {
          await tx.serviceSpecialist.create({
            data: {
              serviceId,
              specialistId: specialist.id,
            },
          });
        }
      }

      const full = await tx.specialist.findUnique({
        where: { id: specialist.id },
        include: {
          photo: true,
          services: { include: { service: true } },
        },
      });

      return this.mapSpecialistResponse(full!);
    });
  }

  async updateSpecialist(id: number, body: SpecialistBody) {
    return this.app.prisma.$transaction(async (tx) => {
      const existing = await tx.specialist.findUnique({ where: { id } });
      if (!existing) {
        throw this.app.httpErrors.notFound('Специалист не найден');
      }

      await tx.specialist.update({
        where: { id },
        data: {
          ...(body.firstName !== undefined && { firstName: body.firstName }),
          ...(body.lastName !== undefined && { lastName: body.lastName }),
          ...(body.specialization !== undefined && {
            specialization: body.specialization,
          }),
          ...(body.biography !== undefined && { biography: body.biography }),
          ...(body.experienceYears !== undefined && {
            experienceYears: body.experienceYears,
          }),
          ...(body.photoFileId !== undefined && {
            photoFileId: body.photoFileId,
          }),
        },
      });

      if (body.serviceIds !== undefined) {
        await tx.serviceSpecialist.deleteMany({
          where: { specialistId: id },
        });

        if (body.serviceIds?.length) {
          for (const serviceId of body.serviceIds) {
            await tx.serviceSpecialist.create({
              data: {
                serviceId,
                specialistId: id,
              },
            });
          }
        }
      }

      const full = await tx.specialist.findUnique({
        where: { id },
        include: {
          photo: true,
          services: { include: { service: true } },
        },
      });

      return this.mapSpecialistResponse(full!);
    });
  }

  async deleteSpecialist(id: number) {
    await this.app.prisma.specialist.delete({ where: { id } });
  }
}
