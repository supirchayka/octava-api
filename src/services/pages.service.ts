// src/services/pages.service.ts
import type { FastifyInstance } from "fastify";
import { StaticPageType, DayGroup, ImagePurpose } from "@prisma/client";
import { buildFileUrl, isSeedFilePath } from "../utils/files";

export class PagesService {
  constructor(private app: FastifyInstance) {}

  // ===== helpers =====

  private mapSeo(seo: any | null) {
    if (!seo) return null;

    return {
      metaTitle: seo.metaTitle,
      metaDescription: seo.metaDescription,
      canonicalUrl: seo.canonicalUrl,
      robotsIndex: seo.robotsIndex,
      robotsFollow: seo.robotsFollow,
      ogTitle: seo.ogTitle,
      ogDescription: seo.ogDescription,
      ogImage: seo.ogImage
        ? {
            url: buildFileUrl(seo.ogImage.path),
            mime: seo.ogImage.mime,
            width: seo.ogImage.width,
            height: seo.ogImage.height,
            alt: seo.ogImage.originalName,
          }
        : null,
    };
  }

  private minutesToTimeString(minutes: number | null): string | null {
    if (minutes == null) return null;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  }

  private dayGroupLabel(group: DayGroup): string {
    switch (group) {
      case DayGroup.WEEKDAYS:
        return "Пн–Пт";
      case DayGroup.SATURDAY:
        return "Суббота";
      case DayGroup.SUNDAY:
        return "Воскресенье";
      default:
        return String(group);
    }
  }

  // ===== HOME (/pages/home) =====

  async getHome() {
    const page = await this.app.prisma.staticPage.findUnique({
      where: { type: StaticPageType.HOME },
      include: {
        home: {
          include: {
            directions: {
              orderBy: { order: "asc" },
              include: {
                service: {
                  include: {
                    category: {
                      include: {
                        images: {
                          include: { file: true },
                        },
                      },
                    },
                  },
                },
              },
            },
            gallery: {
              orderBy: { order: "asc" },
              include: {
                file: true,
              },
            },
            subheroImage: true,
          },
        },
        seo: {
          include: {
            ogImage: true,
          },
        },
      },
    });

    if (!page || !page.home) return null;

    const directions = page.home.directions
      .map((d) => {
        const category = d.service?.category;
        if (!category) return null;

        const heroImage = category.images?.find(
          (img: any) => img.purpose === ImagePurpose.HERO,
        );

        return {
          id: category.id,
          slug: category.slug,
          name: category.name,
          description: category.description,
          heroImage:
            heroImage && heroImage.file
              ? {
                  id: heroImage.id,
                  url: buildFileUrl(heroImage.file.path),
                  mime: heroImage.file.mime,
                  width: heroImage.file.width,
                  height: heroImage.file.height,
                  alt: heroImage.alt ?? heroImage.file.originalName,
                }
              : null,
        };
      })
      .filter(Boolean);

    const heroImagesSource = page.home.gallery.filter(
      (g) => g.purpose === ImagePurpose.HERO,
    );
    const hasNonSeedHero = heroImagesSource.some(
      (g) => g.file && !isSeedFilePath(g.file.path),
    );

    const heroImages = heroImagesSource
      .filter((g) => (hasNonSeedHero ? !isSeedFilePath(g.file?.path) : true))
      .map((g) => ({
        id: g.id,
        url: buildFileUrl(g.file.path),
        alt: g.alt ?? g.file.originalName,
        caption: g.caption,
        order: g.order,
      }));

    const interiorImagesSource = page.home.gallery.filter(
      (g) => g.purpose === ImagePurpose.GALLERY,
    );
    const hasNonSeedInterior = interiorImagesSource.some(
      (g) => g.file && !isSeedFilePath(g.file.path),
    );

    const interiorImages = interiorImagesSource
      .filter((g) =>
        hasNonSeedInterior ? !isSeedFilePath(g.file?.path) : true,
      )
      .map((g) => ({
        id: g.id,
        url: buildFileUrl(g.file.path),
        alt: g.alt ?? g.file.originalName,
        caption: g.caption,
        order: g.order,
      }));

    return {
      page: {
        type: page.type,
        slug: page.slug,
      },
      seo: this.mapSeo(page.seo),
      hero: {
        title: page.home.heroTitle,
        subtitle: page.home.heroSubtitle,
        ctaText: page.home.heroCtaText,
        ctaUrl: page.home.heroCtaUrl,
        images: heroImages,
      },
      directions,
      subHero: {
        title: page.home.subheroTitle,
        subtitle: page.home.subheroSubtitle,
        image: page.home.subheroImage
          ? {
              id: page.home.subheroImage.id,
              url: buildFileUrl(page.home.subheroImage.path),
              mime: page.home.subheroImage.mime,
              width: page.home.subheroImage.width,
              height: page.home.subheroImage.height,
              alt: page.home.subheroImage.originalName,
            }
          : null,
      },
      interior: {
        text: page.home.interiorText,
        images: interiorImages,
      },
    };
  }

  // ===== ABOUT (/pages/about) =====

