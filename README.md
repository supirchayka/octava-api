# Octava API — техническое задание для фронтенда

Этот документ описывает все HTTP-маршруты бэкенда, форматы запросов/ответов и правила работы с медиафайлами. Его можно использовать как ТЗ для реализации административной панели и публичного фронтенда.

## 1. Общая информация о сервере
- Бэкенд работает на Fastify и слушает порт, указанный в `PORT` (по умолчанию `3005`). Здоровье сервиса проверяется через `GET /health`, который возвращает `{ "status": "ok" }` без авторизации.
- Файлы (изображения и документы) сохраняются в локальную папку `uploads/` и раздаются плагином `@fastify/static` по префиксу `/uploads/*`. Любой путь из БД, который начинается с `uploads/`, можно превращать в URL вида `https://api.host/uploads/...`.
- Для аутентификации используется JWT. Защищённые маршруты требуют заголовок `Authorization: Bearer <accessToken>` и допускают только пользователей с ролью `ADMIN` или `EDITOR` (как видно в контроллерах админ-модулей).
- Скрипт `npm run prisma:seed` создаёт **и при повторном запуске обновляет** учётную запись администратора. По умолчанию это `admin@octava.ru` / `changeme`, но значения можно переопределить через переменные `ADMIN_EMAIL` и `ADMIN_PASSWORD` перед запуском сида. Каждый сид гарантированно активирует пользователя и сбрасывает пароль к актуальному значению, чтобы вход всегда работал.【F:prisma/seed.ts†L17-L37】
- Формат данных — JSON. Валидация выполняется на уровне схем Fastify, поэтому необходимо передавать только описанные поля.

## 2. Работа с файлами и изображениями
### POST /admin/files/upload
- **Авторизация:** требуется (ADMIN/EDITOR).
- **Тип запроса:**
  - Предпочтительно `multipart/form-data` с единственным файлом (ограничение 20 МБ).
  - Дополнительно поддерживается запрос, где тело — «сырой» бинарный поток (например, `fetch` c `Blob`). В этом режиме можно (и желательно) передать заголовок `X-Filename: original.jpg`; если заголовка нет, сервер попытается определить тип по сигнатуре файла и подставит расширение автоматически.
- **Ответ:** запись `File` из БД: `{ id, storage, kind, originalName, path, mime, sizeBytes, width?, height? }`.
- Фронтенд должен сохранять `id` и `path`. `path` уже готов к использованию на сайте (`/uploads/...`).

### Привязка HERO и галерей
- Для категорий, услуг и аппаратов мы храним ровно одно HERO-изображение (`ImagePurpose.HERO`). Чтобы задать/обновить HERO, передайте `heroImageFileId` (ID из `/admin/files/upload`).
  - При создании `heroImageFileId` необязателен. Если передан, сервис создаст запись `*Image` с `purpose = HERO`.
  - При обновлении: если поле не передаётся — HERO остаётся прежним; если передаётся `null` — HERO удаляется; если передаётся число — старое HERO удаляется и создаётся новое.
- Галереи (`ImagePurpose.GALLERY`) и списки связанных устройств/цен/документов пересобираются только если соответствующие массивы переданы. Передавайте файлы/ID в том порядке, в котором они должны отображаться — порядок сохраняется в поле `order`.
- Inline-изображения (`ImagePurpose.INLINE`) читаются в публичных карточках услуг и аппаратов, но в текущей версии админ-интерфейса они наполняются через сиды/миграции, поэтому фронту важно уметь их отображать при чтении API.

### Документы и вложения
- Устройства содержат сертификаты (`certBadges`), документы (`documents`) и произвольные вложения (`attachments`). Для каждого документа фронтенд получает `{ id, docType, title, file: { id, url, mime, name } }`, где `url` строится из `path`. Аналогично сертификаты и вложения имеют как изображения (для бейджей/превью), так и файлы.
- Страница сведений об организации (`/pages/org-info`) отдаёт лицензии и сертификаты с прикреплёнными файлами, а также текстовые документы (`htmlBody`). Эти данные нужно отображать в соответствии с типом документа.

### Автогенерация slug
- Для категорий, услуг и аппаратов slug формируется автоматически из человекочитаемого названия: бэкенд транслитерирует русские символы в латиницу, приводит строку к нижнему регистру и заменяет любые недопустимые символы на `-`.
- Фронтенду не нужно (и нельзя) передавать slug в запросах создания/обновления. Достаточно указать `name` (для категорий и услуг) либо пару `brand`+`model` (для аппаратов).
- Перед сохранением slug проверяется на уникальность. Если значение занято, сервер добавляет к базе суффикс из четырёх случайных латинских букв/цифр через дефис (например, `injekcii-3k9d`). Это гарантирует пригодность slug для URL даже при коллизиях.
- Ответы API по-прежнему содержат slug — фронт использует их для переходов и привязки карточек, но не отправляет обратно.

