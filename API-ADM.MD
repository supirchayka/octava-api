# API административной панели OCTAVA

Документ служит техническим заданием для разработки фронтенда админской панели. Он описывает все приватные маршруты, обязательные данные запросов, ожидаемые ответы и общие правила работы с медиа, SEO и slug-ами.

## Общие требования

- **Аутентификация**: каждый приватный эндпоинт (все `/admin/**`) требует заголовок `Authorization: Bearer <accessToken>`.
- **Формат**: если не указано иное, тело запросов и ответов — JSON. Загрузку файлов выполняем через `multipart/form-data`.
- **Slug-и**: для категорий, услуг и аппаратов slug генерируется на сервере. Фронтенд не отправляет поле `slug`; оно вернётся в ответе. При совпадениях сервер добавляет случайный суффикс `-a1b2`.
- **Hero и галереи**:
  - Загружаем файл через `/admin/files/upload`, в ответе получаем `id`.
  - При создании/редактировании сущности передаём `heroImageFileId` (одно значение) и массив `galleryImageFileIds` (упорядоченный список).
  - Сервер гарантирует, что у каждой записи максимум один HERO. Новая загрузка перезаписывает старую.
- **SEO**: блок `seo` всегда необязателен. Передаём только поля, которые хотим изменить; отсутствующие поля остаются без изменений.

## 1. Аутентификация

### POST `/auth/login`
Запрашивает пару токенов.

**Body**
```json
{
  "email": "admin@octava.ru",
  "password": "changeme"
}
```

**Response 200**
```json
{
  "user": { "id": 1, "email": "admin@octava.ru", "role": "ADMIN" },
  "accessToken": "<JWT>",
  "refreshToken": "<random>"
}
```

### POST `/auth/refresh`
Обновляет пару токенов. Старый refresh аннулируется.

**Body**
```json
{ "refreshToken": "<старый refresh>" }
```

**Response 200** — структура, как у `/auth/login`.

### GET `/auth/me`
Возвращает текущего пользователя по access-токену.

**Response 200**
```json
{ "id": 1, "email": "admin@octava.ru", "role": "ADMIN" }
```

## 2. Управление файлами

### POST `/admin/files/upload`
Загружает один файл. Поле в multipart должно называться `file`.

**Response 201**
```json
{
  "id": 42,
  "storage": "LOCAL",
  "kind": "IMAGE",
  "originalName": "hero.jpg",
  "path": "uploads/9f5c....jpg",
  "mime": "image/jpeg",
  "sizeBytes": 582133
}
```
Полученный `id` используется в `heroImageFileId`, `galleryImageFileIds`, `ogImageId`, вложениях устройств и т.д.

## 3. Каталог (категории, услуги, аппараты)

### 3.1 Общие структуры

```json
"seo": {
  "metaTitle": "string | null",
  "metaDescription": "string | null",
  "canonicalUrl": "string | null",
  "robotsIndex": true,
  "robotsFollow": true,
  "ogTitle": "string | null",
  "ogDescription": "string | null",
  "ogImageId": 42
}
```

`servicePricesExtended`:
```json
[
  {
    "title": "VIP пакет",
    "price": 25000,
    "durationMinutes": 90,
    "type": "PACKAGE", // BASE | EXTRA | PACKAGE
    "sessionsCount": 4,
    "order": 0,
    "isActive": true
  }
]
```

### 3.2 Категории услуг

#### GET `/admin/catalog/categories`
Список категорий (со слагами, HERO и SEO).

**Response 200**
```json
[
  {
    "id": 1,
    "slug": "massazh",
    "name": "Массаж",
    "description": "",
    "sortOrder": 10,
    "heroImageFileId": 101,
    "heroImage": { "id": 5, "fileId": 101, "purpose": "HERO", "order": 0, "file": { "id": 101, "url": "https://..." } },
    "seo": { "metaTitle": "Массаж", "ogImageId": 101 }
  }
]
```

#### GET `/admin/catalog/categories/:id`
Возвращает категорию по числовому `id`.

#### POST `/admin/catalog/categories`

