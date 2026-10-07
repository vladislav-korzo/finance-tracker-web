---
description: NestJS — config, AppLogger, ошибки, i18n, pipes/interceptors, pagination, lifecycle, даты
globs: ["**/config/**/*.ts", "**/common/**/*.ts", "**/main.ts", "**/*.service.ts"]
---

# NestJS: Config, логи, ошибки, инфраструктура

## Config

- Один файл конфига — одна группа переменных / внешний сервис.
- В сервисах: `this.configService.get<string>('KEY')` с типом.
- **Не** читать `process.env` в сервисах напрямую — только через `ConfigService`.

```typescript
export default () => ({
  DB_URI: process.env.DB_URI,
  DB_NAME: process.env.DB_NAME,
})
```

## Logging (`AppLogger`)

- Не стандартный `Logger` из `@nestjs/common` для бизнес-логов сервиса.
- `this.logger.info` / `warn` / `error`; `console.log` — только временный дебаг (убрать перед коммитом).

## Ошибки

- Использовать HTTP-исключения Nest (`BadRequestException`, `NotFoundException`, …), не `throw new Error()`.
- Структура при необходимости: `{ code: 'SNAKE_CASE', message: this.localized.t('...') }`.
- Некритичные внешние вызовы — логировать в `catch`, не пробрасывать.

## Pagination

Query через общий тип (например `PaginationQueryParams` из `common/types`); в сервисе при наличии `page`/`limit` — `paginate`, иначе `find().lean()`.

## Lifecycle

- `OnModuleInit` — seed, обязательные записи в БД (блокирует старт HTTP).
- `OnApplicationBootstrap` — лог старта, warm-up, фоновые задачи после полного подъёма.
- Seed: приватный `_seed...`, сначала `existsBy*` / проверка, потом `create`.

## Pipes / Interceptors

- `ParseMongoIdPipe` на `@Param('id')` для Mongo ObjectId — `BadRequestException` с `code: 'INVALID_ID'`.
- Кастомные pipes — `common/pipes/`, re-export через index при принятом в проекте паттерне.
- Response-обёртка `{ data, success }` — отдельный interceptor в `common/interceptors/`, не дублировать логирование там, где уже `AppLogger` в сервисах.

## Даты

- Библиотека: `date-fns` (и `date-fns-tz` при логике с TZ).
- В MongoDB: `Date` в схеме или ISO-строка по соглашению проекта; **не** хранить как числовой timestamp.
- В сервисах при записи часто: `new Date().toISOString()` или `new Date()` — по соглашению схемы.
