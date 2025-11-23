# Публичные маршруты API

Ниже перечислены все публичные (не требующие JWT) эндпоинты, их параметры и структура ответов, сформированная текущей реализацией сервисов.

## Аутентификация

### `POST /auth/login`
- **Тело запроса:** `{ email: string, password: string }` (обязательные поля).
- **Успешный ответ:**
  ```json
  {
    "user": { "id": number, "email": string, "role": "ADMIN" | "EDITOR" | "VIEWER" },
    "accessToken": string,
    "refreshToken": string
  }
  ```
  Токены подписываются `JWT_ACCESS_SECRET`, access-токен имеет TTL `JWT_ACCESS_EXPIRES_IN` (по умолчанию 15m).
- **Ошибки:** 401 при неверных учётных данных или неактивном пользователе.

### `POST /auth/refresh`
- **Тело запроса:** `{ refreshToken: string }` (обязательное поле, minLength 16).
- **Успешный ответ:** такой же формат, как у `/auth/login`, но refresh-токен перевыдаётся и старый помечается отозванным.
- **Ошибки:**
  - 400 если токен не передан.
  - 401 если токен просрочен/отозван или пользователь деактивирован.

## Контент страниц `/pages/*`
Все маршруты возвращают готовые для фронтенда структуры с SEO-данными и контентом. При отсутствии настроенной страницы сервис отдаёт 404 с сообщением об ошибке.

### `GET /pages/home`
- **Ответ:**
  ```json
  {
    "page": { "type": string, "slug": string },
    "seo": { ... },
    "hero": { "title": string, "subtitle": string, "ctaText": string | null, "ctaUrl": string | null, "images": HeroImage[] },
    "directions": [
      {
        "id": number,
        "slug": string,
        "name": string,
        "shortOffer": string | null,
        "priceFrom": string | null,
        "durationMinutes": number | null,
        "benefits": string[],
        "ctaText": string | null,
        "ctaUrl": string | null,
        "category": { "id": number, "slug": string, "name": string }
      }
    ],
    "subHero": { "title": string | null, "subtitle": string | null },
    "interior": { "text": string | null, "images": GalleryImage[] }
  }
  ```
  `HeroImage`/`GalleryImage` содержат id, url, alt, caption, order. SEO-блок включает meta/og поля и ссылку на ogImage, если загружен.

### `GET /pages/about`
- **Ответ:**
  ```json
  {
    "page": { "type": string, "slug": string },
    "seo": { ... },
    "hero": {
      "title": string | null,
      "description": string | null,
      "image": FileMeta | null
    },
    "trustItems": [{
      "id": number,
      "kind": string,
      "title": string | null,
      "number": string | null,
      "issuedAt": string | null,
      "issuedBy": string | null,
      "image": FileMeta | null,
      "file": { id, url, mime, name } | null
    }],
    "howWeAchieve": string | null,
    "facts": [{ "id": number, "title": string, "text": string, "order": number }],
    "heroCta": { "title": string, "subtitle": string } | null
  }
  ```

### `GET /pages/contacts`
- **Ответ:**
  ```json
  {
    "page": { "type": string, "slug": string },
    "seo": { ... },
    "contacts": {
      "phone": string | null,
      "email": string | null,
      "telegramUrl": string | null,
      "whatsappUrl": string | null,
      "address": string | null,
      "yandexMapUrl": string | null,
      "workingHours": [{
        "id": number,
        "group": "WEEKDAYS" | "SATURDAY" | "SUNDAY",
        "label": string,
        "isClosed": boolean,
        "open": "HH:MM" | null,
        "close": "HH:MM" | null
      }],
      "metroStations": [{ "id": number, "name": string, "distanceMeters": number | null, "line": string | null }]
    }
  }
  ```

