# Build Guide

This guide covers local setup, running the project, and deploying.

## Prerequisites

- **Node.js** >= 20 (use [nvm](https://github.com/nvm-sh/nvm) or [fnm](https://github.com/Schniz/fnm))
- **npm** >= 11 (`npm install -g npm@latest`)
- **Supabase CLI** >= 2.x (`npm install -g supabase` or [brew install supabase/tap/supabase](https://supabase.com/docs/guides/cli))
- **Docker** — required by the Supabase local stack (for Postgres, Auth, etc.)
- **Expo CLI** — for mobile development (`npm install -g expo-cli` or use `npx expo`)

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy the example files and fill in your values:

```bash
cp apps/web/.env.example apps/web/.env.local
cp apps/mobile/.env.example apps/mobile/.env.local
```

For local development the values to use are printed by `supabase start` in step 3. For production, use the values from your Supabase dashboard.

| Variable | Where used | What it is |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `apps/web/.env.local` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `apps/web/.env.local` | Supabase anon (public) JWT |
| `EXPO_PUBLIC_SUPABASE_URL` | `apps/mobile/.env.local` | Same URL, Expo-prefixed |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | `apps/mobile/.env.local` | Same anon key, Expo-prefixed |

Edge functions also need `SUPABASE_SERVICE_ROLE_KEY` and `FUNCTION_SECRET`. These are set automatically by the Supabase local stack; in production, configure them in the Supabase dashboard under Project Settings → Edge Functions → Secrets.

### 3. Start the local Supabase stack

```bash
supabase start
```

This starts a local Postgres database, Auth server, Storage, and Edge Function runtime on Docker. When it finishes it prints the local URL and keys — paste these into your `.env.local` files.

### 4. Apply migrations and seed data

```bash
supabase db reset
```

This runs all migration files in `supabase/migrations/` in order, then runs `supabase/seed/seed.sql`. It seeds 88 athletes and one 2026 Pro Indoor season with 8 meets.

To re-apply without dropping the DB:

```bash
supabase migration up
```

## Running the Project

### Web app (Next.js)

```bash
cd apps/web
npm run dev
```

Opens at [http://localhost:3000](http://localhost:3000).

Or from the repo root via Turborepo (runs all apps):

```bash
npm run dev
```

### Mobile app (Expo)

```bash
cd apps/mobile
npx expo start
```

Use the Expo Go app to scan the QR code, or press `i` (iOS Simulator) / `a` (Android Emulator).

> **Note:** The mobile app currently has auth + athlete screens implemented. Other tabs are placeholders.

### Edge functions

To run a specific function locally:

```bash
supabase functions serve make-draft-pick --env-file apps/web/.env.local
```

## Running Checks

```bash
npm run typecheck   # TypeScript across all packages
npm run lint        # ESLint (web only currently)
npm run format      # Prettier across all .ts/.tsx/.json/.md files
npm run test        # Vitest unit tests
```

Or run everything through Turborepo (respects dependency order and caching):

```bash
npm run build
```

## Project Structure

```
apps/
  web/         Next.js 16 — App Router, Tailwind v4
  mobile/      Expo 54 — React Native new architecture, Expo Router
packages/
  shared/      Zod schemas, TypeScript types, game constants
  db/          Supabase typed client + generated DB types
  ui/          Design tokens (colors, spacing, typography)
supabase/
  migrations/  SQL migration files (run in numeric order)
  functions/   Deno edge functions (make-draft-pick, score-meet, ingest-world-athletics)
  seed/        Athlete and meet seed data
docs/
  BUILD.md     This file
  APP_STRUCTURE.md  Full spec: schema, RLS, routes, scoring rules
```

See `docs/APP_STRUCTURE.md` for a complete reference on schema design, RLS policies, scoring rules, and the full feature spec.

## Deploying

### Web (Vercel)

1. Push the repo to GitHub.
2. Import the project in [Vercel](https://vercel.com).
3. Set root directory to `apps/web`.
4. Add environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
5. Deploy.

### Database (Supabase hosted)

1. Create a project at [supabase.com](https://supabase.com).
2. Link locally: `supabase link --project-ref <your-ref>`
3. Push migrations: `supabase db push`
4. Run seed: `supabase db execute --file supabase/seed/seed.sql`

### Edge Functions

```bash
supabase functions deploy make-draft-pick
supabase functions deploy score-meet
supabase functions deploy ingest-world-athletics
```

Set the `FUNCTION_SECRET` secret in the Supabase dashboard before deploying `score-meet` and `ingest-world-athletics`.
