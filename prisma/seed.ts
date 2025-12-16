// prisma/seed.ts
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';

import {
  DayGroup,
  FileKind,
  ImagePurpose,
  PrismaClient,
  DeviceCertType,
  Rarity,
  Role,
  ServicePriceType,
  StaticPageType,
  PhoneType,
  TrustItemKind,
  Storage,
} from '@prisma/client';
import { hashPassword } from '../src/utils/password';

const prisma = new PrismaClient();

const SEED_DIR = path.join(process.cwd(), 'uploads/seed');
const ONE_PIXEL_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=';
const DEFAULT_IMAGE_META = { mime: 'image/png', width: 1600, height: 900 } as const;

function ensureSeedImage(
  filename: string,
  base64Content: string,
  meta: { mime: string; width: number; height: number },
) {
  fs.mkdirSync(SEED_DIR, { recursive: true });
  const filePath = path.join(SEED_DIR, filename);

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, Buffer.from(base64Content, 'base64'));
  }

  const stats = fs.statSync(filePath);
  const dbPath = `uploads/seed/${filename}`;

  return prisma.file.upsert({
    where: { path: dbPath },
    update: {
      originalName: filename,
      mime: meta.mime,
      sizeBytes: stats.size,
      width: meta.width,
      height: meta.height,
      storage: Storage.LOCAL,
      kind: FileKind.IMAGE,
    },
    create: {
      originalName: filename,
      path: dbPath,
      mime: meta.mime,
      sizeBytes: stats.size,
      width: meta.width,
      height: meta.height,
      storage: Storage.LOCAL,
      kind: FileKind.IMAGE,
    },
  });
}

async function ensureAdmin() {
  const email = process.env.ADMIN_EMAIL || 'admin@octava.ru';
  const password = process.env.ADMIN_PASSWORD || 'changeme';

  const passwordHash = await hashPassword(password);

  await prisma.user.upsert({
    where: { email },
    create: {
      email,
      passwordHash,
      role: Role.ADMIN,
      isActive: true,
    },
    update: {
      passwordHash,
      role: Role.ADMIN,
      isActive: true,
    },
  });
}

async function seedOrganization() {
  const org = await prisma.organization.upsert({
    where: { id: 1 },
    update: {
      fullName: 'ООО «Октава»',
      ogrn: '1234567890123',
      inn: '7700000000',
      kpp: '770001001',
      address: 'г. Москва, ул. Примерная, д. 1',
      email: 'info@octava.ru',
    },
    create: {
      fullName: 'ООО «Октава»',
      ogrn: '1234567890123',
      inn: '7700000000',
      kpp: '770001001',
      address: 'г. Москва, ул. Примерная, д. 1',
      email: 'info@octava.ru',
    },
  });

  await prisma.organizationPhone.upsert({
    where: { id: org.id * 10 + 1 },
    update: {
      organizationId: org.id,
      type: PhoneType.MAIN,
      number: '+7 (495) 000-00-00',
      isPrimary: true,
    },
    create: {
      id: org.id * 10 + 1,
      organizationId: org.id,
      type: PhoneType.MAIN,
      number: '+7 (495) 000-00-00',
      isPrimary: true,
    },
  });
}

