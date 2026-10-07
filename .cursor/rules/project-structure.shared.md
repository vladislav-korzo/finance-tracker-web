---
description: Shared React project structure — folders, naming, imports, control flow. Pair with project-structure.react-native.md or project-structure.react-web.md.
globs: ["**/*.ts", "**/*.tsx"]
---

# React project structure (shared)

## Authority

- **Shared**: this file — layout, naming, presenter/container split, path aliases, handler names, control flow, co-located tests.
- **Platform**: one of:
  - `.cursor/rules/project-structure.react-native.md` — Expo / React Native (e.g. `HabitFlow/`, `apps/mobile/`).
  - `.cursor/rules/project-structure.react-web.md` — React web (e.g. `apps/web/`, Vite/Next).
- If advice conflicts on **styling, navigation, animations, or test libraries**, the **platform** file wins.
- Other rules/skills must not contradict this trio. Generic examples using `function` or separate `__tests__/` trees lose to these docs.

**Agents** editing app code: read **this file** first, then the **platform** rule for the app you are touching.

## Component file pattern

Every component/screen lives in its own **folder** with co-located files:

```
[Name]/
├── [Name].tsx              ✅ required — UI only: JSX markup, everything via props
├── [Name].container.tsx    if logic   — Logic only: state, handlers, store, side effects
├── [Name].styles.ts        ✅ required — Styles only (format: see platform rule)
├── [Name].types.ts         if 1+ type — any interface, type alias, or enum
├── [Name].test.tsx         if tested  — co-located tests for this component
├── [Name].hooks.ts         if needed  — custom hooks used only by this component
├── [Name].utils.ts         if needed  — pure utility functions
├── [Name].helpers.ts       if needed  — data formatting / transformation helpers
├── [Name].constants.ts     if needed  — magic numbers, layout values, thresholds, screen-specific colors
├── [Name].config.ts        if needed  — configuration objects (animation params, spring configs, etc.)
├── [Name].data.ts          if needed  — static feature data (slide content, option lists, item arrays)
├── [Name].formConfig.ts    if needed  — form schema, validation rules, field definitions
└── index.ts                ✅ required — exports container (if exists) or component
```

**Rules:**

- `[Name].tsx` — **zero business logic**, **no styles definition**; only JSX; no hook calls except tiny render helpers if needed.
- `[Name].container.tsx` — create only if there is state, handlers, store access, or side effects; **zero JSX** except `return <Name ... />`; calls custom hooks from `.hooks.ts` and passes results as props.
- `[Name].styles.ts` — **only** presentation tokens/styles for this module; **how** (StyleSheet vs CSS Modules) is defined in the **platform** rule; **never exports non-style values** (no constants, no magic numbers).
- `[Name].types.ts` — create as soon as there is **even one** type, interface, or enum.
- `[Name].hooks.ts` — animation/gesture/derived-state hooks per **platform** conventions; called from `.container.tsx`; results passed as props to `.tsx`.
- `[Name].config.ts` — animation parameter objects (spring/timing, etc.) when used; imported by `.hooks.ts`.
- `[Name].constants.ts` — magic numbers (thresholds, sizes, offsets), screen-specific colors not yet in the global theme; imported by `.styles.ts`, `.hooks.ts`, `.config.ts`.
- `[Name].data.ts` — static feature content (slide arrays, option lists); imported by `.container.tsx`.
- Other optional files: create when there are 2+ meaningful entries.

### Constants vs Config vs Data — decision guide

| What you have | File |
|---|---|
| A number or string used as a magic value (threshold, size, offset, color) | `.constants.ts` |
| An object with animation parameters (`{ damping, stiffness }`, `{ duration, easing }`) | `.config.ts` |
| An array or object of feature content (slides, menu items, step definitions) | `.data.ts` |
| A Zod schema / validation rules / form field definitions | `.formConfig.ts` |

---

## Folder structure

