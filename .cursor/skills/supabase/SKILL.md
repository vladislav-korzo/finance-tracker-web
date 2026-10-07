---
name: supabase
description: Supabase patterns for React and React Native — client singleton, auth storage, RLS, Edge Functions. Read when adding auth, DB access, or realtime.
---

# Supabase skill

## When to read

- Implementing sign-in, sign-up, session, or protected routes.
- Adding `supabase.from(...)`, RPC, Storage, or Realtime.
- Adding Edge Functions or SQL migrations that affect the app.

## Canonical rule

Read **`.cursor/rules/supabase.md`** first — keys, RLS, RN secure storage, where to place client code (see `project-structure.shared.md`).

## Quick checklist

1. Client in **one** module; env-based URL + **publishable** key (or legacy anon JWT); see `.cursor/rules/supabase.md`.
2. **RLS** on all user tables; no reliance on “hidden” client checks for security.
3. **RN**: persist session with **SecureStore** (or project-approved secure adapter).
4. Never **service_role** in app code.
5. Cleanup **realtime** subscriptions on unmount.
