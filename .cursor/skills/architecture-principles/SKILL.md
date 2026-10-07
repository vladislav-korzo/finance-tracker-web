---
name: architecture-principles
description: Software architecture principles and design patterns. Read by senior-reviewer before reviewing architecture, by planner when breaking down complex tasks, by worker when implementing new features or modules, and by reviewer when checking architectural consistency.
---

# Architecture Principles Skill

**Purpose**: Define architectural standards and design patterns for the project.

---

## Canonical project conventions (this repo)

- **React / React Native apps**: **Primary reference** — `.cursor/rules/project-structure.shared.md` plus **`.cursor/rules/project-structure.react-native.md`** or **`.cursor/rules/project-structure.react-web.md`** — folder layout, component file split (`.tsx` / `.container.tsx` / `.styles.ts`), path aliases (`@app`, `@screens`, `@shared`, …), import order, handler naming, control flow, tests co-located as `[Name].test.tsx`, and **Hard Rules** (including platform-specific ones).
- **NestJS backends**: **Primary reference** — `.cursor/rules/nestjs-conventions.md` and **`nestjs-*.md`** — `src/features/[name]/` modules, controller vs service, Mongoose schemas, Swagger in `api.ts`, tests per `nestjs-testing.md`. Do not apply React folder rules to Nest code.
- **Before** designing or reviewing architecture, **read the files for the stack you touch** and treat them as authoritative. Generic patterns in this skill must not override them.

---

## React & React Native Architecture

### Shared decisions (both platforms)
- **State**: Zustand — one store per domain, no Context/Redux for global state
- **Structure**: `src/screens/` + `src/components/` + `src/shared/` (see `.cursor/rules/project-structure.shared.md`)
- **Component pattern**: `.tsx` (UI) + `.container.tsx` (logic) + `.styles.ts` (styles)
- **Types**: always in `[Name].types.ts` — never inline in `.tsx` or `.container.tsx`
- **Tests**: co-located as `[Name].test.tsx` inside the component folder — never in a separate `__tests__/` folder
- **Styles**: never inline, never hardcoded values — always theme tokens

### React Native specifics
- **Navigation**: React Navigation v6 native stack (all param lists in `src/app/navigation/types.ts`)
- **Animations**: Reanimated 3 — never `Animated` from RN core
- **Styles**: `StyleSheet.create` + theme tokens

### React Web specifics
- **Routing**: React Router v6 (Next.js — App/Pages Router)
- **Animations**: Framer Motion for complex animations
- **Styles**: CSS Modules (`[Name].module.scss`) or CSS-in-JS + CSS variables as tokens

---

## Core Principles

### 1. SOLID Principles

#### Single Responsibility Principle (SRP)
- One class/module = one reason to change
- Separate concerns (data, logic, presentation)

```
// ✅ Good - Single responsibility
UserRepository:
  findById(id)  // DB logic only

UserService:
  validateUser(user)  // Business logic only

// ❌ Bad - Multiple responsibilities
User:
  save()      // DB logic
  validate()  // Business logic
  render()    // Presentation — three reasons to change
```

#### Open/Closed Principle (OCP)
- Open for extension, closed for modification
- Use interfaces, abstract classes, composition

#### Liskov Substitution Principle (LSP)
- Subtypes must be substitutable for base types
- Don't break parent class contracts

#### Interface Segregation Principle (ISP)
- Many specific interfaces > one general interface
- Clients shouldn't depend on unused methods

#### Dependency Inversion Principle (DIP)
- Depend on abstractions, not concretions
- High-level modules shouldn't depend on low-level modules

---

### 2. Separation of Concerns

#### Layered Architecture

```
┌─────────────────────────────┐
│   Presentation Layer        │  UI, Views, User Interface
├─────────────────────────────┤
│   Application Layer         │  Use Cases, Application Logic
├─────────────────────────────┤
│   Domain Layer              │  Business Logic, Entities
├─────────────────────────────┤
│   Data Layer                │  Data Access, Storage
├─────────────────────────────┤
│   Infrastructure Layer      │  External Services, I/O
└─────────────────────────────┘
```

