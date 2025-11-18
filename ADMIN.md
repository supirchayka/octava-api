# ADMIN.md — техническое задание для фронтенд-админки

Документ описывает только административные сценарии (аутентификация, загрузка файлов и управление каталогом/контентом). Его цель — дать фронтенду полное понимание, какие формы надо реализовать, какие данные отправлять и какие ответы ожидать от API.

## 1. Общие правила
- **Базовый URL** совпадает с адресом бэкенда (например, `https://api.octava.local`). Все пути ниже начинаются относительно него.
- **Авторизация.** Каждый маршрут `/admin/*` требует JWT токен в заголовке `Authorization: Bearer <accessToken>`. Токен выдаётся после логина, срок жизни задаётся переменной `JWT_ACCESS_EXPIRES_IN` (по умолчанию 15 минут).【F:src/services/auth.service.ts†L6-L120】
- **Формат данных.** Админские ручки принимают/возвращают JSON, кроме `/admin/files/upload`. Для него поддерживаются два режима: классический `multipart/form-data` с одним файлом либо «сырой» бинарный поток (например, `fetch` с `Blob`). Во втором случае рекомендуется указать заголовок `X-Filename`, чтобы сервер сохранил исходное расширение.【F:src/routes/admin-files.routes.ts†L5-L15】【F:src/services/admin-files.service.ts†L122-L187】
- **Медиа-идентификаторы.** Любое изображение или документ сначала загружается через `/admin/files/upload`. Ответ содержит `id` и `path` — их фронт хранит и подставляет далее в полях `heroImageFileId`, `galleryImageFileIds`, `ogImageId` и т.д.【F:src/services/admin-files.service.ts†L32-L56】【F:prisma/schema.prisma†L150-L158】

## 2. Аутентификация
Перед запуском фронтенда выполните `npm run prisma:seed` (или `npx prisma db seed`), чтобы гарантированно существовал администратор. По умолчанию сид создаёт пользователя `admin@octava.ru` с паролем `changeme`; эти значения можно изменить через переменные `ADMIN_EMAIL`/`ADMIN_PASSWORD` перед выполнением сида. Каждый повторный сид обновит (и активирует) учётку по этому e-mail и перехэширует пароль, поэтому логин всегда синхронизирован с документацией.【F:prisma/seed.ts†L17-L37】
### 2.1 POST /auth/login
- **Назначение:** получить пару токенов.
- **Тело запроса:**
  ```json
  {
    "email": "admin@octava.ru",
    "password": "changeme"
  }
  ```
- **Ответ (200):**
  ```json
  {
    "user": {
      "id": 1,
      "email": "admin@octava.ru",
      "role": "ADMIN"
    },
    "accessToken": "<jwt>",
    "refreshToken": "<long-random-string>"
  }
  ```
  Если логин/пароль неверны, сервер вернёт `401 Unauthorized`.【F:src/services/auth.service.ts†L47-L76】

### 2.2 POST /auth/refresh
- **Назначение:** обновить пару токенов, одновременно ревокуя старый refresh.
- **Тело:** `{ "refreshToken": "<existing-token>" }`.
- **Ответ (200):** такая же структура, но с новым `refreshToken`. Ошибки 400/401 возвращаются при отсутствии токена или если он просрочен/отозван.【F:src/services/auth.service.ts†L78-L121】

### 2.3 GET /auth/me
- **Назначение:** получить профиль текущего пользователя и подтвердить валидность accessToken.
- **Ответ:** `{ "id": 1, "email": "admin@octava.ru", "role": "ADMIN" }`. Ошибка 401, если токен недействителен.【F:src/services/auth.service.ts†L123-L139】

## 3. Работа с файлами и изображениями
### 3.1 Загрузка файла — POST /admin/files/upload
- **Формат:**
  - `multipart/form-data` с единственным полем `file`.
  - Либо POST, где тело — чистый бинарный поток (Blob/ArrayBuffer). При таком запросе можно передать `Content-Type` любого поддерживаемого формата (JPEG, PNG, WEBP, PDF и т.п.). Если заголовок `Content-Type` или `X-Filename` отсутствует, сервер определит тип по сигнатуре и добавит расширение сам.
- **Ограничения:** до 20 МБ; MIME автоматически классифицируется как `IMAGE` или `DOCUMENT`. Файл записывается в `uploads/<uuid>.<ext>`, а запись в таблице `File` хранит `id`, `path`, `mime`, `sizeBytes`, а также опциональные размеры изображения.【F:src/services/admin-files.service.ts†L96-L187】【F:prisma/schema.prisma†L150-L158】
- **Ответ (201):**
  ```json
  {
    "id": 345,
    "storage": "LOCAL",
    "kind": "IMAGE",
    "originalName": "hero.png",
    "path": "uploads/8bc5d1c4-0a.png",
    "mime": "image/png",
    "sizeBytes": 183552
  }
  ```

