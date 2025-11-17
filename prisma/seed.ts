// prisma/seed.ts
import 'dotenv/config';
import {
  PrismaClient,
  Role,
  StaticPageType,
  DayGroup,
  ImagePurpose,
  FileKind,
  PhoneType,
  ServicePriceType,
  DeviceCertType,
  DeviceDocType,
} from '@prisma/client';
import { hashPassword } from '../src/utils/password';

const prisma = new PrismaClient();

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

async function seedFilesPlaceholders() {
  // Плейсхолдеры картинок
  const paths = [
    'uploads/seed/hero-home.jpg',
    'uploads/seed/gallery-1.jpg',
    'uploads/seed/gallery-2.jpg',
    'uploads/seed/gallery-3.jpg',
    'uploads/seed/gallery-4.jpg',
    'uploads/seed/og.jpg',
  ];
  const result: number[] = [];

  for (const p of paths) {
    const f = await prisma.file.upsert({
      where: { path: p },
      update: {},
      create: {
        kind: FileKind.IMAGE,
        originalName: p.split('/').pop() || 'image.jpg',
        path: p,
        mime: 'image/jpeg',
        sizeBytes: 0,
      },
      select: { id: true },
    });
    result.push(f.id);
  }

  return {
    heroHomeId: result[0],
    galleryIds: result.slice(1, 5),
    ogId: result[5],
  };
}

async function seedOrganization() {
  const org = await prisma.organization.upsert({
    where: { id: 1 },
    update: {},
    create: {
      fullName: 'ООО «Октава»',
      ogrn: '1234567890123',
      inn: '7700000000',
      kpp: '770001001',
      address: 'г. Москва, ул. Примерная, д. 1',
      email: 'info@octava.ru',
    },
  });

  const existsPhone = await prisma.organizationPhone.findFirst({
    where: { organizationId: org.id },
  });

  if (!existsPhone) {
    await prisma.organizationPhone.create({
      data: {
        organizationId: org.id,
        type: PhoneType.MAIN,
        number: '+7 (495) 000-00-00',
        isPrimary: true,
      },
    });
  }
}

