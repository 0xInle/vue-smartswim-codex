# Harden Supabase Registration And Account Access

This ExecPlan is a living document. Keep `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` up to date throughout implementation.

This plan follows `.agent/PLANS.md`.

## Purpose / Big Picture

Keep the existing registration-first UX, but make the current Supabase integration safe for production: account access must depend on a real Supabase session, CRM reads must stop being public, and the client should use supported Supabase auth/data APIs instead of anonymous REST fetches.

## Progress

- [x] (2026-04-05 16:15Z) Audited current registration, account route, and `crm_users` SQL policy.
- [x] (2026-04-05 16:27Z) Replaced manual auth/rest helpers with `@supabase/supabase-js`-based client utilities.
- [x] (2026-04-05 16:31Z) Protected `/account` with a real session check and synced header/account page with auth state.
- [x] (2026-04-05 16:33Z) Tightened `crm_users` RLS to authenticated self-read only.
- [x] (2026-04-05 16:36Z) Ran `npm run build` successfully after the auth hardening changes.

## Surprises & Discoveries

- Observation: `/account` currently loads CRM users with the public anon key and no session.
  Evidence: `src/utils/supabaseDatabase.js` uses `Authorization: Bearer <anon key>` and `src/router/index.js` has no auth guard.
- Observation: current SQL allows `select` on `public.crm_users` for `anon`.
  Evidence: `supabase/crm_users.sql` policy `Allow public read crm users`.

## Decision Log

- Decision: keep the registration modal and account route UX intact, but back it with real Supabase session state.
  Rationale: this preserves the user-facing flow while removing the production security gap.
  Date/Author: 2026-04-05 / Codex

## Outcomes & Retrospective

The app now uses a real Supabase browser client and session state for registration, sign-in, account access, and logout. `/account` is no longer publicly reachable, and `crm_users` is no longer readable by `anon`.

The main tradeoff is that production now depends on real session handling: if email confirmation is enabled in Supabase Auth, the user must confirm the email and then use the new sign-in mode in the existing modal. This preserves the current registration-first UX while making the flow deployable.

## Context and Orientation

Relevant files:

- `src/components/AppFloatingHeader.vue` handles registration modal state and account navigation.
- `src/pages/account/AppAccount.vue` reads CRM users and renders the internal account UI.
- `src/router/index.js` currently exposes `/account` without protection.
- `src/utils/supabaseAuth.js` and `src/utils/supabaseDatabase.js` currently talk to Supabase via raw `fetch`.
- `supabase/crm_users.sql` creates the CRM table, trigger, and current RLS policy.

## Plan of Work

Add a shared Supabase client utility, rework auth/data helpers around it, gate `/account` with a real session check, sync local UI state from Supabase auth events, and update SQL so CRM rows are readable only to authenticated sessions.

## Concrete Steps

```bash
cd /Users/sergeybiryukov/Documents/Frontend/Vue/vue-smartswim
npm install @supabase/supabase-js
npm run build
```

Expected result: the app builds successfully with the new client-based Supabase integration.

## Validation and Acceptance

- registration still works from the modal;
- if Supabase returns a session immediately, the user lands on `/account`;
- if email confirmation is required, the user sees the success message but `/account` stays protected;
- direct navigation to `/account` without a session redirects to `/`;
- CRM users load only for authenticated sessions;
- `npm run build` completes successfully.

## Idempotence and Recovery

- client-side refactors are safe to repeat;
- the SQL migration should use `drop policy if exists` / `create policy` so it can be rerun safely;
- if auth handling fails, rollback path is to restore the old helper files and route config.

## Artifacts and Notes

- `npm run build` passed on 2026-04-05 after the auth/session/RLS refactor.
- Production rollout requires re-running `supabase/crm_users.sql` in Supabase SQL Editor so the new policy replaces the old public-read policy.

## Interfaces and Dependencies

- new dependency: `@supabase/supabase-js`;
- env vars remain `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`;
- `/account` route contract changes from public access to authenticated-only access;
- `crm_users` table remains the same shape: `id`, `email`, `name`, `registered_at`.

---
Revision note: Completed implementation with `@supabase/supabase-js`, session-based `/account` access, modal sign-in fallback, and self-only `crm_users` RLS.
