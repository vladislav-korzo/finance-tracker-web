---
description: Testing standards and test structure guidelines
globs: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/*.spec.tsx", "**/tests/**", "**/__tests__/**"]
---

# Testing Standards

## Alignment with project structure (HabitFlow / TSX)

- For **HabitFlow** and other React Native code in this repo, **follow** `.cursor/rules/project-structure.shared.md` and `.cursor/rules/project-structure.react-native.md`:
  - Tests are **co-located** as `[Name].test.tsx` **inside** the component/screen folder.
  - **Do not** add new `__tests__/` folders or separate test trees for new UI code unless an existing subproject already uses that pattern and you are extending it.
- For **React web** (`apps/web/`, etc.), pair **`.cursor/rules/project-structure.react-web.md`** with the same co-location rule unless the app already mandates otherwise.
- Generic patterns below (AAA, what to mock) still apply; **file placement** is defined by the project-structure rules above.

## Test Pyramid

```
         /\
        /  \     E2E (few)
       /────\    
      /      \   Integration (some)
     /────────\  
    /          \ Unit (many)
   /────────────\
```

- **Unit tests**: Fast, isolated, many
- **Integration tests**: Test modules together
- **E2E tests**: Critical user paths only

## Test Structure (AAA)

```typescript
it('should calculate total with discount', () => {
  // Arrange - Setup data
  const cart = new Cart();
  cart.addItem({ price: 100, quantity: 2 });
  
  // Act - Execute code
  const total = cart.calculateTotal(0.1);
  
  // Assert - Verify result
  expect(total).toBe(180);
});
```

## What to Test

### Always Test

- Public APIs and functions
- Business logic
- Edge cases and error handling
- Data transformations

### Don't Test

- Private methods (test through public API)
- Framework/library code
- Third-party integrations (mock them)
- Simple getters/setters

## Mocking

**When to Mock:**
- External services (APIs, databases)
- Time-dependent code
- Random values
- File system operations

**When NOT to Mock:**
- The code under test
- Simple pure functions
- Data structures