async function seedStaticPages(files: {
  heroHomeId: number;
  galleryIds: number[];
  ogId: number;
}) {
  const slugs: Record<StaticPageType, string> = {
    [StaticPageType.HOME]: '',
    [StaticPageType.ABOUT]: 'about',
    [StaticPageType.CONTACTS]: 'contacts',
    [StaticPageType.ORG_INFO]: 'org-info',
    [StaticPageType.PERSONAL_DATA_POLICY]: 'personal-data-policy',
    [StaticPageType.PRIVACY_POLICY]: 'privacy-policy',
  };

  // StaticPage
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

  // HOME
  const home = await prisma.staticPage.findUniqueOrThrow({
    where: { type: StaticPageType.HOME },
  });

  await prisma.homePage.upsert({
    where: { id: home.id },
    update: {
      heroTitle: 'Клиника OCTAVA — молодость и эстетика',
      heroSubtitle:
        'Современные методы антивозрастной медицины и косметологии',
      heroCtaText: 'Записаться на консультацию',
      heroCtaUrl: '/contacts',
      subheroTitle: 'Комплексный подход',
      subheroSubtitle:
        'Индивидуальные протоколы, безопасные технологии и забота о каждом пациенте',
      interiorText:
        'Интерьер OCTAVA создан для того, чтобы вы чувствовали спокойствие, комфорт и доверие с первых минут визита.',
    },
    create: {
      id: home.id,
      heroTitle: 'Клиника OCTAVA — молодость и эстетика',
      heroSubtitle:
        'Современные методы антивозрастной медицины и косметологии',
      heroCtaText: 'Записаться на консультацию',
      heroCtaUrl: '/contacts',
      subheroTitle: 'Комплексный подход',
      subheroSubtitle:
        'Индивидуальные протоколы, безопасные технологии и забота о каждом пациенте',
      interiorText:
        'Интерьер OCTAVA создан для того, чтобы вы чувствовали спокойствие, комфорт и доверие с первых минут визита.',
    },
  });

  // HERO и интерьерные изображения
  await prisma.homeGalleryImage.deleteMany({
    where: { homePageId: home.id },
  });

  await prisma.homeGalleryImage.create({
    data: {
      homePageId: home.id,
      fileId: files.heroHomeId,
      purpose: ImagePurpose.HERO,
      order: 0,
      alt: 'Главный баннер клиники OCTAVA',
    },
  });

  for (let i = 0; i < files.galleryIds.length; i++) {
    await prisma.homeGalleryImage.create({
      data: {
        homePageId: home.id,
        fileId: files.galleryIds[i],
        purpose: ImagePurpose.GALLERY,
        order: i + 1,
        alt: `Интерьер клиники ${i + 1}`,
      },
    });
  }

  // ABOUT
  const about = await prisma.staticPage.findUniqueOrThrow({
    where: { type: StaticPageType.ABOUT },
  });

  await prisma.aboutPage.upsert({
    where: { id: about.id },
    update: {
      heroTitle: 'О клинике OCTAVA',
      heroDescription:
        'Центр антивозрастной и эстетической медицины в Москве. Работаем с акцентом на доказательную базу и безопасность.',
      howWeAchieveText:
        'Подбираем персональные протоколы, используем сертифицированные аппараты и многоступенчатый контроль качества.',
    },
    create: {
      id: about.id,
      heroTitle: 'О клинике OCTAVA',
      heroDescription:
        'Центр антивозрастной и эстетической медицины в Москве. Работаем с акцентом на доказательную базу и безопасность.',
      howWeAchieveText:
        'Подбираем персональные протоколы, используем сертифицированные аппараты и многоступенчатый контроль качества.',
    },
  });

  // CONTACTS
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
      yandexMapUrl: 'https://yandex.ru/maps/?some_map_link',
    },
    create: {
      id: contacts.id,
      phoneMain: '+7 (495) 000-00-00',
      email: 'info@octava.ru',
      telegramUrl: 'https://t.me/octava_clinic',
      whatsappUrl: 'https://wa.me/79990000000',
      addressText: 'г. Москва, ул. Примерная, д. 1',
      yandexMapUrl: 'https://yandex.ru/maps/?some_map_link',
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

  // Политики
  const pdn = await prisma.staticPage.findUniqueOrThrow({
    where: { type: StaticPageType.PERSONAL_DATA_POLICY },
  });

  await prisma.policyPage.upsert({
    where: { id: pdn.id },
    update: {
      title: 'Политика обработки персональных данных',
      body:
        'Настоящая политика обработки персональных данных определяет порядок обработки и меры по обеспечению безопасности персональных данных в ООО «Октава»...',
    },
    create: {
      id: pdn.id,
      title: 'Политика обработки персональных данных',
      body:
        'Настоящая политика обработки персональных данных определяет порядок обработки и меры по обеспечению безопасности персональных данных в ООО «Октава»...',
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
        'Мы уважаем вашу конфиденциальность и обрабатываем данные в соответствии с действующим законодательством РФ...',
    },
    create: {
      id: privacy.id,
      title: 'Политика конфиденциальности',
      body:
        'Мы уважаем вашу конфиденциальность и обрабатываем данные в соответствии с действующим законодательством РФ...',
    },
  });

  // SEO для всех статических страниц
  const pageIds = [home.id, about.id, contacts.id, pdn.id, privacy.id];

  for (const pid of pageIds) {
    await prisma.seoStaticPage.upsert({
      where: { pageId: pid },
      update: {
        metaTitle: 'Клиника OCTAVA — антивозрастная и эстетическая медицина',
        metaDescription:
          'Процедуры, авторские протоколы и современные аппараты. Запись на консультацию в Москве.',
        canonicalUrl: null,
        robotsIndex: true,
        robotsFollow: true,
        ogTitle: 'OCTAVA',
        ogDescription: 'Антивозрастная медицина и косметология',
        ogImageId: files.ogId,
      },
      create: {
        pageId: pid,
        metaTitle: 'Клиника OCTAVA — антивозрастная и эстетическая медицина',
        metaDescription:
          'Процедуры, авторские протоколы и современные аппараты. Запись на консультацию в Москве.',
        canonicalUrl: null,
        robotsIndex: true,
        robotsFollow: true,
        ogTitle: 'OCTAVA',
        ogDescription: 'Антивозрастная медицина и косметология',
        ogImageId: files.ogId,
      },
    });
  }
}