async function seedStaticPages() {
  const slugs: Record<StaticPageType, string> = {
    [StaticPageType.HOME]: '',
    [StaticPageType.ABOUT]: 'about',
    [StaticPageType.CONTACTS]: 'contacts',
    [StaticPageType.ORG_INFO]: 'org-info',
    [StaticPageType.PERSONAL_DATA_POLICY]: 'personal-data-policy',
    [StaticPageType.PRIVACY_POLICY]: 'privacy-policy',
  };

  for (const type of Object.values(StaticPageType)) {
    await prisma.staticPage.upsert({
      where: { type },
      update: {
        slug: slugs[type],
      },
      create: {
        type,
        slug: slugs[type],
      },
    });
  }

  const home = await prisma.staticPage.findUniqueOrThrow({
    where: { type: StaticPageType.HOME },
  });

  const homeHeroImage = await ensureSeedImage(
    'home-hero.png',
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=',
    {
      mime: 'image/png',
      width: 1,
      height: 1,
    },
  );

  await prisma.homePage.upsert({
    where: { id: home.id },
    update: {
      heroTitle: 'Клиника OCTAVA — молодость и эстетика',
      heroSubtitle:
        'Современные протоколы антивозрастной медицины и косметологии, подтверждённые доказательной базой.',
      heroCtaText: 'Записаться на консультацию',
      heroCtaUrl: '/contacts',
      subheroTitle: 'Персональные программы',
      subheroSubtitle:
        'Мы подбираем решения под задачи пациента: от диагностики до комплексного сопровождения и реабилитации.',
      interiorText:
        'В OCTAVA пациенты чувствуют себя комфортно: мы внимательно объясняем каждый шаг и сопровождаем на всём пути лечения.',
    },
    create: {
      id: home.id,
      heroTitle: 'Клиника OCTAVA — молодость и эстетика',
      heroSubtitle:
        'Современные протоколы антивозрастной медицины и косметологии, подтверждённые доказательной базой.',
      heroCtaText: 'Записаться на консультацию',
      heroCtaUrl: '/contacts',
      subheroTitle: 'Персональные программы',
      subheroSubtitle:
        'Мы подбираем решения под задачи пациента: от диагностики до комплексного сопровождения и реабилитации.',
      interiorText:
        'В OCTAVA пациенты чувствуют себя комфортно: мы внимательно объясняем каждый шаг и сопровождаем на всём пути лечения.',
    },
  });

  await prisma.homeGalleryImage.deleteMany({
    where: { homePageId: home.id, purpose: ImagePurpose.HERO },
  });

  await prisma.homeGalleryImage.create({
    data: {
      homePageId: home.id,
      purpose: ImagePurpose.HERO,
      fileId: homeHeroImage.id,
      alt: 'Клиника OCTAVA — главный баннер',
      caption: 'Герой и OG для главной страницы',
      order: 0,
    },
  });

  await prisma.seoStaticPage.upsert({
    where: { pageId: home.id },
    update: {
      metaTitle: 'Клиника OCTAVA — антивозрастная и эстетическая медицина',
      metaDescription:
        'Главная страница клиники OCTAVA: персональные программы, консультации и современный подход к эстетике.',
      canonicalUrl: '/',
      robotsIndex: true,
      robotsFollow: true,
      ogTitle: 'OCTAVA — молодость и эстетика',
      ogDescription:
        'Клиника антивозрастной и эстетической медицины в Москве. Индивидуальные программы и современные аппараты.',
      ogImageId: homeHeroImage.id,
    },
    create: {
      pageId: home.id,
      metaTitle: 'Клиника OCTAVA — антивозрастная и эстетическая медицина',
      metaDescription:
        'Главная страница клиники OCTAVA: персональные программы, консультации и современный подход к эстетике.',
      canonicalUrl: '/',
      robotsIndex: true,
      robotsFollow: true,
      ogTitle: 'OCTAVA — молодость и эстетика',
      ogDescription:
        'Клиника антивозрастной и эстетической медицины в Москве. Индивидуальные программы и современные аппараты.',
      ogImageId: homeHeroImage.id,
    },
  });

  const about = await prisma.staticPage.findUniqueOrThrow({
    where: { type: StaticPageType.ABOUT },
  });

  const aboutHeroImage = await ensureSeedImage(
    'about-hero.png',
    ONE_PIXEL_BASE64,
    { ...DEFAULT_IMAGE_META, width: 1400, height: 788 },
  );

  await prisma.aboutPage.upsert({
    where: { id: about.id },
    update: {
      heroTitle: 'О клинике OCTAVA',
      heroDescription:
        'Мы работаем на стыке медицины и эстетики: команда врачей использует международные стандарты, обучается и внедряет технологии омоложения.',
      howWeAchieveText:
        'Собираем междисциплинарные консилиумы, ведём пациента от первичной консультации до контроля результатов и профилактики.',
      heroImageId: aboutHeroImage.id,
    },
    create: {
      id: about.id,
      heroTitle: 'О клинике OCTAVA',
      heroDescription:
        'Мы работаем на стыке медицины и эстетики: команда врачей использует международные стандарты, обучается и внедряет технологии омоложения.',
      howWeAchieveText:
        'Собираем междисциплинарные консилиумы, ведём пациента от первичной консультации до контроля результатов и профилактики.',
      heroImageId: aboutHeroImage.id,
    },
  });

  await prisma.aboutHeroCta.upsert({
    where: { aboutPageId: about.id },
    update: {
      title: 'Записаться на консультацию',
      subtitle: 'Свяжемся, предложим удобное время и подготовим врача под ваш запрос.',
    },
    create: {
      aboutPageId: about.id,
      title: 'Записаться на консультацию',
      subtitle: 'Свяжемся, предложим удобное время и подготовим врача под ваш запрос.',
    },
  });

  await prisma.aboutTrustItem.deleteMany({ where: { aboutPageId: about.id } });

  await prisma.aboutTrustItem.createMany({
    data: [
      {
        aboutPageId: about.id,
        kind: TrustItemKind.LICENSE,
        title: 'Медицинская лицензия на деятельность в области косметологии',
        number: 'Л041-01137-77/00590027',
        issuedAt: new Date('2022-04-20'),
        issuedBy: 'Департамент здравоохранения г. Москвы',
      },
      {
        aboutPageId: about.id,
        kind: TrustItemKind.CERTIFICATE,
        title: 'Сертификат соответствия на аппаратные методики',
        number: 'RU.77.01.34.003.E.000001.04.24',
        issuedAt: new Date('2024-04-01'),
        issuedBy: 'Росздравнадзор',
      },
      {
        aboutPageId: about.id,
        kind: TrustItemKind.AWARD,
        title: 'Премия за инновационный подход в anti-age медицине',
        issuedAt: new Date('2023-11-12'),
        issuedBy: 'National Aesthetic Awards',
      },
      {
        aboutPageId: about.id,
        kind: TrustItemKind.ATTESTATION,
        title: 'Ежегодная аттестация врачей OCTAVA',
        issuedAt: new Date('2024-02-10'),
        issuedBy: 'Внутренняя комиссия клиники',
      },
    ],
  });

  await prisma.aboutFact.deleteMany({ where: { aboutPageId: about.id } });

  await prisma.aboutFact.createMany({
    data: [
      {
        aboutPageId: about.id,
        title: 'Мультидисциплинарная команда',
        text: 'Дерматологи, эндокринологи, косметологи и реабилитологи составляют общий план лечения.',
        order: 0,
      },
      {
        aboutPageId: about.id,
        title: 'Персонализированные протоколы',
        text: 'Подбираем сочетание аппаратных и инъекционных методик под здоровье кожи и анамнез пациента.',
        order: 1,
      },
      {
        aboutPageId: about.id,
        title: 'Доказательная база',
        text: 'Используем сертифицированные препараты и методики, подтверждённые международными исследованиями.',
        order: 2,
      },
      {
        aboutPageId: about.id,
        title: 'Сопровождение после процедур',
        text: 'Контролируем восстановление, даём рекомендации по уходу и анализируем результаты.',
        order: 3,
      },
    ],
  });

  const contacts = await prisma.staticPage.findUniqueOrThrow({
    where: { type: StaticPageType.CONTACTS },
  });

  await prisma.contactsPage.upsert({
    where: { id: contacts.id },
    update: {
      phoneMain: '+7 (495) 000-00-00',
      email: 'info@octava.ru',
      telegramUrl: 'https://t.me/octava_clinic',
      whatsappUrl: 'https://wa.me/79990000000',
      addressText: 'г. Москва, ул. Примерная, д. 1',
      yandexMapUrl: 'https://yandex.ru/maps/?example=octava',
    },
    create: {
      id: contacts.id,
      phoneMain: '+7 (495) 000-00-00',
      email: 'info@octava.ru',
      telegramUrl: 'https://t.me/octava_clinic',
      whatsappUrl: 'https://wa.me/79990000000',
      addressText: 'г. Москва, ул. Примерная, д. 1',
      yandexMapUrl: 'https://yandex.ru/maps/?example=octava',
    },
  });

  await prisma.contactsWorkingHours.deleteMany({
    where: { contactsPageId: contacts.id },
  });

  await prisma.contactsWorkingHours.createMany({
    data: [
      {
        contactsPageId: contacts.id,
        dayGroup: DayGroup.WEEKDAYS,
        openMinutes: 10 * 60,
        closeMinutes: 20 * 60,
        isClosed: false,
      },
      {
        contactsPageId: contacts.id,
        dayGroup: DayGroup.SATURDAY,
        openMinutes: 11 * 60,
        closeMinutes: 18 * 60,
        isClosed: false,
      },
      {
        contactsPageId: contacts.id,
        dayGroup: DayGroup.SUNDAY,
        openMinutes: null,
        closeMinutes: null,
        isClosed: true,
      },
    ],
  });

  const pdn = await prisma.staticPage.findUniqueOrThrow({
    where: { type: StaticPageType.PERSONAL_DATA_POLICY },
  });

  await prisma.policyPage.upsert({
    where: { id: pdn.id },
    update: {
      title: 'Политика обработки персональных данных',
      body:
        'Настоящая политика определяет правила обработки персональных данных в ООО «Октава» и меры по их защите. Мы используем данные только для работы клиники и соблюдаем требования законодательства РФ.',
    },
    create: {
      id: pdn.id,
      title: 'Политика обработки персональных данных',
      body:
        'Настоящая политика определяет правила обработки персональных данных в ООО «Октава» и меры по их защите. Мы используем данные только для работы клиники и соблюдаем требования законодательства РФ.',
    },
  });

  const privacy = await prisma.staticPage.findUniqueOrThrow({
    where: { type: StaticPageType.PRIVACY_POLICY },
  });

  await prisma.policyPage.upsert({
    where: { id: privacy.id },
    update: {
      title: 'Политика конфиденциальности',
      body:
        'Мы уважаем личные данные пациентов и применяем организационные и технические меры безопасности. Подробно раскрываем цели сбора, сроки хранения и права пользователей.',
    },
    create: {
      id: privacy.id,
      title: 'Политика конфиденциальности',
      body:
        'Мы уважаем личные данные пациентов и применяем организационные и технические меры безопасности. Подробно раскрываем цели сбора, сроки хранения и права пользователей.',
    },
  });

  const pageIds = [home.id, about.id, contacts.id, pdn.id, privacy.id];

  for (const pid of pageIds) {
    await prisma.seoStaticPage.upsert({
      where: { pageId: pid },
      update: {
        metaTitle: 'Клиника OCTAVA — антивозрастная и эстетическая медицина',
        metaDescription:
          'Комплексная диагностика, авторские протоколы и мультидисциплинарная команда. Записаться на консультацию.',
        canonicalUrl: null,
        robotsIndex: true,
        robotsFollow: true,
        ogTitle: 'OCTAVA',
        ogDescription: 'Антивозрастная медицина и косметология',
        ogImageId: null,
      },
      create: {
        pageId: pid,
        metaTitle: 'Клиника OCTAVA — антивозрастная и эстетическая медицина',
        metaDescription:
          'Комплексная диагностика, авторские протоколы и мультидисциплинарная команда. Записаться на консультацию.',
        canonicalUrl: null,
        robotsIndex: true,
        robotsFollow: true,
        ogTitle: 'OCTAVA',
        ogDescription: 'Антивозрастная медицина и косметология',
        ogImageId: null,
      },
    });
  }
}

