# Цены услуг по полу

Эндпоинты возвращают список категорий услуг с вложенными услугами и их ценами для указанного пола.

## `GET /services/prices/female`

- Возвращает цены услуг для категорий с полом `FEMALE`.

## `GET /services/prices/male`

- Возвращает цены услуг для категорий с полом `MALE`.

## Сортировка

- Категории: `sortOrder ASC`, затем `name ASC`.
- Услуги внутри категории: `service.sortOrder ASC`, затем `service.name ASC`.
- Цены внутри услуги: `price.order ASC`.

## Формат ответа

```json
[{
  "id": number,
  "slug": string,
  "name": string,
  "description": string | null,
  "sortOrder": number,
  "services": [{
    "id": number,
    "slug": string,
    "name": string,
    "shortOffer": string | null,
    "priceFrom": string | null,
    "durationMinutes": number | null,
    "pricesExtended": [{
      "id": number,
      "title": string,
      "price": string,
      "durationMinutes": number | null,
      "type": string,
      "sessionsCount": number | null,
      "order": number
    }]
  }]
}]
```
