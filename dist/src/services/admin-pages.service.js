"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminPagesService = void 0;
const client_1 = require("@prisma/client");
/**
 * Админ-управление статическими страницами и их SEO.
 */
class AdminPagesService {
    constructor(app) {
        this.app = app;
    }
    ensureStaticPage(type) {
        return this.app.prisma.staticPage.findUniqueOrThrow({
            where: { type },
        });
    }
    /**
     * Общий апсерт SEO-настроек для статической страницы
     */
    async upsertSeo(pageId, seo) {
        if (!seo)
            return;
        // В update не трогаем поля, которые не пришли
        const updateData = {};
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
                metaTitle: seo.metaTitle ??
                    'Клиника OCTAVA — антивозрастная и эстетическая медицина',
                metaDescription: seo.metaDescription ??
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
    async updateHomePage(input) {
        const page = await this.ensureStaticPage(client_1.StaticPageType.HOME);
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
            },
            create: {
                id: page.id,
                heroTitle: input.heroTitle ?? 'Клиника OCTAVA — молодость и эстетика',
                heroSubtitle: input.heroSubtitle ??
                    'Современные методы антивозрастной медицины и косметологии',
                heroCtaText: input.heroCtaText ?? 'Записаться на консультацию',
                heroCtaUrl: input.heroCtaUrl ?? '/contacts',
                subheroTitle: input.subheroTitle ?? 'Комплексный подход',
                subheroSubtitle: input.subheroSubtitle ??
                    'Индивидуальные протоколы и лучшие аппараты',
                interiorText: input.interiorText ??
                    'Интерьер и атмосфера клиники создают ощущение уюта и доверия.',
            },
        });
        await this.upsertSeo(page.id, input.seo);
    }
    /* ===================== ABOUT ===================== */
    async updateAboutPage(input) {
        const page = await this.ensureStaticPage(client_1.StaticPageType.ABOUT);
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
            },
            create: {
                id: page.id,
                heroTitle: input.heroTitle ?? 'О клинике OCTAVA',
                heroDescription: input.heroDescription ??
                    'Мы центр антивозрастной и эстетической медицины в Москве. Работаем по современным стандартам.',
                howWeAchieveText: input.howWeAchieveText ??
                    'Подбираем персональные протоколы, используем сертифицированные аппараты и бережные методики.',
            },
        });
        // Блок hero CTA отдельной моделью AboutHeroCta
        if (input.heroCtaTitle !== undefined ||
            input.heroCtaSubtitle !== undefined) {
            const hasContent = (input.heroCtaTitle && input.heroCtaTitle.trim().length > 0) ||
                (input.heroCtaSubtitle && input.heroCtaSubtitle.trim().length > 0);
            if (!hasContent) {
                // Если поля пришли, но пустые — считаем, что блок нужно убрать
                await this.app.prisma.aboutHeroCta
                    .delete({ where: { aboutPageId: page.id } })
                    .catch(() => { });
            }
            else {
                await this.app.prisma.aboutHeroCta.upsert({
                    where: { aboutPageId: page.id },
                    update: {
                        ...(input.heroCtaTitle !== undefined && {
                            title: input.heroCtaTitle ?? '',
                        }),
                        ...(input.heroCtaSubtitle !== undefined && {
                            subtitle: input.heroCtaSubtitle ?? '',
                        }),
                    },
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
    async updateContactsPage(input) {
        const page = await this.ensureStaticPage(client_1.StaticPageType.CONTACTS);
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
            },
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
    async updatePolicyByType(type, input) {
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
            },
            create: {
                id: page.id,
                title: input.title ?? '',
                body: input.body ?? '',
            },
        });
        await this.upsertSeo(page.id, input.seo);
    }
    async updatePersonalDataPolicy(input) {
        return this.updatePolicyByType(client_1.StaticPageType.PERSONAL_DATA_POLICY, input);
    }
    async updatePrivacyPolicy(input) {
        return this.updatePolicyByType(client_1.StaticPageType.PRIVACY_POLICY, input);
    }
}
exports.AdminPagesService = AdminPagesService;