type ServiceSeed = {
  categorySlug: string;
  name: string;
  slug: string;
  shortOffer: string;
  priceFrom: string;
  durationMinutes: number;
  benefit1: string;
  benefit2: string;
  prices: Array<{ title: string; price: string; durationMinutes: number; type: ServicePriceType; order: number }>;
  indications: string[];
  contraindications: string[];
  preparation: string[];
  rehab: string[];
  faq: Array<{ question: string; answer: string }>;
};

type DeviceImageSeed = {
  filename: string;
  purpose: ImagePurpose;
  alt?: string;
  caption?: string;
  order?: number;
};

type DeviceSeed = {
  brand: string;
  model: string;
  slug: string;
  positioning?: string;
  principle?: string;
  safetyNotes?: string;
  heroImage?: DeviceImageSeed;
  galleryImages?: DeviceImageSeed[];
  inlineImages?: DeviceImageSeed[];
  certBadges?: Array<{ type: DeviceCertType; label: string; image?: DeviceImageSeed }>;
  attachments?: Array<{ name: string; description?: string; image?: DeviceImageSeed }>;
  indications?: string[];
  contraindications?: string[];
  sideEffects?: Array<{ text: string; rarity: Rarity }>;
  faq?: Array<{ question: string; answer: string; order?: number }>;
  seo?: { metaTitle?: string | null; metaDescription?: string | null };
};