## 3. Публичные маршруты
### 3.1 Служебные
| Метод | Путь | Описание/ответ |
| --- | --- | --- |
| GET | /health | `{ status: "ok" }` — проверка доступности сервиса. |
| GET | /sitemap.xml | XML-карта сайта, включающая статические страницы, категории, услуги и аппараты. |

### 3.2 Аутентификация (для админки)
| Метод | Путь | Тело запроса | Ответ |
| --- | --- | --- | --- |
| POST | /auth/login | `{ email, password }` | `{ user: { id, email, role }, accessToken, refreshToken }`. Ошибка 401 при неверных данных. |
| POST | /auth/refresh | `{ refreshToken }` | `{ user, accessToken, refreshToken }` с новым набором токенов. Старый refresh ревокается. |
| GET | /auth/me | — (нужен Bearer токен) | `{ id, email, role }` текущего пользователя. |

### 3.3 Публичный каталог
Ниже приведены полные JSON-ответы (усечённые только по количеству элементов). Все поля, связанные с SEO и изображениями, всегда присутствуют в ответе — если данных нет, они приходят со значением `null` или пустым массивом.

#### GET /service-categories
**Response 200**
```json
[
  {
    "id": 12,
    "slug": "massazh",
    "name": "Массаж",
    "description": "Расслабляющие и лечебные техники",
    "sortOrder": 10,
    "servicesCount": 8,
    "seo": {
      "metaTitle": "Массаж — OCTAVA",
      "metaDescription": "Линейка массажных программ",
      "canonicalUrl": null,
      "robotsIndex": true,
      "robotsFollow": true,
      "ogTitle": "Массаж",
      "ogDescription": null,
      "ogImage": {
        "id": 501,
        "url": "https://api.octava.local/uploads/massage-og.jpg",
        "originalName": "massage-og.jpg",
        "mime": "image/jpeg",
        "sizeBytes": 128553,
        "width": 1200,
        "height": 630
      }
    },
    "heroImage": {
      "id": 910,
      "fileId": 345,
      "purpose": "HERO",
      "order": 0,
      "alt": "Процедура массажа",
      "caption": null,
      "url": "https://api.octava.local/uploads/massage-hero.jpg",
      "file": {
        "id": 345,
        "url": "https://api.octava.local/uploads/massage-hero.jpg",
        "originalName": "massage-hero.jpg",
        "mime": "image/jpeg",
        "sizeBytes": 256000,
        "width": 1600,
        "height": 900
      }
    },
    "galleryImages": [
      {
        "id": 911,
        "fileId": 346,
        "purpose": "GALLERY",
        "order": 0,
        "alt": "Интерьер",
        "caption": "Зал процедур",
        "url": "https://api.octava.local/uploads/massage-gallery-1.jpg",
        "file": {
          "id": 346,
          "url": "https://api.octava.local/uploads/massage-gallery-1.jpg",
          "originalName": "massage-gallery-1.jpg",
          "mime": "image/jpeg",
          "sizeBytes": 182000,
          "width": 1400,
          "height": 900
        }
      }
    ]
  }
]
```
> Если для категории нет HERO или галереи, поля `heroImage` и `galleryImages` приходят как `null` и `[]`, но ключи в JSON всегда присутствуют.

#### GET /service-categories/:slug
**Response 200**
```json
{
  "category": {
    "id": 12,
    "slug": "massazh",
    "name": "Массаж",
    "description": "Расслабляющие и лечебные техники",
    "sortOrder": 10,
    "heroImage": {
      "id": 910,
      "fileId": 345,
      "purpose": "HERO",
      "order": 0,
      "alt": "Процедура массажа",
      "caption": null,
      "url": "https://api.octava.local/uploads/massage-hero.jpg",
      "file": {
        "id": 345,
        "url": "https://api.octava.local/uploads/massage-hero.jpg",
        "originalName": "massage-hero.jpg",
        "mime": "image/jpeg",
        "sizeBytes": 256000,
        "width": 1600,
        "height": 900
      }
    },
    "galleryImages": []
  },
  "seo": {
    "metaTitle": "Массаж в OCTAVA",
    "metaDescription": "Все массажные практики",
    "canonicalUrl": "https://octava.ru/service-categories/massazh",
    "robotsIndex": true,
    "robotsFollow": true,
    "ogTitle": "Массаж",
    "ogDescription": null,
    "ogImage": null
  },
  "services": [
    {
      "id": 44,
      "slug": "relaks-massazh",
      "name": "Релакс-массаж",
      "shortOffer": "Полный релакс за 60 минут",
      "priceFrom": "4500",
      "durationMinutes": 60,
      "benefits": ["Антистресс", "Улучшает сон"],
      "ctaText": "Записаться",
      "ctaUrl": "/forms/service?slug=relaks-massazh"
    }
  ]
}
```

