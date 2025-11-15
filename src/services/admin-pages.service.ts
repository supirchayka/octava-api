// src/services/admin-pages.service.ts
import type { FastifyInstance } from 'fastify';
import { StaticPageType } from '@prisma/client';

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

export interface HomePageBody {
  heroTitle?: string | null;
  heroSubtitle?: string | null;
  heroCtaText?: string | null;
  heroCtaUrl?: string | null;
  subheroTitle?: string | null;
  subheroSubtitle?: string | null;
  interiorText?: string | null;
  seo?: SeoBody;
}

export interface AboutPageBody {
  heroTitle?: string | null;
  heroDescription?: string | null;
  howWeAchieveText?: string | null;
  // hero CTA — отдельная модель AboutHeroCta
  heroCtaTitle?: string | null;
  heroCtaSubtitle?: string | null;
  seo?: SeoBody;
}

export interface ContactsPageBody {
  phoneMain?: string | null;
  email?: string | null;
  telegramUrl?: string | null;
  whatsappUrl?: string | null;
  addressText?: string | null;
  yandexMapUrl?: string | null;
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

  async updateHomePage(input: HomePageBody) {
    const page = await this.ensureStaticPage(StaticPageType.HOME);

    await this.app.prisma.homePage.upsert({
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
        interiorText:
          input.interiorText ??
          'Интерьер и атмосфера клиники создают ощущение уюта и доверия.',
      },
    });

    await this.upsertSeo(page.id, input.seo);
  }

  /* ===================== ABOUT ===================== */

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
  }

  /* ===================== CONTACTS ===================== */

  async updateContactsPage(input: ContactsPageBody) {
    const page = await this.ensureStaticPage(StaticPageType.CONTACTS);

    await this.app.prisma.contactsPage.upsert({
      where: { id: page.id },
      update: {
        ...(input.phoneMain !== undefined && {
          phoneMain: input.phoneMain ?? '',
        }),
        ...(input.email !== undefined && {
          email: input.email, // поле nullable в схеме
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
}