### 3.2 Унифицированная логика HERO/галерей
- Каждый медиа-блок хранится в таблицах `CategoryImage`, `ServiceImage` или `DeviceImage` с полем `purpose`, которое может быть `HERO`, `GALLERY` или `INLINE`. Это гарантирует, что у сущности ровно один HERO и произвольное число элементов в галерее, упорядоченных по `order`. Фронтенд управляет порядком, просто отправляя ID файлов в нужной последовательности.【F:prisma/schema.prisma†L53-L56】【F:prisma/schema.prisma†L498-L646】【F:prisma/schema.prisma†L653-L674】
- Общий алгоритм:
  1. Загрузить каждое изображение через `/admin/files/upload` и сохранить его `id`.
  2. При создании сущности передать `heroImageFileId` и/или массив `galleryImageFileIds`.
  3. При обновлении:
     - не передавать поле, если его не нужно менять;
     - передать `null`, чтобы удалить HERO;
     - передать массив (включая пустой), чтобы пересобрать галерею целиком.
- **Категории:** поддерживают только HERO. Обновление всегда удаляет предыдущую запись перед сохранением новой, что исключает дубликаты.【F:src/services/admin-catalog.service.ts†L94-L165】
- **Услуги:** транзакционно создают/обновляют HERO, галерею, привязки к устройствам и расширенные цены, сохраняя порядок элементов. Любой переданный массив пересобирается с нуля, поэтому фронт должен отправлять полный список. Ответ содержит вложенные `images` (с `file`), `devices`, `pricesExtended` и `seo` для дальнейшего отображения/редактирования.【F:src/services/admin-catalog.service.ts†L263-L353】【F:src/services/admin-catalog.service.ts†L357-L459】【F:src/services/admin-catalog.service.ts†L343-L350】
- **Аппараты:** работают по тем же правилам; HERO всегда одиночный, галерея пересоздаётся при передаче массива. Ответ содержит `images` (каждое с вложенным `file`) и `seo`.【F:src/services/admin-catalog.service.ts†L544-L595】【F:src/services/admin-catalog.service.ts†L597-L676】

### 3.3 Автогенерация slug
- Slug для категорий, услуг и аппаратов вычисляется на сервере. Фронтенду НЕ нужно отправлять поле `slug` ни при создании, ни при обновлении.
- Алгоритм: берём человекочитаемое название (`name` для категорий/услуг, `brand + model` для аппаратов), транслитерируем русские символы в латиницу, приводим строку к нижнему регистру и заменяем любые неалфавитно-цифровые символы на дефисы. Это гарантирует валидность URL.
- Перед сохранением slug проверяется на уникальность в соответствующей таблице. При коллизии сервер добавляет к базе суффикс `-xxxx`, где `xxxx` — случайная комбинация из 4 латинских букв/цифр (например, `injekcii-a9f2`). При необходимости проверка повторяется, пока не будет найдено уникальное значение.
- В ответах API slug всегда присутствует — UI должен отображать и использовать его для ссылок, но не отправлять обратно. При изменении `name`/`brand`/`model` slug пересчитается автоматически.

## 4. Каталог
### 4.1 Категории услуг
| Метод | Путь | Обязательные поля | Дополнительные поля |
| --- | --- | --- | --- |
| GET | `/admin/catalog/categories` | — | возвращает список категорий с HERO/SEO |
| GET | `/admin/catalog/categories/:id` | `id` из URL | возвращает конкретную категорию |
| POST | `/admin/catalog/categories` | `name: string` | `description?: string`, `sortOrder?: number`, `heroImageFileId?: number`, `seo?: SeoBody` |
| PUT | `/admin/catalog/categories/:id` | — (все поля опциональны) | те же, что и в POST |
| DELETE | `/admin/catalog/categories/:id` | `id` из URL | — |

**SeoBody** включает `metaTitle`, `metaDescription`, `canonicalUrl`, `robotsIndex`, `robotsFollow`, `ogTitle`, `ogDescription`, `ogImageId`. Любое поле можно опустить или передать `null`. 【F:src/routes/admin-catalog.routes.ts†L45-L112】

> Slug категории создаётся автоматически из `name` по правилам §3.3 и возвращается в ответе.