#### GET /services/:slug
**Response 200**
```json
{
  "service": {
    "id": 44,
    "slug": "smas-lifting",
    "name": "SMAS-лифтинг",
    "category": {
      "id": 12,
      "slug": "massazh",
      "name": "Массаж"
    }
  },
  "seo": {
    "metaTitle": "SMAS-лифтинг в OCTAVA",
    "metaDescription": "Инновационная процедура",
    "canonicalUrl": null,
    "robotsIndex": true,
    "robotsFollow": true,
    "ogTitle": "SMAS-лифтинг",
    "ogDescription": "Безоперационный лифтинг",
    "ogImage": {
      "id": 777,
      "url": "https://api.octava.local/uploads/smas-og.jpg",
      "originalName": "smas-og.jpg",
      "mime": "image/jpeg",
      "sizeBytes": 120553,
      "width": 1200,
      "height": 630
    }
  },
  "hero": {
    "title": "SMAS-лифтинг",
    "shortOffer": "Глубокое омоложение",
    "priceFrom": "19000",
    "durationMinutes": 90,
    "benefits": ["Без наркоза", "Реабилитация 1 день"],
    "ctaText": "Записаться",
    "ctaUrl": "/forms/service?slug=smas-lifting",
    "images": [
      {
        "id": 1001,
        "fileId": 600,
        "purpose": "HERO",
        "order": 0,
        "alt": "Процедура SMAS",
        "caption": null,
        "url": "https://api.octava.local/uploads/smas-hero.jpg",
        "file": {
          "id": 600,
          "url": "https://api.octava.local/uploads/smas-hero.jpg",
          "originalName": "smas-hero.jpg",
          "mime": "image/jpeg",
          "sizeBytes": 265555,
          "width": 1600,
          "height": 900
        }
      }
    ]
  },
  "about": {
    "whoIsFor": "Пациентам с выраженным птозом",
    "effect": "Лифтинг овала лица",
    "principle": "Сфокусированный ультразвук",
    "resultsTiming": "1–2 недели",
    "courseSessions": "1 процедура"
  },
  "pricesExtended": [
    {
      "id": 801,
      "title": "SMAS лицо",
      "price": "19000",
      "durationMinutes": 60,
      "type": "BASE",
      "order": 0
    },
    {
      "id": 802,
      "title": "SMAS лицо + шея",
      "price": "26000",
      "durationMinutes": 90,
      "type": "PACKAGE",
      "order": 1
    }
  ],
  "indications": ["Птоз мягких тканей", "Нечёткий овал"],
  "contraindications": ["Беременность", "Имплантированный кардиостимулятор"],
  "preparationChecklist": [
    { "id": 61, "text": "За 24 часа исключить алкоголь", "order": 0 }
  ],
  "rehabChecklist": [
    { "id": 71, "text": "Избегать сауны 7 дней", "order": 0 }
  ],
  "devices": [
    {
      "id": 5,
      "slug": "ulthera",
      "brand": "Ulthera",
      "model": "System",
      "positioning": "SMAS-лифтинг без хирургии"
    }
  ],
  "galleryImages": [],
  "inlineImages": [
    {
      "id": 1201,
      "fileId": 777,
      "purpose": "INLINE",
      "order": 0,
      "alt": "Схема лифтинга",
      "caption": "Как работает метод",
      "url": "https://api.octava.local/uploads/smas-inline.png",
      "file": {
        "id": 777,
        "url": "https://api.octava.local/uploads/smas-inline.png",
        "originalName": "smas-inline.png",
        "mime": "image/png",
        "sizeBytes": 12000,
        "width": 900,
        "height": 600
      }
    }
  ],
  "faq": [
    { "id": 91, "question": "Больно ли?", "answer": "Дискомфорт минимален", "order": 0 }
  ],
  "legalDisclaimer": "Имеются противопоказания, требуется консультация специалиста"
}
```

#### GET /devices
**Response 200**
```json
[
  {
    "id": 5,
    "slug": "ulthera",
    "brand": "Ulthera",
    "model": "System",
    "positioning": "SMAS-лифтинг без хирургии",
    "heroImage": {
      "id": 1301,
      "fileId": 810,
      "purpose": "HERO",
      "order": 0,
      "alt": "Аппарат Ulthera",
      "caption": null,
      "url": "https://api.octava.local/uploads/ulthera-hero.jpg",
      "file": {
        "id": 810,
        "url": "https://api.octava.local/uploads/ulthera-hero.jpg",
        "originalName": "ulthera-hero.jpg",
        "mime": "image/jpeg",
        "sizeBytes": 310000,
        "width": 1600,
        "height": 900
      }
    }
  }
]
```