### `GET /pages/org-info`
- **Ответ:**
  ```json
  {
    "page": { "type": string, "slug": string },
    "seo": { ... },
    "organization": {
      "fullName": string,
      "ogrn": string | null,
      "inn": string | null,
      "kpp": string | null,
      "address": string | null,
      "email": string | null,
      "phones": [{ "type": string, "number": string, "isPrimary": boolean }]
    },
    "licenses": [{
      "id": number,
      "number": string | null,
      "issuedAt": string | null,
      "issuedBy": string | null,
      "file": FileMeta | null
    }],
    "documents": [{ "id": number, "type": string, "title": string, "htmlBody": string | null, "publishedAt": string | null }],
    "certificates": [{
      "id": number,
      "title": string | null,
      "issuedBy": string | null,
      "issuedAt": string | null,
      "file": FileMeta | null
    }]
  }
  ```

### `GET /pages/personal-data-policy` и `GET /pages/privacy-policy`
- **Ответ:** `{ "page": { ... }, "seo": { ... }, "policy": { "title": string | null, "body": string | null } }`.

## Информация об организации

### `GET /org`
- **Ответ:** карточка организации в формате, аналогичном секции `organization/licenses/documents/certificates` выше, но без обёртки SEO/страницы.
- **Ошибки:** 404 если организация не заведена.

## Каталог услуг и аппаратов

### `GET /service-categories`
- **Ответ:** массив категорий
  ```json
  [{
    "id": number,
    "slug": string,
    "name": string,
    "description": string | null,
    "sortOrder": number,
    "servicesCount": number,
    "seo": { ... } | null,
    "heroImage": Image | null,
    "galleryImages": Image[]
  }]
  ```

### `GET /service-categories/:slug`
- **Ответ:**
  ```json
  {
    "category": {
      "id": number,
      "slug": string,
      "name": string,
      "description": string | null,
      "sortOrder": number,
      "heroImage": Image | null,
      "galleryImages": Image[]
    },
    "seo": { ... } | null,
    "services": [{
      "id": number,
      "slug": string,
      "name": string,
      "shortOffer": string | null,
      "priceFrom": string | null,
      "durationMinutes": number | null,
      "benefits": string[],
      "ctaText": string | null,
      "ctaUrl": string | null
    }]
  }
  ```
  404 если категория не найдена.

### `GET /services/:slug`
- **Ответ:**
  ```json
  {
    "service": { "id": number, "slug": string, "name": string, "category": { id, slug, name } },
    "seo": { ... } | null,
    "hero": {
      "title": string,
      "shortOffer": string | null,
      "priceFrom": string | null,
      "durationMinutes": number | null,
      "benefits": string[],
      "ctaText": string | null,
      "ctaUrl": string | null,
      "images": Image[]
    },
    "about": { "whoIsFor": string | null, "effect": string | null, "principle": string | null, "resultsTiming": string | null, "courseSessions": number | null } | null,
    "pricesExtended": [{ "id": number, "title": string, "price": string, "durationMinutes": number | null, "type": string, "order": number }],
    "indications": string[],
    "contraindications": string[],
    "preparationChecklist": [{ "id": number, "text": string, "order": number }],
    "rehabChecklist": [{ "id": number, "text": string, "order": number }],
    "devices": [{ "id": number, "slug": string, "brand": string, "model": string, "positioning": string | null }],
    "galleryImages": Image[],
    "inlineImages": Image[],
    "faq": [{ "id": number, "question": string, "answer": string, "order": number }],
    "legalDisclaimer": string | null
  }
  ```
  404 если услуга не найдена.

### `GET /devices`
- **Ответ:** массив
  ```json
  [{
    "id": number,
    "slug": string,
    "brand": string,
    "model": string,
    "positioning": string | null,
    "heroImage": Image | null
  }]
  ```

### `GET /devices/:slug`
- **Ответ:**
  ```json
  {
    "device": {
      "id": number,
      "slug": string,
      "brand": string,
      "model": string,
      "positioning": string | null,
      "principle": string | null,
      "safetyNotes": string | null
    },
    "seo": { ... } | null,
    "hero": { "brand": string, "model": string, "positioning": string | null, "certBadges": CertBadge[], "images": Image[] },
    "galleryImages": Image[],
    "inlineImages": Image[],
    "attachments": [{ "id": number, "name": string, "description": string | null, "image": FileMeta | null }],
    "indications": string[],
    "contraindications": string[],
    "sideEffects": [{ "id": number, "text": string, "rarity": string | null }],
    "documents": [{ "id": number, "docType": string, "title": string | null, "issuedBy": string | null, "issuedAt": string | null, "file": FileMeta | null }],
    "faq": [{ "id": number, "question": string, "answer": string, "order": number }],
    "services": [{ "id": number, "slug": string, "name": string, "shortOffer": string | null, "priceFrom": string | null }]
  }
  ```
  404 если аппарат не найден.

