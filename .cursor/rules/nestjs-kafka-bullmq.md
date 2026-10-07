---
description: NestJS — Kafka (envelope, consumers) и BullMQ (очереди, процессоры)
globs: ["**/*kafka*.ts", "**/kafkaDto/**/*.ts", "**/kafkaConsumers/**/*.ts", "**/*.processor.ts", "**/bullmq/**/*.ts"]
---

# NestJS: Kafka и BullMQ

## Kafka — сообщения

- Топики: `namespace.service.action` (например `app.auth.sendCode`).
- Envelope: `id` (UUID), `source` (имя сервиса), `time` (ISO 8601), `data` (полезная нагрузка).
- `kafkaService.send()` — оборачивать в `try/catch`; при ошибке логировать, основной flow не ломать, если так задумано.
- Consumer: подписка в `onModuleInit`, лог начала/конца обработки, `AppLogger`.

```typescript
await this.kafkaService.send<SendCodeMessage>('app.auth.sendCode', {
  id: crypto.randomUUID(),
  source: '[service-name]',
  time: new Date().toISOString(),
  data: { email, code, templateId },
})
```

## BullMQ

**Producer**

- `@InjectQueue('email')` — имя очереди kebab-case: `'email'`, `'notifications'`.
- Имя джоба kebab-case: `'send-welcome'`.
- Опции: `attempts: 3`, `backoff`, `removeOnComplete: true`, `removeOnFail: false` для отладки падений.
- Логи до и после `queue.add`.

**Processor**

- `@Processor('email')`, класс extends `WorkerHost`, в `process(job)` — `switch (job.name)` и приватные `_handle*`.
- Логировать `job.name`, `job.id`, начало и конец обработки.

**Module**

```typescript
BullModule.registerQueue({ name: 'email' }),
providers: [EmailService, EmailProcessor],
```