#### GET /devices/:slug
**Response 200**
```json
{
  "device": {
    "id": 5,
    "slug": "ulthera",
    "brand": "Ulthera",
    "model": "System",
    "positioning": "SMAS-лифтинг без хирургии",
    "principle": "Сфокусированный ультразвук",
    "safetyNotes": "Процедура выполняется врачом"
  },
  "seo": {
    "metaTitle": "Аппарат Ulthera",
    "metaDescription": "SMAS-лифтинг",
    "canonicalUrl": null,
    "robotsIndex": true,
    "robotsFollow": true,
    "ogTitle": "Аппарат Ulthera",
    "ogDescription": null,
    "ogImage": null
  },
  "hero": {
    "brand": "Ulthera",
    "model": "System",
    "positioning": "SMAS-лифтинг без хирургии",
    "certBadges": [
      {
        "id": 30,
        "type": "FDA",
        "label": "FDA cleared",
        "image": {
          "id": 900,
          "url": "https://api.octava.local/uploads/fda.png",
          "originalName": "fda.png",
          "mime": "image/png",
          "sizeBytes": 54000,
          "width": 256,
          "height": 256
        },
        "file": {
          "id": 901,
          "url": "https://api.octava.local/uploads/fda.pdf",
          "originalName": "fda.pdf",
          "mime": "application/pdf",
          "sizeBytes": 99000,
          "width": null,
          "height": null
        }
      }
    ],
    "images": [
      {
        "id": 1301,
        "fileId": 810,
        "purpose": "HERO",
        "order": 0,
        "alt": "Аппарат Ulthera",
        "caption": null,
        "url": "https://api.octava.local/uploads/ulthera-hero.jpg",
        "file": {
          "id": 810,
          "url": "https://api.octava.local/uploads/ulthera-hero.jpg",
          "originalName": "ulthera-hero.jpg",
          "mime": "image/jpeg",
          "sizeBytes": 310000,
          "width": 1600,
          "height": 900
        }
      }
    ]
  },
  "galleryImages": [],
  "inlineImages": [],
  "attachments": [
    {
      "id": 41,
      "name": "Манипула",
      "description": "Насадки для тела",
      "image": {
        "id": 950,
        "url": "https://api.octava.local/uploads/ulthera-attachment.jpg",
        "originalName": "ulthera-attachment.jpg",
        "mime": "image/jpeg",
        "sizeBytes": 82000,
        "width": 900,
        "height": 600
      }
    }
  ],
  "indications": ["Лифтинг", "Плотность кожи"],
  "contraindications": ["Беременность"],
  "sideEffects": [
    { "id": 51, "text": "Лёгкая отёчность", "rarity": "RARE" }
  ],
  "documents": [
    {
      "id": 61,
      "docType": "CERTIFICATE",
      "title": "Регистрационное удостоверение",
      "issuedBy": "Росздравнадзор",
      "issuedAt": "2023-01-10",
      "file": {
        "id": 910,
        "url": "https://api.octava.local/uploads/ulthera-cert.pdf",
        "originalName": "ulthera-cert.pdf",
        "mime": "application/pdf",
        "sizeBytes": 230000,
        "width": null,
        "height": null
      }
    }
  ],
  "faq": [
    { "id": 71, "question": "Сколько держится эффект?", "answer": "До 12 месяцев", "order": 0 }
  ],
  "services": [
    {
      "id": 44,
      "slug": "smas-lifting",
      "name": "SMAS-лифтинг",
      "shortOffer": "Глубокое омоложение",
      "priceFrom": "19000"
    }
  ]
}
```

### 3.4 Публичные страницы
Каждый маршрут возвращает объект с ключом `page`, SEO-блоком и всеми связанными изображениями. Ниже приведены примерные ответы (поля могут быть `null`, но ключи присутствуют).

