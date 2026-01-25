# Разделение категорий услуг по полу и новые ручки

## Назначение
Функциональность нужна для разделения витрин на женские и мужские направления. Категория услуги теперь содержит признак пола, а публичные ручки позволяют получать категории и услуги отдельно для женщин и мужчин.

## Пол категории
- Поле: `gender`.
- Возможные значения: `FEMALE`, `MALE`.
- Значение по умолчанию (если не передано при создании): `FEMALE`.

## Новые публичные ручки

### Категории по полу
- `GET /service-categories/female` — список женских категорий услуг.
- `GET /service-categories/male` — список мужских категорий услуг.

Сортировка совпадает с общей ручкой категорий: `sortOrder ASC`, затем `name ASC`.

### Услуги по полу
- `GET /services/female` — список женских услуг (по полу категории).
- `GET /services/male` — список мужских услуг (по полу категории).

Сортировка: по `category.sortOrder ASC`, затем `service.sortOrder ASC`, затем `name ASC`.

## Изменения в существующих ответах

### Категории (`GET /service-categories`, а также `.../female` и `.../male`)
Каждая категория теперь содержит поле `gender`.

**Структура элемента списка:**
```json
{
  "id": 1,
  "slug": "apparatnaya-kosmetologiya",
  "name": "Аппаратная косметология",
  "description": "...",
  "gender": "FEMALE",
  "sortOrder": 0,
  "servicesCount": 12,
  "seo": {
    "metaTitle": "...",
    "metaDescription": "...",
    "canonicalUrl": "...",
    "robotsIndex": true,
    "robotsFollow": true,
    "ogTitle": "...",
    "ogDescription": "...",
    "ogImage": {
      "id": 10,
      "url": "...",
      "originalName": "...",
      "mime": "image/jpeg",
      "sizeBytes": 123456,
      "width": 1200,
      "height": 630,
      "alt": "..."
    }
  },
  "heroImage": {
    "id": 11,
    "fileId": 99,
    "purpose": "HERO",
    "order": 0,
    "alt": "...",
    "caption": null,
    "url": "...",
    "file": {
      "id": 99,
      "url": "...",
      "originalName": "...",
      "mime": "image/jpeg",
      "sizeBytes": 123456,
      "width": 1600,
      "height": 900
    }
  },
  "galleryImages": []
}
```

### Категория по slug (`GET /service-categories/:slug`)
В блоке `category` добавлено поле `gender`.

**Фрагмент ответа:**
```json
{
  "category": {
    "id": 1,
    "slug": "apparatnaya-kosmetologiya",
    "name": "Аппаратная косметология",
    "description": "...",
    "gender": "FEMALE",
    "sortOrder": 0,
    "heroImage": null,
    "galleryImages": []
  },
  "seo": { "metaTitle": "..." },
  "services": [
    {
      "id": 101,
      "slug": "rf-lifting-litsa",
      "name": "RF-лифтинг лица и шеи",
      "shortOffer": "...",
      "priceFrom": "7200",
      "durationMinutes": 55,
      "benefits": ["...", "..."],
      "ctaText": "Записаться",
      "ctaUrl": "/contacts"
    }
  ]
}
```

### Списки услуг по полу (`GET /services/female`, `GET /services/male`)
Список услуг возвращается с блоком `category`, чтобы фронтенд мог строить группировки и фильтры.

**Структура элемента списка:**
```json
{
  "id": 201,
  "slug": "chistka-lica-muzhskaya",
  "name": "Комбинированная чистка лица для мужчин",
  "shortOffer": "...",
  "priceFrom": "4800",
  "durationMinutes": 60,
  "benefits": ["...", "..."],
  "ctaText": "Записаться",
  "ctaUrl": "/contacts",
  "category": {
    "id": 50,
    "slug": "muzhskaya-kosmetologiya",
    "name": "Мужская косметология",
    "gender": "MALE"
  }
}
```

## Администрирование
В запросах создания/обновления категории (`/admin/catalog/categories`) добавлено поле `gender`:
```json
{
  "name": "Мужская косметология",
  "gender": "MALE",
  "description": "...",
  "sortOrder": 10
}
```

## Сидовые данные
В сид добавлены мужские категории и услуги для демонстрации и тестирования:
- Категории:
  - `muzhskaya-kosmetologiya`
  - `trihologiya-dlya-muzhchin`
- Услуги в них:
  - `chistka-lica-muzhskaya`
  - `anti-age-uhod-muzhskoj`
  - `konsultaciya-trihologa`
  - `mezoterapiya-kozhi-golovy-m`
