---
description: NestJS — controller, service, module, приватные методы `_`, декораторы common
globs: ["**/*.controller.ts", "**/*.service.ts", "**/*.module.ts", "**/common/decorators/**/*.ts", "**/common/guards/**/*.ts"]
---

# NestJS: Controller, Service, Module

## Controller

- Только: принять запрос, вызвать service, вернуть `plainToClass(Dto, ...)`.
- `@ApiTags('...')` на классе; `@HttpCode(HttpStatus.OK)` явно где уместно.
- Swagger — **только** через функции из `[name].api.ts`, не inline.
- Ответы: `plainToClass(CountryDto, entity)`; массивы: `.map((x) => plainToClass(CountryDto, x))`.
- Без бизнес-логики и без прямых запросов к БД.

```typescript
@ApiTags('Country')
@Controller('country')
export class CountryController {
  constructor(private countryService: CountryService) {}

  @Get('/')
  @HttpCode(HttpStatus.OK)
  @GetAllCountriesApi()
  async get() {
    const countries = await this.countryService.get()
    return countries.map((c) => plainToClass(CountryDto, c))
  }
}
```

## Service

- `private readonly logger = new AppLogger(CountryService.name)`.
- `this.logger.info` в начале и в конце значимых методов.
- Mongoose: `.lean()` на read-запросах; после `create()` — `.toObject()`; в логах `_id?.toString()`.
- Внешние вызовы (Kafka, письма и т.д.) — `try/catch`; некритичные ошибки не пробрасывать, логировать.

См. детали Mongoose в `nestjs-mongoose.md`.

## Module

- Только DI: imports, controllers, providers, exports.
- `exports: [XService]` если сервис нужен другим модулям.
- **`forwardRef()` не использовать** — при циклических зависимостях вынести общее в третий модуль / `SharedModule`.

```typescript
@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Country', schema: CountrySchema }]),
  ],
  controllers: [CountryController],
  providers: [CountryService],
  exports: [CountryService],
})
export class CountryModule {}
```

## Приватные методы сервиса

- Внутренние хелперы: префикс `_` (`_getAccessToken`, `_buildPayload`).
- Публичные методы без `_` — API сервиса для контроллеров и других сервисов.
- `private _method` — когда не должно торчать наружу даже через `any`.

## Декораторы (common)

- `@Public()` — без JWT.
- `@CurrentUser()` / `@CurrentUserId()` — из JWT.
- `@Roles(...)` + `RoleGuard` — ролевой доступ.