#### GET /pages/home
```json
{
  "page": {
    "type": "HOME",
    "slug": ""
  },
  "seo": {
    "metaTitle": "Клиника OCTAVA — антивозрастная и эстетическая медицина",
    "metaDescription": "Процедуры, авторские протоколы и современные аппараты. Запись на консультацию в Москве.",
    "canonicalUrl": null,
    "robotsIndex": true,
    "robotsFollow": true,
    "ogTitle": "OCTAVA",
    "ogDescription": "Антивозрастная медицина и косметология",
    "ogImage": {
      "url": "/uploads/seed/og.jpg",
      "mime": "image/jpeg",
      "width": null,
      "height": null,
      "alt": "og.jpg"
    }
  },
  "hero": {
    "title": "Клиника OCTAVA — молодость и эстетика",
    "subtitle": "Современные методы антивозрастной медицины и косметологии",
    "ctaText": "Записаться на консультацию",
    "ctaUrl": "/contacts",
    "images": [
      {
        "id": 1,
        "url": "/uploads/seed/hero-home.jpg",
        "alt": "Главный баннер клиники OCTAVA",
        "caption": null,
        "order": 0
      }
    ]
  },
  "directions": [
    {
      "id": 1,
      "slug": "tayskiy-massazh",
      "name": "Тайский массаж",
      "shortOffer": "Глубокое расслабление и восстановление тонуса.",
      "priceFrom": "3000",
      "durationMinutes": 60,
      "benefits": [
        "Улучшение микроциркуляции.",
        "Снятие мышечных зажимов."
      ],
      "ctaText": "Записаться",
      "ctaUrl": "/contacts",
      "category": {
        "id": 1,
        "slug": "massazh",
        "name": "Массаж"
      }
    },
    {
      "id": 2,
      "slug": "spa-ritual-relax",
      "name": "SPA-ритуал Relax",
      "shortOffer": "Расслабляющий уход с акцентом на восстановление ресурса.",
      "priceFrom": "4500",
      "durationMinutes": 75,
      "benefits": [
        "Снятие эмоционального напряжения.",
        "Улучшение состояния кожи и общего самочувствия."
      ],
      "ctaText": "Записаться",
      "ctaUrl": "/contacts",
      "category": {
        "id": 2,
        "slug": "spa",
        "name": "SPA"
      }
    }
  ],
  "subHero": {
    "title": "Комплексный подход",
    "subtitle": "Индивидуальные протоколы, безопасные технологии и забота о каждом пациенте"
  },
  "interior": {
    "text": "Интерьер OCTAVA создан для того, чтобы вы чувствовали спокойствие, комфорт и доверие с первых минут визита.",
    "images": [
      {
        "id": 2,
        "url": "/uploads/seed/gallery-1.jpg",
        "alt": "Интерьер клиники 1",
        "caption": null,
        "order": 1
      },
      {
        "id": 3,
        "url": "/uploads/seed/gallery-2.jpg",
        "alt": "Интерьер клиники 2",
        "caption": null,
        "order": 2
      },
      {
        "id": 4,
        "url": "/uploads/seed/gallery-3.jpg",
        "alt": "Интерьер клиники 3",
        "caption": null,
        "order": 3
      },
      {
        "id": 5,
        "url": "/uploads/seed/gallery-4.jpg",
        "alt": "Интерьер клиники 4",
        "caption": null,
        "order": 4
      }
    ]
  }
}
```
Массив `directions` всегда содержит четыре услуги, выбранные в админке; порядок задаётся в теле PUT-запроса `/admin/pages/home`.

#### GET /pages/about
```json
{
  "page": { "type": "ABOUT", "slug": "about" },
  "seo": {
    "metaTitle": "О клинике OCTAVA",
    "metaDescription": "Почему нам доверяют",
    "canonicalUrl": null,
    "robotsIndex": true,
    "robotsFollow": true,
    "ogTitle": "О клинике",
    "ogDescription": null,
    "ogImage": null
  },
  "hero": {
    "title": "OCTAVA — центр экспертной косметологии",
    "description": "Сочетаем аппаратные и инъекционные методики",
    "image": {
      "id": 99,
      "url": "/uploads/seed/about-hero.jpg",
      "mime": "image/jpeg",
      "width": 1600,
      "height": 900,
      "alt": "Команда клиники"
    }
  },
  "trustItems": [
    {
      "id": 10,
      "kind": "LICENSE",
      "title": "Медицинская лицензия",
      "number": "ЛО-77-01-012345",
      "issuedAt": "2022-05-01",
      "issuedBy": "ДЗМ",
      "image": {
        "id": 501,
        "url": "https://api.octava.local/uploads/license.png",
        "alt": "Лицензия"
      },
      "file": {
        "id": 900,
        "url": "https://api.octava.local/uploads/license.pdf",
        "mime": "application/pdf",
        "name": "license.pdf"
      }
    }
  ],
  "howWeAchieve": "Работаем по международным протоколам",
  "facts": [
    { "id": 1, "title": "15 лет", "text": "Опыт врачей", "order": 0 }
  ],
  "heroCta": {
    "title": "Нужна консультация?",
    "subtitle": "Оставьте заявку"
  }
}
```

#### GET /pages/contacts
```json
{
  "page": { "type": "CONTACTS", "slug": "contacts" },
  "seo": {
    "metaTitle": "Контакты OCTAVA",
    "metaDescription": "Как нас найти",
    "canonicalUrl": null,
    "robotsIndex": true,
    "robotsFollow": true,
    "ogTitle": "Контакты",
    "ogDescription": null,
    "ogImage": null
  },
  "contacts": {
    "phone": "+7 (495) 000-00-00",
    "email": "info@octava.ru",
    "telegramUrl": "https://t.me/octava",
    "whatsappUrl": null,
    "address": "Москва, ул. Примерная, 10",
    "yandexMapUrl": "https://yandex.ru/map-widget/v1/?um=constructor%3A...",
    "workingHours": [
      { "id": 1, "group": "WEEKDAYS", "label": "Пн–Пт", "isClosed": false, "open": "10:00", "close": "21:00" },
      { "id": 2, "group": "SUNDAY", "label": "Воскресенье", "isClosed": true, "open": null, "close": null }
    ],
    "metroStations": [
      { "id": 5, "name": "Маяковская", "distanceMeters": 400, "line": "Зелёная" }
    ]
  }
}
```