async function seedCatalog(files: { ogId: number }) {
  // Категории
  const catMassage = await prisma.serviceCategory.upsert({
    where: { slug: 'massazh' },
    update: {
      name: 'Массаж',
      description: 'Классические и авторские массажные техники.',
    },
    create: {
      name: 'Массаж',
      slug: 'massazh',
      description: 'Классические и авторские массажные техники.',
    },
  });

  const catSpa = await prisma.serviceCategory.upsert({
    where: { slug: 'spa' },
    update: {
      name: 'SPA',
      description: 'SPA-ритуалы и уходовые программы.',
    },
    create: {
      name: 'SPA',
      slug: 'spa',
      description: 'SPA-ритуалы и уходовые программы.',
    },
  });

  // SEO категорий
  await prisma.seoCategory.upsert({
    where: { categoryId: catMassage.id },
    update: {
      metaTitle: 'Массаж в клинике OCTAVA',
      metaDescription: 'Тайский, классический и другие виды массажа. Москва.',
      ogImageId: files.ogId,
    },
    create: {
      categoryId: catMassage.id,
      metaTitle: 'Массаж в клинике OCTAVA',
      metaDescription: 'Тайский, классический и другие виды массажа. Москва.',
      ogImageId: files.ogId,
    },
  });

  await prisma.seoCategory.upsert({
    where: { categoryId: catSpa.id },
    update: {
      metaTitle: 'SPA-программы в клинике OCTAVA',
      metaDescription: 'Расслабляющие и восстановительные SPA-ритуалы.',
      ogImageId: files.ogId,
    },
    create: {
      categoryId: catSpa.id,
      metaTitle: 'SPA-программы в клинике OCTAVA',
      metaDescription: 'Расслабляющие и восстановительные SPA-ритуалы.',
      ogImageId: files.ogId,
    },
  });

  // Аппарат
  const device = await prisma.device.upsert({
    where: { slug: 'brandx-modely' },
    update: {
      brand: 'BrandX',
      model: 'ModelY',
      positioning: 'Аппарат для неинвазивного лифтинга',
      principle: 'Высокочастотная энергия, стимулирующая выработку коллагена.',
      safetyNotes:
        'Сертифицированное оборудование, минимальный период реабилитации.',
    },
    create: {
      brand: 'BrandX',
      model: 'ModelY',
      slug: 'brandx-modely',
      positioning: 'Аппарат для неинвазивного лифтинга',
      principle: 'Высокочастотная энергия, стимулирующая выработку коллагена.',
      safetyNotes:
        'Сертифицированное оборудование, минимальный период реабилитации.',
    },
  });

  // Сертификат (бейдж)
  await prisma.deviceCertBadge.upsert({
    where: { id: device.id * 1000 + 1 },
    update: {
      type: DeviceCertType.CE,
      label: 'CE Certified',
    },
    create: {
      id: device.id * 1000 + 1,
      deviceId: device.id,
      type: DeviceCertType.CE,
      label: 'CE Certified',
    },
  });

  // Документ для аппарата — сначала файл, потом DeviceDocument
  const manualPath = `uploads/seed/manual-${device.id}.pdf`;

  const manualFile = await prisma.file.upsert({
    where: { path: manualPath },
    update: {},
    create: {
      kind: FileKind.DOCUMENT,
      originalName: 'manual.pdf',
      path: manualPath,
      mime: 'application/pdf',
      sizeBytes: 0,
    },
  });

  const existingManual = await prisma.deviceDocument.findFirst({
    where: {
      deviceId: device.id,
      docType: DeviceDocType.MANUAL,
      title: 'Руководство пользователя',
      fileId: manualFile.id,
    },
  });

  if (!existingManual) {
    await prisma.deviceDocument.create({
      data: {
        deviceId: device.id,
        docType: DeviceDocType.MANUAL,
        title: 'Руководство пользователя',
        fileId: manualFile.id,
      },
    });
  }

  await prisma.seoDevice.upsert({
    where: { deviceId: device.id },
    update: {
      metaTitle: 'Аппарат BrandX ModelY — OCTAVA',
      metaDescription: 'Неинвазивный лифтинг на аппарате BrandX ModelY.',
      ogImageId: files.ogId,
    },
    create: {
      deviceId: device.id,
      metaTitle: 'Аппарат BrandX ModelY — OCTAVA',
      metaDescription: 'Неинвазивный лифтинг на аппарате BrandX ModelY.',
      ogImageId: files.ogId,
    },
  });

  // Услуги
  const svcThai = await prisma.service.upsert({
    where: { slug: 'tajskij-massazh' },
    update: {
      name: 'Тайский массаж',
      categoryId: catMassage.id,
      shortOffer: 'Глубокое расслабление и восстановление тонуса.',
      priceFrom: '3000',
      durationMinutes: 60,
      benefit1: 'Улучшение микроциркуляции.',
      benefit2: 'Снятие мышечных зажимов.',
      ctaText: 'Записаться',
      ctaUrl: '/contacts',
    },
    create: {
      name: 'Тайский массаж',
      slug: 'tajskij-massazh',
      categoryId: catMassage.id,
      shortOffer: 'Глубокое расслабление и восстановление тонуса.',
      priceFrom: '3000',
      durationMinutes: 60,
      benefit1: 'Улучшение микроциркуляции.',
      benefit2: 'Снятие мышечных зажимов.',
      ctaText: 'Записаться',
      ctaUrl: '/contacts',
    },
  });

  await prisma.serviceDetails.upsert({
    where: { serviceId: svcThai.id },
    update: {
      whoIsFor: 'Подходит при стрессе, хронической усталости и мышечных зажимах.',
      effect: 'Расслабление, улучшение сна, ощущение легкости в теле.',
      principle: 'Комбинация растяжений, надавливаний и проработки фасций.',
      resultsTiming: 'Часто эффект заметен уже после первой процедуры.',
      courseSessions: 5,
    },
    create: {
      serviceId: svcThai.id,
      whoIsFor: 'Подходит при стрессе, хронической усталости и мышечных зажимах.',
      effect: 'Расслабление, улучшение сна, ощущение легкости в теле.',
      principle: 'Комбинация растяжений, надавливаний и проработки фасций.',
      resultsTiming: 'Часто эффект заметен уже после первой процедуры.',
      courseSessions: 5,
    },
  });

  // Расширенный прайс
  await prisma.servicePriceExtended.deleteMany({
    where: { serviceId: svcThai.id },
  });

  await prisma.servicePriceExtended.createMany({
    data: [
      {
        serviceId: svcThai.id,
        title: 'Базовый сеанс 60 мин',
        price: '3000',
        durationMinutes: 60,
        type: ServicePriceType.BASE,
        order: 1,
        isActive: true,
      },
      {
        serviceId: svcThai.id,
        title: 'Сеанс 75 мин',
        price: '3500',
        durationMinutes: 75,
        type: ServicePriceType.EXTRA,
        order: 2,
        isActive: true,
      },
      {
        serviceId: svcThai.id,
        title: 'Сеанс 90 мин',
        price: '4000',
        durationMinutes: 90,
        type: ServicePriceType.EXTRA,
        order: 3,
        isActive: true,
      },
    ],
  });

  await prisma.serviceIndication.createMany({
    data: [
      { serviceId: svcThai.id, text: 'Хроническая усталость' },
      { serviceId: svcThai.id, text: 'Стресс, нарушения сна' },
    ],
    skipDuplicates: true,
  });

  await prisma.serviceContraindication.createMany({
    data: [
      { serviceId: svcThai.id, text: 'Острые воспалительные процессы' },
      { serviceId: svcThai.id, text: 'Тромбоз, онкопатология в активной фазе' },
    ],
    skipDuplicates: true,
  });

  await prisma.servicePreparationStep.createMany({
    data: [
      { serviceId: svcThai.id, text: 'За 2 часа до процедуры не переедать', order: 1 },
      { serviceId: svcThai.id, text: 'Сообщить специалисту о хронических заболеваниях', order: 2 },
    ],
  });

  await prisma.serviceRehabStep.createMany({
    data: [
      { serviceId: svcThai.id, text: 'Пить достаточное количество воды', order: 1 },
      {
        serviceId: svcThai.id,
        text: 'Избегать интенсивных физических нагрузок 12 часов',
        order: 2,
      },
    ],
  });

  await prisma.serviceFaq.createMany({
    data: [
      {
        serviceId: svcThai.id,
        question: 'Больно ли во время процедуры?',
        answer:
          'Процедура может сопровождаться умеренным дискомфортом в зонах мышечных зажимов, но не должна быть болезненной.',
        order: 1,
      },
      {
        serviceId: svcThai.id,
        question: 'Нужна ли специальная подготовка?',
        answer:
          'Достаточно не есть плотно за 1,5–2 часа до сеанса и предупредить о хронических заболеваниях.',
        order: 2,
      },
    ],
  });

  await prisma.serviceLegalDisclaimer.upsert({
    where: { id: svcThai.id * 1000 + 1 },
    update: {
      text:
        'Имеются противопоказания. Необходимо получить консультацию специалиста.',
    },
    create: {
      id: svcThai.id * 1000 + 1,
      serviceId: svcThai.id,
      text:
        'Имеются противопоказания. Необходимо получить консультацию специалиста.',
    },
  });

  // Привязка к аппарату
  await prisma.serviceDevice.upsert({
    where: {
      serviceId_deviceId: { serviceId: svcThai.id, deviceId: device.id },
    },
    update: {},
    create: {
      serviceId: svcThai.id,
      deviceId: device.id,
    },
  });

  // Вторая услуга (SPA)
  const svcSpa = await prisma.service.upsert({
    where: { slug: 'spa-ritual-relax' },
    update: {
      name: 'SPA-ритуал Relax',
      categoryId: catSpa.id,
      shortOffer: 'Расслабляющий уход с акцентом на восстановление ресурса.',
      priceFrom: '4500',
      durationMinutes: 75,
      benefit1: 'Снятие эмоционального напряжения.',
      benefit2: 'Улучшение состояния кожи и общего самочувствия.',
      ctaText: 'Записаться',
      ctaUrl: '/contacts',
    },
    create: {
      name: 'SPA-ритуал Relax',
      slug: 'spa-ritual-relax',
      categoryId: catSpa.id,
      shortOffer: 'Расслабляющий уход с акцентом на восстановление ресурса.',
      priceFrom: '4500',
      durationMinutes: 75,
      benefit1: 'Снятие эмоционального напряжения.',
      benefit2: 'Улучшение состояния кожи и общего самочувствия.',
      ctaText: 'Записаться',
      ctaUrl: '/contacts',
    },
  });

  for (const svc of [svcThai, svcSpa]) {
    await prisma.seoService.upsert({
      where: { serviceId: svc.id },
      update: {
        metaTitle: `${svc.name} — клиника OCTAVA`,
        metaDescription: svc.shortOffer,
        ogImageId: files.ogId,
      },
      create: {
        serviceId: svc.id,
        metaTitle: `${svc.name} — клиника OCTAVA`,
        metaDescription: svc.shortOffer,
        ogImageId: files.ogId,
      },
    });
  }

  // Directions на главной
  const home = await prisma.staticPage.findUniqueOrThrow({
    where: { type: StaticPageType.HOME },
  });

  const services = await prisma.service.findMany({
    orderBy: { id: 'asc' },
    take: 4,
  });

  await prisma.homeDirection.deleteMany({
    where: { homePageId: home.id },
  });

  for (let i = 0; i < services.length; i++) {
    await prisma.homeDirection.create({
      data: {
        homePageId: home.id,
        serviceId: services[i].id,
        order: i + 1,
      },
    });
  }
}

async function main() {
  await ensureAdmin();
  await seedOrganization();
  const files = await seedFilesPlaceholders();
  await seedStaticPages(files);
  await seedCatalog({ ogId: files.ogId });

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