async function seedCatalog() {
  const categories = [
    {
      name: 'Инъекционные методики',
      slug: 'injekcionnye-metodiki',
      description: 'Препараты с доказанной эффективностью для омоложения и коррекции.',
    },
    {
      name: 'Аппаратная косметология',
      slug: 'apparatnaya-kosmetologiya',
      description: 'Технологии для лифтинга, улучшения тона кожи и ремоделирования силуэта.',
    },
    {
      name: 'Эстетическая терапия',
      slug: 'esteticheskaya-terapiya',
      description: 'Уходовые процедуры и массажи для восстановления ресурса и сияния кожи.',
    },
    {
      name: 'Диагностика и консультации',
      slug: 'diagnostika-i-konsultacii',
      description: 'Стартовый этап: обследования, индивидуальные планы и маршрутизация.',
    },
  ];

  for (const cat of categories) {
    await prisma.serviceCategory.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        description: cat.description,
      },
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
      },
    });
  }

  const services: ServiceSeed[] = [
    {
      categorySlug: 'injekcionnye-metodiki',
      name: 'Биоревитализация гиалуроновой кислотой',
      slug: 'biorevitalizaciya-gk',
      shortOffer: 'Гидратация и улучшение качества кожи для равномерного тона и упругости.',
      priceFrom: '6500',
      durationMinutes: 60,
      benefit1: 'Восстанавливает уровень увлажнённости и эластичность.',
      benefit2: 'Снижает выраженность мелких морщин.',
      prices: [
        {
          title: 'Одна зона',
          price: '6500',
          durationMinutes: 45,
          type: ServicePriceType.BASE,
          order: 1,
        },
        {
          title: 'Две зоны',
          price: '11000',
          durationMinutes: 60,
          type: ServicePriceType.EXTRA,
          order: 2,
        },
      ],
      indications: ['Сухость и тусклость кожи', 'Дегидратация после солнца или стрессов'],
      contraindications: ['Острые воспалительные процессы', 'Беременность и лактация'],
      preparation: [
        'За двое суток не принимать алкоголь и НПВС',
        'Сообщить врачу об аллергиях и хронических заболеваниях',
      ],
      rehab: [
        'Избегать саун и активного спорта 3 дня',
        'Наносить успокаивающий крем по рекомендации врача',
      ],
      faq: [
        {
          question: 'Когда виден эффект?',
          answer: 'Первое улучшение через 5–7 дней, курсом 3–4 процедуры для стойкого результата.',
        },
        {
          question: 'Есть ли ограничения после процедуры?',
          answer: 'В течение суток не наносить макияж и избегать нагрева кожи.',
        },
      ],
    },
    {
      categorySlug: 'injekcionnye-metodiki',
      name: 'Мезотерапия витаминами и пептидами',
      slug: 'mezoterapiya-vitaminami',
      shortOffer: 'Комплексный коктейль для питания кожи и повышения её плотности.',
      priceFrom: '5200',
      durationMinutes: 50,
      benefit1: 'Поддерживает тонус и улучшает цвет лица.',
      benefit2: 'Стимулирует выработку собственного коллагена.',
      prices: [
        {
          title: 'Стандартная процедура',
          price: '5200',
          durationMinutes: 50,
          type: ServicePriceType.BASE,
          order: 1,
        },
        {
          title: 'Курс из 4 процедур',
          price: '19000',
          durationMinutes: 50,
          type: ServicePriceType.EXTRA,
          order: 2,
        },
      ],
      indications: ['Тусклый цвет лица', 'Мимические морщины на ранней стадии'],
      contraindications: ['Инфекции кожи в зоне обработки', 'Онкология в активной фазе'],
      preparation: ['За день исключить алкоголь', 'Обсудить приём антикоагулянтов с врачом'],
      rehab: ['В течение суток не пользоваться косметикой', 'Увлажнять кожу по схеме специалиста'],
      faq: [
        {
          question: 'Сколько длится курс?',
          answer: 'Оптимально 4–6 процедур с интервалом 7–10 дней.',
        },
        {
          question: 'Как долго держится результат?',
          answer: 'Средний срок — 6–9 месяцев, зависит от образа жизни и ухода.',
        },
      ],
    },
    {
      categorySlug: 'injekcionnye-metodiki',
      name: 'Ботулинотерапия',
      slug: 'botulinoterapiya',
      shortOffer: 'Коррекция мимических морщин с естественным сохранением мимики.',
      priceFrom: '7800',
      durationMinutes: 45,
      benefit1: 'Расслабляет гиперактивные мышцы и разглаживает заломы.',
      benefit2: 'Профилактирует появление новых морщин.',
      prices: [
        {
          title: 'Межбровье',
          price: '7800',
          durationMinutes: 30,
          type: ServicePriceType.BASE,
          order: 1,
        },
        {
          title: 'Лоб + межбровье',
          price: '12500',
          durationMinutes: 45,
          type: ServicePriceType.EXTRA,
          order: 2,
        },
      ],
      indications: ['Морщины в области лба и межбровья', 'Гипергидроз подмышечных впадин'],
      contraindications: ['Беременность и ГВ', 'Миастения, заболевания нервно-мышечной передачи'],
      preparation: ['За сутки исключить алкоголь и сауну', 'Сообщить врачу о приёме антибиотиков'],
      rehab: ['Не наклоняться и не трогать область инъекций 4 часа', 'Не посещать бани и солярии 3 дня'],
      faq: [
        {
          question: 'Когда появится результат?',
          answer: 'Эффект проявляется через 3–5 дней и усиливается до 14 дней.',
        },
        {
          question: 'Сколько держится действие?',
          answer: 'В среднем 4–6 месяцев, затем требуется поддержка.',
        },
      ],
    },
    {
      categorySlug: 'injekcionnye-metodiki',
      name: 'Контурная пластика',
      slug: 'konturnaya-plastika',
      shortOffer: 'Восстановление объёмов и чётких контуров лица с сохранением естественности.',
      priceFrom: '13500',
      durationMinutes: 70,
      benefit1: 'Возвращает утраченные объёмы и уменьшает носогубные складки.',
      benefit2: 'Используются сертифицированные филлеры с безопасным профилем.',
      prices: [
        {
          title: 'Скулы или подбородок',
          price: '13500',
          durationMinutes: 60,
          type: ServicePriceType.BASE,
          order: 1,
        },
        {
          title: 'Коррекция нескольких зон',
          price: '24500',
          durationMinutes: 80,
          type: ServicePriceType.EXTRA,
          order: 2,
        },
      ],
      indications: ['Потеря объёма в средней трети лица', 'Нечёткий овал и подбородок'],
      contraindications: ['Аутоиммунные заболевания в обострении', 'Беременность и лактация'],
      preparation: ['Прекратить приём разжижающих кровь средств за 3 дня в согласовании с врачом', 'Убрать алкоголь за сутки'],
      rehab: ['Охлаждать зону по рекомендации врача', 'Исключить спорт и сауны 48 часов'],
      faq: [
        {
          question: 'Сколько держится филлер?',
          answer: 'В среднем 9–12 месяцев, зависит от препарата и метаболизма.',
        },
        {
          question: 'Есть ли отёк?',
          answer: 'Небольшой отёк возможен первые сутки и проходит самостоятельно.',
        },
      ],
    },
    {
      categorySlug: 'apparatnaya-kosmetologiya',
      name: 'RF-лифтинг лица и шеи',
      slug: 'rf-lifting-litsa',
      shortOffer: 'Радиочастотное прогревание для уплотнения кожи и улучшения овала.',
      priceFrom: '7200',
      durationMinutes: 55,
      benefit1: 'Стимулирует выработку коллагена.',
      benefit2: 'Повышает тонус и уменьшает дряблость.',
      prices: [
        {
          title: 'Лицо',
          price: '7200',
          durationMinutes: 45,
          type: ServicePriceType.BASE,
          order: 1,
        },
        {
          title: 'Лицо + шея',
          price: '9800',
          durationMinutes: 55,
          type: ServicePriceType.EXTRA,
          order: 2,
        },
      ],
      indications: ['Снижение упругости кожи', 'Нечёткий контур нижней трети лица'],
      contraindications: ['Наличие кардиостимулятора', 'Кожные воспаления в зоне обработки'],
      preparation: ['Убрать активный загар за 2 недели', 'Согласовать процедуры с дерматологом при заболеваниях кожи'],
      rehab: ['Избегать сауны и горячего душа сутки', 'Использовать увлажняющий крем'],
      faq: [
        {
          question: 'Есть ли реабилитация?',
          answer: 'Обычно нет, может быть кратковременное покраснение до 2 часов.',
        },
        {
          question: 'Сколько нужно процедур?',
          answer: 'Курс 4–6 сеансов раз в 1–2 недели для выраженного эффекта.',
        },
      ],
    },
    {
      categorySlug: 'apparatnaya-kosmetologiya',
      name: 'Лазерное омоложение',
      slug: 'lazernoe-omolozhenie',
      shortOffer: 'Выравнивание тона, уменьшение пор и улучшение текстуры кожи.',
      priceFrom: '11500',
      durationMinutes: 60,
      benefit1: 'Запускает процессы обновления и ремоделирования дермы.',
      benefit2: 'Снижает проявления постакне и пигментации.',
      prices: [
        {
          title: 'Лицо',
          price: '11500',
          durationMinutes: 60,
          type: ServicePriceType.BASE,
          order: 1,
        },
        {
          title: 'Лицо + шея',
          price: '14900',
          durationMinutes: 75,
          type: ServicePriceType.EXTRA,
          order: 2,
        },
      ],
      indications: ['Постакне и неровный рельеф', 'Пигментация и фотостарение'],
      contraindications: ['Беременность', 'Недавний активный загар'],
      preparation: ['Отказаться от солярия и пилингов за 2 недели', 'Использовать SPF 50 ежедневно'],
      rehab: ['Соблюдать фотопротекцию 4 недели', 'Не использовать кислоты и ретинол 10 дней'],
      faq: [
        {
          question: 'Больно ли во время процедуры?',
          answer: 'Используется комфортный режим с охлаждением, возможно легкое пощипывание.',
        },
        {
          question: 'Когда ждать результат?',
          answer: 'Первые изменения заметны через 7–10 дней, курс 3–4 процедуры.',
        },
      ],
    },
    {
      categorySlug: 'apparatnaya-kosmetologiya',
      name: 'SMAS-лифтинг ультразвуком',
      slug: 'smas-lifting-ultrazvuk',
      shortOffer: 'Глубинное прогревание ультразвуком для подтяжки без хирургии.',
      priceFrom: '32000',
      durationMinutes: 90,
      benefit1: 'Работает на уровне SMAS, формируя чёткий овал.',
      benefit2: 'Результат нарастает в течение 2–3 месяцев.',
      prices: [
        {
          title: 'Полное лицо',
          price: '32000',
          durationMinutes: 90,
          type: ServicePriceType.BASE,
          order: 1,
        },
        {
          title: 'Лицо + шея + декольте',
          price: '42000',
          durationMinutes: 110,
          type: ServicePriceType.EXTRA,
          order: 2,
        },
      ],
      indications: ['Птоз мягких тканей', 'Размытый угол нижней челюсти'],
      contraindications: ['Металлические импланты в зоне воздействия', 'Беременность'],
      preparation: ['Предварительная консультация с врачом', 'Снять металлические украшения перед процедурой'],
      rehab: ['Избегать активного массажа лица неделю', 'Использовать успокаивающие средства по рекомендации врача'],
      faq: [
        {
          question: 'Нужно ли повторять процедуру?',
          answer: 'Как правило, достаточно одного сеанса раз в 12–18 месяцев.',
        },
        {
          question: 'Когда заметен эффект?',
          answer: 'Первые изменения через 2–4 недели, итоговый результат — к 2–3 месяцам.',
        },
      ],
    },
    {
      categorySlug: 'apparatnaya-kosmetologiya',
      name: 'Микротоковая терапия',
      slug: 'mikrotokovaya-terapiya',
      shortOffer: 'Мягкая стимуляция для улучшения микроциркуляции и тонуса.',
      priceFrom: '4200',
      durationMinutes: 50,
      benefit1: 'Снимает отёчность и улучшает цвет лица.',
      benefit2: 'Укрепляет мышцы и повышает упругость кожи.',
      prices: [
        {
          title: 'Одна зона',
          price: '4200',
          durationMinutes: 40,
          type: ServicePriceType.BASE,
          order: 1,
        },
        {
          title: 'Лицо + шея',
          price: '6400',
          durationMinutes: 55,
          type: ServicePriceType.EXTRA,
          order: 2,
        },
      ],
      indications: ['Отёчность и тусклый цвет лица', 'Снижение тонуса мышц'],
      contraindications: ['Кардиостимулятор', 'Эпилепсия'],
      preparation: ['Не наносить тяжёлый макияж за день', 'Обсудить наличие имплантов с врачом'],
      rehab: ['Использовать увлажняющий уход', 'Не перегревать кожу в день процедуры'],
      faq: [
        {
          question: 'Сколько длится курс?',
          answer: 'Обычно 8–10 процедур 1–2 раза в неделю.',
        },
        {
          question: 'Есть ли ощущения во время сеанса?',
          answer: 'Лёгкое покалывание и ритмичные сокращения мышц, без боли.',
        },
      ],
    },
    {
      categorySlug: 'esteticheskaya-terapiya',
      name: 'Авторский уход «Глубокое увлажнение»',
      slug: 'uhod-glubokoe-uvlazhnenie',
      shortOffer: 'Многоэтапный уход для восстановления баланса кожи и сияния.',
      priceFrom: '4800',
      durationMinutes: 70,
      benefit1: 'Мягко отшелушивает и насыщает кожу влагой.',
      benefit2: 'Подходит для чувствительной кожи.',
      prices: [
        {
          title: 'Базовый уход',
          price: '4800',
          durationMinutes: 70,
          type: ServicePriceType.BASE,
          order: 1,
        },
        {
          title: 'Базовый + сыворотка по показаниям',
          price: '6200',
          durationMinutes: 80,
          type: ServicePriceType.EXTRA,
          order: 2,
        },
      ],
      indications: ['Сухость и ощущение стянутости', 'Неровный микрорельеф'],
      contraindications: ['Активные дерматиты', 'Аллергия на компоненты ухода'],
      preparation: ['За день не использовать агрессивные пилинги', 'Сообщить косметологу о чувствительности кожи'],
      rehab: ['Использовать SPF 50', 'Не применять ретинол и кислоты 5 дней'],
      faq: [
        {
          question: 'Сколько этапов в процедуре?',
          answer: 'Очищение, энзимный пилинг, сыворотка, массаж и завершающий крем.',
        },
        {
          question: 'Подходит ли для беременных?',
          answer: 'Используем щадящие формулы, но решение принимает врач после консультации.',
        },
      ],
    },
    {
      categorySlug: 'esteticheskaya-terapiya',
      name: 'Релакс-массаж лица',
      slug: 'relaks-massazh-lica',
      shortOffer: 'Мануальная техника для снятия напряжения и улучшения тонуса.',
      priceFrom: '3500',
      durationMinutes: 50,
      benefit1: 'Улучшает микроциркуляцию и лимфоток.',
      benefit2: 'Снижает мышечные зажимы и стресс.',
      prices: [
        {
          title: 'Классический сеанс',
          price: '3500',
          durationMinutes: 50,
          type: ServicePriceType.BASE,
          order: 1,
        },
        {
          title: 'Расширенный сеанс 70 мин',
          price: '4500',
          durationMinutes: 70,
          type: ServicePriceType.EXTRA,
          order: 2,
        },
      ],
      indications: ['Повышенное напряжение мышц', 'Усталость и отёчность лица'],
      contraindications: ['Кожные инфекции и высыпания', 'Системные заболевания в обострении'],
      preparation: ['Не применять плотный макияж в день процедуры', 'Сообщить о проблемах с сосудами'],
      rehab: ['Пить достаточно воды', 'Избегать тяжёлых нагрузок 12 часов'],
      faq: [
        {
          question: 'Можно ли сочетать с аппаратными процедурами?',
          answer: 'Да, массаж входит в протоколы реабилитации, график согласовываем с врачом.',
        },
        {
          question: 'Как часто нужен массаж?',
          answer: 'Курс 6–8 процедур с периодичностью 1–2 раза в неделю.',
        },
      ],
    },
    {
      categorySlug: 'esteticheskaya-terapiya',
      name: 'Пилинг миндальной кислотой',
      slug: 'piling-mindalnyj',
      shortOffer: 'Мягкое обновление кожи без выраженной реабилитации.',
      priceFrom: '4100',
      durationMinutes: 45,
      benefit1: 'Выравнивает тон, уменьшает поствоспалительные пятна.',
      benefit2: 'Подходит для чувствительной кожи и первых процедур.',
      prices: [
        {
          title: 'Одна процедура',
          price: '4100',
          durationMinutes: 45,
          type: ServicePriceType.BASE,
          order: 1,
        },
        {
          title: 'Курс из 4 процедур',
          price: '15000',
          durationMinutes: 45,
          type: ServicePriceType.EXTRA,
          order: 2,
        },
      ],
      indications: ['Неровный тон кожи', 'Постакне и расширенные поры'],
      contraindications: ['Аллергия на миндальную кислоту', 'Герпес в стадии обострения'],
      preparation: ['Исключить загар за 7 дней', 'Прекратить использование кислотных средств за 3 дня'],
      rehab: ['Использовать SPF 50 и увлажняющий крем', 'Не применять скрабы 7 дней'],
      faq: [
        {
          question: 'Будет ли шелушение?',
          answer: 'Возможное лёгкое шелушение в течение 2–3 дней, легко контролируется уходом.',
        },
        {
          question: 'Нужно ли заранее готовить кожу?',
          answer: 'За неделю используем мягкий уход без кислот, при необходимости врач даст схему препилинга.',
        },
      ],
    },
    {
      categorySlug: 'esteticheskaya-terapiya',
      name: 'Миофасциальный массаж тела',
      slug: 'miofascialnyj-massazh',
      shortOffer: 'Глубокая работа с мышцами и фасциями для свободы движений.',
      priceFrom: '5200',
      durationMinutes: 80,
      benefit1: 'Устраняет мышечные блоки и асимметрии.',
      benefit2: 'Улучшает осанку и самочувствие.',
      prices: [
        {
          title: 'Сеанс 60 мин',
          price: '5200',
          durationMinutes: 60,
          type: ServicePriceType.BASE,
          order: 1,
        },
        {
          title: 'Сеанс 90 мин',
          price: '6800',
          durationMinutes: 90,
          type: ServicePriceType.EXTRA,
          order: 2,
        },
      ],
      indications: ['Хроническое напряжение спины', 'Нарушения осанки и ограничение подвижности'],
      contraindications: ['Острые воспалительные процессы', 'Тромбоз и тяжёлые сердечно-сосудистые заболевания'],
      preparation: ['Не переедать за 2 часа до процедуры', 'Сообщить врачу о травмах и операциях'],
      rehab: ['Поддерживать водный баланс', 'Избегать тяжёлых нагрузок сутки'],
      faq: [
        {
          question: 'Больно ли?',
          answer: 'Может быть интенсивно, но специалист контролирует комфорт и адаптирует давление.',
        },
        {
          question: 'Сколько нужно сеансов?',
          answer: 'Обычно 5–8 процедур раз в неделю, далее поддерживающий массаж.',
        },
      ],
    },
    {
      categorySlug: 'diagnostika-i-konsultacii',
      name: 'Первичная консультация врача-косметолога',
      slug: 'konsultaciya-vracha',
      shortOffer: 'Сбор анамнеза, осмотр и персональный план процедур.',
      priceFrom: '2000',
      durationMinutes: 45,
      benefit1: 'Определяем цели и формируем маршрут лечения.',
      benefit2: 'Вы получаете расписанный план с этапами и бюджетом.',
      prices: [
        {
          title: 'Очная консультация',
          price: '2000',
          durationMinutes: 45,
          type: ServicePriceType.BASE,
          order: 1,
        },
        {
          title: 'Повторная консультация',
          price: '1500',
          durationMinutes: 30,
          type: ServicePriceType.EXTRA,
          order: 2,
        },
      ],
      indications: ['Первичный визит в клинику', 'Необходимость составить индивидуальный план'],
      contraindications: ['Отсутствуют'],
      preparation: ['Соберите сведения о перенесённых процедурах и лекарствах', 'Придите без макияжа для осмотра кожи'],
      rehab: ['Следовать рекомендациям врача', 'При необходимости записаться на назначенные процедуры'],
      faq: [
        {
          question: 'Нужно ли приносить результаты анализов?',
          answer: 'Если есть свежие исследования, возьмите их — это поможет точнее подобрать план.',
        },
        {
          question: 'Сколько времени занимает консультация?',
          answer: 'Обычно 30–45 минут, включая составление плана и ответы на вопросы.',
        },
      ],
    },
    {
      categorySlug: 'diagnostika-i-konsultacii',
      name: 'Дерматоскопия и фотофиксация',
      slug: 'dermatoskopiya',
      shortOffer: 'Инструментальная оценка состояния кожи и родинок.',
      priceFrom: '2800',
      durationMinutes: 40,
      benefit1: 'Позволяет отслеживать изменения во времени.',
      benefit2: 'Фиксирует базовую точку для выбора процедур.',
      prices: [
        {
          title: 'Исследование кожи лица',
          price: '2800',
          durationMinutes: 40,
          type: ServicePriceType.BASE,
          order: 1,
        },
        {
          title: 'Расширенное исследование',
          price: '3600',
          durationMinutes: 55,
          type: ServicePriceType.EXTRA,
          order: 2,
        },
      ],
      indications: ['Контроль новообразований', 'Подбор протокола лечения кожи'],
      contraindications: ['Острые воспалительные заболевания кожи'],
      preparation: ['Не использовать автозагар и тональные средства за сутки', 'Сообщить о приёме лекарств'],
      rehab: ['Нет ограничений', 'Следовать рекомендациям врача по уходу'],
      faq: [
        {
          question: 'Нужно ли специальное освещение?',
          answer: 'Мы используем собственное оборудование, дополнительных условий не требуется.',
        },
        {
          question: 'Опасна ли процедура?',
          answer: 'Нет, обследование не инвазивно и подходит всем пациентам.',
        },
      ],
    },
    {
      categorySlug: 'diagnostika-i-konsultacii',
      name: 'Планирование anti-age программы',
      slug: 'plan-anti-age',
      shortOffer: 'Комплексный маршрут с учётом генетики, образа жизни и задач.',
      priceFrom: '5200',
      durationMinutes: 60,
      benefit1: 'Включает подбор лабораторной диагностики.',
      benefit2: 'Содержит календарь процедур и контрольные точки.',
      prices: [
        {
          title: 'Разработка программы',
          price: '5200',
          durationMinutes: 60,
          type: ServicePriceType.BASE,
          order: 1,
        },
        {
          title: 'Коррекция плана через 3 месяца',
          price: '2600',
          durationMinutes: 45,
          type: ServicePriceType.EXTRA,
          order: 2,
        },
      ],
      indications: ['Желание системно работать с возрастными изменениями', 'Необходимость согласовать процедуры в единый план'],
      contraindications: ['Нет специфических ограничений'],
      preparation: ['Принести результаты анализов, если есть', 'Ответить на вопросы о привычках и питании'],
      rehab: ['Следовать расписанию визитов и контролей', 'Вести дневник самочувствия при необходимости'],
      faq: [
        {
          question: 'Что входит в итоговый документ?',
          answer: 'Календарь процедур, рекомендации по уходу, список анализов и план наблюдений.',
        },
        {
          question: 'Можно ли менять план?',
          answer: 'Да, врач корректирует программу на контрольных визитах.',
        },
      ],
    },
    {
      categorySlug: 'diagnostika-i-konsultacii',
      name: 'Лабораторный скрининг для косметологических процедур',
      slug: 'lab-skrining',
      shortOffer: 'Подбор анализов перед процедурами для безопасного проведения.',
      priceFrom: '3900',
      durationMinutes: 30,
      benefit1: 'Исключает противопоказания и повышает безопасность.',
      benefit2: 'Включает разбор результатов с врачом.',
      prices: [
        {
          title: 'Базовый пакет',
          price: '3900',
          durationMinutes: 30,
          type: ServicePriceType.BASE,
          order: 1,
        },
        {
          title: 'Расширенный пакет',
          price: '6200',
          durationMinutes: 40,
          type: ServicePriceType.EXTRA,
          order: 2,
        },
      ],
      indications: ['Подготовка к инъекциям и аппаратным процедурам', 'Комплексный чек-ап кожи'],
      contraindications: ['Индивидуальные ограничения на забор крови'],
      preparation: ['Сдавать анализы натощак, если рекомендовано', 'Сообщить врачу о принимаемых препаратах'],
      rehab: ['Получить консультацию по результатам', 'Следовать рекомендациям по корректировке процедур'],
      faq: [
        {
          question: 'Можно ли сдать анализы в другой лаборатории?',
          answer: 'Да, главное — принести результаты, соответствующие перечню исследований.',
        },
        {
          question: 'Нужна ли подготовка к сдаче крови?',
          answer: 'Большинство анализов сдаются натощак, подробный список выдаёт врач.',
        },
      ],
    },
  ];

  const categoriesMap = await prisma.serviceCategory.findMany();
  const categoryBySlug = new Map(categoriesMap.map((c) => [c.slug, c.id]));

  for (const svc of services) {
    const categoryId = categoryBySlug.get(svc.categorySlug);

    if (!categoryId) {
      throw new Error(`Category not found for service ${svc.slug}`);
    }

    const service = await prisma.service.upsert({
      where: { slug: svc.slug },
      update: {
        name: svc.name,
        categoryId,
        shortOffer: svc.shortOffer,
        priceFrom: svc.priceFrom,
        durationMinutes: svc.durationMinutes,
        benefit1: svc.benefit1,
        benefit2: svc.benefit2,
        ctaText: 'Записаться',
        ctaUrl: '/contacts',
      },
      create: {
        name: svc.name,
        slug: svc.slug,
        categoryId,
        shortOffer: svc.shortOffer,
        priceFrom: svc.priceFrom,
        durationMinutes: svc.durationMinutes,
        benefit1: svc.benefit1,
        benefit2: svc.benefit2,
        ctaText: 'Записаться',
        ctaUrl: '/contacts',
      },
    });

    await prisma.servicePriceExtended.deleteMany({ where: { serviceId: service.id } });
    await prisma.servicePriceExtended.createMany({
      data: svc.prices.map((p) => ({
        serviceId: service.id,
        ...p,
        isActive: true,
      })),
    });

    await prisma.serviceIndication.deleteMany({ where: { serviceId: service.id } });
    await prisma.serviceIndication.createMany({
      data: svc.indications.map((text) => ({ serviceId: service.id, text })),
      skipDuplicates: true,
    });

    await prisma.serviceContraindication.deleteMany({ where: { serviceId: service.id } });
    await prisma.serviceContraindication.createMany({
      data: svc.contraindications.map((text) => ({ serviceId: service.id, text })),
      skipDuplicates: true,
    });

    await prisma.servicePreparationStep.deleteMany({ where: { serviceId: service.id } });
    await prisma.servicePreparationStep.createMany({
      data: svc.preparation.map((text, index) => ({
        serviceId: service.id,
        text,
        order: index + 1,
      })),
    });

    await prisma.serviceRehabStep.deleteMany({ where: { serviceId: service.id } });
    await prisma.serviceRehabStep.createMany({
      data: svc.rehab.map((text, index) => ({
        serviceId: service.id,
        text,
        order: index + 1,
      })),
    });

    await prisma.serviceFaq.deleteMany({ where: { serviceId: service.id } });
    await prisma.serviceFaq.createMany({
      data: svc.faq.map((item, index) => ({
        serviceId: service.id,
        question: item.question,
        answer: item.answer,
        order: index + 1,
      })),
    });

    await prisma.serviceLegalDisclaimer.upsert({
      where: { id: service.id * 1000 + 1 },
      update: {
        serviceId: service.id,
        text: 'Имеются противопоказания. Необходимо получить консультацию специалиста.',
      },
      create: {
        id: service.id * 1000 + 1,
        serviceId: service.id,
        text: 'Имеются противопоказания. Необходимо получить консультацию специалиста.',
      },
    });

    await prisma.seoService.upsert({
      where: { serviceId: service.id },
      update: {
        metaTitle: `${service.name} — клиника OCTAVA`,
        metaDescription: service.shortOffer,
        ogImageId: null,
      },
      create: {
        serviceId: service.id,
        metaTitle: `${service.name} — клиника OCTAVA`,
        metaDescription: service.shortOffer,
        ogImageId: null,
      },
    });
  }

  const categoriesForDirections = await prisma.serviceCategory.findMany({
    orderBy: { id: 'asc' },
    take: 4,
  });

  const home = await prisma.staticPage.findUniqueOrThrow({
    where: { type: StaticPageType.HOME },
  });

  await prisma.homeDirection.deleteMany({ where: { homePageId: home.id } });

  for (let i = 0; i < categoriesForDirections.length; i++) {
    await prisma.homeDirection.create({
      data: {
        homePage: { connect: { id: home.id } },
        category: { connect: { id: categoriesForDirections[i].id } },
        order: i + 1,
      },
    });
  }
}

