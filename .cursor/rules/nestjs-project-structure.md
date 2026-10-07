---
description: NestJS — стек, layout feature-модулей, layout src/, path aliases, enums
globs: ["**/src/main.ts", "**/app.module.ts", "**/features/**/*.module.ts", "**/enums/**/*.ts", "**/constants/**/*.ts"]
---

# NestJS: стек и структура проекта

Точка входа для агентов: **`.cursor/rules/nestjs-conventions.md`** (полный список связанных `nestjs-*.md`).

> Примеры с `Country`, `User` — **иллюстрация**. Имена сущностей, enum-ов, топиков и полей берутся из **текущего проекта**.

## Стек (ориентир)

- **Framework**: NestJS v9+
- **Database**: MongoDB + Mongoose (`@nestjs/mongoose`)
- **Auth**: Passport JWT, Argon2 для хешей
- **Queue**: BullMQ — по необходимости
- **Messaging**: Kafka (`kafkajs`, `@nestjs/microservices`) — по необходимости
- **Validation**: `class-validator` + `class-transformer`
- **Swagger**: `@nestjs/swagger`
- **Config**: `@nestjs/config`, именованные конфиги
- **Logging**: кастомный `AppLogger extends ConsoleLogger`
- **i18n**: `nestjs-i18n`
- **Тесты**: Jest + `@nestjs/testing`
- **Package manager**: yarn

## Структура feature-модуля

Каждая фича — папка в `src/features/`:

```
features/[name]/
├── [name].module.ts
├── [name].controller.ts   # только HTTP, без бизнес-логики
├── [name].service.ts      # вся бизнес-логика
├── [name].api.ts          # Swagger через applyDecorators
├── [name].helpers.ts
├── [name].types.ts
├── dto/
│   ├── [name].dto.ts      # Response DTO (@Expose)
│   └── index.ts
├── types/
│   ├── create[Name].type.ts
│   ├── update[Name].type.ts
│   └── index.ts
├── kafkaDto/
├── kafkaConsumers/
└── tests/
    ├── [name].service.spec.ts
    ├── [name].controller.spec.ts
    └── [name].helpers.spec.ts
```

**Правила:** controller → service → `plainToClass`; `api.ts` — все Swagger-декораторы; `types/` — вход с `class-validator`; `dto/` — исход с `class-transformer` (`@Expose`).

## Структура `src/`

```
src/
├── common/          # decorators, guards, interceptors, services, logger, types
├── config/          # common.config.ts, [service].config.ts, env/
├── constants/
├── enums/
├── schemas/         # Mongoose + subSchemas/
├── helpers/
├── features/
└── migrations/      # DD.MM.YYYY/
```

## Path aliases (всегда)

Использовать алиасы из `tsconfig.json` (`schemas/*`, `common/*`, `constants/*`, `config/*`, `helpers/*`, `features/*`, `enums/*`, `migrations/*`), не глубокие `../../..`.

```typescript
// ✅
import { CountryDocument } from 'schemas/country.schema'
import { AppLogger } from 'common/logger'
// ❌
import { CountryDocument } from '../../schemas/country.schema'
```

## Enums

Настоящие TypeScript `enum`; значения — по требованиям проекта.

```typescript
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}
```

См. также правила в `.cursor/rules/`: `nestjs-controller-service.md`, `nestjs-mongoose.md`, `nestjs-dto-swagger.md`, `nestjs-infra.md`, `nestjs-kafka-bullmq.md`, `nestjs-testing.md`, `nestjs-style-imports-git.md`.
