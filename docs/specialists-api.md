# Специалисты: API и использование

Документ описывает новые сущности «Специалист» и связи с услугами, а также эндпоинты для фронта и админки.

## Модель данных

**Специалист**:
- `firstName` — имя
- `lastName` — фамилия
- `specialization` — специализация
- `biography` — биография
- `experienceYears` — опыт (в годах, `int`)
- `photoFileId` — ссылка на файл (фото специалиста)

**Связь**: многие-ко-многим между услугами и специалистами через таблицу связи.

## Админка (защищённые эндпоинты)

Все методы требуют авторизации (`Authorization: Bearer <token>`), роль `ADMIN` или `EDITOR`.

### Получить список специалистов
`GET /admin/catalog/specialists`

**Ответ 200**
```json
[
  {
    "id": 1,
    "firstName": "Анна",
    "lastName": "Иванова",
    "specialization": "Дерматолог",
    "biography": "...",
    "experienceYears": 8,
    "photoFileId": 10,
    "photo": {
      "id": 10,
      "url": "/uploads/...",
      "originalName": "anna.jpg",
      "mime": "image/jpeg",
      "sizeBytes": 12345,
      "width": 800,
      "height": 600
    },
    "serviceIds": [3, 5],
    "services": [
      { "id": 3, "slug": "...", "name": "...", "shortOffer": "..." }
    ]
  }
]
```

### Получить специалиста по ID
`GET /admin/catalog/specialists/:id`

**Ответ 200** — структура как в списке.

### Создать специалиста
`POST /admin/catalog/specialists`

**Тело запроса**
```json
{
  "firstName": "Анна",
  "lastName": "Иванова",
  "specialization": "Дерматолог",
  "biography": "...",
  "experienceYears": 8,
  "photoFileId": 10,
  "serviceIds": [3, 5]
}
```

**Ответ 201** — созданный специалист.

### Обновить специалиста
`PUT /admin/catalog/specialists/:id`

Можно передавать только изменяемые поля. `serviceIds` перезаписывает связи.

### Удалить специалиста
`DELETE /admin/catalog/specialists/:id`

**Ответ 204** — без тела.

### Привязка специалистов к услугам

В админском CRUD услуг поддержано поле `specialistIds`:

`POST /admin/catalog/services` / `PUT /admin/catalog/services/:id`
```json
{
  "categoryId": 1,
  "name": "...",
  "shortOffer": "...",
  "specialistIds": [1, 2]
}
```

## Публичные эндпоинты (фронт)

### Список специалистов
`GET /specialists`

**Ответ 200**
```json
[
  {
    "id": 1,
    "firstName": "Анна",
    "lastName": "Иванова",
    "specialization": "Дерматолог",
    "biography": "...",
    "experienceYears": 8,
    "photo": {
      "id": 10,
      "url": "/uploads/...",
      "originalName": "anna.jpg",
      "mime": "image/jpeg",
      "sizeBytes": 12345,
      "width": 800,
      "height": 600
    },
    "services": [
      {
        "id": 3,
        "slug": "...",
        "name": "...",
        "shortOffer": "...",
        "priceFrom": "2500.00"
      }
    ]
  }
]
```

### Получить специалиста по ID
`GET /specialists/:id`

**Ответ 200**
```json
{
  "id": 1,
  "firstName": "Анна",
  "lastName": "Иванова",
  "specialization": "Дерматолог",
  "biography": "...",
  "experienceYears": 8,
  "photo": {
    "id": 10,
    "url": "/uploads/...",
    "originalName": "anna.jpg",
    "mime": "image/jpeg",
    "sizeBytes": 12345,
    "width": 800,
    "height": 600
  },
  "services": [
    {
      "id": 3,
      "slug": "...",
      "name": "...",
      "shortOffer": "...",
      "priceFrom": "2500.00"
    }
  ]
}
```

### Услуга с детальными специалистами
`GET /services/:slug`

Поле `specialists` возвращает специалистов с детальным описанием и их услугами:
```json
{
  "service": { "id": 3, "slug": "...", "name": "...", "category": { "id": 1, "slug": "...", "name": "..." } },
  "specialists": [
    {
      "id": 1,
      "firstName": "Анна",
      "lastName": "Иванова",
      "specialization": "Дерматолог",
      "biography": "...",
      "experienceYears": 8,
      "photo": { "id": 10, "url": "/uploads/..." },
      "services": [
        { "id": 3, "slug": "...", "name": "...", "shortOffer": "...", "priceFrom": "2500.00" }
      ]
    }
  ]
}
```