**Rules:**
- Each layer only depends on layers below
- Business logic independent of infrastructure
- Easy to test each layer in isolation
- Upper layers depend on abstractions, not implementations

---

### 3. Design Patterns

#### Repository Pattern
Abstracts data access logic behind an interface so business logic doesn't depend on storage details.

```
// Contract — what operations are available
UserRepository (interface/protocol/trait):
  findById(id) → User or null
  save(user)
  delete(id)

// Concrete implementation — one per storage backend
DatabaseUserRepository implements UserRepository:
  constructor(db)
  findById(id) → db.query("SELECT ... WHERE id = ?", id)
  save(user)   → db.exec("INSERT OR UPDATE ...", user)

// Business logic only knows the interface, not the implementation
UserService:
  constructor(repo: UserRepository)  // injected
```

#### Service Pattern
Encapsulates business logic and orchestrates dependencies.

```
UserService:
  constructor(userRepo, notificationService)

  registerUser(data):
    1. validateRegistrationData(data)       // guard
    2. user = buildUserFromInput(data)      // domain logic
    3. userRepo.save(user)                  // persistence
    4. notificationService.sendWelcome(user) // side effect
    return user
```

#### Factory Pattern
Creates objects without hardcoding the concrete class at the call site.

```
PaymentProcessorFactory:
  create(type):
    if type == "stripe" → return StripeProcessor()
    if type == "paypal" → return PayPalProcessor()
    else → raise UnknownProcessorError(type)
```

#### Strategy Pattern
Encapsulates interchangeable algorithms behind a common interface.

```
// Contract
ValidationStrategy (interface):
  validate(value) → bool

// Implementations
EmailValidation implements ValidationStrategy:
  validate(email) → matchesEmailPattern(email)

PasswordValidation implements ValidationStrategy:
  validate(password) → length >= 8 AND hasUpperCase AND hasDigit

// Usage — caller doesn't know which strategy is used
Validator:
  constructor(strategy: ValidationStrategy)
  check(value) → strategy.validate(value)
```

---

### 4. Dependency Injection

**Benefits:**
- Loose coupling
- Easy testing (swap real deps for mocks/fakes)
- Flexible configuration

```
// ✅ Good - dependencies come in from outside
UserController:
  constructor(userService, logger)  // injected — easy to test/swap

// ❌ Bad - dependencies created internally
UserController:
  constructor():
    this.userService = new UserService()   // hardcoded — hard to test
    this.logger     = new ConsoleLogger()  // hardcoded — hard to swap
```

---

### 5. Error Handling

#### Centralized Error Handling

Use domain-specific error types instead of generic ones — callers can then handle each case explicitly.

```
// Domain error types (name them after what went wrong)
ValidationError(message, field?)   extends BaseError
NotFoundError(resource, id)        extends BaseError
UnauthorizedError(message)         extends BaseError

// Central handler dispatches by type
ErrorHandler:
  handle(error):
    if error is ValidationError  → respond 400, show field
    if error is NotFoundError    → respond 404
    if error is UnauthorizedError → respond 401
    else                         → respond 500, log details privately
    log(error.type, error.message)
```

---

### 6. Configuration Management

```
// ✅ Good - one place to read all config (env vars, files, flags)
config:
  environment    = env("APP_ENV", default="development")
  storage.type   = env("STORAGE_TYPE", default="local")
  logging.level  = env("LOG_LEVEL", default="info")
  features.maxRetries = env("MAX_RETRIES", default=3)

// ❌ Bad - config scattered across modules
// storage.go:    storageType = env("STORAGE_TYPE")
// logger.py:     logLevel    = env("LOG_LEVEL")
// retry.ts:      maxRetries  = env("MAX_RETRIES")
// → hard to find all config keys, easy to forget defaults
```

---

## Code Organization

### Project Structure (React & React Native)