**Body**
```json
{
  "name": "Массаж",
  "description": "Короткое описание",
  "sortOrder": 10,
  "heroImageFileId": 101,
  "seo": { "metaTitle": "Массаж" }
}
```

**Response 201**
```json
{
  "id": 1,
  "name": "Массаж",
  "slug": "massazh",
  "description": "Короткое описание",
  "sortOrder": 10
}
```

#### PUT `/admin/catalog/categories/:id`
Передаём только изменяемые поля. Установка `heroImageFileId: null` удаляет текущий HERO.

#### DELETE `/admin/catalog/categories/:id`
Удаляет категорию.

### 3.3 Услуги

#### GET `/admin/catalog/services`
Необязательный `?categoryId=1` фильтрует список.

**Response 200**
```json
[
  {
    "id": 10,
    "slug": "tajskij-massazh",
    "categoryId": 1,
    "categoryName": "Массаж",
    "name": "Тайский массаж",
    "shortOffer": "60 минут релакса",
    "priceFrom": 4500,
    "durationMinutes": 60,
    "benefit1": "Снимает стресс",
    "benefit2": "Улучшает сон",
    "ctaText": "Записаться",
    "ctaUrl": "/forms/service",
    "sortOrder": 20,
    "heroImageFileId": 105,
    "heroImage": { "id": 77, "fileId": 105, "purpose": "HERO", "order": 0, "file": { "url": "https://..." } },
    "galleryImageFileIds": [106, 107],
    "galleryImages": [ { "id": 80, "fileId": 106, "order": 0, "file": { "url": "https://..." } } ],
    "usedDeviceIds": [3, 4],
    "servicePricesExtended": [ { "id": 55, "title": "VIP пакет", "price": 25000, "type": "PACKAGE" } ],
    "seo": { "metaTitle": "Тайский массаж" }
  }
]
```

#### GET `/admin/catalog/services/:id`
Подробности услуги по числовому `id`.

#### POST `/admin/catalog/services`

**Body**
```json
{
  "categoryId": 1,
  "name": "Тайский массаж",
  "shortOffer": "60 минут релакса",
  "priceFrom": 4500,
  "durationMinutes": 60,
  "benefit1": "Снимает стресс",
  "benefit2": "Улучшает сон",
  "ctaText": "Записаться",
  "ctaUrl": "/forms/service",
  "sortOrder": 20,
  "heroImageFileId": 105,
  "galleryImageFileIds": [106, 107],
  "usedDeviceIds": [3],
  "servicePricesExtended": [
    { "title": "VIP пакет", "price": 25000, "type": "PACKAGE", "sessionsCount": 4, "order": 0 }
  ],
  "seo": { "metaTitle": "Тайский массаж" }
}
```

**Response 201** — объект услуги c присвоенным `slug`.

#### PUT `/admin/catalog/services/:id`
Любое поле опционально. Пустой массив `galleryImageFileIds: []` очищает галерею; `null` очищает HERO. Новые `usedDeviceIds` перезаписывают связи.

#### DELETE `/admin/catalog/services/:id`
Удаляет услугу вместе с ценами и связями.

### 3.4 Аппараты

#### GET `/admin/catalog/devices`
Возвращает список аппаратов в алфавитном порядке.

**Response 200**
```json
[
  {
    "id": 3,
    "slug": "ultraformer-iii",
    "brand": "Ultraformer",
    "model": "III",
    "positioning": "SMAS-лифтинг",
    "principle": "HIFU",
    "safetyNotes": "Допуск врача",
    "heroImageFileId": 205,
    "heroImage": { "id": 88, "fileId": 205, "purpose": "HERO", "file": { "url": "https://..." } },
    "galleryImageFileIds": [206],
    "galleryImages": [ { "id": 90, "fileId": 206, "order": 0, "file": { "url": "https://..." } } ],
    "seo": { "metaTitle": "Аппарат Ultraformer III" }
  }
]
```

#### GET `/admin/catalog/devices/:id`
Подробности аппарата.

#### POST `/admin/catalog/devices`

