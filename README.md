# Abase

A workout app for athletes: position-specific workouts and multi-week training
plans, browsed and enrolled in from a mobile-first PWA, with an admin CMS for
building out the content library.

**Stack:** Next.js (App Router) + TypeScript + Tailwind CSS v4 · Supabase
(Postgres, Auth, Storage) · installable PWA via Serwist · deployed on Vercel +
Supabase Cloud.

## Project structure

```
src/
  app/
    (auth)/           login, signup, shared auth server actions
    (app)/             the athlete-facing PWA (bottom-nav shell)
      dashboard/        today's workout
      plans/            browse/search library, plan detail + enroll
      log/[id]/         set-by-set workout logging
      progress/         streak + history
      profile/          edit sport/position/level
    admin/              admin CMS (sidebar shell, role-gated)
      sports/ positions/ exercises/   simple CRUD (dialog forms)
      workouts/[id]/     workout editor + exercise builder
      plans/[id]/        plan editor + weekly schedule grid
    auth/callback/      OAuth + email-confirmation redirect handler
    onboarding/         post-signup sport/position/level wizard
  components/           ui/ (design system), layout/, theme/, auth/, plans/, workout/
  lib/
    supabase/            browser/server/middleware Supabase clients
    validations/         zod schemas (client + server validation)
    database.types.ts    hand-written Database type (see note below)
    auth/                requireProfile / requireAdminProfile / assertAdmin guards
supabase/
  migrations/            schema + RLS policies, in order
  seed.sql                sample sports/positions/exercises/workouts/plans
```

## One-time setup

### 1. Create a Supabase project

Create a project at [supabase.com](https://supabase.com) (or use the CLI:
`supabase projects create`). You'll need its **Project URL**, **anon key**,
and (for the CLI steps below) its **project ref**.

### 2. Configure Google OAuth (optional, for "Continue with Google")

In the Supabase dashboard: **Authentication → Providers → Google**, enable it
and add your Google OAuth client ID/secret. Add
`https://<your-project-ref>.supabase.co/auth/v1/callback` as an authorized
redirect URI in your Google Cloud OAuth client, and add your app's own URL
(e.g. `http://localhost:3000/auth/callback` and your production URL) as
additional authorized redirect URIs in the Supabase provider settings.

### 3. Apply the database schema (and seed sample content)

From this directory, with the [Supabase CLI](https://supabase.com/docs/guides/cli)
installed:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

This runs every file in `supabase/migrations/` in order — it creates all
tables, enables Row Level Security on every one of them, installs the
admin-role/ownership policies, **and seeds sample content** (the last
migration mirrors `supabase/seed.sql`, since the CLI has no standalone
"run this SQL file against my linked remote project" command — see the
comment at the top of that migration for why it's duplicated there). See the
migration files themselves for exactly what each one does; the short version:

- **Content tables** (`sports`, `positions`, `exercises`, `workouts`,
  `workout_exercises`, `plans`, `plan_workouts`) are readable by anyone,
  writable only by admins.
- **User tables** (`profiles`, `user_plans`, `progress_logs`,
  `exercise_logs`) are readable/writable only by their owning user
  (`auth.uid() = user_id`), and admin status can't be self-granted for a
  signed-in athlete (a trigger reverts a non-admin's attempt to change their
  own `role`; direct database access — SQL Editor, migrations, service_role —
  is exempt, since it's already a trusted context).
- `supabase/seed.sql` (unseeded by `db push` since it's not a migration) is
  there for **local dev only**, applied automatically by `supabase db reset`
  against a local Postgres started with `supabase start` (requires Docker).

After `db push`, you should have 4 sports, 14 positions, 18 exercises, 10
workouts, and 4 sample 4-week plans — enough that the app isn't empty on
first run.

### 4. Create your admin account

Sign up for an account through the app itself (`/signup`), then promote it to
admin from the SQL Editor:

```sql
update public.profiles set role = 'admin' where email = 'you@example.com';
```

There's no self-serve "become admin" flow by design — this is the one manual
step.

### 5. Environment variables

Copy `.env.example` to `.env.local` and fill in your Supabase project URL and
anon key:

```bash
cp .env.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

`SUPABASE_SERVICE_ROLE_KEY` is only needed if you write server-only scripts
that must bypass RLS (none currently exist) — leave it blank otherwise, and
never expose it to the client.

### 6. Run it

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## A note on `database.types.ts`

`src/lib/database.types.ts` is **hand-written** to match the schema in
`supabase/migrations/`, since it was authored before a live project existed to
generate types from. Once your project is linked, regenerate it from the real
schema so it never drifts:

```bash
supabase gen types typescript --linked > src/lib/database.types.ts
```

If you do this, re-check the pages that currently cast joined-select query
results with `as unknown as <LocalType>` (search for that pattern) — a fresh
codegen may include proper `Relationships` metadata that makes some of those
casts unnecessary.

## Production build

```bash
npm run build   # runs `next build --webpack` — see note below
npm run start
```

**Why `--webpack`:** this project uses [Serwist](https://serwist.pages.dev/)
to generate the PWA service worker, which currently only supports Next's
Webpack build, not Turbopack (Next 16's new default). `npm run dev` and
`npm run build` both pass `--webpack` for this reason; the service worker
itself is disabled in dev (`next.config.ts`) and only built for production.

## Deploying

- **Frontend:** push to a Git repo and import it in Vercel. Set the same
  environment variables from `.env.local` in the Vercel project settings.
  Set `NEXT_PUBLIC_SITE_URL` to your production URL (needed for OAuth/email
  redirect targets).
- **Backend:** your Supabase project is already live once you've pushed
  migrations to it in step 3 — no separate deploy step. If you add Edge
  Functions later, deploy them with `supabase functions deploy`.