## Публичные формы лидов
Все формы возвращают `{ "ok": true }` при создании записи и 201 статус. В ip/referer собираются автоматически.

### `POST /forms/contact`
- **Тело:** `{ name: string, phone: string, message?: string, source: "HOME" | "CONTACTS" | "OTHER", pdnConsent?: boolean, utmSource?: string, utmMedium?: string, utmCampaign?: string }`.
- **Ошибки:** 400 при отсутствии обязательных полей.

### `POST /forms/service`
- **Тело:** `{ name: string, phone: string, message?: string, serviceId?: number, serviceSlug?: string, pdnConsent?: boolean, utm*?: string }`.
- **Ошибки:**
  - 400 если не переданы `serviceId`/`serviceSlug` или услуга по slug не найдена.

### `POST /forms/device`
- **Тело:** `{ name: string, phone: string, message?: string, deviceId?: number, deviceSlug?: string, pdnConsent?: boolean, utm*?: string }`.
- **Ошибки:**
  - 400 если не переданы `deviceId`/`deviceSlug` или аппарат по slug не найден.

## Служебные эндпоинты

### `GET /sitemap.xml`
- Генерирует XML со ссылками на главную, статические страницы, карточку организации, все категории, услуги и аппараты. Базовый домен берётся из `SITE_URL` (по умолчанию `https://octava-clinic.ru`).

### `GET /health`
- Возвращает `{ "status": "ok" }` для проверки доступности сервиса.

## Техническое задание для пользовательского фронтенда

1. **Конфигурация API**
   - Использовать базовый URL бэкенда; загруженные файлы доступны по абсолютным ссылкам `url` в ответах (prefix `/uploads/`).
   - Передавать `Authorization: Bearer` только для админских разделов (не в рамках данного списка).

2. **Роутинг и данные**
   - Страницы `home`, `about`, `contacts`, `org-info`, `personal-data`, `privacy-policy` получают данные с `/pages/*`; при 404 показывать страницу-заглушку.
   - Каталог строится на основе `/service-categories` и `/service-categories/:slug`; карточка услуги использует `/services/:slug`; страница аппарата — `/devices/:slug`; общий список аппаратов — `/devices`.
   - Карточка организации и юридические документы берутся из `/org`.
   - Страница карты сайта может использовать `/sitemap.xml` для проверки индексации.

3. **Модели данных**
   - Визуальные блоки (hero, галерея, сертификаты и т.п.) используют `Image`/`FileMeta` из ответов: хранить `url`, `alt`, `caption`, размеры при наличии.
   - Цены приходят строками (`priceFrom`, `price`), не приводить их к числам без проверки разделителей.
   - SEO-метаданные (`metaTitle`, `metaDescription`, `canonicalUrl`, `robotsIndex`, `robotsFollow`, `og*`) должны прокидываться в метатеги страниц.

4. **Формы**
   - Отправлять формы в JSON с точным набором полей, указанным выше; ожидать `{ ok: true }` и статус 201.
   - Передавать согласие на ПДн (`pdnConsent`) булевым значением; валидацию обязательных полей делать на клиенте.
   - Можно дополнительно передавать UTM-метки (source/medium/campaign) для аналитики.

5. **Ошибки и статусы**
   - Обрабатывать 400/401/404 по тексту сообщения из поля `message`, выводя пользовательскую ошибку.
   - При сетевых ошибках или 5xx показывать общий фолбек.

6. **Кеширование и SEO**
   - Позволяется кешировать публичные GET-ответы на стороне клиента/SSR; формы и аутентификация не кешировать.
   - Использовать `sitemap.xml` и `seo`-блоки для генерации метатегов на сервере при SSR.