async function seedDevices() {
  const devices: DeviceSeed[] = [
    {
      brand: 'Ultraformer',
      model: 'III',
      slug: 'ultraformer-iii',
      positioning: 'SMAS-лифтинг и ремоделирование овала лица',
      principle: 'Сфокусированный ультразвук (HIFU)',
      safetyNotes: 'Работает только сертифицированный врач с подбором картриджей по зонам.',
      heroImage: {
        filename: 'device-ultraformer-hero.png',
        purpose: ImagePurpose.HERO,
        alt: 'Аппарат Ultraformer III для SMAS-лифтинга',
      },
      galleryImages: [
        {
          filename: 'device-ultraformer-handle.png',
          purpose: ImagePurpose.GALLERY,
          caption: 'Рукоятки с картриджами разной глубины',
        },
        {
          filename: 'device-ultraformer-panel.png',
          purpose: ImagePurpose.GALLERY,
          caption: 'Панель управления с визуализацией линий',
          order: 2,
        },
      ],
      certBadges: [
        { type: DeviceCertType.CE, label: 'CE Medical Device' },
        { type: DeviceCertType.ROSZDRAV, label: 'Регистрация Росздравнадзора' },
      ],
      attachments: [
        { name: 'Лифтинговая насадка 4.5 мм', description: 'Для работы по SMAS' },
        { name: 'Картридж 1.5 мм', description: 'Деликатные зоны и глазная область' },
      ],
      indications: ['Птоз мягких тканей', 'Нечёткий овал лица', 'Снижение плотности кожи'],
      contraindications: ['Импланты в зоне воздействия', 'Беременность', 'Активные воспаления кожи'],
      sideEffects: [
        { text: 'Лёгкая чувствительность при надавливании 1–3 дня', rarity: Rarity.COMMON },
        { text: 'Преходящая отёчность', rarity: Rarity.UNCOMMON },
      ],
      faq: [
        {
          question: 'Когда виден итоговый лифтинг?',
          answer: 'Коллагеновое ремоделирование занимает 6–12 недель, первые улучшения заметны уже через месяц.',
        },
        {
          question: 'Сколько линий требуется?',
          answer: 'Подбираем индивидуально, в среднем 400–800 линий на лицо и шею.',
          order: 2,
        },
      ],
      seo: {
        metaTitle: 'Ultraformer III — SMAS-лифтинг в OCTAVA',
        metaDescription: 'Сфокусированный ультразвук для чёткого овала лица и лифтинга без реабилитации.',
      },
    },
    {
      brand: 'InMode',
      model: 'Morpheus8 Body',
      slug: 'morpheus8-body',
      positioning: 'Фракционный RF-микроигольчатый лифтинг для плотности кожи',
      principle: 'Комбинированная радиочастота и микроиглы до 8 мм',
      safetyNotes: 'Используются стерильные одноразовые картриджи; требуется аппликационная анестезия.',
      heroImage: {
        filename: 'device-morpheus-hero.png',
        purpose: ImagePurpose.HERO,
        alt: 'Манипула Morpheus8 Body',
      },
      galleryImages: [
        {
          filename: 'device-morpheus-panel.png',
          purpose: ImagePurpose.GALLERY,
          caption: 'Панель с контролем глубины прогрева',
        },
      ],
      attachments: [
        { name: 'Насадка 24 pin', description: 'Коррекция постакне и пор' },
        { name: 'Body-tip 7 pin', description: 'Укрепление кожи живота и рук' },
      ],
      indications: ['Растяжки и постакне', 'Снижение тургора кожи тела', 'Профилактика возрастных изменений'],
      contraindications: ['Беременность и лактация', 'Имплантированные кардиостимуляторы'],
      sideEffects: [
        { text: 'Покраснение и ощущение жара до суток', rarity: Rarity.COMMON },
        { text: 'Корочки в местах проколов', rarity: Rarity.UNCOMMON },
      ],
      faq: [
        {
          question: 'Нужна ли подготовка?',
          answer: 'Достаточно исключить активные загары и агрессивные пилинги за 2 недели.',
        },
      ],
      seo: {
        metaTitle: 'Morpheus8 Body — RF-микроигольчатое омоложение',
        metaDescription: 'Укрепление кожи тела и лица за счёт фракционного прогрева на глубину до 8 мм.',
      },
    },
    {
      brand: 'Lumenis',
      model: 'M22 IPL',
      slug: 'lumenis-m22',
      positioning: 'Фотолечение пигментации и сосудистых проявлений',
      principle: 'Импульсный свет с фильтрами 515–695 нм',
      safetyNotes: 'Подбор фильтров и энергии по фототипу, обязательна защита глаз.',
      heroImage: {
        filename: 'device-m22-hero.png',
        purpose: ImagePurpose.HERO,
        alt: 'Модуль Lumenis M22',
      },
      galleryImages: [
        {
          filename: 'device-m22-handpiece.png',
          purpose: ImagePurpose.GALLERY,
          caption: 'Сменные фильтры для разных задач',
        },
      ],
      certBadges: [{ type: DeviceCertType.FDA, label: 'FDA Cleared' }],
      attachments: [{ name: 'SapphireCool', description: 'Контактное охлаждение для комфорта' }],
      indications: ['Фотостарение и тусклый тон', 'Лентиго и купероз', 'Неровный микрорельеф'],
      contraindications: ['Загар менее чем 2 недели назад', 'Фотосенсибилизирующие препараты'],
      sideEffects: [
        { text: 'Потемнение пигмента на 3–7 дней', rarity: Rarity.COMMON },
      ],
      faq: [
        {
          question: 'Сколько процедур нужно?',
          answer: 'Рекомендуем курс 3–5 сеансов с интервалом 3–4 недели.',
        },
      ],
      seo: {
        metaTitle: 'Lumenis M22 — фотолечение пигментации',
        metaDescription: 'IPL-терапия для сосудов и пигмента с индивидуальным подбором фильтров.',
      },
    },
    {
      brand: 'BTL',
      model: 'Exilis Ultra 360',
      slug: 'btl-exilis-ultra',
      positioning: 'Радиочастотный лифтинг и ремоделирование силуэта',
      principle: 'Монополярная RF и ультразвук с контролем температуры',
      safetyNotes: 'Контроль температуры кожи в реальном времени, процедура комфортная и без анестезии.',
      heroImage: {
        filename: 'device-exilis-hero.png',
        purpose: ImagePurpose.HERO,
        alt: 'Ручка Exilis Ultra 360',
      },
      galleryImages: [
        { filename: 'device-exilis-body.png', purpose: ImagePurpose.GALLERY, caption: 'Насадка для тела с охлаждением' },
      ],
      indications: ['Снижение упругости кожи', 'Локальные жировые отложения', 'Морщины и дряблость'],
      contraindications: ['Металлические импланты в зоне прогрева', 'Беременность'],
      sideEffects: [{ text: 'Кратковременное покраснение кожи', rarity: Rarity.COMMON }],
      faq: [
        { question: 'Есть ли реабилитация?', answer: 'Нет, можно сразу вернуться к обычной активности.' },
      ],
      seo: {
        metaTitle: 'Exilis Ultra 360 — RF-лифтинг без боли',
        metaDescription: 'Комфортный прогрев тканей для лифтинга лица и тела с контролем температуры.',
      },
    },
    {
      brand: 'CoolSculpting',
      model: 'Elite',
      slug: 'coolsculpting-elite',
      positioning: 'Криолиполиз для коррекции фигуры',
      principle: 'Контролируемое охлаждение жировой ткани с двойными аппликаторами',
      safetyNotes: 'Перед установкой аппликатора наносится защитная мембрана; зона оценивается врачом.',
      heroImage: {
        filename: 'device-coolsculpting-hero.png',
        purpose: ImagePurpose.HERO,
        alt: 'Аппликаторы CoolSculpting Elite',
      },
      galleryImages: [
        {
          filename: 'device-coolsculpting-applicators.png',
          purpose: ImagePurpose.GALLERY,
          caption: 'Насадки для живота, бёдер и подподбородочной зоны',
        },
      ],
      indications: ['Локальные жировые ловушки', 'Контурирование живота и фланков'],
      contraindications: ['Грыжи в зоне воздействия', 'Криоглобулинемия'],
      sideEffects: [
        { text: 'Онемение в зоне установки аппликатора до 2 недель', rarity: Rarity.COMMON },
        { text: 'Редко — гематомы после массажа', rarity: Rarity.UNCOMMON },
      ],
      faq: [
        {
          question: 'Когда ждать результата?',
          answer: 'Редукция жировых клеток развивается в течение 6–12 недель после сеанса.',
        },
      ],
      seo: {
        metaTitle: 'CoolSculpting Elite — нехирургическое уменьшение жира',
        metaDescription: 'Криолиполиз с двойными аппликаторами для точечной коррекции силуэта.',
      },
    },
    {
      brand: 'HydraFacial',
      model: 'Syndeo',
      slug: 'hydrafacial-syndeo',
      positioning: 'Гидропиллинг и инфьюзия активных сывороток',
      principle: 'Вакуумный вортекс-поток и последовательные пилинговые этапы',
      safetyNotes: 'Подбор кислотных составов по типу кожи, давление регулируется по ощущениям пациента.',
      heroImage: {
        filename: 'device-hydrafacial-hero.png',
        purpose: ImagePurpose.HERO,
        alt: 'Консоль HydraFacial Syndeo',
      },
      galleryImages: [
        {
          filename: 'device-hydrafacial-handpiece.png',
          purpose: ImagePurpose.GALLERY,
          caption: 'Насадки для очищения и инфьюзии',
        },
      ],
      attachments: [
        { name: 'Dermabuilder', description: 'Пептидный коктейль для упругости' },
        { name: 'Britenol', description: 'Осветление и ровный тон' },
      ],
      indications: ['Комедоны и расширенные поры', 'Тусклый тон', 'Подготовка к лазерным процедурам'],
      contraindications: ['Активный герпес', 'Непереносимость кислот в составе сывороток'],
      sideEffects: [{ text: 'Кратковременное покраснение после вакуумной чистки', rarity: Rarity.COMMON }],
      faq: [
        { question: 'Можно ли делать летом?', answer: 'Да, при использовании SPF и щадящих растворов по показаниям.' },
      ],
      seo: {
        metaTitle: 'HydraFacial Syndeo — многоэтапное очищение',
        metaDescription: 'Гидропиллинг, вакуумная чистка и сыворотки в одном сеансе для сияния кожи.',
      },
    },
    {
      brand: 'Endospheres',
      model: 'Evolution',
      slug: 'endospheres-therapy',
      positioning: 'Микровибрационно-компрессионный массаж',
      principle: 'Ротация сферами с микровибрацией 29–355 Гц',
      safetyNotes: 'Сила давления подбирается индивидуально, важно достаточное увлажнение кожи маслом.',
      heroImage: {
        filename: 'device-endospheres-hero.png',
        purpose: ImagePurpose.HERO,
        alt: 'Аппарат Endospheres Evolution',
      },
      galleryImages: [
        { filename: 'device-endospheres-handpiece.png', purpose: ImagePurpose.GALLERY, caption: 'Манипула с вращающимися сферами' },
      ],
      indications: ['Отёчность и лимфостаз', 'Снижение тонуса кожи тела', 'Целлюлит'],
      contraindications: ['Онкологические заболевания', 'Тромбофлебит'],
      sideEffects: [{ text: 'Лёгкая чувствительность мышц на следующий день', rarity: Rarity.COMMON }],
      faq: [
        {
          question: 'Какой курс нужен?',
          answer: 'Стандартно 8–12 процедур 1–2 раза в неделю, далее поддержка по показаниям.',
        },
      ],
      seo: {
        metaTitle: 'Endospheres Therapy — лимфодренаж и тонус',
        metaDescription: 'Микровибрационный массаж для улучшения микроциркуляции и борьбы с отёками.',
      },
    },
  ];

  for (const seed of devices) {
    const device = await prisma.device.upsert({
      where: { slug: seed.slug },
      update: {
        brand: seed.brand,
        model: seed.model,
        positioning: seed.positioning,
        principle: seed.principle,
        safetyNotes: seed.safetyNotes,
      },
      create: {
        brand: seed.brand,
        model: seed.model,
        slug: seed.slug,
        positioning: seed.positioning,
        principle: seed.principle,
        safetyNotes: seed.safetyNotes,
      },
    });

    await prisma.deviceCertBadge.deleteMany({ where: { deviceId: device.id } });
    await prisma.deviceAttachment.deleteMany({ where: { deviceId: device.id } });
    await prisma.deviceIndication.deleteMany({ where: { deviceId: device.id } });
    await prisma.deviceContraindication.deleteMany({ where: { deviceId: device.id } });
    await prisma.deviceSideEffect.deleteMany({ where: { deviceId: device.id } });
    await prisma.deviceDocument.deleteMany({ where: { deviceId: device.id } });
    await prisma.deviceFaq.deleteMany({ where: { deviceId: device.id } });
    await prisma.deviceImage.deleteMany({ where: { deviceId: device.id } });

    const images: DeviceImageSeed[] = [
      ...(seed.heroImage ? [seed.heroImage] : []),
      ...(seed.galleryImages ?? []),
      ...(seed.inlineImages ?? []),
    ];

    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const file = await ensureSeedImage(img.filename, ONE_PIXEL_BASE64, DEFAULT_IMAGE_META);

      await prisma.deviceImage.create({
        data: {
          deviceId: device.id,
          fileId: file.id,
          purpose: img.purpose,
          order: img.order ?? i,
          alt: img.alt ?? null,
          caption: img.caption ?? null,
        },
      });
    }

    for (const badge of seed.certBadges ?? []) {
      await prisma.deviceCertBadge.create({
        data: {
          deviceId: device.id,
          type: badge.type,
          label: badge.label,
        },
      });
    }

    for (const attachment of seed.attachments ?? []) {
      const imageFile = attachment.image
        ? await ensureSeedImage(attachment.image.filename, ONE_PIXEL_BASE64, DEFAULT_IMAGE_META)
        : null;

      await prisma.deviceAttachment.create({
        data: {
          deviceId: device.id,
          name: attachment.name,
          description: attachment.description,
          imageId: imageFile?.id ?? null,
        },
      });
    }

    for (const text of seed.indications ?? []) {
      await prisma.deviceIndication.create({ data: { deviceId: device.id, text } });
    }

    for (const text of seed.contraindications ?? []) {
      await prisma.deviceContraindication.create({ data: { deviceId: device.id, text } });
    }

    for (const sideEffect of seed.sideEffects ?? []) {
      await prisma.deviceSideEffect.create({
        data: {
          deviceId: device.id,
          text: sideEffect.text,
          rarity: sideEffect.rarity,
        },
      });
    }

    for (let i = 0; i < (seed.faq?.length ?? 0); i++) {
      const item = seed.faq![i];
      await prisma.deviceFaq.create({
        data: {
          deviceId: device.id,
          question: item.question,
          answer: item.answer,
          order: item.order ?? i,
        },
      });
    }

    await prisma.seoDevice.upsert({
      where: { deviceId: device.id },
      update: {
        metaTitle: seed.seo?.metaTitle ?? null,
        metaDescription: seed.seo?.metaDescription ?? null,
        ogImageId: null,
      },
      create: {
        deviceId: device.id,
        metaTitle: seed.seo?.metaTitle ?? null,
        metaDescription: seed.seo?.metaDescription ?? null,
        ogImageId: null,
      },
    });
  }
}

async function main() {
  //await ensureAdmin();
  //await seedOrganization();
  //await seedStaticPages();
  await seedDevices();
  //await seedCatalog();

  console.log('✅ Seed completed');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