```
src/
├── app/              # Bootstrap, navigation / routing config
├── screens/          # All screens/pages — flat, each screen = folder
│   └── [Name]Screen/
│       ├── [Name]Screen.tsx           # UI only
│       ├── [Name]Screen.container.tsx # Logic (if needed)
│       ├── [Name]Screen.styles.ts     # Styles
│       ├── [Name]Screen.types.ts      # Types (if any)
│       ├── components/                # Screen-local extracted components
│       └── index.ts
├── components/       # Shared business components (used in 2+ screens)
│   └── [Name]/
├── shared/           # Cross-cutting concerns
│   ├── components/   # Design system — UI primitives
│   ├── store/        # Zustand stores
│   ├── hooks/        # Shared hooks
│   ├── utils/        # Shared utilities
│   └── theme/        # Design tokens
└── assets/
```

### Component Placement Decision

```
Is it a UI primitive (Button, Input)?     → shared/components/
Is it used in 2+ screens?                 → components/
Is it used in only one screen?            → screens/[Name]Screen/components/
```

### Component File Split — SRP in Practice

Every component applies Single Responsibility at the file level:

```
[Name].tsx            → UI responsibility only
[Name].container.tsx  → Logic responsibility only (state, handlers, store)
[Name].styles.ts      → Style responsibility only
[Name].types.ts       → Type definitions
```

This directly maps to the **Separation of Concerns** principle:
- UI (`[Name].tsx`) is testable in isolation with just props
- Logic (`[Name].container.tsx`) is testable without rendering
- Styles (`[Name].styles.ts`) can be changed without touching logic or markup

---

## Performance Principles

### 1. Data Access
- Index frequently accessed data
- Implement pagination for large datasets
- Use connection pooling for external resources
- Avoid N+1 queries (fetch related data efficiently)
- Lazy load data when appropriate

### 2. Caching
- Cache expensive computations
- Use appropriate cache invalidation strategies
- Consider memory vs speed tradeoffs
- Cache at the right layer (application, data, CDN)

### 3. Async Operations
- Use async/await for I/O operations
- Don't block the main thread
- Implement background jobs for heavy tasks
- Use queues/streams for decoupling
- Consider parallelization opportunities

### 4. React Render Performance

#### Memoization — use with intent, not by default
```typescript
// ✅ Memoize when: component renders frequently with same props, or render is expensive
const HabitCard = React.memo(({ habit }: HabitCardProps) => { ... });

// ✅ useMemo for expensive computations
const sortedHabits = useMemo(() => habits.slice().sort(byDate), [habits]);

// ✅ useCallback for handlers passed to memoized children
const handlePress = useCallback(() => navigation.navigate('Detail', { id }), [id]);

// ❌ Don't memoize everything — it has its own cost
const label = useMemo(() => `Hello ${name}`, [name]); // pointless
```

#### Zustand selectors — prevent unnecessary re-renders
```typescript
// ✅ Select only the slice you need
const user = useAuthStore(s => s.user);
const login = useAuthStore(s => s.login);

// ❌ Subscribes to entire store — re-renders on any store change
const store = useAuthStore();
```

#### React Native specifics
- Use `FlatList` / `SectionList` for long lists — never `ScrollView` + `.map()`
- Use `removeClippedSubviews` and `windowSize` for very long lists
- Avoid anonymous functions in `renderItem` — extract or `useCallback`

#### React Web specifics
- Use `React.lazy` + `Suspense` for route-level code splitting
- Avoid layout thrashing — batch DOM reads/writes
- Use `IntersectionObserver` for lazy-load of off-screen content

### 5. Resource Management
- Clean up resources (connections, file handles, timers)
- Implement proper timeout mechanisms
- Use object pooling for expensive resources
- Monitor memory usage and prevent leaks

---

## Testing Strategy

### Test Pyramid

```
        /\
       /  \    E2E Tests (few)
      /----\
     /      \  Integration Tests (some)
    /--------\
   /          \ Unit Tests (many)
  /____________\
```