#### GET /pages/org-info
```json
{
  "page": { "type": "ORG_INFO", "slug": "org-info" },
  "seo": {
    "metaTitle": "Документы и лицензии",
    "metaDescription": null,
    "canonicalUrl": null,
    "robotsIndex": true,
    "robotsFollow": true,
    "ogTitle": null,
    "ogDescription": null,
    "ogImage": null
  },
  "organization": {
    "fullName": "ООО \"Октава\"",
    "ogrn": "1234567890123",
    "inn": "7701234567",
    "kpp": "770101001",
    "address": "Москва, ул. Примерная, 10",
    "email": "info@octava.ru",
    "phones": [
      { "type": "PRIMARY", "number": "+7 (495) 000-00-00", "isPrimary": true }
    ]
  },
  "licenses": [
    {
      "id": 11,
      "number": "ЛО-77-01-012345",
      "issuedAt": "2022-05-01",
      "issuedBy": "Департамент здравоохранения",
      "file": {
        "id": 901,
        "url": "https://api.octava.local/uploads/license.pdf",
        "mime": "application/pdf",
        "name": "license.pdf",
        "sizeBytes": 180000,
        "width": null,
        "height": null
      }
    }
  ],
  "documents": [
    {
      "id": 21,
      "type": "AGREEMENT",
      "title": "Договор оказания услуг",
      "htmlBody": "<p>Текст документа<\/p>",
      "publishedAt": "2024-02-01"
    }
  ],
  "certificates": [
    {
      "id": 31,
      "title": "Сертификат соответствия",
      "issuedBy": "Росздравнадзор",
      "issuedAt": "2023-03-10",
      "file": null
    }
  ]
}
```

#### GET /pages/personal-data-policy
```json
{
  "page": { "type": "PERSONAL_DATA_POLICY", "slug": "personal-data-policy" },
  "seo": {
    "metaTitle": "Политика обработки персональных данных",
    "metaDescription": null,
    "canonicalUrl": null,
    "robotsIndex": true,
    "robotsFollow": true,
    "ogTitle": null,
    "ogDescription": null,
    "ogImage": null
  },
  "policy": {
    "title": "Политика обработки ПДн",
    "body": "<h1>1. Общие положения<\/h1>..."
  }
}
```

#### GET /pages/privacy-policy
```json
{
  "page": { "type": "PRIVACY_POLICY", "slug": "privacy-policy" },
  "seo": {
    "metaTitle": "Политика конфиденциальности",
    "metaDescription": null,
    "canonicalUrl": null,
    "robotsIndex": true,
    "robotsFollow": true,
    "ogTitle": null,
    "ogDescription": null,
    "ogImage": null
  },
  "policy": {
    "title": "Политика конфиденциальности",
    "body": "<p>Положения...<\/p>"
  }
}
```

### 3.5 Публичные данные об организации
#### GET /org
```json
{
  "id": 1,
  "fullName": "ООО \"Октава\"",
  "ogrn": "1234567890123",
  "inn": "7701234567",
  "kpp": "770101001",
  "address": "Москва, ул. Примерная, 10",
  "email": "info@octava.ru",
  "phones": [
    { "type": "PRIMARY", "number": "+7 (495) 000-00-00", "isPrimary": true },
    { "type": "SECONDARY", "number": "+7 (495) 111-22-33", "isPrimary": false }
  ],
  "licenses": [
    {
      "id": 11,
      "number": "ЛО-77-01-012345",
      "issuedAt": "2022-05-01",
      "issuedBy": "Департамент здравоохранения",
      "file": {
        "id": 901,
        "url": "https://api.octava.local/uploads/license.pdf",
        "originalName": "license.pdf",
        "mime": "application/pdf",
        "sizeBytes": 180000,
        "width": null,
        "height": null
      }
    }
  ],
  "documents": [
    {
      "id": 21,
      "type": "AGREEMENT",
      "title": "Договор оказания услуг",
      "htmlBody": "<p>Текст документа<\/p>",
      "publishedAt": "2024-02-01"
    }
  ],
  "certificates": [
    {
      "id": 31,
      "title": "Сертификат соответствия",
      "issuedBy": "Росздравнадзор",
      "issuedAt": "2023-03-10",
      "file": {
        "id": 950,
        "url": "https://api.octava.local/uploads/certificate.pdf",
        "originalName": "certificate.pdf",
        "mime": "application/pdf",
        "sizeBytes": 220000,
        "width": null,
        "height": null
      }
    }
  ]
}
```

