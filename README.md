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
- **Тип запроса:** `multipart/form-data` с единственным файлом (ограничение 20 МБ).
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
#### GET /service-categories
- **Ответ:** массив категорий `{ id, slug, name, description, servicesCount }`.

#### GET /service-categories/:slug
- **Ответ:** `{ category: { id, slug, name, description }, seo, services: [...] }`, где каждая услуга содержит `id, slug, name, shortOffer, priceFrom, durationMinutes, benefits[], ctaText, ctaUrl`.
- **404:** если slug не найден.

#### GET /services/:slug
- **Ответ:** объект с блоками:
  - `service`: `{ id, slug, name, category: { id, slug, name } }`.
  - `seo`: SEO-мета.
  - `hero`: `{ title, shortOffer, priceFrom, durationMinutes, benefits[], ctaText, ctaUrl, images[] }`.
  - `about`: `{ whoIsFor, effect, principle, resultsTiming, courseSessions } | null`.
  - `pricesExtended`: массив `{ id, title, price, durationMinutes, type, order }`.
  - `indications[]`, `contraindications[]` — строки.
  - `preparationChecklist[]` и `rehabChecklist[]` — элементы `{ id, text, order }`.
  - `devices`: массив связанных аппаратов `{ id, slug, brand, model, positioning }`.
  - `galleryImages[]` и `inlineImages[]`: `{ id, url, alt, caption, order }`.
  - `faq[]`: `{ id, question, answer, order }`.
  - `legalDisclaimer`: строка или `null`.
- **404:** если slug не найден.

#### GET /devices
- **Ответ:** список аппаратов `{ id, slug, brand, model, positioning }`.

#### GET /devices/:slug
- **Ответ:** объект с блоками:
  - `device`: базовые поля `{ id, slug, brand, model, positioning, principle, safetyNotes }`.
  - `seo`: SEO-мета.
  - `hero`: `{ brand, model, positioning, certBadges[], images[] }`, где `certBadges` включают `image` (иконка) и `file` (подтверждающий документ).
  - `galleryImages[]`, `inlineImages[]`.
  - `attachments[]`: `{ id, name, description, image? }`.
  - `indications[]`, `contraindications[]` — строки.
  - `sideEffects[]`: `{ id, text, rarity }`.
  - `documents[]`: `{ id, docType, title, file: { id, url, mime, name } }`.
  - `faq[]`: `{ id, question, answer, order }`.
  - `services[]`: связанные услуги `{ id, slug, name, shortOffer, priceFrom }`.
- **404:** если slug не найден.

### 3.4 Публичные страницы
Каждый маршрут возвращает `{ page: { type, slug }, seo, ... }`. Структуры:
- **GET /pages/home:** `hero` (заголовок, подзаголовок, CTA и HERO-галерея), `directions` (витрина услуг с вложенными категориями), `subHero` и блок `interior` с описанием и фотогалереей.
- **GET /pages/about:** `hero` (title/description), `trustItems` (список наград/лицензий с `image` и `file`), `howWeAchieve` текст, `facts[]` (title/text/order), `heroCta` (title/subtitle) если задан.
- **GET /pages/contacts:** `contacts` объект `{ phone, email, telegramUrl, whatsappUrl, address, yandexMapUrl, workingHours[], metroStations[] }`, где график содержит `label`, `isClosed`, `open`, `close`.
- **GET /pages/org-info:** `organization` (реквизиты и телефоны), `licenses[]` (с файлами), `documents[]` (тексты с `htmlBody`), `certificates[]` (с файлами).
- **GET /pages/personal-data-policy** и **GET /pages/privacy-policy:** `policy` `{ title, body }`.

### 3.5 Публичные данные об организации
- **GET /org:** краткая карточка `{ id, fullName, ogrn, inn, kpp, address, email, phones[] }`. Возвращает 404, если запись не заведена.

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
Все endpoints принимают соответствующие тела и возвращают `204 No Content`.
- **GET /admin/pages/home:** отдаёт текущий контент главной страницы + SEO, чтобы заполнить форму редактирования.
- **PUT /admin/pages/home:** поля `heroTitle`, `heroSubtitle`, `heroCtaText`, `heroCtaUrl`, `subheroTitle`, `subheroSubtitle`, `interiorText`, `seo`.
- **GET /admin/pages/about:** возвращает hero «О клинике», текст «Как мы работаем» и CTA.
- **PUT /admin/pages/about:** поля `heroTitle`, `heroDescription`, `howWeAchieveText`, `heroCtaTitle`, `heroCtaSubtitle`, `seo`.
- **GET /admin/pages/contacts:** текущие контакты, адрес, карта и SEO.
- **PUT /admin/pages/contacts:** `phoneMain`, `email`, `telegramUrl`, `whatsappUrl`, `addressText`, `yandexMapUrl`, `seo`.
- **GET /admin/pages/personal-data-policy:** заголовок, HTML-тело и SEO политики ПДн.
- **PUT /admin/pages/personal-data-policy:** `title`, `body`, `seo`.
- **GET /admin/pages/privacy-policy:** данные политики конфиденциальности.
- **PUT /admin/pages/privacy-policy:** `title`, `body`, `seo`.

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

