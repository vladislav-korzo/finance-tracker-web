---
description: NestJS — unit-тесты сервисов и контроллеров (Jest, моки Mongoose)
globs: ["**/tests/**/*.spec.ts", "**/*.service.spec.ts", "**/*.controller.spec.ts", "**/jest.config.*"]
---

# NestJS: тесты

- Файлы: `tests/` внутри feature или рядом — по структуре репозитория; шаблон: `[name].spec.ts`.
- `@nestjs/testing` + `Test.createTestingModule()`.
- После каждого теста: `afterEach(() => jest.clearAllMocks())`.
- Сервис: мок модели через `getModelToken('ModelName')`, цепочки `.find().lean()` мокать как `mockReturnValue({ lean: jest.fn().mockResolvedValue(...) })`.
- Контроллер: мок `CountryService` с `jest.fn()`.
- Проверять вызовы с аргументами, не только результат.
- **Не** вызывать приватные `_методы` напрямую — только через публичный API.

```typescript
const mockModel = {
  find: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }),
  findById: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }),
  create: jest.fn().mockResolvedValue({ _id: 'id', toObject: () => ({ _id: 'id' }) }),
}
// providers: [{ provide: getModelToken('Country'), useValue: mockModel }]
```

Общие принципы тест-пирамиды см. `.cursor/rules/testing.md` — не противоречь им.