```
src/
├── app/                        # App bootstrap & navigation / routing entry
│   ├── index.ts
│   └── navigation/             # React Navigation (RN) — see platform rule for web routing
│       ├── RootNavigator.tsx
│       ├── [Name]Navigator.tsx
│       ├── types.ts            # Param lists (RN) — web: see platform rule
│       └── index.ts
│
├── screens/                    # All screens (flat list)
│   ├── [Name]Screen/
│   │   ├── [Name]Screen.tsx
│   │   ├── [Name]Screen.container.tsx   # if logic
│   │   ├── [Name]Screen.styles.ts
│   │   ├── [Name]Screen.types.ts        # if 1+ type
│   │   ├── [Name]Screen.hooks.ts        # optional
│   │   ├── [Name]Screen.utils.ts        # optional
│   │   ├── [Name]Screen.helpers.ts      # optional
│   │   ├── [Name]Screen.constants.ts    # optional
│   │   ├── [Name]Screen.config.ts       # optional
│   │   ├── [Name]Screen.formConfig.ts   # optional
│   │   ├── components/                  # screen-local components
│   │   │   ├── [Name]/
│   │   │   │   ├── [Name].tsx
│   │   │   │   ├── [Name].container.tsx # if logic
│   │   │   │   ├── [Name].styles.ts
│   │   │   │   ├── [Name].types.ts      # if 1+ type
│   │   │   │   ├── ... optional files
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   └── index.ts
│
├── components/                 # Shared business components (used in 2+ screens)
│   ├── [Name]/
│   │   ├── [Name].tsx
│   │   ├── [Name].container.tsx         # if logic
│   │   ├── [Name].styles.ts
│   │   ├── [Name].types.ts              # if 1+ type
│   │   ├── ... optional files
│   │   └── index.ts
│   └── index.ts
│
└── shared/                     # Cross-cutting concerns
    ├── components/             # Design system — UI primitives
    ├── store/
    ├── hooks/
    ├── utils/
    └── theme/
```

---

## Where does a component go?

| Type | Location | Example |
|------|----------|---------|
| UI primitive, design system | `src/shared/components/` | `Button`, `Input`, `Text`, `Icon` |
| Business component, used in 2+ screens | `src/components/` | `HabitCard`, `ProfileHeader` |
| Only one screen | `src/screens/[Name]Screen/components/` | `LoginForm`, `ErrorBanner` |
| Screen | `src/screens/` | `HomeScreen`, `LoginScreen` |

**Promotion rule:**

1. Extract into `[Name]Screen/components/`.
2. Second screen needs it → promote to `src/components/`.
3. UI primitive with no app logic → `src/shared/components/`.

---

## Path aliases

Always use aliases, never deep relative paths (adjust names to your `tsconfig`):

```typescript
// ✅
import { Button } from '@shared/components';
import { HabitCard } from '@components/HabitCard';
import { LoginScreen } from '@screens/LoginScreen';
import { RootStackParamList } from '@app/navigation/types';

// ❌
import { Button } from '../../../shared/components/Button';
```

| Alias | Typical resolve |
|-------|-----------------|
| `@app/*` | `src/app/*` |
| `@screens/*` | `src/screens/*` |
| `@components/*` | `src/components/*` |
| `@shared/*` | `src/shared/*` |
| `@assets/*` | `src/assets/*` |

---

## Naming conventions

| What | Convention | Example |
|------|------------|---------|
| UI component file | `[Name].tsx` | `HabitCard.tsx` |
| Container | `[Name].container.tsx` | `HabitCard.container.tsx` |
| Styles | `[Name].styles.ts` | `HabitCard.styles.ts` |
| Types | `[Name].types.ts` | `HabitCard.types.ts` |
| Hooks | `[Name].hooks.ts` | `HabitCard.hooks.ts` |
| Utils / helpers / constants / config / data / formConfig | `[Name].*.ts` | `HabitCard.constants.ts` |
| Component folder | PascalCase | `HabitCard/` |
| Screen folder | PascalCase + `Screen` | `HomeScreen/` |
| Navigator (RN) | `[Name]Navigator.tsx` | `AuthNavigator.tsx` |
| Zustand store | `[domain]Store.ts` | `authStore.ts` |
| Test file | `[Name].test.tsx` (co-located) | `HabitCard.test.tsx` |
| Barrel | `index.ts` | required |

---

## Module rules

