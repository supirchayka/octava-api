// src/services/admin-pages.service.ts
import type { FastifyInstance } from 'fastify';
import { DayGroup, ImagePurpose, StaticPageType } from '@prisma/client';
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

export interface AboutPageBody {
  heroTitle?: string | null;
  heroDescription?: string | null;
  howWeAchieveText?: string | null;
  // hero CTA — отдельная модель AboutHeroCта
  heroCtaTitle?: string | null;
  heroCtaSubtitle?: string | null;
  heroImageFileId?: number | null;
  heroImage?: FileSummary | null;
  facts?: AboutFactInput[];
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

  /**
   * Общий апсерт SEO-настроек для статической страницы
   */
  private async upsertSeo(pageId: number, seo?: SeoBody) {
    if (!seo) return;

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
    if (seo.ogImageId !== undefined) {
      updateData.ogImageId = seo.ogImageId;
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
        ogImageId: seo.ogImageId ?? null,
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

    await this.app.prisma.$transaction(async (tx) => {
      await tx.homePage.upsert({
        where: { id: page.id },
        update: {
          ...(input.heroTitle !== undefined && {
            heroTitle: input.heroTitle ?? '',
          }),
          ...(input.heroSubtitle !== undefined && {
            heroSubtitle: input.heroSubtitle ?? '',
          }),
          ...(input.heroCtaText !== undefined && {
            heroCtaText: input.heroCtaText ?? '',
          }),
          ...(input.heroCtaUrl !== undefined && {
            heroCtaUrl: input.heroCtaUrl ?? '',
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
          heroTitle: input.heroTitle ?? 'Клиника OCTAVA — молодость и эстетика',
          heroSubtitle:
            input.heroSubtitle ??
            'Современные методы антивозрастной медицины и косметологии',
          heroCtaText: input.heroCtaText ?? 'Записаться на консультацию',
          heroCtaUrl: input.heroCtaUrl ?? '/contacts',
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

      if (input.heroImages !== undefined) {
        await tx.homeGalleryImage.deleteMany({
          where: { homePageId: page.id, purpose: ImagePurpose.HERO },
        });
        const heroImage = input.heroImages.find((img) => img?.fileId);
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

    await this.upsertSeo(page.id, input.seo);
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