**Ответ GET /admin/catalog/categories (200):**
```json
[
  {
    "id": 12,
    "slug": "inekcii",
    "name": "Инъекции",
    "description": "Малоинвазивные процедуры",
    "sortOrder": 20,
    "heroImageFileId": 345,
    "heroImage": {
      "id": 901,
      "fileId": 345,
      "order": 0,
      "alt": "Инъекционная процедура",
      "caption": null,
      "file": {
        "id": 345,
        "url": "/uploads/hero.png",
        "originalName": "hero.png",
        "mime": "image/png",
        "width": 1600,
        "height": 900
      }
    },
    "seo": {
      "metaTitle": "Инъекционные процедуры",
      "metaDescription": "Краткое описание",
      "canonicalUrl": null,
      "robotsIndex": true,
      "robotsFollow": true,
      "ogTitle": "Инъекции",
      "ogDescription": null,
      "ogImageId": 678,
      "ogImage": {
        "id": 678,
        "url": "/uploads/og.png",
        "originalName": "og.png",
        "mime": "image/png",
        "width": 1200,
        "height": 630
      }
    }
  }
]
```

**Ответ GET /admin/catalog/categories/:id (200)** — тот же объект, что и в списке. Используйте `heroImageFileId` и `seo.ogImageId`, чтобы заполнить форму редактирования без дополнительных запросов.【F:src/services/admin-catalog.service.ts†L86-L165】

**Пример создания:**
```http
POST /admin/catalog/categories
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Инъекции",
  "description": "Малоинвазивные процедуры",
  "sortOrder": 20,
  "heroImageFileId": 345,
  "seo": {
    "metaTitle": "Инъекционные процедуры",
    "metaDescription": "Краткое описание",
    "ogImageId": 678
  }
}
```
**Ответ (200):**
```json
{
  "id": 12,
  "name": "Инъекции",
  "slug": "injections",
  "description": "Малоинвазивные процедуры",
  "sortOrder": 20,
  "updatedAt": "2025-05-17T09:42:31.000Z"
}
```
> HERO привяжется автоматически, если `heroImageFileId` не `null`. При `PUT` значение `null` удалит текущий HERO; отсутствие поля оставит его без изменений.【F:src/services/admin-catalog.service.ts†L94-L165】

### 4.2 Услуги
#### GET /admin/catalog/services
- `query.categoryId?: number` — фильтрация по категории.
- **Ответ:** массив объектов
```json
{
  "id": 44,
  "slug": "smas-lifting",
  "categoryId": 12,
  "categoryName": "Инъекции",
  "name": "SMAS-лифтинг",
  "shortOffer": "Быстрый лифтинг без реабилитации",
  "priceFrom": 19000,
  "durationMinutes": 90,
  "benefit1": "Клинически доказанный результат",
  "benefit2": "Одной процедуры достаточно",
  "ctaText": "Записаться",
  "ctaUrl": "/forms/service?s=smas-lifting",
  "sortOrder": 0,
  "heroImageFileId": 345,
  "heroImage": {
    "id": 901,
    "fileId": 345,
    "purpose": "HERO",
    "order": 0,
    "file": { "id": 345, "url": "/uploads/hero.png", "mime": "image/png", "width": 1600, "height": 900 }
  },
  "galleryImageFileIds": [346, 347],
  "galleryImages": [
    { "id": 902, "fileId": 346, "order": 0, "purpose": "GALLERY", "file": { "id": 346, "url": "/uploads/gallery-1.png", "mime": "image/png", "width": 1200, "height": 800 } },
    { "id": 903, "fileId": 347, "order": 1, "purpose": "GALLERY", "file": { "id": 347, "url": "/uploads/gallery-2.png", "mime": "image/png", "width": 1200, "height": 800 } }
  ],
  "usedDeviceIds": [5, 9],
  "servicePricesExtended": [
    { "id": 80, "title": "SMAS лицо", "price": 19000, "durationMinutes": 60, "type": "BASE", "sessionsCount": null, "order": 0, "isActive": true },
    { "id": 81, "title": "SMAS лицо+шея", "price": 26000, "durationMinutes": 90, "type": "PACKAGE", "sessionsCount": null, "order": 2, "isActive": true }
  ],
  "seo": {
    "metaTitle": "SMAS-лифтинг в OCTAVA",
    "metaDescription": "Передовое оборудование",
    "canonicalUrl": null,
    "robotsIndex": true,
    "robotsFollow": true,
    "ogTitle": "SMAS-лифтинг",
    "ogDescription": null,
    "ogImageId": 678,
    "ogImage": { "id": 678, "url": "/uploads/og.png", "mime": "image/png", "width": 1200, "height": 630 }
  }
}
```
- Массивы уже приходят в порядке показа, числовые поля приведены к number, файлы содержат URL — можно сразу рисовать предпросмотры списков и форм.【F:src/routes/admin-catalog.routes.ts†L116-L181】【F:src/services/admin-catalog.service.ts†L309-L459】

