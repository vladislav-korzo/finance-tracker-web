---
description: NestJS — types (class-validator), response DTO, Swagger api.ts, глобальная сериализация
globs: ["**/types/**/*.ts", "**/dto/**/*.ts", "**/*.api.ts", "**/app.module.ts"]
---

# NestJS: Types, DTO, Swagger

## Types (request body / params)

- Классы, не интерфейсы.
- На обязательных полях: `@IsNotEmpty()` первым; затем `@IsString()` / `@IsNumber()` и т.д.
- `@IsOptional()` для необязательных.
- Вложенные объекты: `@ValidateNested({ each: true })` + `@Type(() => Nested)`.

## DTO (response)

- Только `@Expose()` — глобальный `ClassSerializerInterceptor` с `excludeExtraneousValues: true`.
- `_id` → в API как `id`: `@Expose({ name: 'id' })` + `@Transform(({ obj }) => obj._id.toString())`.
- `createdAt` / `updatedAt` — через базовый `BaseDto`, не дублировать.
- Вложенные DTO — `@Type(() => ChildDto)`.
- Без логики в DTO — только форма ответа.

```typescript
export class BaseDto {
  @Expose() createdAt: Date
  @Expose() updatedAt: Date
}
```

## Swagger (`[name].api.ts`)

- Все декораторы OpenAPI — в `applyDecorators`, по одной именованной функции на endpoint: `GetAllCountriesApi`, `CreateCountryApi`.
- Для защищённых роутов: `ApiBearerAuth('bearer')` в том же `api.ts`, иначе в Swagger UI не будет замка.
- Публичные (`@Public()`) — без `ApiBearerAuth`.

```typescript
export const CreateCountryApi = () =>
  applyDecorators(
    ApiOperation({ summary: 'Create country' }),
    ApiBody({ type: CreateCountry }),
    ApiOkResponse({ description: 'Created country', type: CountryDto }),
  )
```

## ValidationPipe (глобально в `main.ts`)

```typescript
app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }))
```

## Глобальные guard / interceptor (`app.module.ts`)

- `TokenGuard` через `APP_GUARD` (кроме `@Public()`).
- `ClassSerializerInterceptor` через `APP_INTERCEPTOR` с `excludeExtraneousValues: true`.

## i18n и ошибки

- Сообщения пользователю: `this.localized.t('namespace.snake_case_key')` в `UnauthorizedException` и т.п.
- Не передавать «сырые» строки в exception, если есть ключ i18n.

См. `nestjs-infra.md` для LocalizedService и ошибок.