### What to Test:
- **Unit**: Business logic, utilities, pure functions, algorithms
- **Integration**: Component interactions, data flow, external services
- **E2E**: Critical user flows, main scenarios

---

## Anti-Patterns to Avoid

### ❌ God Object
One class that knows/does too much

### ❌ Spaghetti Code
Tangled, unstructured code with unclear flow

### ❌ Magic Numbers
Hardcoded values without explanation
```
// ❌ Bad
if user.age > 18 { ... }

// ✅ Good
MINIMUM_AGE = 18
if user.age > MINIMUM_AGE { ... }
```

### ❌ Circular Dependencies
Module A depends on B, B depends on A

### ❌ Premature Optimization
Optimizing before identifying actual bottlenecks

### ❌ Logic in UI Components
Business logic, store access, or side effects inside `[Name].tsx`
```typescript
// ❌ Bad — UI component doing everything
const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const login = useAuthStore(s => s.login);
  const handleSubmit = async () => { await api.login(email); login(...); };
  return <View style={{ padding: 16 }}>...</View>; // inline style too
};

// ✅ Good — split into .tsx / .container.tsx / .styles.ts
```

### ❌ Prop Drilling
Passing props through 3+ levels just to reach a deep component — use Zustand store or component composition instead

### ❌ useEffect Overuse
Using `useEffect` for things that aren't side effects
```typescript
// ❌ Bad — deriving state via effect
useEffect(() => { setFullName(`${first} ${last}`); }, [first, last]);

// ✅ Good — derive directly
const fullName = `${first} ${last}`;
```

### ❌ Missing Cleanup in useEffect
```typescript
// ❌ Bad — subscription leak
useEffect(() => { socket.on('message', handler); }, []);

// ✅ Good — always return cleanup
useEffect(() => {
  socket.on('message', handler);
  return () => socket.off('message', handler);
}, [handler]);
```

---

## Architecture Review Checklist

When reviewing architecture:

### Structure
- [ ] Clear separation of concerns
- [ ] Consistent folder structure
- [ ] Logical module boundaries

### Dependencies
- [ ] No circular dependencies
- [ ] Dependency injection used
- [ ] Abstractions over concretions

### Scalability
- [ ] Components/services are stateless where possible
- [ ] Data access is optimized (indexed, cached)
- [ ] Resource usage is efficient
- [ ] System can handle increased load

### Maintainability
- [ ] Code is self-documenting
- [ ] Consistent naming conventions
- [ ] Easy to add new features

### Testability
- [ ] Business logic isolated
- [ ] Dependencies can be mocked
- [ ] Test coverage adequate

### React / React Native Specific
- [ ] UI components (`[Name].tsx`) contain zero logic and zero styles
- [ ] Containers (`[Name].container.tsx`) contain zero JSX except `return <Name />`
- [ ] Styles are in `.styles.ts` or `.module.scss` — no inline styles
- [ ] Types are in `.types.ts` — no inline type definitions in component files
- [ ] Zustand selectors are specific — no whole-store subscriptions
- [ ] `useEffect` dependencies are complete and cleanup is handled
- [ ] Lists use `FlatList`/virtualization (RN) or `IntersectionObserver` (Web), not `.map()` in `ScrollView`
- [ ] Memoization (`memo`, `useMemo`, `useCallback`) is used with purpose, not blindly
- [ ] Component placed in correct location: screen-local → `screens/X/components/`, shared → `components/`, primitive → `shared/components/`

---

## When to Refactor Architecture

Signs you need architectural changes:

1. **Adding features is increasingly difficult**
2. **Changes in one area break unrelated areas**
3. **Tests are hard to write or brittle**
4. **Code duplication everywhere**
5. **Performance issues at scale**

---

## References

- [Clean Architecture by Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)
- [Design Patterns: Elements of Reusable Object-Oriented Software](https://en.wikipedia.org/wiki/Design_Patterns)

---

**Note**: This skill should be consulted by agents when making architectural decisions or reviewing system design.