#### GET /admin/catalog/services/:id
- Возвращает один объект услуги в том же формате (404, если `id` не найден).

**Схема запроса (POST /admin/catalog/services):**
- Базовые поля: `categoryId`, `name`, `shortOffer` (обязательные); опциональные `priceFrom`, `durationMinutes`, `benefit1`, `benefit2`, `ctaText`, `ctaUrl`, `sortOrder`. Slug генерируется автоматически из `name`.
- Медиа/связи: `heroImageFileId?: number`, `galleryImageFileIds?: number[]`, `usedDeviceIds?: number[]`.
- Расширенные цены: `servicePricesExtended?: { title: string; price: number; durationMinutes?: number; type?: 'BASE'|'EXTRA'|'PACKAGE'; sessionsCount?: number; order?: number; isActive?: boolean; }[]`.
- `seo?: SeoBody`.
`PUT /admin/catalog/services/:id` принимает те же поля, но все они опциональны; массивы, если переданы, пересобираются целиком. Удаление HERO — через `"heroImageFileId": null`. Пустой массив `[]` удалит галерею/список устройств/цен.【F:src/routes/admin-catalog.routes.ts†L116-L221】【F:src/services/admin-catalog.service.ts†L263-L459】

> Если при обновлении поменять `name`, slug услуги также пересчитается и вернётся в ответе. Старые slug не нужно хранить на фронте.

**Пример создания:**
```http
POST /admin/catalog/services
Authorization: Bearer <token>
Content-Type: application/json

{
  "categoryId": 12,
  "name": "SMAS-лифтинг",
  "shortOffer": "Быстрый лифтинг без реабилитации",
  "priceFrom": 19000,
  "durationMinutes": 90,
  "benefit1": "Клинически доказанный результат",
  "benefit2": "Одной процедуры достаточно",
  "ctaText": "Записаться",
  "ctaUrl": "/forms/service?s=smas-lifting",
  "heroImageFileId": 345,
  "galleryImageFileIds": [346, 347, 348],
  "usedDeviceIds": [5, 9],
  "servicePricesExtended": [
    { "title": "SMAS лицо", "price": 19000, "durationMinutes": 60, "type": "BASE" },
    { "title": "SMAS лицо+шея", "price": 26000, "durationMinutes": 90, "type": "PACKAGE", "order": 2 }
  ],
  "seo": {
    "metaTitle": "SMAS-лифтинг в OCTAVA",
    "metaDescription": "Передовое оборудование",
    "ogImageId": 678
  }
}
```
**Ответ (200):**
```json
{
  "id": 44,
  "categoryId": 12,
  "name": "SMAS-лифтинг",
  "slug": "smas-lifting",
  "shortOffer": "Быстрый лифтинг без реабилитации",
  "priceFrom": 19000,
  "durationMinutes": 90,
  "benefit1": "Клинически доказанный результат",
  "benefit2": "Одной процедуры достаточно",
  "ctaText": "Записаться",
  "ctaUrl": "/forms/service?s=smas-lifting",
  "sortOrder": 0,
  "updatedAt": "2025-05-17T09:50:12.000Z",
  "pricesExtended": [
    {
      "id": 80,
      "serviceId": 44,
      "title": "SMAS лицо",
      "price": 19000,
      "durationMinutes": 60,
      "type": "BASE",
      "sessionsCount": null,
      "order": 0,
      "isActive": true
    },
    {
      "id": 81,
      "serviceId": 44,
      "title": "SMAS лицо+шея",
      "price": 26000,
      "durationMinutes": 90,
      "type": "PACKAGE",
      "sessionsCount": null,
      "order": 2,
      "isActive": true
    }
  ],
  "devices": [
    { "serviceId": 44, "deviceId": 5, "device": { "id": 5, "brand": "Ulthera", "model": "System", "slug": "ulthera" } },
    { "serviceId": 44, "deviceId": 9, "device": { "id": 9, "brand": "Doublo", "model": "Gold", "slug": "doublo-gold" } }
  ],
  "images": [
    {
      "id": 901,
      "purpose": "HERO",
      "order": 0,
      "file": { "id": 345, "path": "uploads/hero.png", "mime": "image/png" }
    },
    {
      "id": 902,
      "purpose": "GALLERY",
      "order": 0,
      "file": { "id": 346, "path": "uploads/gallery-1.png", "mime": "image/png" }
    }
  ],
  "seo": {
    "serviceId": 44,
    "metaTitle": "SMAS-лифтинг в OCTAVA",
    "metaDescription": "Передовое оборудование",
    "canonicalUrl": null,
    "robotsIndex": true,
    "robotsFollow": true,
    "ogTitle": null,
    "ogDescription": null,
    "ogImageId": 678
  }
}
```
> Ответ построен на реальном `include`, поэтому фронтенд может заполнить форму редактирования без дополнительных запросов.【F:src/services/admin-catalog.service.ts†L343-L353】

