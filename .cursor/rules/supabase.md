---
description: Supabase from React / React Native — keys, auth session, RLS, client modules.
globs: ["**/*.ts", "**/*.tsx", "**/*.sql"]
---

# Supabase (frontend + database expectations)

Use this together with `.cursor/rules/project-structure.shared.md` (where to put auth hooks, stores, API wrappers).

## Keys and environment

- **Publishable key** (Dashboard → API Keys → *Publishable and secret*; prefix `sb_publishable_…`) — use this for new projects; safe in browser with **RLS**. **Legacy anon JWT** (tab *Legacy anon, service_role API keys*) still works as the same second argument to `createClient`. Vite: `VITE_SUPABASE_PUBLISHABLE_KEY` (preferred) or `VITE_SUPABASE_ANON_KEY` (legacy). Never hardcode in source.
- **Service role key** — **server-only** (Edge Functions, backend scripts, CI admin). **Never** ship in React, React Native, or Expo bundles.
- Do not log access tokens or refresh tokens.

## Client setup

- One module creates the Supabase client (e.g. `src/shared/lib/supabase.ts` or `@shared/lib/supabase`) and exports `supabase`.
- **React Native / Expo**: use **`@supabase/supabase-js`** + storage adapter for auth session:
  - Prefer **`expo-secure-store`** (or similar) for refresh/session persistence — AsyncStorage alone is weaker for sensitive tokens.
- **Web**: default client storage is usually fine; use **httpOnly** cookies only if you add a custom server layer (not default supabase-js in browser).

## Data access

- All table policies assume **RLS enabled** on user data. Client code must not “hide” data that RLS would still allow.
- Prefer **typed** helpers or generated types (`Database` type from Supabase CLI) for `from('table')` calls.
- Put **Supabase calls** in hooks, stores, or `*.utils.ts` / dedicated `api/` modules — not in presentational `.tsx`.

## Auth

- Use `supabase.auth` APIs; subscribe to `onAuthStateChange` in one place (e.g. root layout or auth store) and derive UI from store.
- OAuth / magic links: handle **deep links** on RN (Expo Linking); validate redirect URLs in Supabase dashboard.

## Realtime

- Subscribe in `useEffect` (or dedicated hook); **unsubscribe** on unmount. Avoid duplicate channels for the same filter.

## Edge Functions

- Use for secrets, privileged operations, webhooks, or aggregations that must not run with anon key only.
- Call with user JWT when the function should act as the user; use service role only inside the function when needed.

## SQL migrations

- Keep migrations in repo (`supabase/migrations/`). Review RLS on every new table touching user content.

## Testing

- Mock the Supabase client in Jest; do not hit real projects in unit tests. Integration tests may use a dedicated Supabase project.