### 3.6 Публичные формы (лиды)
Все формы принимают JSON и возвращают `{ ok: true }` при успехе.
- **POST /forms/contact:** тело `{ name, phone, message?, source: 'HOME'|'CONTACTS'|'OTHER', pdnConsent?, utmSource?, utmMedium?, utmCampaign? }`.
- **POST /forms/service:** `{ name, phone, message?, serviceId?, serviceSlug?, pdnConsent?, utm* }`. Если указан `serviceSlug`, он конвертируется в `serviceId`, иначе нужно передать `serviceId` напрямую.
- **POST /forms/device:** `{ name, phone, message?, deviceId?, deviceSlug?, pdnConsent?, utm* }` — аналогично услугам.

## 4. Административные маршруты
Все нижеперечисленные пути требуют JWT и роль ADMIN/EDITOR.

### 4.1 Каталог
#### GET /admin/catalog/categories
- **Ответ:** массив категорий `{ id, slug, name, description, sortOrder, heroImageFileId, heroImage?, seo? }`, где `heroImage` содержит `imageId`, `fileId`, `order`, `alt`, `caption` и вложенный `file` `{ id, url, mime, originalName, width?, height? }`.
- Используйте `heroImage.file.url` для предпросмотра обложки в таблицах.

#### GET /admin/catalog/categories/:id
- **Ответ:** одиночная категория с теми же полями, что и список. Возвращает 404, если `id` не существует.
- Подходит для заполнения формы редактирования — `heroImageFileId` можно подставить обратно в PATCH/PUT, `seo.ogImageId` содержит файл для Open Graph.

#### POST /admin/catalog/categories
- **Тело:** `{ name, description?, sortOrder?, heroImageFileId?, seo? }`. Slug генерируется автоматически из `name`, поэтому поле не передаём.
- **Ответ:** созданная категория `{ id, name, slug, description, sortOrder, ... }`.
- Если передан `heroImageFileId`, создаётся HERO-запись.

#### PUT /admin/catalog/categories/:id
- **Тело:** любые поля как выше; необязательные.
- **Поведение HERO:** если `heroImageFileId` опущен — оставить; `null` — удалить; число — заменить.
- **Ответ:** обновлённая категория.

#### DELETE /admin/catalog/categories/:id
- Удаляет категорию; ответ `204 No Content`.

#### GET /admin/catalog/services
- **Query:** `categoryId?: number` — позволяет отфильтровать услуги внутри выбранной категории.
- **Ответ:** массив полных карточек с полями `{ id, slug, categoryId, categoryName, name, shortOffer, priceFrom, durationMinutes, benefit1, benefit2, ctaText, ctaUrl, sortOrder, heroImageFileId, heroImage?, galleryImageFileIds[], galleryImages[], usedDeviceIds[], servicePricesExtended[], seo? }`.
- `galleryImages[]` повторяет порядок, переданный при сохранении, а каждый элемент содержит `file` с готовым URL.

#### GET /admin/catalog/services/:id
- **Ответ:** полный объект услуги в том же формате, что и список. Если `id` не найден, вернётся 404.
- Используйте эти данные для подстановки значений в форму (массивы можно редактировать на клиенте и отправлять целиком).

#### POST /admin/catalog/services
- **Тело:**
  - Основные поля: `{ categoryId, name, shortOffer, priceFrom?, durationMinutes?, benefit1?, benefit2?, ctaText?, ctaUrl?, sortOrder? }`. Slug формируется автоматически по `name`.
  - Связи: `heroImageFileId?`, `galleryImageFileIds?`, `usedDeviceIds?`.
  - Доп. цены: `servicePricesExtended?` — массив `{ title, price, durationMinutes?, type?, sessionsCount?, order?, isActive? }`.
  - SEO: `seo?` (общая структура).
- **Ответ:** полная услуга с вложенными `pricesExtended`, `devices`, `images` (с файлами) и `seo`.
- **Логика изображений:** HERO создаётся, галерея формируется из массива в заданном порядке.

#### PUT /admin/catalog/services/:id
- Все поля опциональны; если передать массив (`galleryImageFileIds`, `usedDeviceIds`, `servicePricesExtended`), сервис пересоздаёт соответствующие записи с нуля.
- HERO работает по тем же правилам (`undefined` — оставить, `null` — удалить, число — заменить).
- **Ответ:** полная услуга (как при создании).

#### DELETE /admin/catalog/services/:id
- Ответ `204 No Content`.