### 4.3 Аппараты
#### GET /admin/catalog/devices
- **Ответ:** массив
```json
{
  "id": 5,
  "slug": "ulthera-system",
  "brand": "Ulthera",
  "model": "System",
  "positioning": "SMAS-лифтинг",
  "principle": "Ультразвук",
  "safetyNotes": "Процедура под контролем врача",
  "heroImageFileId": 777,
  "heroImage": { "id": 1101, "fileId": 777, "purpose": "HERO", "order": 0, "file": { "id": 777, "url": "/uploads/hero-device.png", "mime": "image/png", "width": 1600, "height": 900 } },
  "galleryImageFileIds": [778, 779],
  "galleryImages": [ { "id": 1102, "fileId": 778, "order": 0, "purpose": "GALLERY", "file": { "id": 778, "url": "/uploads/device-1.png", "mime": "image/png" } } ],
  "seo": {
    "metaTitle": "Аппарат Ulthera",
    "metaDescription": "Лифтинг без разрезов",
    "canonicalUrl": null,
    "robotsIndex": true,
    "robotsFollow": true,
    "ogImageId": 888,
    "ogImage": { "id": 888, "url": "/uploads/device-og.png", "mime": "image/png" }
  }
}
```
- `heroImageFileId` и `galleryImageFileIds` можно напрямую проставлять в формах, `heroImage.file.url` подходит для предпросмотра.

#### GET /admin/catalog/devices/:id
- Возвращает единичный объект аппарата в том же формате (404, если `id` не найден).【F:src/routes/admin-catalog.routes.ts†L183-L247】【F:src/services/admin-catalog.service.ts†L461-L642】
**POST /admin/catalog/devices**
- Обязательные поля: `brand`, `model`, `positioning`, `principle`. Slug генерируется автоматически из `brand + model`.
- Опциональные: `safetyNotes`, `heroImageFileId`, `galleryImageFileIds`, `seo` (та же структура).
`PUT /admin/catalog/devices/:id` принимает те же поля; массивы/hero ведут себя как в услугах. `DELETE` удаляет запись целиком.【F:src/routes/admin-catalog.routes.ts†L224-L305】【F:src/services/admin-catalog.service.ts†L544-L676】

> При изменении `brand` или `model` slug устройства автоматически пересчитывается и возвращается в ответе.

**Пример обновления:**
```http
PUT /admin/catalog/devices/5
Authorization: Bearer <token>
Content-Type: application/json

{
  "brand": "Ulthera",
  "model": "System",
  "positioning": "SMAS-лифтинг без хирургии",
  "principle": "Сфокусированный ультразвук",
  "safetyNotes": "Процедура проводится врачом",
  "heroImageFileId": 401,
  "galleryImageFileIds": [402, 403],
  "seo": { "metaTitle": "Аппарат Ulthera", "ogImageId": 401 }
}
```
**Ответ:**
```json
{
  "id": 5,
  "brand": "Ulthera",
  "model": "System",
  "slug": "ulthera",
  "positioning": "SMAS-лифтинг без хирургии",
  "principle": "Сфокусированный ультразвук",
  "safetyNotes": "Процедура проводится врачом",
  "updatedAt": "2025-05-17T10:05:10.000Z",
  "images": [
    { "purpose": "HERO", "order": 0, "file": { "id": 401, "path": "uploads/u-hero.png" } },
    { "purpose": "GALLERY", "order": 0, "file": { "id": 402, "path": "uploads/u-gal-1.png" } }
  ],
  "seo": {
    "deviceId": 5,
    "metaTitle": "Аппарат Ulthera",
    "metaDescription": "",
    "canonicalUrl": null,
    "robotsIndex": true,
    "robotsFollow": true,
    "ogImageId": 401
  }
}
```

## 5. Статические страницы
Каждая страница управляется парой маршрутов: `GET /admin/pages/...` возвращает текущие значения для формы, `PUT /admin/pages/...` принимает частичное обновление (любой переданный ключ можно обнулить через `null`). Ниже — полные JSON-примеры.

