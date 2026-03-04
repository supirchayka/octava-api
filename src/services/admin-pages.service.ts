// src/services/admin-pages.service.ts
import type { FastifyInstance } from 'fastify';
import {
  DayGroup,
  FileKind,
  ImagePurpose,
  StaticPageType,
  TrustItemKind,
} from '@prisma/client';
import { buildFileUrl, isSeedFilePath } from '../utils/files';

export interface SeoBody {
  metaTitle?: string | null;
  metaDescription?: string | null;
  canonicalUrl?: string | null;
  robotsIndex?: boolean;
  robotsFollow?: boolean;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImageId?: number | null;
}

export interface FileSummary {
  id: number;
  path: string;
  mime: string;
  originalName: string;
  sizeBytes?: number | null;
}

export interface HomeHeroImageInput {
  fileId: number;
  alt?: string | null;
  caption?: string | null;
  order?: number | null;
  file?: FileSummary | null;
}

export interface HomeInteriorImageInput {
  fileId: number;
  alt?: string | null;
  caption?: string | null;
  order?: number | null;
  file?: FileSummary | null;
}

export interface HomeDirectionInput {
  categoryId: number;
  order?: number | null;
  category?: {
    id: number;
    slug: string;
    name: string;
    description?: string | null;
  } | null;
}

export interface HomePageBody {
  heroTitle?: string | null;
  heroSubtitle?: string | null;
  heroCtaText?: string | null;
  heroCtaUrl?: string | null;
  subheroTitle?: string | null;
  subheroSubtitle?: string | null;
  subheroImageFileId?: number | null;
  subheroImage?: FileSummary | null;
  interiorText?: string | null;
  heroImages?: HomeHeroImageInput[];
  interiorImages?: HomeInteriorImageInput[];
  directions?: HomeDirectionInput[];
  seo?: SeoBody;
}

interface AdminHomeHeroImage {
  id: number;
  fileId: number;
  url: string;
  alt: string | null;
  caption: string | null;
  order: number | null;
}

interface AdminHomeResponse {
  hero: {
    title: string | null;
    subtitle: string | null;
    ctaText: string | null;
    ctaUrl: string | null;
    images: AdminHomeHeroImage[];
  };
  subHero: {
    title: string | null;
    subtitle: string | null;
    image: (FileSummary & { url: string }) | null;
  };
  interior: {
    text: string | null;
    images: AdminHomeHeroImage[];
  };
  directions: HomeDirectionInput[];
  seo: SeoBody | null;
}

export interface AboutFactInput {
  id?: number;
  title?: string | null;
  text?: string | null;
  order?: number | null;
}

export interface AboutTrustItemInput {
  id?: number;
  kind?: TrustItemKind | null;
  title?: string | null;
  number?: string | null;
  issuedAt?: string | null;
  issuedBy?: string | null;
  fileId?: number | null;
}

export interface AboutPageBody {
  heroTitle?: string | null;
  heroDescription?: string | null;
  howWeAchieveText?: string | null;
  heroBadgeText?: string | null;
  heroCardText?: string | null;
  howWeAchieveTitle?: string | null;
  howWeAchieveCardText?: string | null;
  factsSectionTitle?: string | null;
  trustSectionTitle?: string | null;
  trustSectionSubtitle?: string | null;
  // hero CTA — отдельная модель AboutHeroCта
  heroCtaTitle?: string | null;
  heroCtaSubtitle?: string | null;
  heroImageFileId?: number | null;
  heroImage?: FileSummary | null;
  facts?: AboutFactInput[];
  trustItems?: AboutTrustItemInput[];
  seo?: SeoBody;
}

export interface ContactsWorkingHourInput {
  id?: number;
  group: DayGroup;
  open?: string | null;
  close?: string | null;
  isClosed?: boolean;
}

export interface ContactsMetroStationInput {
  id?: number;
  name: string;
  distanceMeters?: number | null;
  line?: string | null;
}

export interface ContactsPageBody {
  phoneMain?: string | null;
  email?: string | null;
  telegramUrl?: string | null;
  whatsappUrl?: string | null;
  maxMessengerUrl?: string | null;
  addressText?: string | null;
  yandexMapUrl?: string | null;
  workingHours?: ContactsWorkingHourInput[];
  metroStations?: ContactsMetroStationInput[];
  seo?: SeoBody;
}

export interface PolicyPageBody {
  title?: string | null;
  body?: string | null;
  seo?: SeoBody;
}

export interface PricesPageBody {
  priceListFileId?: number | null;
  seo?: SeoBody;
}

