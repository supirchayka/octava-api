// src/services/catalog.service.ts
import type { FastifyInstance } from "fastify";
import { ImagePurpose } from "@prisma/client";
import { buildFileUrl } from "../utils/files";

export class CatalogService {
  constructor(private app: FastifyInstance) {}

  // ===== helpers =====

  private mapSeo(seo: any | null) {
    if (!seo) return null;

    const ogImage = this.mapFileMeta(seo.ogImage);

    return {
      metaTitle: seo.metaTitle,
      metaDescription: seo.metaDescription,
      canonicalUrl: seo.canonicalUrl,
      robotsIndex: seo.robotsIndex,
      robotsFollow: seo.robotsFollow,
      ogTitle: seo.ogTitle,
      ogDescription: seo.ogDescription,
      ogImage: ogImage
        ? {
            ...ogImage,
            alt: seo.ogImage?.originalName ?? null,
          }
        : null,
    };
  }

  private mapFileMeta(file: any | null) {
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

  private mapImage(image: any | null) {
    if (!image || !image.file) return null;

    const file = this.mapFileMeta(image.file);
    if (!file) return null;

    return {
      id: image.id,
      fileId: image.fileId,
      purpose: image.purpose,
      order: image.order,
      alt: image.alt ?? image.file.originalName,
      caption: image.caption ?? null,
      url: file.url,
      file,
    };
  }

  // ===================== УСЛУГИ =====================

  /**
   * Список категорий услуг с количеством услуг в каждой.
   */
  async getServiceCategories() {
    const categories = await this.app.prisma.serviceCategory.findMany({
      orderBy: [
        { sortOrder: "asc" },
        { name: "asc" },
      ],
      include: {
        images: {
          include: { file: true },
          orderBy: { order: "asc" },
        },
        seo: {
          include: { ogImage: true },
        },
        _count: {
          select: { services: true },
        },
      },
    });

    return categories.map((c) => {
      const heroImage = c.images.find((img: any) => img.purpose === ImagePurpose.HERO);
      const galleryImages = c.images
        .filter((img: any) => img.purpose === ImagePurpose.GALLERY)
        .map((img: any) => this.mapImage(img)!)
        .filter(Boolean);

      return {
        id: c.id,
        slug: c.slug,
        name: c.name,
        description: c.description,
        sortOrder: c.sortOrder,
        servicesCount: c._count.services,
        seo: this.mapSeo(c.seo),
        heroImage: this.mapImage(heroImage) ?? null,
        galleryImages,
      };
    });
  }

  /**
   * Страница категории услуг: сама категория + список услуг + SEO.
   */
  async getServiceCategoryBySlug(slug: string) {
    const category = await this.app.prisma.serviceCategory.findUnique({
      where: { slug },
      include: {
        images: {
          include: { file: true },
          orderBy: { order: "asc" },
        },
        seo: {
          include: { ogImage: true },
        },
      },
    });

    if (!category) {
      return null;
    }

    const services = await this.app.prisma.service.findMany({
      where: { categoryId: category.id },
      orderBy: { name: "asc" },
    });

    const servicesMapped = services.map((s) => ({
      id: s.id,
      slug: s.slug,
      name: s.name,
      shortOffer: s.shortOffer,
      priceFrom: s.priceFrom?.toString() ?? null,
      durationMinutes: s.durationMinutes,
      benefits: [s.benefit1, s.benefit2].filter(Boolean),
      ctaText: s.ctaText,
      ctaUrl: s.ctaUrl,
    }));

    const heroImage = category.images.find((img) => img.purpose === ImagePurpose.HERO);
    const galleryImages = category.images
      .filter((img) => img.purpose === ImagePurpose.GALLERY)
      .map((img) => this.mapImage(img)!)
      .filter(Boolean);

    return {
      category: {
        id: category.id,
        slug: category.slug,
        name: category.name,
        description: category.description,
        sortOrder: category.sortOrder,
        heroImage: this.mapImage(heroImage) ?? null,
        galleryImages,
      },
      seo: this.mapSeo(category.seo),
      services: servicesMapped,
    };
  }

  /**
   * Детальная страница услуги по slug.
   */
  async getServiceBySlug(slug: string) {
    const service = await this.app.prisma.service.findUnique({
      where: { slug },
      include: {
        category: true,
      },
    });

    if (!service) {
      return null;
    }

    const [
      seo,
      details,
      pricesExtended,
      indications,
      contraindications,
      prepSteps,
      rehabSteps,
      faq,
      legalDisclaimer,
      deviceLinks,
      images,
    ] = await Promise.all([
      this.app.prisma.seoService.findUnique({
        where: { serviceId: service.id },
        include: { ogImage: true },
      }),
      this.app.prisma.serviceDetails.findUnique({
        where: { serviceId: service.id },
      }),
      this.app.prisma.servicePriceExtended.findMany({
        where: { serviceId: service.id, isActive: true },
        orderBy: { order: "asc" },
      }),
      this.app.prisma.serviceIndication.findMany({
        where: { serviceId: service.id },
        orderBy: { id: "asc" },
      }),
      this.app.prisma.serviceContraindication.findMany({
        where: { serviceId: service.id },
        orderBy: { id: "asc" },
      }),
      this.app.prisma.servicePreparationStep.findMany({
        where: { serviceId: service.id },
        orderBy: { order: "asc" },
      }),
      this.app.prisma.serviceRehabStep.findMany({
        where: { serviceId: service.id },
        orderBy: { order: "asc" },
      }),
      this.app.prisma.serviceFaq.findMany({
        where: { serviceId: service.id },
        orderBy: { order: "asc" },
      }),
      this.app.prisma.serviceLegalDisclaimer.findFirst({
        where: { serviceId: service.id },
      }),
      this.app.prisma.serviceDevice.findMany({
        where: { serviceId: service.id },
        include: {
          device: true,
        },
      }),
      this.app.prisma.serviceImage.findMany({
        where: { serviceId: service.id },
        orderBy: { order: "asc" },
        include: {
          file: true,
        },
      }),
    ]);

    const heroImages = images
      .filter((img) => img.purpose === ImagePurpose.HERO)
      .map((img) => this.mapImage(img)!)
      .filter(Boolean);

    const galleryImages = images
      .filter((img) => img.purpose === ImagePurpose.GALLERY)
      .map((img) => this.mapImage(img)!)
      .filter(Boolean);

    const inlineImages = images
      .filter((img) => img.purpose === ImagePurpose.INLINE)
      .map((img) => this.mapImage(img)!)
      .filter(Boolean);

    const devices = deviceLinks.map((link) => ({
      id: link.device.id,
      slug: link.device.slug,
      brand: link.device.brand,
      model: link.device.model,
      positioning: link.device.positioning,
    }));

    return {
      service: {
        id: service.id,
        slug: service.slug,
        name: service.name,
        category: {
          id: service.category.id,
          slug: service.category.slug,
          name: service.category.name,
        },
      },
      seo: this.mapSeo(seo),
      hero: {
        title: service.name,
        shortOffer: service.shortOffer,
        priceFrom: service.priceFrom?.toString() ?? null,
        durationMinutes: service.durationMinutes,
        benefits: [service.benefit1, service.benefit2].filter(Boolean),
        ctaText: service.ctaText,
        ctaUrl: service.ctaUrl,
        images: heroImages,
      },
      about: details
        ? {
            whoIsFor: details.whoIsFor,
            effect: details.effect,
            principle: details.principle,
            resultsTiming: details.resultsTiming,
            courseSessions: details.courseSessions,
          }
        : null,
      pricesExtended: pricesExtended.map((p) => ({
        id: p.id,
        title: p.title,
        price: p.price.toString(),
        durationMinutes: p.durationMinutes,
        type: p.type,
        order: p.order,
      })),
      indications: indications.map((i) => i.text),
      contraindications: contraindications.map((c) => c.text),
      preparationChecklist: prepSteps.map((s) => ({
        id: s.id,
        text: s.text,
        order: s.order,
      })),
      rehabChecklist: rehabSteps.map((s) => ({
        id: s.id,
        text: s.text,
        order: s.order,
      })),
      devices,
      galleryImages,
      inlineImages,
      faq: faq.map((q) => ({
        id: q.id,
        question: q.question,
        answer: q.answer,
        order: q.order,
      })),
      legalDisclaimer: legalDisclaimer?.text ?? null,
    };
  }

  // ===================== АППАРАТЫ =====================

  /**
   * Листинг аппаратов (для общей страницы /devices).
   */
  async getDevicesList() {
    const devices = await this.app.prisma.device.findMany({
      orderBy: [
        { brand: "asc" },
        { model: "asc" },
      ],
      include: {
        images: {
          where: { purpose: ImagePurpose.HERO },
          orderBy: { order: "asc" },
          take: 1,
          include: { file: true },
        },
      },
    });

    return devices.map((d) => ({
      id: d.id,
      slug: d.slug,
      brand: d.brand,
      model: d.model,
      positioning: d.positioning,
      heroImage: this.mapImage(d.images[0]) ?? null,
    }));
  }

  /**
   * Детальная страница аппарата по slug.
   */
  async getDeviceBySlug(slug: string) {
    const device = await this.app.prisma.device.findUnique({
      where: { slug },
    });

    if (!device) {
      return null;
    }

    const [
      seo,
      certBadges,
      attachments,
      indications,
      contraindications,
      sideEffects,
      documents,
      faq,
      images,
      serviceLinks,
    ] = await Promise.all([
      this.app.prisma.seoDevice.findUnique({
        where: { deviceId: device.id },
        include: { ogImage: true },
      }),
      this.app.prisma.deviceCertBadge.findMany({
        where: { deviceId: device.id },
        include: {
          image: true,
          file: true,
        },
      }),
      this.app.prisma.deviceAttachment.findMany({
        where: { deviceId: device.id },
        include: {
          image: true,
        },
      }),
      this.app.prisma.deviceIndication.findMany({
        where: { deviceId: device.id },
        orderBy: { id: "asc" },
      }),
      this.app.prisma.deviceContraindication.findMany({
        where: { deviceId: device.id },
        orderBy: { id: "asc" },
      }),
      this.app.prisma.deviceSideEffect.findMany({
        where: { deviceId: device.id },
        orderBy: { id: "asc" },
      }),
      this.app.prisma.deviceDocument.findMany({
        where: { deviceId: device.id },
        include: {
          file: true,
        },
      }),
      this.app.prisma.deviceFaq.findMany({
        where: { deviceId: device.id },
        orderBy: { order: "asc" },
      }),
      this.app.prisma.deviceImage.findMany({
        where: { deviceId: device.id },
        orderBy: { order: "asc" },
        include: {
          file: true,
        },
      }),
      this.app.prisma.serviceDevice.findMany({
        where: { deviceId: device.id },
        include: {
          service: true,
        },
      }),
    ]);

    const heroImages = images
      .filter((img) => img.purpose === ImagePurpose.HERO)
      .map((img) => this.mapImage(img)!)
      .filter(Boolean);

    const galleryImages = images
      .filter((img) => img.purpose === ImagePurpose.GALLERY)
      .map((img) => this.mapImage(img)!)
      .filter(Boolean);

    const inlineImages = images
      .filter((img) => img.purpose === ImagePurpose.INLINE)
      .map((img) => this.mapImage(img)!)
      .filter(Boolean);

    const certs = certBadges.map((c) => ({
      id: c.id,
      type: c.type,
      label: c.label,
      image: this.mapFileMeta(c.image),
      file: this.mapFileMeta(c.file),
    }));

    const docs = documents.map((d) => ({
      id: d.id,
      docType: d.docType,
      title: d.title,
      issuedBy: d.issuedBy,
      issuedAt: d.issuedAt,
      file: this.mapFileMeta(d.file),
    }));

    const services = serviceLinks.map((link) => ({
      id: link.service.id,
      slug: link.service.slug,
      name: link.service.name,
      shortOffer: link.service.shortOffer,
      priceFrom: link.service.priceFrom?.toString() ?? null,
    }));

    return {
      device: {
        id: device.id,
        slug: device.slug,
        brand: device.brand,
        model: device.model,
        positioning: device.positioning,
        principle: device.principle,
        safetyNotes: device.safetyNotes,
      },
      seo: this.mapSeo(seo),
      hero: {
        brand: device.brand,
        model: device.model,
        positioning: device.positioning,
        certBadges: certs,
        images: heroImages,
      },
      galleryImages,
      inlineImages,
      attachments: attachments.map((a) => ({
        id: a.id,
        name: a.name,
        description: a.description,
        image: this.mapFileMeta(a.image),
      })),
      indications: indications.map((i) => i.text),
      contraindications: contraindications.map((c) => c.text),
      sideEffects: sideEffects.map((s) => ({
        id: s.id,
        text: s.text,
        rarity: s.rarity,
      })),
      documents: docs,
      faq: faq.map((q) => ({
        id: q.id,
        question: q.question,
        answer: q.answer,
        order: q.order,
      })),
      services,
    };
  }
}
