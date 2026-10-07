---
description: NestJS — порядок импортов, ESLint/Prettier, tsconfig, conventional commits, анти-паттерны
globs: ["**/*.controller.ts", "**/*.service.ts", "**/*.module.ts", "**/.eslintrc.*", "**/.prettierrc*"]
---

# NestJS: стиль, импорты, git

## Порядок импортов

1. `@nestjs/common` (и core)
2. Подпакеты Nest (`@nestjs/mongoose`, `@nestjs/config`, `@nestjs/jwt`, `@nestjs/bullmq`, …)
3. Сторонние (`mongoose`, `bullmq`, `argon2`, `crypto`, …)
4. Алиасы проекта: `common/`, `schemas/`, `constants/`, `enums/`, `helpers/`, `config/`
5. Другие features: `features/...`
6. Локальные: `./types`, `./dto`, `./*.service`

## ESLint + Prettier (ориентир)

- `singleQuote`, `trailingComma: 'all'`, `semi: true`, `printWidth: 100`, `tabWidth: 2`, `endOfLine: 'lf'`.
- Во многих Nest-проектах допускают `any` (`@typescript-eslint/no-explicit-any: off`) — **не навязывать строгость frontend** без решения команды.
- Точка с запятой обязательна.

## TypeScript (контекст шаблона)

- Могут быть отключены `strictNullChecks` / `noImplicitAny` — следовать `tsconfig` репозитория.
- Входящие типы — классы с `class-validator`; исходящие — DTO с `class-transformer`.

## Git (Conventional Commits)

```
feat(auth): add OAuth login
fix(booking): handle null response
refactor(country): extract helpers
test(auth): add service tests
chore: update bullmq
```

Ветки: `feature/`, `fix/`, `hotfix/`, `refactor/`, `docs/`, `test/`, `chore/`.

## Анти-паттерны (кратко)

| Запрещено | Вместо |
|-----------|--------|
| Логика в controller | service |
| Mongoose в controller | service |
| Swagger inline в controller | `[name].api.ts` |
| `process.env` в сервисах | `ConfigService` |
| find без `.lean()` (когда нужен plain) | `.lean()` |
| `create()` без `.toObject()` при отдаче наружу | `.toObject()` |
| `ObjectId === string` | `.toString()` и сравнение строк |
| `throw new Error` | Nest HTTP exceptions |
| Внешние вызовы без try/catch | лог + политика проброса |
| `console.log` в проде | `AppLogger` |
| Глубокие `../../../` | path aliases |
| Логика в `@Module()` | только DI |
| Полный документ при нужде в 1–3 полях | `.select(...)` |
| `forwardRef` для «лечения» циклов | вынести зависимость в третий модуль |
| `ApiBearerAuth` в controller | в `api.ts` |
| Тесты приватных `_method` | через публичные методы |