/**
 * Админ-управление статическими страницами и их SEO.
 */
export class AdminPagesService {
  constructor(private app: FastifyInstance) {}

  private ensureStaticPage(type: StaticPageType) {
    return this.app.prisma.staticPage.findUniqueOrThrow({
      where: { type },
    });
  }

  private mapSeoResponse(seo: any | null) {
    if (!seo) return null;
    return {
      metaTitle: seo.metaTitle,
      metaDescription: seo.metaDescription,
      canonicalUrl: seo.canonicalUrl,
      robotsIndex: seo.robotsIndex,
      robotsFollow: seo.robotsFollow,
      ogTitle: seo.ogTitle,
      ogDescription: seo.ogDescription,
      ogImageId: seo.ogImageId,
    } as SeoBody;
  }

  private timeStringToMinutes(value?: string | null) {
    if (!value) return null;
    const [hoursStr, minutesStr] = value.split(':');
    const hours = Number.parseInt(hoursStr, 10);
    const minutes = Number.parseInt(minutesStr, 10);

    if (
      Number.isNaN(hours) ||
      Number.isNaN(minutes) ||
      hours < 0 ||
      hours > 23 ||
      minutes < 0 ||
      minutes > 59
    ) {
      throw this.app.httpErrors.badRequest(
        'Время должно быть в формате HH:MM (00-23:00-59)',
      );
    }

    return hours * 60 + minutes;
  }