**Body**
```json
{
  "brand": "Ultraformer",
  "model": "III",
  "positioning": "SMAS-лифтинг",
  "principle": "Сфокусированный ультразвук",
  "safetyNotes": "Есть противопоказания",
  "heroImageFileId": 205,
  "galleryImageFileIds": [206, 207],
  "seo": { "metaTitle": "Ultraformer III" }
}
```

**Response 201** — объект аппарата.

#### PUT `/admin/catalog/devices/:id`
Все поля опциональны. Массивы `galleryImageFileIds` пересоздаются целиком.

#### DELETE `/admin/catalog/devices/:id`
Удаляет аппарат и связанные изображения.

## 4. Организация

### GET `/admin/org`
Возвращает текущую карточку организации (или `null`, если не создана).

**Response 200**
```json
{
  "id": 1,
  "fullName": "ООО «OCTAVA»",
  "ogrn": "1234567890123",
  "inn": "7701234567",
  "kpp": "770101001",
  "address": "Москва, ул. Пример, 10",
  "email": "info@octava.ru",
  "createdAt": "2024-01-01T10:00:00.000Z",
  "updatedAt": "2024-11-20T12:00:00.000Z"
}
```

### PUT `/admin/org`
Частично обновляет карточку. Поля необязательны; не переданные значения сохраняются.

**Body**
```json
{
  "fullName": "ООО «OCTAVA»",
  "ogrn": "1234567890123",
  "inn": "7701234567",
  "kpp": "770101001",
  "address": "Москва, ул. Пример, 10",
  "email": "info@octava.ru"
}
```

**Response 200** — сохранённый объект организации.

## 5. Управление статическими страницами

Каждый маршрут возвращает `204 No Content` при успехе. Передаём только изменяемые поля.

### PUT `/admin/pages/home`
Поля: `heroTitle`, `heroSubtitle`, `heroCtaText`, `heroCtaUrl`, `subheroTitle`, `subheroSubtitle`, `interiorText`, `seo`.

**Body пример**
```json
{
  "heroTitle": "OCTAVA",
  "heroSubtitle": "Главная страница",
  "heroCtaText": "Записаться",
  "heroCtaUrl": "/contacts",
  "subheroTitle": "Компетенции",
  "interiorText": "Новые фото интерьера",
  "seo": { "metaTitle": "Главная OCTAVA" }
}
```

### PUT `/admin/pages/about`
Поля: `heroTitle`, `heroDescription`, `howWeAchieveText`, `heroCtaTitle`, `heroCtaSubtitle`, `seo`.

### PUT `/admin/pages/contacts`
Поля: `phoneMain`, `email`, `telegramUrl`, `whatsappUrl`, `addressText`, `yandexMapUrl`, `seo`.

### PUT `/admin/pages/personal-data-policy`
Поля: `title`, `body`, `seo`.

### PUT `/admin/pages/privacy-policy`
Поля: `title`, `body`, `seo`.

## 6. Лиды

### GET `/admin/leads`
Список лидов с фильтрами. Все параметры строковые и необязательны:
- `page`, `limit` — пагинация.
- `status` — `NEW | IN_PROGRESS | DONE`.
- `sourceType` — `HOME | CONTACTS | SERVICE | DEVICE | OTHER`.
- `serviceId`, `deviceId` — фильтры по связанной сущности.
- `search` — поиск по имени/телефону.
- `from`, `to` — ISO-даты для фильтра по времени создания.

**Response 200 (пример)**
```json
{
  "items": [
    {
      "id": 12,
      "name": "Анна",
      "phone": "+7 900 000-00-00",
      "message": "Хочу консультацию",
      "status": "NEW",
      "sourceType": "SERVICE",
      "serviceId": 10,
      "deviceId": null,
      "createdAt": "2024-11-20T12:00:00.000Z"
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 35
}
```

### PATCH `/admin/leads/:id/status`
Обновляет статус лида.

**Body**
```json
{ "status": "IN_PROGRESS" }
```

**Response 200**
```json
{ "id": 12, "status": "IN_PROGRESS" }
```

---

Этот документ охватывает все приватные маршруты, описывает работу с медиа и SEO и должен использоваться как единственный источник правды при разработке фронтенд-админки.