- `src/screens/` — composition; import from `@components/`, `@shared/`, `@app/`.
- `src/components/` — business components; import from `@shared/` only (not other feature screens).
- `src/shared/components/` — design system; no app-level imports; pure UI.
- `[Name].tsx` — UI only; no store access; no `StyleSheet.create` / CSS module imports (styles come from `.styles.ts` or companion CSS per platform rule).
- `[Name].container.tsx` — logic; renders `<Name />` only.
- `[Name].types.ts` — any types; never inline large types in `.tsx`.
- `[Name].test.tsx` — co-located; never a separate `__tests__/` tree for new UI.
- `index.ts` — export container if present, else component.

---

## Import order

Group imports; **blank line between groups**; **no blank lines inside a group**. Order:

1. `react`
2. Platform UI / framework (see **platform** rule for examples: `react-native`, `react-router-dom`, etc.)
3. Third-party libraries
4. `@app` / `@screens` / `@components` / `@shared` / `@assets` (logical sub-order: navigation → components → store/utils → theme → assets)
5. Local: `./` hooks, utils, constants, config
6. `./` styles
7. **Last**: `import type` from `./` types

Skip empty groups. Types are always the final group.

---

## Adding a new screen — checklist (shared)

1. Create `src/screens/[Name]Screen/` with `[Name]Screen.tsx`, `[Name]Screen.styles.ts`, `index.ts`.
2. Add `.container.tsx` if there is logic.
3. Add `.types.ts` if there is any exported type.
4. Optional files only when they have real content.
5. Extract pieces into `components/[Sub]/` inside the screen folder when needed.
6. **Platform**: register route/navigator (see `project-structure.react-native.md` or `project-structure.react-web.md`).

## Adding a new component — checklist

1. One screen only → `src/screens/[Name]Screen/components/[Component]/`.
2. Two or more screens → `src/components/[Name]/`.
3. Design system → `src/shared/components/[Name]/`.
4. Required: `[Name].tsx`, `[Name].styles.ts`, `index.ts`; container/types as needed.

---

## Component body structure

### Container (`.container.tsx`)

Sections separated by a blank line (omit unused sections):

1. Navigation / routing  
2. Store  
3. State  
4. Derived / memoized  
5. Effects  
6. Handlers (blank line between handlers)

### UI (`.tsx`)

Presentational only; optional small render helpers.

---

## Handler naming

Pattern: `handle[Subject][EventType]` — e.g. `handleLoginClick`, `handleEmailChange`.  
Use `onX` **only** on props, not as local function names.

---

## Control flow

- Prefer guard clauses over `else` chains.
- Prefer object maps over `if-else-if` for value → value mapping.
- No nested ternaries; ternary only for simple binary choice.
- `switch` allowed when mapping is not a good fit.

---

## Braces and function style

- Always `{}` on `if`, even single-line.
- Use **arrow functions** for components, hooks, handlers, utilities. Exception: `function*` generators only.

---

## Hard rules (shared)

- Never put screens in `src/components/` or `src/shared/` (except design-system demos if your repo allows — default: no).
- Never put design-system primitives in `src/components/`.
- Never keep one-screen components in `src/components/`.
- Never put loose component files directly in a screen folder — use `components/[Name]/`.
- Never put styles inline in `.tsx` — use the style module pattern from the **platform** rule.
- Never put state/handlers/store in `[Name].tsx` — use `.container.tsx`.
- Never put JSX in `.container.tsx` except `return <Name ... />`.
- Never use raw magic values for colors/spacing — use theme/tokens.
- Never export non-style values from `.styles.ts`.
- Never put static feature lists in `.constants.ts` — use `.data.ts`.
- Never skip `index.ts` barrels in new folders.
- Never use `__tests__/` for new UI code unless an existing subproject already mandates it.
- Never use the `function` keyword for components/hooks (arrow functions only).
- Never use `onSubmit`-style names for local handlers — use `handle…Click` / `handle…Change` pattern.
- Shared hooks/utils → `src/shared/hooks/` or `src/shared/utils/`.

Platform-specific hard rules (animations, gestures, testing stack) are in the **react-native** or **react-web** rule file.