### 5.1 `/admin/pages/home`
**GET Response 200**
```json
{
  "heroTitle": "Клиника OCTAVA — молодость и эстетика",
  "heroSubtitle": "Современные методы антивозрастной медицины и косметологии",
  "heroCtaText": "Записаться на консультацию",
  "heroCtaUrl": "/contacts",
  "subheroTitle": "Комплексный подход",
  "subheroSubtitle": "Индивидуальные протоколы и лучшие аппараты",
  "interiorText": "Интерьер OCTAVA создан для ощущения спокойствия и комфорта.",
  "heroImages": [
    {
      "id": 11,
      "fileId": 501,
      "order": 0,
      "alt": "Главный баннер",
      "caption": null,
      "file": {
        "id": 501,
        "path": "/uploads/seed/hero-home.jpg",
        "mime": "image/jpeg",
        "originalName": "hero-home.jpg",
        "sizeBytes": 325811
      }
    }
  ],
  "interiorImages": [
    {
      "id": 21,
      "fileId": 610,
      "order": 1,
      "alt": "Зал ожидания",
      "caption": null,
      "file": {
        "id": 610,
        "path": "/uploads/seed/gallery-1.jpg",
        "mime": "image/jpeg",
        "originalName": "gallery-1.jpg",
        "sizeBytes": 220144
      }
    }
  ],
  "directions": [
    {
      "id": 31,
      "serviceId": 101,
      "order": 0,
      "service": {
        "id": 101,
        "slug": "tayskiy-massazh",
        "name": "Тайский массаж",
        "category": { "id": 1, "slug": "massazh", "name": "Массаж" }
      }
    },
    {
      "id": 32,
      "serviceId": 102,
      "order": 1,
      "service": {
        "id": 102,
        "slug": "spa-ritual-relax",
        "name": "SPA-ритуал Relax",
        "category": { "id": 2, "slug": "spa", "name": "SPA" }
      }
    },
    {
      "id": 33,
      "serviceId": 103,
      "order": 2,
      "service": {
        "id": 103,
        "slug": "lifting-ritual",
        "name": "Лифтинг-ритуал",
        "category": { "id": 3, "slug": "face", "name": "Лицо" }
      }
    },
    {
      "id": 34,
      "serviceId": 104,
      "order": 3,
      "service": {
        "id": 104,
        "slug": "detox-body",
        "name": "Detox Body",
        "category": { "id": 4, "slug": "detox", "name": "Детокс" }
      }
    }
  ],
  "seo": {
    "metaTitle": "Клиника OCTAVA — антивозрастная и эстетическая медицина",
    "metaDescription": "Процедуры, авторские протоколы и современные аппараты.",
    "canonicalUrl": null,
    "robotsIndex": true,
    "robotsFollow": true,
    "ogTitle": "OCTAVA",
    "ogDescription": "Антивозрастная медицина и косметология",
    "ogImageId": 345
  }
}
```

**PUT Body (пример)**
```json
{
  "heroTitle": "OCTAVA",
  "heroSubtitle": "Экспертная косметология",
  "heroCtaText": "Записаться",
  "heroCtaUrl": "/forms/contact",
  "subheroTitle": "Комплексный подход",
  "subheroSubtitle": "Лучшие аппараты",
  "interiorText": "Обновили описание интерьера",
  "heroImages": [
    { "fileId": 777, "alt": "Обложка", "caption": null }
  ],
  "interiorImages": [
    { "fileId": 801, "order": 0 },
    { "fileId": 802, "order": 1 }
  ],
  "directions": [
    { "serviceId": 201, "order": 0 },
    { "serviceId": 202, "order": 1 },
    { "serviceId": 203, "order": 2 },
    { "serviceId": 204, "order": 3 }
  ],
  "seo": { "metaTitle": "Главная OCTAVA", "ogImageId": 345 }
}
```

> `directions` обязательно должен содержать четыре услуги. Чтобы очистить HERO, передайте пустой массив `heroImages`.

### 5.2 `/admin/pages/about`
**GET Response 200**
```json
{
  "heroTitle": "OCTAVA — центр экспертной косметологии",
  "heroDescription": "Сочетаем аппаратные и инъекционные методики",
  "howWeAchieveText": "Работаем по международным протоколам",
  "heroCtaTitle": "Нужна консультация?",
  "heroCtaSubtitle": null,
  "heroImage": {
    "id": 901,
    "path": "/uploads/seed/about-hero.jpg",
    "mime": "image/jpeg",
    "originalName": "about-hero.jpg",
    "sizeBytes": 482113
  },
  "facts": [
    { "id": 1, "title": "15 лет", "text": "Опыт врачей", "order": 0 },
    { "id": 2, "title": "> 12000", "text": "Проведённых процедур", "order": 1 }
  ],
  "seo": {
    "metaTitle": "О клинике OCTAVA",
    "metaDescription": "Почему нам доверяют",
    "canonicalUrl": null,
    "robotsIndex": true,
    "robotsFollow": true,
    "ogTitle": null,
    "ogDescription": null,
    "ogImageId": null
  }
}
```

