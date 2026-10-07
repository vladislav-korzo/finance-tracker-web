---
description: React web — routing, CSS Modules / tokens, Framer Motion, RTL. Use with project-structure.shared.md.
globs:
  - "**/apps/web/**/*.ts"
  - "**/apps/web/**/*.tsx"
  - "**/src/**/*.ts"
  - "**/src/**/*.tsx"
---

# React web project structure

**Prerequisite:** `.cursor/rules/project-structure.shared.md`.

## Tech stack (typical)

- **Routing**: React Router v6, or **Next.js** App Router / Pages Router (follow one convention per app).
- **State**: Zustand (avoid Redux/Context for global app state unless already standard).
- **Animations**: Framer Motion for complex transitions (or CSS per design system).
- **Styling**: CSS Modules (`[Name].module.scss`) + CSS variables / design tokens, or approved CSS-in-JS — **no** raw hex scattered in JSX.
- **Build**: Vite, Next, or CRA — match the repo’s tool; do not mix patterns in one app.
- **Testing**: Jest + **React Testing Library** (`@testing-library/react`).

## `[Name].styles.ts` / styles (web)

- Co-locate styles as **CSS Modules** (`[Name].module.scss` imported from `[Name].tsx`) **or** a single `[Name].styles.ts` that re-exports class maps / styled primitives — **per existing app convention**.
- Theme via CSS variables or TS tokens from `@shared/theme` — same “no magic values in JSX” rule as shared doc.

## Routing / screens

- Register routes in the app’s router (e.g. `createBrowserRouter`, Next `app/` segments, or `routes.tsx`).
- **Do not** use React Navigation APIs in web apps unless this is an explicit RN-web hybrid.

## Import order — example (React web)

```typescript
import React, { useState, useCallback } from 'react';

import { Link, useNavigate } from 'react-router-dom';

import { motion } from 'framer-motion';

import { HabitCard } from '@components/HabitCard';

import { useAuthStore } from '@shared/store';
import { formatDate } from '@shared/utils';

import { Button, Input } from '@shared/components';

import { useLoginForm } from './LoginScreen.hooks';
import { VALIDATION_RULES } from './LoginScreen.constants';

import styles from './LoginScreen.module.scss';

import type { LoginScreenProps } from './LoginScreen.types';
```

(Adjust group 2–3 for Next.js: `next/link`, `next/navigation`, etc.)

## New screen / page — checklist (web)

1. Add route entry (router config, or `app/[route]/page.tsx`, or `pages/*.tsx`).
2. Keep the same folder pattern as shared doc under `src/screens/` **or** follow the framework’s directory convention — **do not** duplicate screen logic in two trees.

## Animations (web)

- Prefer **Framer Motion** or CSS for motion; keep animation constants in `.config.ts` / `.constants.ts` when values are reused.
- Do not embed long `transition` objects inline in JSX if they repeat — extract to `.config.ts`.

## Hard rules (web)

- No React Native core imports (`react-native`) in a web-only app.
- Respect **CORS and cookie** behavior for auth when calling APIs (see `.cursor/rules/supabase.md` for Supabase clients).

## Single-app repo

If the whole repository is one Vite/Next app (no `apps/web/`), widen `globs` in this file’s frontmatter to match your tree (e.g. `src/**/*.{ts,tsx}`) and **disable** or narrow `project-structure.react-native.md` globs so both platform rules do not attach to the same files.