#### GET /admin/catalog/devices
- **Ответ:** массив аппаратов `{ id, slug, brand, model, positioning, principle, safetyNotes, heroImageFileId, heroImage?, galleryImageFileIds[], galleryImages[], seo? }`.
- `heroImage` и `galleryImages` содержат вложенные файлы с URL/размерами для предпросмотра.

#### GET /admin/catalog/devices/:id
- **Ответ:** одиночный аппарат с тем же набором полей. Возвращает 404 при неверном `id`.

#### POST /admin/catalog/devices
- **Тело:** `{ brand, model, positioning, principle, safetyNotes?, heroImageFileId?, galleryImageFileIds?, seo? }`. Slug генерируется из `brand + model`.
- **Ответ:** созданный аппарат с `images` (файлы) и `seo`.

#### PUT /admin/catalog/devices/:id
- Частичное обновление с той же схемой. Галерея пересобирается, если массив передан.
- **Ответ:** полный аппарат с изображениями и SEO.

#### DELETE /admin/catalog/devices/:id
- Ответ `204 No Content`.

### 4.2 Админ-страницы
Каждый PUT возвращает `204 No Content`; GET отдают полный JSON, чтобы заполнить форму.

**/admin/pages/home**
- GET: `{ heroTitle, heroSubtitle, heroCtaText, heroCtaUrl, subheroTitle, subheroSubtitle, interiorText, heroImages[], interiorImages[], directions[], seo }`. `heroImages` и `interiorImages` содержат `fileId`, `alt`, `caption`, `order` и вложенный `file` (id/path/mime/size) для предпросмотра. `directions` всегда массив из **четырёх** элементов, каждый с `serviceId`, `order` и данными услуги/категории.
- PUT: все текстовые поля опциональны. `heroImages` — массив максимум из одного объекта `{ fileId, alt?, caption?, order? }`. `interiorImages` — список картинок интерьера. `directions` обязательны и должны включать ровно четыре `{ serviceId, order? }`, иначе запрос отклоняется.

**/admin/pages/about**
- GET: `{ heroTitle, heroDescription, heroImage, howWeAchieveText, heroCtaTitle, heroCtaSubtitle, facts[], seo }`, где `heroImage` — файл (как в hero), `facts` упорядочены по `order`.
- PUT: те же текстовые поля + `heroImageFileId` (null очищает) и `facts` — массив `{ title, text, order? }`. Массив пересоздаётся полностью.

**/admin/pages/contacts**
- GET: `{ phoneMain, email, telegramUrl, whatsappUrl, addressText, yandexMapUrl, workingHours[], metroStations[], seo }`. `workingHours` содержит `id, group, open, close, isClosed`; `metroStations` — `{ id, name, distanceMeters, line }`.
- PUT: все строки опциональны. `workingHours` — до трёх объектов (WEEKDAYS/SATURDAY/SUNDAY). Для открытых дней нужно передавать `open` и `close` в формате `HH:MM`. `metroStations` — массив `{ name, distanceMeters?, line? }`; массивы пересобираются целиком.

**Политики** (`/admin/pages/personal-data-policy`, `/admin/pages/privacy-policy`)
- GET: `title`, `body`, `seo`.
- PUT: опциональные `title`, `body`, `seo`.

### 4.3 Админ — организация
- **PUT /admin/org:** тело `{ fullName?, ogrn?, inn?, kpp?, address?, email? }`. Обновляет (или создаёт) единственную запись организации и возвращает её JSON.

### 4.4 Админ — лиды
- **GET /admin/leads:** принимает query `page`, `limit`, `status`, `sourceType`, `serviceId`, `deviceId`, `search`, `from`, `to`. Возвращает `{ items, total, page, limit, pages }`, где каждый лид содержит ссылки на услугу/аппарат (если есть).
- **PATCH /admin/leads/:id/status:** тело `{ status: 'NEW'|'IN_PROGRESS'|'DONE' }`. Возвращает обновлённый лид.

## 5. Выводы для фронтенда
- Любые медиа сначала загружайте через `/admin/files/upload`, сохраняйте `id`, потом прокидывайте его в соответствующие `heroImageFileId`, `galleryImageFileIds` или поля SEO (`ogImageId`). На фронте используйте `path`, добавляя `https://api.host` перед `/uploads/...`.
- При редактировании сущностей передавайте только изменённые поля: сервисы/аппараты/категории поддерживают частичное обновление и аккуратно обращаются с HERO/галереями.
- Публичные карточки услуг и аппаратов содержат все необходимые текстовые блоки, изображения, документы и FAQ. Планируя фронт, закладывайтесь на отображение всех перечисленных разделов.
- Формы лидов должны собирать согласие на обработку ПДн (`pdnConsent`) и при необходимости прокидывать `utm`-метки. После отправки достаточно проверить, что пришёл `{ ok: true }`.
- SEO-данные присутствуют во всех публичных ответах (`seo` объект), их нужно прокидывать в метатеги страниц.