**PUT Body (пример)**
```json
{
  "heroTitle": "OCTAVA",
  "heroDescription": "Новые формулировки",
  "heroImageFileId": 933,
  "howWeAchieveText": "Обновили блок доверия",
  "heroCtaTitle": "Оставить заявку",
  "heroCtaSubtitle": "Перезвоним за 5 минут",
  "facts": [
    { "title": "20+", "text": "Авторских протоколов", "order": 0 },
    { "title": "5", "text": "Кабинетов", "order": 1 }
  ],
  "seo": { "metaTitle": "О нас", "ogImageId": 4002 }
}
```

`heroImageFileId: null` очищает изображение, пустой массив `facts` удаляет все факты.

### 5.3 `/admin/pages/contacts`
**GET Response 200**
```json
{
  "phoneMain": "+7 (495) 000-00-00",
  "email": "info@octava.ru",
  "telegramUrl": "https://t.me/octava",
  "whatsappUrl": null,
  "addressText": "Москва, ул. Примерная, 10",
  "yandexMapUrl": "https://yandex.ru/map-widget/v1/?um=constructor%3A...",
  "workingHours": [
    { "id": 1, "group": "WEEKDAYS", "open": "10:00", "close": "21:00", "isClosed": false },
    { "id": 2, "group": "SATURDAY", "open": "11:00", "close": "18:00", "isClosed": false },
    { "id": 3, "group": "SUNDAY", "open": null, "close": null, "isClosed": true }
  ],
  "metroStations": [
    { "id": 5, "name": "Маяковская", "distanceMeters": 400, "line": "Зелёная" }
  ],
  "seo": {
    "metaTitle": "Контакты OCTAVA",
    "metaDescription": "Как нас найти",
    "canonicalUrl": null,
    "robotsIndex": true,
    "robotsFollow": true,
    "ogTitle": null,
    "ogDescription": null,
    "ogImageId": null
  }
}
```

**PUT Body (пример)**
```json
{
  "phoneMain": "+7 (495) 000-00-00",
  "email": "info@octava.ru",
  "telegramUrl": "https://t.me/octava",
  "whatsappUrl": "https://wa.me/79990000000",
  "addressText": "Москва, ул. Примерная, 10",
  "yandexMapUrl": "https://yandex.ru/map-widget/v1/?um=constructor%3A...",
  "workingHours": [
    { "group": "WEEKDAYS", "open": "10:00", "close": "21:00", "isClosed": false },
    { "group": "SATURDAY", "open": "11:00", "close": "18:00", "isClosed": false },
    { "group": "SUNDAY", "isClosed": true }
  ],
  "metroStations": [
    { "name": "Маяковская", "distanceMeters": 400, "line": "Зелёная" },
    { "name": "Белорусская", "distanceMeters": 850, "line": "Кольцевая" }
  ],
  "seo": { "metaTitle": "Контакты OCTAVA", "ogImageId": 350 }
}
```

`workingHours` и `metroStations` пересоздаются при каждом PUT — отправляйте полный набор значений.

### 5.4 `/admin/pages/personal-data-policy`
**GET Response 200**
```json
{
  "title": "Политика обработки персональных данных",
  "body": "<h1>1. Общие положения<\/h1>...",
  "seo": {
    "metaTitle": "Политика ПДн",
    "metaDescription": null,
    "canonicalUrl": null,
    "robotsIndex": true,
    "robotsFollow": true,
    "ogTitle": null,
    "ogDescription": null,
    "ogImageId": null
  }
}
```

**PUT Body** — те же ключи; `body` допускает HTML/Markdown.

### 5.5 `/admin/pages/privacy-policy`
**GET Response 200**
```json
{
  "title": "Политика конфиденциальности",
  "body": "<p>Положения...<\/p>",
  "seo": {
    "metaTitle": "Privacy",
    "metaDescription": null,
    "canonicalUrl": null,
    "robotsIndex": true,
    "robotsFollow": true,
    "ogTitle": null,
    "ogDescription": null,
    "ogImageId": null
  }
}
```

**PUT Body** — `title`, `body`, `seo`. Все поля частичные; `null` очищает данные.