  async getAbout() {
    const page = await this.app.prisma.staticPage.findUnique({
      where: { type: StaticPageType.ABOUT },
      include: {
        about: {
          include: {
            trustItems: {
              include: {
                image: true,
                file: true,
              },
            },
            facts: {
              orderBy: { order: "asc" },
            },
            heroCta: true,
            heroImage: true,
          },
        },
        seo: {
          include: {
            ogImage: true,
          },
        },
      },
    });

    if (!page || !page.about) return null;

    const trust = page.about.trustItems.map((t) => ({
      id: t.id,
      kind: t.kind,
      title: t.title,
      number: t.number,
      issuedAt: t.issuedAt,
      issuedBy: t.issuedBy,
      image: t.image
        ? {
            id: t.image.id,
            url: buildFileUrl(t.image.path),
            alt: t.image.originalName,
          }
        : null,
      file: t.file
        ? {
            id: t.file.id,
            url: buildFileUrl(t.file.path),
            mime: t.file.mime,
            name: t.file.originalName,
          }
        : null,
    }));

    const facts = page.about.facts.map((f) => ({
      id: f.id,
      title: f.title,
      text: f.text,
      order: f.order,
    }));

    const heroCta = page.about.heroCta
      ? {
          title: page.about.heroCta.title,
          subtitle: page.about.heroCta.subtitle,
        }
      : null;

    return {
      page: {
        type: page.type,
        slug: page.slug,
      },
      seo: this.mapSeo(page.seo),
      hero: {
        title: page.about.heroTitle,
        description: page.about.heroDescription,
        image: page.about.heroImage
          ? {
              id: page.about.heroImage.id,
              url: buildFileUrl(page.about.heroImage.path),
              mime: page.about.heroImage.mime,
              width: page.about.heroImage.width,
              height: page.about.heroImage.height,
              alt: page.about.heroImage.originalName,
            }
          : null,
      },
      trustItems: trust,
      howWeAchieve: page.about.howWeAchieveText,
      facts,
      heroCta,
    };
  }

  // ===== CONTACTS (/pages/contacts) =====

  async getContacts() {
    const page = await this.app.prisma.staticPage.findUnique({
      where: { type: StaticPageType.CONTACTS },
      include: {
        contacts: {
          include: {
            workingHours: true,
            metroStations: true,
          },
        },
        seo: {
          include: {
            ogImage: true,
          },
        },
      },
    });

    if (!page || !page.contacts) return null;

    const schedule = page.contacts.workingHours.map((wh) => ({
      id: wh.id,
      group: wh.dayGroup,
      label: this.dayGroupLabel(wh.dayGroup),
      isClosed: wh.isClosed,
      open: this.minutesToTimeString(wh.openMinutes),
      close: this.minutesToTimeString(wh.closeMinutes),
    }));

    const metro = page.contacts.metroStations.map((m) => ({
      id: m.id,
      name: m.name,
      distanceMeters: m.distanceMeters,
      line: m.line,
    }));

    return {
      page: {
        type: page.type,
        slug: page.slug,
      },
      seo: this.mapSeo(page.seo),
      contacts: {
        phone: page.contacts.phoneMain,
        email: page.contacts.email,
        telegramUrl: page.contacts.telegramUrl,
        whatsappUrl: page.contacts.whatsappUrl,
        address: page.contacts.addressText,
        yandexMapUrl: page.contacts.yandexMapUrl,
        workingHours: schedule,
        metroStations: metro,
      },
    };
  }

  // ===== ORG INFO (/pages/org-info) =====

  async getOrgInfo() {
    const page = await this.app.prisma.staticPage.findUnique({
      where: { type: StaticPageType.ORG_INFO },
      include: {
        seo: {
          include: {
            ogImage: true,
          },
        },
      },
    });

    // Берём первую организацию (по ТЗ — одна)
    const org = await this.app.prisma.organization.findFirst({
      include: {
        phones: true,
        licenses: {
          include: {
            file: true,
          },
        },
        documents: true,
        certificates: {
          include: {
            file: true,
          },
        },
      },
      orderBy: { id: "asc" },
    });

    if (!page || !org) return null;

    return {
      page: {
        type: page.type,
        slug: page.slug,
      },
      seo: this.mapSeo(page.seo),
      organization: {
        fullName: org.fullName,
        ogrn: org.ogrn,
        inn: org.inn,
        kpp: org.kpp,
        address: org.address,
        email: org.email,
        phones: org.phones.map((p) => ({
          type: p.type,
          number: p.number,
          isPrimary: p.isPrimary,
        })),
      },
      licenses: org.licenses.map((lic) => ({
        id: lic.id,
        number: lic.licenseNumber,
        issuedAt: lic.issuedAt,
        issuedBy: lic.issuedBy,
        file: lic.file
          ? {
              id: lic.file.id,
              url: buildFileUrl(lic.file.path),
              mime: lic.file.mime,
              name: lic.file.originalName,
            }
          : null,
      })),
      documents: org.documents.map((doc) => ({
        id: doc.id,
        type: doc.docType,
        title: doc.title,
        htmlBody: doc.htmlBody,
        publishedAt: doc.publishedAt,
      })),
      certificates: org.certificates.map((c) => ({
        id: c.id,
        title: c.title,
        issuedBy: c.issuedBy,
        issuedAt: c.issuedAt,
        file: c.file
          ? {
              id: c.file.id,
              url: buildFileUrl(c.file.path),
              mime: c.file.mime,
              name: c.file.originalName,
            }
          : null,
      })),
    };
  }

  // ===== Политики (/pages/personal-data-policy, /pages/privacy-policy) =====

  private async getPolicyByType(type: StaticPageType) {
    const page = await this.app.prisma.staticPage.findUnique({
      where: { type },
      include: {
        policy: true,
        seo: {
          include: {
            ogImage: true,
          },
        },
      },
    });

    if (!page || !page.policy) return null;

    return {
      page: {
        type: page.type,
        slug: page.slug,
      },
      seo: this.mapSeo(page.seo),
      policy: {
        title: page.policy.title,
        body: page.policy.body,
      },
    };
  }

  async getPersonalDataPolicy() {
    return this.getPolicyByType(StaticPageType.PERSONAL_DATA_POLICY);
  }

  async getPrivacyPolicy() {
    return this.getPolicyByType(StaticPageType.PRIVACY_POLICY);
  }
}
