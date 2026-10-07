---
description: NestJS backend — порядок чтения правил; отличие от React layout
globs: ["**/*.module.ts", "**/*.controller.ts", "**/*.service.ts", "**/main.ts", "**/app.module.ts"]
---

# NestJS: какие правила читать

В `.cursor/rules/` лежат файлы **`nestjs-*.md`**. При работе с **NestJS-бэкендом** читай в таком порядке:

1. **`nestjs-project-structure.md`** — стек, `src/features/`, алиасы, enums (всегда первым).
2. **`nestjs-controller-service.md`** — controller / service / module, декораторы.
3. **`nestjs-mongoose.md`** — схемы, запросы, `select`, индексы.
4. **`nestjs-dto-swagger.md`** — types, DTO, `[name].api.ts`, ValidationPipe.
5. **`nestjs-infra.md`** — config, AppLogger, ошибки, i18n, pipes, pagination, lifecycle.
6. По задаче: **`nestjs-kafka-bullmq.md`**, **`nestjs-testing.md`**, **`nestjs-style-imports-git.md`**.

**Не смешивать** с React: правила `project-structure.shared.md` / `project-structure.react-*.md` относятся к **клиентским** приложениям. Для Nest используй только **`nestjs-*.md`** (другая структура: feature modules, `schemas/`, `dto/` + `types/`).

**Совместимость:** полноценное приложение может включать **React (web/native)** и **Nest API** в одном монорепо — выбирай набор правил по **типу файлов**, который редактируешь.