## 6. Карточка организации
### GET /admin/org
```json
{
  "id": 1,
  "fullName": "ООО \"Октава\"",
  "ogrn": "1234567890123",
  "inn": "7701234567",
  "kpp": "770101001",
  "address": "г. Москва, ул. Примерная, 1",
  "email": "info@octava.ru",
  "createdAt": "2024-01-01T10:00:00.000Z",
  "updatedAt": "2025-05-17T09:00:00.000Z"
}
```
Возвращает `null`, если карточка ещё не создана.

### PUT /admin/org
Принимает любой поднабор полей `fullName`, `ogrn`, `inn`, `kpp`, `address`, `email`. Если записи ещё нет, создаёт новую; иначе выполняет частичное обновление. Ответ — актуальный объект Organization.【F:src/routes/admin-org.routes.ts†L8-L28】【F:src/services/admin-org.service.ts†L4-L55】

**Body (пример)**
```json
{
  "fullName": "ООО \"Октава\"",
  "ogrn": "1234567890123",
  "inn": "7701234567",
  "kpp": "770101001",
  "address": "г. Москва, ул. Примерная, 1",
  "email": "info@octava.ru"
}
```

## 7. Лиды
### 7.1 GET /admin/leads
- **Query-параметры (все опциональны):** `page`, `limit`, `status (NEW|IN_PROGRESS|DONE)`, `sourceType (HOME|CONTACTS|SERVICE|DEVICE|OTHER)`, `serviceId`, `deviceId`, `search`, `from`, `to` (ISO-строки).
- **Ответ:**
  ```json
  {
    "items": [
      {
        "id": 210,
        "sourceType": "SERVICE",
        "status": "NEW",
        "serviceId": 44,
        "name": "Анна",
        "phone": "+79990000000",
        "message": "Хочу консультацию",
        "utmSource": "google",
        "createdAt": "2025-05-17T08:32:10.000Z",
        "service": { "id": 44, "name": "SMAS-лифтинг", "slug": "smas-lifting" },
        "device": null
      }
    ],
    "total": 57,
    "page": 1,
    "limit": 20,
    "pages": 3
  }
  ```
  Лимит по умолчанию — 20; максимум — 100. Результат всегда содержит вложенные ссылки на услугу/аппарат, если они указаны. Поиск идёт по имени, телефону и UTM-полям. Дата-фильтр строится по `createdAt` (>= `from`, <= `to`).【F:src/routes/lead.routes.ts†L83-L140】【F:src/services/lead.service.ts†L155-L240】

### 7.2 PATCH /admin/leads/:id/status
- **Тело:** `{ "status": "IN_PROGRESS" }` — только перечисленные значения.
- **Ответ:** обновлённая запись лида.
- **Ошибки:** 400 при неверном статусе/ID, 404 если лида нет. Фронтенд может использовать это для смены этапа в воронке. 【F:src/routes/lead.routes.ts†L115-L140】【F:src/services/lead.service.ts†L242-L257】

## 8. Дополнительные медиа и документы
- **Service inline images.** Публичные карточки услуг используют изображения с `purpose = INLINE`, которые на данный момент наполняются миграциями/сидом и недоступны для редактирования через текущие админ-ручки. Фронтенд-админке достаточно отображать их в превью, считая read-only.
- **Device материалы.** Таблицы `DeviceCertBadge`, `DeviceAttachment`, `DeviceDocument` и др. содержат бейджи, дополнительные насадки/режимы и документы. Они связываются с сущностью через `deviceId` и используют файлы (`imageId`, `fileId`). Пока CRUD для них отсутствует, поэтому админский фронт работает только с HERO/галереей и базовыми полями устройства; отображение остального можно реализовать в виде read-only блока, подтягивая данные из публичного `GET /devices/:slug`. 【F:prisma/schema.prisma†L653-L759】
- **Документы организации.** Лицензии/сертификаты (`OrgLicense`, `OrgCertificate`) и текстовые документы (`OrgDocument`) управляются вне текущего ТЗ; фронт может только отображать их из публичных страниц.

## 9. Валидация и ошибки
- Все схемы Fastify отклоняют неизвестные поля, поэтому фронт должен отправлять только описанные ключи.
- При ошибках валидации сервер возвращает `400 Bad Request` с описанием проблемы; при отсутствии сущности — `404 Not Found`; при нехватке прав — `403 Forbidden`.
- После любой операции обновления, чтобы показать пользователю актуальные данные, можно повторно запросить соответствующую публичную карточку (например, `/service-categories`, `/services/:slug`, `/devices/:slug`, `/pages/*`).
