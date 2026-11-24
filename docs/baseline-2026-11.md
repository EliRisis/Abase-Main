# Baseline, November 2026

Taken before the QOL pass (`docs` created in Phase 0). Production build of commit 020c35e plus the Phase 0 dependency changes.

## Route table from `npm run build`

Next 16 with `--webpack` no longer prints a First Load JS column, so the sizes below are computed instead.

```
Route (app)
┌ ƒ /
├ ○ /_not-found
├ ƒ /admin
├ ƒ /admin/archetypes
├ ƒ /admin/exercises
├ ƒ /admin/needs
├ ƒ /admin/plans
├ ƒ /admin/plans/[id]
├ ƒ /admin/plans/new
├ ƒ /admin/positions
├ ƒ /admin/sports
├ ƒ /admin/workouts
├ ƒ /admin/workouts/[id]
├ ƒ /admin/workouts/new
├ ○ /apple-icon
├ ƒ /auth/callback
├ ○ /auth/error
├ ƒ /dashboard
├ ○ /icon
├ ƒ /icons/icon-192
├ ƒ /icons/icon-512
├ ƒ /icons/maskable-512
├ ƒ /log/[progressLogId]
├ ƒ /log/[progressLogId]/done
├ ○ /login
├ ○ /manifest.webmanifest
├ ƒ /metrics
├ ƒ /onboarding
├ ƒ /plans
├ ƒ /plans/[slug]
├ ƒ /profile
├ ƒ /program
├ ƒ /program/coach
├ ƒ /program/history
├ ƒ /program/history/[id]
├ ƒ /progress
├ ○ /signup
└ ƒ /today


ƒ Proxy (Middleware)

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

## First Load JS per route (computed)

Method: gzip size of every client chunk listed in the route's `page_client-reference-manifest.js`, plus the shared root
chunks and polyfills (`build-manifest.json`). This is an approximation of what Next used to print, good for before/after
comparison only. Re-run the same way for the Phase 6 comparison.

shared (all routes): 167.9 kB gzip
| Route | First Load JS (gzip) |
|---|---|
| /(auth)/signup | 307.1 kB |
| /(auth)/login | 304.7 kB |
| /(app)/program/coach | 298.9 kB |
| /admin/plans/[id] | 295.4 kB |
| /admin/plans/new | 293.2 kB |
| /(app)/program/history | 293.1 kB |
| /(app)/program/history/[id] | 292.9 kB |
| /(app)/program | 292.9 kB |
| /admin/workouts/new | 289.5 kB |
| /admin/workouts/[id] | 289.3 kB |
| /admin/positions | 284.7 kB |
| /admin/exercises | 284.2 kB |
| /admin/archetypes | 273.4 kB |
| /admin/sports | 271.2 kB |
| /(app)/plans/[slug] | 256.3 kB |
| /(app)/profile | 254.5 kB |
| /(app)/today | 253.8 kB |
| /(app)/plans | 252.0 kB |
| /onboarding | 248.8 kB |
| /admin/plans | 248.0 kB |
| /admin/workouts | 247.9 kB |
| /admin/needs | 244.8 kB |
| /(app)/metrics | 241.1 kB |
| /(app)/dashboard | 240.0 kB |
| /(app)/progress | 240.0 kB |
| /(app)/log/[progressLogId]/done | 239.8 kB |
| /(app)/log/[progressLogId] | 239.8 kB |
| /admin | 235.2 kB |
| /auth/error | 234.6 kB |
| / | 234.4 kB |
| /_global-error | 234.4 kB |
| /_not-found | 234.4 kB |

## Console errors and warnings (production build, `next start`)

Checked in the Claude built-in browser pane against `http://localhost:3100`, signed out.

| Route | Result |
|---|---|
| `/` | No app errors. Service worker registration error (see note). |
| `/login` | No app errors. Service worker registration error. |
| `/signup` | No app errors. Service worker registration error. |
| `/nope` (signed out) | Redirects to `/login?next=%2Fnope`. No 404 page is shown to signed-out visitors (see finding 2). |
| Protected routes signed out | Redirect to `/login?next=...`. Same as above. |

Not checked (needs a signed-in session, which the assistant does not create): `/onboarding`, `/dashboard`, `/today`,
`/program`, `/program/history`, `/program/history/[id]`, `/program/coach`, `/plans`, `/plans/[slug]`, `/progress`,
`/metrics`, `/profile`, `/log/[id]`, `/admin`, and 404 while signed in. Re-run these signed in and add the results here.

## Findings

1. **Service worker registers twice.** `@serwist/next` registers `/sw.js` by default, and `src/components/pwa-register.tsx`
   registers it again. Only the second has a `.catch`, so a failed registration surfaces as an uncaught promise error in the
   console. `/sw.js` itself returns 200 with the right content type. The built-in browser pane could not register it, which
   is most likely a limit of the pane, so confirm in Chrome (DevTools, Application, Service Workers).
2. **Signed-out visitors never see a 404.** `src/proxy.ts` treats every path that is not on its short allowlist as private and
   redirects it to login, so `/nope` shows the login page. Relevant to the custom 404 work in Phase 4.
3. **Unused dependencies removed in Phase 0:** `lucide-react` (no imports) and `omniroute` (no imports, missing from the lockfile).
4. **`public/sw.js` is a build output** and is no longer tracked.

## Earlier prompts not yet applied

Searched the code and migrations for the schema they add. None of these exist yet:

- `user_program_days.skipped_at` (audit-fixes Phase 2, rolling Day 1-N and Skip)
- `user_lift_maxes` table (audit-fixes Phase 4, real weights)
- `exercise_logs.reps_in_reserve` (audit-fixes Phase 5, effort tap)
- `exercises.form_cues` (exercise demo animations prompt)