  private minutesToTimeString(value?: number | null) {
    if (value == null) return null;
    const hours = Math.floor(value / 60)
      .toString()
      .padStart(2, '0');
    const minutes = (value % 60)
      .toString()
      .padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  private async normalizeSeoOgImageId(ogImageId: number | null | undefined) {
    if (ogImageId === undefined) {
      return undefined;
    }

    if (ogImageId === null) {
      return null;
    }

    if (!Number.isInteger(ogImageId) || ogImageId <= 0) {
      return null;
    }

    const id = ogImageId;
    const file = await this.app.prisma.file.findUnique({
      where: { id },
      select: { id: true, kind: true },
    });

    if (!file || file.kind !== FileKind.IMAGE) {
      return null;
    }

    return file.id;
  }

  /**
   * Общий апсерт SEO-настроек для статической страницы
   */
  private async upsertSeo(pageId: number, seo?: SeoBody) {
    if (!seo) return;
    const normalizedOgImageId = await this.normalizeSeoOgImageId(seo.ogImageId);

    // В update не трогаем поля, которые не пришли
    const updateData: any = {};
    if (seo.metaTitle !== undefined) {
      // в модели поле not null, поэтому null превращаем в пустую строку
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
    if (normalizedOgImageId !== undefined) {
      updateData.ogImageId = normalizedOgImageId;
    }

    await this.app.prisma.seoStaticPage.upsert({
      where: { pageId },
      update: updateData,
      create: {
        pageId,
        metaTitle:
          seo.metaTitle ??
          'Клиника OCTAVA — антивозрастная и эстетическая медицина',
        metaDescription:
          seo.metaDescription ??
          'Клиника OCTAVA в Москве. Антивозрастная и эстетическая медицина, аппаратные и инъекционные методики.',
        canonicalUrl: seo.canonicalUrl ?? null,
        robotsIndex: seo.robotsIndex ?? true,
        robotsFollow: seo.robotsFollow ?? true,
        ogTitle: seo.ogTitle ?? null,
        ogDescription: seo.ogDescription ?? null,
        ogImageId: normalizedOgImageId ?? null,
      },
    });
  }

  /* ===================== HOME ===================== */

  async getHomePage(): Promise<AdminHomeResponse> {
    const page = await this.app.prisma.staticPage.findUnique({
      where: { type: StaticPageType.HOME },
      include: {
        home: {
          include: {
            directions: {
              orderBy: { order: 'asc' },
              include: {
                category: true,
              },
            },
            gallery: {
              orderBy: { order: 'asc' },
              include: {
                file: true,
              },
            },
            subheroImage: true,
          },
        },
        seo: true,
      },
    });

    if (!page) {
      throw this.app.httpErrors.notFound('Страница HOME не найдена');
    }

    const heroImagesSource =
      page.home?.gallery.filter((img) => img.purpose === ImagePurpose.HERO) ??
      [];
    const hasNonSeedHero = heroImagesSource.some(
      (img) => img.file && !isSeedFilePath(img.file.path),
    );

    const heroImages: AdminHomeHeroImage[] = heroImagesSource
      .filter((img) => (hasNonSeedHero ? !isSeedFilePath(img.file?.path) : true))
      .map((img) => ({
        id: img.id,
        fileId: img.fileId,
        url: img.file ? buildFileUrl(img.file.path) : '',
        alt: img.alt ?? img.file?.originalName ?? null,
        caption: img.caption ?? null,
        order: img.order,
      }));

    const interiorImagesSource =
      page.home?.gallery.filter((img) => img.purpose === ImagePurpose.GALLERY) ??
      [];
    const hasNonSeedInterior = interiorImagesSource.some(
      (img) => img.file && !isSeedFilePath(img.file.path),
    );

    const interiorImages: AdminHomeHeroImage[] = interiorImagesSource
      .filter((img) =>
        hasNonSeedInterior ? !isSeedFilePath(img.file?.path) : true,
      )
      .map((img) => ({
        id: img.id,
        fileId: img.fileId,
        url: img.file ? buildFileUrl(img.file.path) : '',
        alt: img.alt ?? img.file?.originalName ?? null,
        caption: img.caption ?? null,
        order: img.order,
      }));

    return {
      hero: {
        title: page.home?.heroTitle ?? null,
        subtitle: page.home?.heroSubtitle ?? null,
        ctaText: page.home?.heroCtaText ?? null,
        ctaUrl: page.home?.heroCtaUrl ?? null,
        images: heroImages,
      },
      subHero: {
        title: page.home?.subheroTitle ?? null,
        subtitle: page.home?.subheroSubtitle ?? null,
        image: page.home?.subheroImage
          ? {
              id: page.home.subheroImage.id,
              path: page.home.subheroImage.path,
              mime: page.home.subheroImage.mime,
              originalName: page.home.subheroImage.originalName,
              sizeBytes: page.home.subheroImage.sizeBytes,
              url: buildFileUrl(page.home.subheroImage.path),
            }
          : null,
      },
      interior: {
        text: page.home?.interiorText ?? null,
        images: interiorImages,
      },
      directions:
        page.home?.directions.map((dir) => ({
          id: dir.id,
          categoryId: dir.categoryId,
          order: dir.order,
          category: dir.category
            ? {
                id: dir.category.id,
                slug: dir.category.slug,
                name: dir.category.name,
                description: dir.category.description,
              }
            : null,
        })) ?? [],
      seo: this.mapSeoResponse(page.seo),
    };
  }

  async updateHomePage(input: HomePageBody) {
    const page = await this.ensureStaticPage(StaticPageType.HOME);
    const heroBlock = (input as any)?.hero ?? {};
    const nestedSubheroImage = (input as any)?.subHero?.image;
    const subheroImageId =
      input.subheroImageFileId ??
      (input.subheroImage as any)?.fileId ??
      input.subheroImage?.id ??
      (input.subheroImage as any)?.file?.id ??
      nestedSubheroImage?.fileId ??
      nestedSubheroImage?.id ??
      nestedSubheroImage?.file?.id ??
      null;

    const hasSubheroImageInput =
      input.subheroImageFileId !== undefined ||
      input.subheroImage !== undefined ||
      nestedSubheroImage !== undefined;

    const heroTitle = input.heroTitle ?? heroBlock.title;
    const heroSubtitle = input.heroSubtitle ?? heroBlock.subtitle;
    const heroCtaText = input.heroCtaText ?? heroBlock.ctaText;
    const heroCtaUrl =
      input.heroCtaUrl ?? heroBlock.ctaUrl ?? heroBlock.cta?.url ?? null;

    const heroImagesInput =
      input.heroImages ?? heroBlock.images ?? heroBlock.heroImages;

    await this.app.prisma.$transaction(async (tx) => {
      await tx.homePage.upsert({
        where: { id: page.id },
        update: {
          ...(heroTitle !== undefined && {
            heroTitle: heroTitle ?? '',
          }),
          ...(heroSubtitle !== undefined && {
            heroSubtitle: heroSubtitle ?? '',
          }),
          ...(heroCtaText !== undefined && {
            heroCtaText: heroCtaText ?? '',
          }),
          ...(heroCtaUrl !== undefined && {
            heroCtaUrl: heroCtaUrl ?? '',
          }),
          ...(input.subheroTitle !== undefined && {
            subheroTitle: input.subheroTitle ?? '',
          }),
          ...(input.subheroSubtitle !== undefined && {
            subheroSubtitle: input.subheroSubtitle ?? '',
          }),
          ...(hasSubheroImageInput && {
            subheroImageId,
          }),
          ...(input.interiorText !== undefined && {
            interiorText: input.interiorText ?? '',
          }),
        } as any,
        create: {
          id: page.id,
          heroTitle:
            heroTitle ?? 'Клиника OCTAVA — молодость и эстетика',
          heroSubtitle:
            heroSubtitle ??
            'Современные методы антивозрастной медицины и косметологии',
          heroCtaText: heroCtaText ?? 'Записаться на консультацию',
          heroCtaUrl: heroCtaUrl ?? '/contacts',
          subheroTitle: input.subheroTitle ?? 'Комплексный подход',
          subheroSubtitle:
            input.subheroSubtitle ??
            'Индивидуальные протоколы и лучшие аппараты',
          subheroImageId,
          interiorText:
            input.interiorText ??
            'Интерьер и атмосфера клиники создают ощущение уюта и доверия.',
        },
      });

      if (heroImagesInput !== undefined) {
        await tx.homeGalleryImage.deleteMany({
          where: { homePageId: page.id, purpose: ImagePurpose.HERO },
        });
        const heroImage = heroImagesInput.find((img: any) => img?.fileId);
        if (heroImage) {
          await tx.homeGalleryImage.create({
            data: {
              homePageId: page.id,
              purpose: ImagePurpose.HERO,
              fileId: heroImage.fileId,
              order: heroImage.order ?? 0,
              alt: heroImage.alt ?? null,
              caption: heroImage.caption ?? null,
            },
          });
        }
      }

      if (input.interiorImages !== undefined) {
        await tx.homeGalleryImage.deleteMany({
          where: { homePageId: page.id, purpose: ImagePurpose.GALLERY },
        });

        const galleryPayload = input.interiorImages
          .filter((img): img is HomeInteriorImageInput & { fileId: number } =>
            Boolean(img && img.fileId),
          )
          .map((img, index) => ({
            homePageId: page.id,
            purpose: ImagePurpose.GALLERY,
            fileId: img.fileId,
            order: img.order ?? index,
            alt: img.alt ?? null,
            caption: img.caption ?? null,
          }));

        if (galleryPayload.length) {
          await tx.homeGalleryImage.createMany({ data: galleryPayload });
        }
      }

      if (input.directions !== undefined) {
        if (input.directions.length !== 4) {
          throw this.app.httpErrors.badRequest(
            'Нужно указать ровно четыре направления на главной странице',
          );
        }

        const ids = input.directions.map((d) => d.categoryId);
        if (ids.some((id) => !id)) {
          throw this.app.httpErrors.badRequest(
            'Каждое направление должно ссылаться на категорию',
          );
        }

        const uniqueIds = [...new Set(ids)];
        const categories = await tx.serviceCategory.findMany({
          where: { id: { in: uniqueIds } },
          select: { id: true },
        });
        if (categories.length !== uniqueIds.length) {
          throw this.app.httpErrors.badRequest('Категория для направления не найдена');
        }

        await tx.homeDirection.deleteMany({ where: { homePageId: page.id } });
        if (ids.length) {
          await tx.homeDirection.createMany({
            data: input.directions.map((dir, index) => ({
              homePageId: page.id,
              categoryId: dir.categoryId,
              order: dir.order ?? index,
            })),
          });
        }
      }
    });

    const heroImageForSeo = heroImagesInput?.find((img: any) => img?.fileId);
    const heroImageFileId = Number(heroImageForSeo?.fileId);
    const seoEligibleHeroImageId = Number.isFinite(heroImageFileId)
      ? (
          await this.app.prisma.file.findUnique({
            where: { id: heroImageFileId },
            select: { kind: true },
          })
        )?.kind === FileKind.IMAGE
        ? heroImageFileId
        : null
      : null;
    let seoPayload = (input as any)?.seo ?? input.seo;

    if (seoEligibleHeroImageId) {
      if (seoPayload) {
        if (seoPayload.ogImageId === undefined) {
          seoPayload = { ...seoPayload, ogImageId: seoEligibleHeroImageId };
        }
      } else {
        seoPayload = { ogImageId: seoEligibleHeroImageId } as SeoBody;
      }
    }

    await this.upsertSeo(page.id, seoPayload);
  }

  /* ===================== ABOUT ===================== */

  async getAboutPage() {
    const page = await this.app.prisma.staticPage.findUnique({
      where: { type: StaticPageType.ABOUT },
      include: {
        about: {
          include: {
            heroCta: true,
            heroImage: true,
            trustItems: {
              orderBy: { id: 'asc' },
              include: {
                file: true,
              },
            },
            facts: {
              orderBy: { order: 'asc' },
            },
          },
        },
        seo: true,
      },
    });

    if (!page) {
      throw this.app.httpErrors.notFound('Страница ABOUT не найдена');
    }

    return {
      heroTitle: page.about?.heroTitle ?? null,
      heroDescription: page.about?.heroDescription ?? null,
      howWeAchieveText: page.about?.howWeAchieveText ?? null,
      heroBadgeText: page.about?.heroBadgeText ?? null,
      heroCardText: page.about?.heroCardText ?? null,
      howWeAchieveTitle: page.about?.howWeAchieveTitle ?? null,
      howWeAchieveCardText: page.about?.howWeAchieveCardText ?? null,
      factsSectionTitle: page.about?.factsSectionTitle ?? null,
      trustSectionTitle: page.about?.trustSectionTitle ?? null,
      trustSectionSubtitle: page.about?.trustSectionSubtitle ?? null,
      heroCtaTitle: page.about?.heroCta?.title ?? null,
      heroCtaSubtitle: page.about?.heroCta?.subtitle ?? null,
      heroImage: page.about?.heroImage
        ? {
            id: page.about.heroImage.id,
            path: page.about.heroImage.path,
            mime: page.about.heroImage.mime,
            originalName: page.about.heroImage.originalName,
          }
        : null,
      facts: page.about?.facts.map((fact) => ({
        id: fact.id,
        title: fact.title,
        text: fact.text,
        order: fact.order,
      })) ?? [],
      trustItems:
        page.about?.trustItems.map((item) => ({
          id: item.id,
          kind: item.kind,
          title: item.title,
          number: item.number,
          issuedAt: item.issuedAt,
          issuedBy: item.issuedBy,
          fileId: item.fileId,
          file: item.file
            ? {
                id: item.file.id,
                path: item.file.path,
                mime: item.file.mime,
                originalName: item.file.originalName,
                sizeBytes: item.file.sizeBytes,
                url: buildFileUrl(item.file.path),
              }
            : null,
        })) ?? [],
      seo: this.mapSeoResponse(page.seo),
    } as AboutPageBody;
  }

  async updateAboutPage(input: AboutPageBody) {
    const page = await this.ensureStaticPage(StaticPageType.ABOUT);

    await this.app.prisma.aboutPage.upsert({
      where: { id: page.id },
      update: {
        ...(input.heroTitle !== undefined && {
          heroTitle: input.heroTitle ?? '',
        }),
        ...(input.heroDescription !== undefined && {
          heroDescription: input.heroDescription ?? '',
        }),
        ...(input.howWeAchieveText !== undefined && {
          howWeAchieveText: input.howWeAchieveText ?? '',
        }),
        ...(input.heroBadgeText !== undefined && {
          heroBadgeText: input.heroBadgeText ?? null,
        }),
        ...(input.heroCardText !== undefined && {
          heroCardText: input.heroCardText ?? null,
        }),
        ...(input.howWeAchieveTitle !== undefined && {
          howWeAchieveTitle: input.howWeAchieveTitle ?? null,
        }),
        ...(input.howWeAchieveCardText !== undefined && {
          howWeAchieveCardText: input.howWeAchieveCardText ?? null,
        }),
        ...(input.factsSectionTitle !== undefined && {
          factsSectionTitle: input.factsSectionTitle ?? null,
        }),
        ...(input.trustSectionTitle !== undefined && {
          trustSectionTitle: input.trustSectionTitle ?? null,
        }),
        ...(input.trustSectionSubtitle !== undefined && {
          trustSectionSubtitle: input.trustSectionSubtitle ?? null,
        }),
        ...(input.heroImageFileId !== undefined && {
          heroImageId: input.heroImageFileId,
        }),
      } as any,
      create: {
        id: page.id,
        heroTitle: input.heroTitle ?? 'О клинике OCTAVA',
        heroDescription:
          input.heroDescription ??
          'Мы центр антивозрастной и эстетической медицины в Москве. Работаем по современным стандартам.',
        howWeAchieveText:
          input.howWeAchieveText ??
          'Подбираем персональные протоколы, используем сертифицированные аппараты и бережные методики.',
        heroBadgeText:
          input.heroBadgeText ?? 'Антивозрастная и эстетическая медицина',
        heroCardText:
          input.heroCardText ??
          'Мы работаем не только с внешним проявлением возраста, но и с его причинами. Каждый план лечения — это комбинация диагностики, аппаратных методик и поддержки образа жизни.',
        howWeAchieveTitle: input.howWeAchieveTitle ?? 'Как мы работаем',
        howWeAchieveCardText:
          input.howWeAchieveCardText ??
          'OCTAVA — это место, где диагностика, anti-age и эстетика собраны в единую систему. Мы смотрим на здоровье кожи шире, чем просто косметология: учитываем гормональный фон, образ жизни и долгосрочные цели.',
        factsSectionTitle:
          input.factsSectionTitle ?? 'Наш подход к работе с пациентами',
        trustSectionTitle:
          input.trustSectionTitle ?? 'Лицензии, сертификаты и награды',
        trustSectionSubtitle:
          input.trustSectionSubtitle ??
          'Юридическая чистота, контроль качества и признание профессионального сообщества.',
        heroImageId: input.heroImageFileId ?? null,
      },
    });

    // Блок hero CTA отдельной моделью AboutHeroCta
    if (
      input.heroCtaTitle !== undefined ||
      input.heroCtaSubtitle !== undefined
    ) {
      const hasContent =
        (input.heroCtaTitle && input.heroCtaTitle.trim().length > 0) ||
        (input.heroCtaSubtitle && input.heroCtaSubtitle.trim().length > 0);

      if (!hasContent) {
        // Если поля пришли, но пустые — считаем, что блок нужно убрать
        await this.app.prisma.aboutHeroCta
          .delete({ where: { aboutPageId: page.id } })
          .catch(() => {});
      } else {
        await this.app.prisma.aboutHeroCta.upsert({
          where: { aboutPageId: page.id },
          update: {
            ...(input.heroCtaTitle !== undefined && {
              title: input.heroCtaTitle ?? '',
            }),
            ...(input.heroCtaSubtitle !== undefined && {
              subtitle: input.heroCtaSubtitle ?? '',
            }),
          } as any,
          create: {
            aboutPageId: page.id,
            title: input.heroCtaTitle ?? 'Записаться на консультацию',
            subtitle: input.heroCtaSubtitle ?? null,
          },
        });
      }
    }

    await this.upsertSeo(page.id, input.seo);

    if (input.facts !== undefined) {
      await this.app.prisma.aboutFact.deleteMany({
        where: { aboutPageId: page.id },
      });

      const payload = input.facts
        .filter((fact) => fact.title && fact.text)
        .map((fact, index) => ({
          aboutPageId: page.id,
          title: fact.title ?? '',
          text: fact.text ?? '',
          order: fact.order ?? index,
        }));

      if (payload.length) {
        await this.app.prisma.aboutFact.createMany({ data: payload });
      }
    }

    if (input.trustItems !== undefined) {
      const normalized = input.trustItems
        .map((item) => {
          const issuedAtRaw = item.issuedAt?.trim();
          const issuedAt =
            issuedAtRaw && issuedAtRaw.length
              ? new Date(issuedAtRaw)
              : null;

          if (issuedAtRaw && (!issuedAt || Number.isNaN(issuedAt.getTime()))) {
            throw this.app.httpErrors.badRequest(
              'Некорректная дата выдачи в блоке документов о клинике',
            );
          }

          return {
            kind: item.kind ?? TrustItemKind.CERTIFICATE,
            title: item.title?.trim() ?? '',
            number: item.number?.trim() || null,
            issuedBy: item.issuedBy?.trim() || null,
            issuedAt,
            fileId: item.fileId ?? null,
          };
        })
        .filter(
          (item) =>
            item.title.length > 0 ||
            item.number ||
            item.issuedBy ||
            item.issuedAt ||
            item.fileId,
        );

      const fileIds = normalized
        .map((item) => item.fileId)
        .filter((id): id is number => Number.isFinite(id as number));

      if (fileIds.length) {
        const files = await this.app.prisma.file.findMany({
          where: { id: { in: fileIds } },
          select: { id: true, mime: true },
        });

        const mimeById = new Map(files.map((file) => [file.id, file.mime]));
        for (const fileId of fileIds) {
          const mime = mimeById.get(fileId);
          if (!mime) {
            throw this.app.httpErrors.badRequest(
              `Файл #${fileId} для документа о клинике не найден`,
            );
          }
          if (mime !== 'application/pdf') {
            throw this.app.httpErrors.badRequest(
              'Для лицензий и сертификатов разрешены только PDF файлы',
            );
          }
        }
      }

      await this.app.prisma.aboutTrustItem.deleteMany({
        where: { aboutPageId: page.id },
      });

      if (normalized.length) {
        await this.app.prisma.aboutTrustItem.createMany({
          data: normalized.map((item) => ({
            aboutPageId: page.id,
            kind: item.kind,
            title: item.title || 'Документ',
            number: item.number,
            issuedBy: item.issuedBy,
            issuedAt: item.issuedAt,
            fileId: item.fileId,
          })),
        });
      }
    }
  }

  /* ===================== CONTACTS ===================== */

  async getContactsPage() {
    const page = await this.app.prisma.staticPage.findUnique({
      where: { type: StaticPageType.CONTACTS },
      include: {
        contacts: {
          include: {
            workingHours: true,
            metroStations: true,
          },
        },
        seo: true,
      },
    });

    if (!page) {
      throw this.app.httpErrors.notFound('Страница CONTACTS не найдена');
    }

    return {
      phoneMain: page.contacts?.phoneMain ?? null,
      email: page.contacts?.email ?? null,
      telegramUrl: page.contacts?.telegramUrl ?? null,
      whatsappUrl: page.contacts?.whatsappUrl ?? null,
      maxMessengerUrl: page.contacts?.maxMessengerUrl ?? null,
      addressText: page.contacts?.addressText ?? null,
      yandexMapUrl: page.contacts?.yandexMapUrl ?? null,
      workingHours:
        page.contacts?.workingHours.map((wh) => ({
          id: wh.id,
          group: wh.dayGroup,
          open: this.minutesToTimeString(wh.openMinutes),
          close: this.minutesToTimeString(wh.closeMinutes),
          isClosed: wh.isClosed,
        })) ?? [],
      metroStations:
        page.contacts?.metroStations.map((station) => ({
          id: station.id,
          name: station.name,
          distanceMeters: station.distanceMeters,
          line: station.line,
        })) ?? [],
      seo: this.mapSeoResponse(page.seo),
    } as ContactsPageBody;
  }

  async updateContactsPage(input: ContactsPageBody) {
    const page = await this.ensureStaticPage(StaticPageType.CONTACTS);
    await this.app.prisma.$transaction(async (tx) => {
      const contacts = await tx.contactsPage.upsert({
        where: { id: page.id },
        update: {
          ...(input.phoneMain !== undefined && {
            phoneMain: input.phoneMain ?? '',
          }),
          ...(input.email !== undefined && {
            email: input.email,
          }),
          ...(input.telegramUrl !== undefined && {
            telegramUrl: input.telegramUrl,
          }),
          ...(input.whatsappUrl !== undefined && {
            whatsappUrl: input.whatsappUrl,
          }),
          ...(input.maxMessengerUrl !== undefined && {
            maxMessengerUrl: input.maxMessengerUrl,
          }),
          ...(input.addressText !== undefined && {
            addressText: input.addressText ?? '',
          }),
          ...(input.yandexMapUrl !== undefined && {
            yandexMapUrl: input.yandexMapUrl ?? '',
          }),
        } as any,
        create: {
          id: page.id,
          phoneMain: input.phoneMain ?? '',
          email: input.email ?? null,
          telegramUrl: input.telegramUrl ?? null,
          whatsappUrl: input.whatsappUrl ?? null,
          maxMessengerUrl: input.maxMessengerUrl ?? null,
          addressText: input.addressText ?? '',
          yandexMapUrl: input.yandexMapUrl ?? '',
        },
      });

      if (input.workingHours !== undefined) {
        const seen = new Set<DayGroup>();
        const payload = input.workingHours.map((item) => {
          if (seen.has(item.group)) {
            throw this.app.httpErrors.badRequest(
              'Каждая группа расписания должна встречаться один раз',
            );
          }
          seen.add(item.group);

          const isClosed = item.isClosed ?? false;
          const openMinutes = isClosed
            ? null
            : this.timeStringToMinutes(item.open ?? '');
          const closeMinutes = isClosed
            ? null
            : this.timeStringToMinutes(item.close ?? '');

          if (!isClosed && (openMinutes == null || closeMinutes == null)) {
            throw this.app.httpErrors.badRequest(
              'Для открытого дня нужно указать время открытия и закрытия',
            );
          }

          return {
            contactsPageId: contacts.id,
            dayGroup: item.group,
            openMinutes,
            closeMinutes,
            isClosed,
          };
        });

        await tx.contactsWorkingHours.deleteMany({
          where: { contactsPageId: contacts.id },
        });
        if (payload.length) {
          await tx.contactsWorkingHours.createMany({ data: payload });
        }
      }

      if (input.metroStations !== undefined) {
        await tx.contactsMetroStation.deleteMany({
          where: { contactsPageId: contacts.id },
        });

        const metroPayload = input.metroStations
          .filter((station) => station.name?.trim().length)
          .map((station) => ({
            contactsPageId: contacts.id,
            name: station.name.trim(),
            distanceMeters: station.distanceMeters ?? null,
            line: station.line ?? null,
          }));

        if (metroPayload.length) {
          await tx.contactsMetroStation.createMany({ data: metroPayload });
        }
      }
    });

    await this.upsertSeo(page.id, input.seo);
  }

  /* ===================== PRICES ===================== */

  async getPricesPage() {
    const page = await this.app.prisma.staticPage.upsert({
      where: { type: StaticPageType.PRICES },
      update: {
        slug: 'prices',
      },
      create: {
        type: StaticPageType.PRICES,
        slug: 'prices',
      },
      include: {
        prices: {
          include: {
            priceListFile: true,
          },
        },
        seo: true,
      },
    });

    return {
      priceListFileId: page.prices?.priceListFileId ?? null,
      priceListFile: page.prices?.priceListFile
        ? {
            id: page.prices.priceListFile.id,
            path: page.prices.priceListFile.path,
            mime: page.prices.priceListFile.mime,
            originalName: page.prices.priceListFile.originalName,
            sizeBytes: page.prices.priceListFile.sizeBytes,
            url: buildFileUrl(page.prices.priceListFile.path),
          }
        : null,
      seo: this.mapSeoResponse(page.seo),
    } as PricesPageBody & {
      priceListFile: (FileSummary & { url: string }) | null;
    };
  }

  async updatePricesPage(input: PricesPageBody) {
    const page = await this.app.prisma.staticPage.upsert({
      where: { type: StaticPageType.PRICES },
      update: {
        slug: 'prices',
      },
      create: {
        type: StaticPageType.PRICES,
        slug: 'prices',
      },
    });

    if (input.priceListFileId !== undefined && input.priceListFileId !== null) {
      const file = await this.app.prisma.file.findUnique({
        where: { id: input.priceListFileId },
        select: { mime: true },
      });
      if (!file) {
        throw this.app.httpErrors.badRequest('PDF файл не найден');
      }
      if (file.mime !== 'application/pdf') {
        throw this.app.httpErrors.badRequest('Допустим только PDF файл');
      }
    }

    await this.app.prisma.pricesPage.upsert({
      where: { id: page.id },
      update: {
        ...(input.priceListFileId !== undefined && {
          priceListFileId: input.priceListFileId,
        }),
      },
      create: {
        id: page.id,
        priceListFileId: input.priceListFileId ?? null,
      },
    });

    await this.upsertSeo(page.id, input.seo);
  }

  /* ===================== POLICIES ===================== */

  private async updatePolicyByType(
    type: StaticPageType,
    input: PolicyPageBody,
  ) {
    const page = await this.ensureStaticPage(type);

    await this.app.prisma.policyPage.upsert({
      where: { id: page.id },
      update: {
        ...(input.title !== undefined && {
          title: input.title ?? '',
        }),
        ...(input.body !== undefined && {
          body: input.body ?? '',
        }),
      } as any,
      create: {
        id: page.id,
        title: input.title ?? '',
        body: input.body ?? '',
      },
    });

    await this.upsertSeo(page.id, input.seo);
  }

  async updatePersonalDataPolicy(input: PolicyPageBody) {
    return this.updatePolicyByType(
      StaticPageType.PERSONAL_DATA_POLICY,
      input,
    );
  }

  async updatePrivacyPolicy(input: PolicyPageBody) {
    return this.updatePolicyByType(StaticPageType.PRIVACY_POLICY, input);
  }

  private async getPolicyByType(type: StaticPageType) {
    const page = await this.app.prisma.staticPage.findUnique({
      where: { type },
      include: {
        policy: true,
        seo: true,
      },
    });

    if (!page) {
      throw this.app.httpErrors.notFound('Страница не найдена');
    }

    return {
      title: page.policy?.title ?? null,
      body: page.policy?.body ?? null,
      seo: this.mapSeoResponse(page.seo),
    } as PolicyPageBody;
  }

  async getPersonalDataPolicy() {
    return this.getPolicyByType(StaticPageType.PERSONAL_DATA_POLICY);
  }

  async getPrivacyPolicy() {
    return this.getPolicyByType(StaticPageType.PRIVACY_POLICY);
  }
}
