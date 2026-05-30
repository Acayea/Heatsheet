# FieldDay — Complete App Structure Document

> Everything you need to build an exact duplicate of this application from scratch.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Repository Structure](#2-repository-structure)
3. [Technology Stack](#3-technology-stack)
4. [Design System & Visual Language](#4-design-system--visual-language)
5. [Shared Packages](#5-shared-packages)
6. [Database Schema](#6-database-schema)
7. [Supabase Edge Functions](#7-supabase-edge-functions)
8. [Web App (Next.js)](#8-web-app-nextjs)
9. [Mobile App (Expo)](#9-mobile-app-expo)
10. [Authentication Flow](#10-authentication-flow)
11. [Core Game Logic & Rules](#11-core-game-logic--rules)
12. [Environment Variables](#12-environment-variables)
13. [Build & Tooling Config](#13-build--tooling-config)
14. [Reconstruction Checklist](#14-reconstruction-checklist)

---

## 1. Project Overview

**FieldDay** is a fantasy sports platform for Track & Field. Users create or join fantasy leagues, draft pro and college athletes, earn points based on real meet results, and compete on a leaderboard. A secondary game mode ("Pick'em") lets users predict race/field event winners without a full roster.

### Core Concepts

| Concept | Description |
|---|---|
| **Season** | A competition season scoped by level (pro/college) and discipline (indoor/outdoor/cross_country) |
| **Meet** | A single track & field event/competition within a season |
| **League** | A group of users (2–20) who draft athletes and compete together in one season |
| **Roster** | Each user in a league holds one roster of 8 athletes |
| **Draft** | Snake-format draft at the start of a season to assign athletes to rosters |
| **Scoring** | Athletes earn points based on their place at each meet, multiplied by meet tier and slot type |
| **Pick'em** | Standalone prediction game where users pick event winners before a meet |
| **Salary Cap** | Each team has 50,000 credits; athletes cost varying amounts to restrict roster power |

---

## 2. Repository Structure

```
/
├── package.json               # Monorepo root (npm workspaces)
├── turbo.json                 # Turborepo pipeline config
├── tsconfig.base.json         # Shared TypeScript base config
├── .prettierrc                # Shared formatter config
├── .gitignore
│
├── packages/
│   ├── shared/                # Zod schemas, TypeScript types, constants
│   ├── db/                    # Supabase client factory + generated DB types
│   └── ui/                    # Shared design tokens (colors, spacing, typography)
│
├── apps/
│   ├── web/                   # Next.js 16 web application
│   └── mobile/                # Expo 54 React Native application
│
└── supabase/
    ├── migrations/            # SQL migration files (run in order)
    ├── seed/                  # Test data SQL
    └── functions/             # Deno edge functions
```

### Workspace Names

| Path | Package Name |
|---|---|
| `packages/shared` | `@fieldday/shared` |
| `packages/db` | `@fieldday/db` |
| `packages/ui` | `@fieldday/ui` |
| `apps/web` | `web` |
| `apps/mobile` | `mobile` |

---

## 3. Technology Stack

| Layer | Choice | Version |
|---|---|---|
| Monorepo tool | Turbo | `^2.9.3` |
| Package manager | npm workspaces | `npm@11.7.0` |
| Language | TypeScript | `^5.6.3` |
| Web framework | Next.js (App Router) | `16.2.2` |
| Mobile framework | Expo | `~54.0.33` |
| Mobile navigation | Expo Router | `~4.0.22` |
| React (web + mobile) | React | `19.1.0` |
| React Native | react-native | `0.81.5` |
| Database + Auth | Supabase | `^2.84.5` (CLI), `^2.45.4` (client) |
| Supabase SSR (web) | @supabase/ssr | `^0.10.0` |
| State management | Zustand | `^5.0.2` |
| Server state | TanStack Query (React Query) | `^5.62.16` |
| Validation | Zod | `^3.23.8` |
| CSS (web) | Tailwind CSS | `^4` |
| Secure storage (mobile) | expo-secure-store | `~14.2.0` |
| Animations (mobile) | react-native-reanimated | `~3.17.4` |
| Formatter | Prettier | `^3.3.3` |
| Linter (web) | ESLint + eslint-config-next | `^9`, `16.2.2` |
| Edge function runtime | Deno (via Supabase Functions) | — |

---

## 4. Design System & Visual Language

All design tokens live in `packages/ui/src/tokens.ts` and are shared across web and mobile.

### 4.1 Color Palette

```typescript
colors = {
  // Brand
  primary:      '#E8FF00',   // Electric yellow — primary CTA, highlights, active states
  primaryDark:  '#B8CC00',   // Darker yellow for hover states

  // Backgrounds
  surface:      '#0D0D0D',   // Primary dark background
  surfaceAlt:   '#1A1A1A',   // Card / elevated surface background

  // Borders
  border:       '#2A2A2A',   // Default border color

  // Semantic
  success:      '#22C55E',
  warning:      '#F59E0B',
  error:        '#EF4444',
  info:         '#3B82F6',

  // Text
  textPrimary:  '#FFFFFF',
  textSecondary:'#A1A1AA',
  textMuted:    '#52525B',

  // Pool-specific accents
  pro:          '#E8FF00',   // Same as primary — Pro league color
  college:      '#60A5FA',   // Blue — College league color
}
```

**Visual Theme:** Dark mode only. Electric yellow (#E8FF00) on near-black (#0D0D0D). No light mode exists.

### 4.2 Spacing Scale

```typescript
spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  '2xl': 48,
  '3xl': 64,
}
```

### 4.3 Border Radius

```typescript
radius = {
  sm:   4,
  md:   8,
  lg:   12,
  xl:   16,
  full: 9999,   // Pill/circle shapes
}
```

### 4.4 Typography

```typescript
fontSizes = {
  xs:   11,
  sm:   13,
  md:   15,   // Body default
  lg:   17,
  xl:   20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
}

fontWeights = {
  regular:  '400',
  medium:   '500',
  semibold: '600',
  bold:     '700',
  black:    '900',
}
```

**Web font:** Geist (loaded via `next/font/google` in root layout).

### 4.5 Navigation Icons

Navigation uses emoji icons throughout both web and mobile:

| Route | Label | Icon |
|---|---|---|
| /home | Home | 🏠 |
| /seasons | Seasons | 🏆 |
| /leagues | My Leagues | 👥 |
| /athletes | Athletes | ⚡ |
| /profile | Profile | 👤 |

---

## 5. Shared Packages

### 5.1 `@fieldday/shared`

**Location:** `packages/shared/src/`

#### Constants (`constants/index.ts`)

```typescript
SALARY_CAP = 50_000              // Credits per roster
ROSTER_SIZE = 8                  // Athletes per roster
STARTING_SLOTS = 6               // Starters (includes captain)
BENCH_SLOTS = 2
DNF_INSURANCE_TOKENS_PER_SEASON = 1
INVITE_CODE_LENGTH = 8           // Characters, uppercase alphanumeric
MAX_LEAGUE_MEMBERS = 20
MIN_LEAGUE_MEMBERS = 2
DEFAULT_LEAGUE_MEMBERS = 10
PICKEM_CORRECT_POINTS = 5
PICKEM_INCORRECT_POINTS = 0

SEASONS = {
  PRO_INDOOR:           'pro_indoor',
  COLLEGE_INDOOR:       'college_indoor',
  PRO_OUTDOOR:          'pro_outdoor',
  COLLEGE_OUTDOOR:      'college_outdoor',
  PRO_CROSS_COUNTRY:    'pro_cross_country',
  COLLEGE_CROSS_COUNTRY:'college_cross_country',
}
```

#### Types (`types/`)

**`athlete.ts`**
```typescript
type AthletePool = 'pro' | 'college'
type AthleteGender = 'men' | 'women'
type TrackEvent =
  | '60m' | '100m' | '200m' | '400m'
  | '800m' | '1500m' | '1mile'
  | '5000m' | '10000m'
  | '60mh' | '100mh' | '110mh' | '400mh'
  | '3000msc'
  | 'hj' | 'pv' | 'lj' | 'tj'
  | 'sp' | 'dt' | 'ht' | 'jt'
  | 'hept' | 'dec'
  | 'cross_country' | 'marathon'

interface Athlete {
  id: string
  pool: AthletePool
  gender: AthleteGender
  firstName: string
  lastName: string
  countryCode: string         // ISO 3166-1 alpha-3
  primaryEvent: TrackEvent
  events: TrackEvent[]
  photoUrl: string | null
  worldAthleticsId: string | null
  salary: number              // In credits (0–50,000)
  isActive: boolean
  createdAt: string
  updatedAt: string
}
```

**`season.ts`**
```typescript
type SeasonLevel = 'pro' | 'college'
type SeasonDiscipline = 'indoor' | 'outdoor' | 'cross_country'
type SeasonStatus = 'upcoming' | 'active' | 'completed'
type MeetTier = 'world_championship' | 'diamond_league' | 'gold' | 'silver' | 'bronze' | 'regular'

interface Season {
  id: string
  level: SeasonLevel
  discipline: SeasonDiscipline
  name: string
  status: SeasonStatus
  draftOpensAt: string        // ISO datetime
  startsAt: string
  endsAt: string
  salaryCap: number
  rosterSize: number
  startingSlots: number
  createdAt: string
}

interface Meet {
  id: string
  seasonId: string
  name: string
  location: string
  tier: MeetTier
  startsAt: string
  endsAt: string
  isScored: boolean
  createdAt: string
}
```

**`user.ts`**
```typescript
type UserRole = 'user' | 'admin'

interface UserProfile {
  id: string
  userId: string              // FK to auth.users
  username: string            // Unique, 3–20 chars
  displayName: string
  avatarUrl: string | null
  role: UserRole
  createdAt: string
  updatedAt: string
}
```

**`league.ts`**
```typescript
type LeagueType = 'public' | 'private'
type LeagueMemberRole = 'commissioner' | 'member'
type DraftStatus = 'pending' | 'active' | 'completed'
type RosterSlotType = 'starter' | 'bench' | 'captain'

interface League {
  id: string
  seasonId: string
  name: string
  type: LeagueType
  inviteCode: string | null   // 8-char, only for private leagues
  maxMembers: number
  draftStatus: DraftStatus
  draftStartsAt: string | null
  createdBy: string
  createdAt: string
}

interface LeagueMember {
  id: string
  leagueId: string
  userId: string
  role: LeagueMemberRole
  draftOrder: number | null   // Set when draft starts
  totalPoints: number
  joinedAt: string
}

interface Roster {
  id: string
  leagueId: string
  userId: string
  seasonId: string
  totalSalaryUsed: number
  createdAt: string
  updatedAt: string
}

interface RosterAthlete {
  id: string
  rosterId: string
  athleteId: string
  slotType: RosterSlotType
  acquiredAt: string
  droppedAt: string | null    // Null = currently on roster
}
```

**`scoring.ts`**
```typescript
type FinishResult = 'completed' | 'dnf' | 'dns' | 'dq' | 'nh' | 'nm'

interface ScoringEvent {
  id: string
  meetId: string
  athleteId: string
  event: string
  place: number | null        // Null for DNF/DNS/etc.
  result: FinishResult
  mark: string | null         // Time/distance (e.g., "9.83", "8.25m")
  basePoints: number
  tierMultiplier: number
  totalPoints: number
  dnfInsuranceApplied: boolean
  createdAt: string
}
```

#### Zod Schemas (`schemas/`)

**`auth.ts`**
```typescript
SignUpSchema = z.object({
  email:       z.string().email(),
  password:    z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
  username:    z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
  displayName: z.string().min(1).max(50),
})

SignInSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
})
```

**`league.ts`**
```typescript
CreateLeagueSchema = z.object({
  name:       z.string().min(3).max(50),
  seasonId:   z.string().uuid(),
  type:       z.enum(['public', 'private']),
  maxMembers: z.number().int().min(2).max(20),
})

JoinLeagueSchema = z.object({
  inviteCode: z.string().length(8).regex(/^[A-Z0-9]+$/),
})
```

**`pickem.ts`**
```typescript
PickemPickSchema = z.object({
  meetId:    z.string().uuid(),
  event:     z.string(),
  athleteId: z.string().uuid(),
})

SubmitPickemSchema = z.object({
  meetId: z.string().uuid(),
  picks:  z.array(PickemPickSchema).min(1).max(50),
})
```

---

### 5.2 `@fieldday/db`

**Location:** `packages/db/src/`

#### `client.ts`

```typescript
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

export function createClient(supabaseUrl: string, supabaseAnonKey: string) {
  return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })
}
```

#### `database.types.ts`

Auto-generated via `supabase gen types typescript`. Contains full typed definitions for:
- All public schema tables
- All enums
- Insert/Update/Row variants for each table

Generate with: `supabase gen types typescript --project-id <id> > packages/db/src/database.types.ts`

---

### 5.3 `@fieldday/ui`

**Location:** `packages/ui/src/tokens.ts`

Exports: `colors`, `spacing`, `radius`, `typography`

See [Section 4](#4-design-system--visual-language) for all values.

---

## 6. Database Schema

### 6.1 Extensions

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

### 6.2 Enums

```sql
CREATE TYPE athlete_pool AS ENUM ('pro', 'college');
CREATE TYPE athlete_gender AS ENUM ('men', 'women');
CREATE TYPE season_level AS ENUM ('pro', 'college');
CREATE TYPE season_discipline AS ENUM ('indoor', 'outdoor', 'cross_country');
CREATE TYPE season_status AS ENUM ('upcoming', 'active', 'completed');
CREATE TYPE meet_tier AS ENUM ('world_championship', 'diamond_league', 'gold', 'silver', 'bronze', 'regular');
CREATE TYPE league_type AS ENUM ('public', 'private');
CREATE TYPE draft_status AS ENUM ('pending', 'active', 'completed');
CREATE TYPE league_member_role AS ENUM ('commissioner', 'member');
CREATE TYPE roster_slot_type AS ENUM ('starter', 'bench', 'captain');
CREATE TYPE finish_result AS ENUM ('completed', 'dnf', 'dns', 'dq', 'nh', 'nm');
CREATE TYPE user_role AS ENUM ('user', 'admin');
```

### 6.3 Tables

#### `user_profiles`
```sql
CREATE TABLE user_profiles (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username     text UNIQUE NOT NULL CHECK (length(username) BETWEEN 3 AND 20),
  display_name text NOT NULL,
  avatar_url   text,
  role         user_role NOT NULL DEFAULT 'user',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
```
- Trigger: `on_auth_user_created` → auto-creates row when new user signs up
- Trigger: `updated_at` auto-update on modification

#### `athletes`
```sql
CREATE TABLE athletes (
  id                  uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  pool                athlete_pool NOT NULL,
  gender              athlete_gender NOT NULL,
  first_name          text NOT NULL,
  last_name           text NOT NULL,
  country_code        text NOT NULL,
  primary_event       text NOT NULL,
  events              text[] NOT NULL DEFAULT '{}',
  photo_url           text,
  world_athletics_id  text UNIQUE,
  salary              integer NOT NULL DEFAULT 0,
  is_active           boolean NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ON athletes(pool, gender);
CREATE INDEX ON athletes(primary_event);
CREATE INDEX ON athletes(is_active);
```

#### `seasons`
```sql
CREATE TABLE seasons (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  level          season_level NOT NULL,
  discipline     season_discipline NOT NULL,
  name           text NOT NULL,
  status         season_status NOT NULL DEFAULT 'upcoming',
  draft_opens_at timestamptz NOT NULL,
  starts_at      timestamptz NOT NULL,
  ends_at        timestamptz NOT NULL,
  salary_cap     integer NOT NULL DEFAULT 50000,
  roster_size    integer NOT NULL DEFAULT 8,
  starting_slots integer NOT NULL DEFAULT 6,
  created_at     timestamptz NOT NULL DEFAULT now()
);
```

#### `meets`
```sql
CREATE TABLE meets (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  season_id  uuid NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  name       text NOT NULL,
  location   text NOT NULL,
  tier       meet_tier NOT NULL DEFAULT 'regular',
  starts_at  timestamptz NOT NULL,
  ends_at    timestamptz NOT NULL,
  is_scored  boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

#### `leagues`
```sql
CREATE TABLE leagues (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  season_id       uuid NOT NULL REFERENCES seasons(id),
  name            text NOT NULL CHECK (length(name) BETWEEN 3 AND 50),
  type            league_type NOT NULL DEFAULT 'public',
  invite_code     text UNIQUE CHECK (
                    (type = 'private' AND invite_code IS NOT NULL)
                    OR (type = 'public' AND invite_code IS NULL)
                  ),
  max_members     integer NOT NULL DEFAULT 10 CHECK (max_members BETWEEN 2 AND 20),
  draft_status    draft_status NOT NULL DEFAULT 'pending',
  draft_starts_at timestamptz,
  created_by      uuid NOT NULL REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now()
);
```

#### `league_members`
```sql
CREATE TABLE league_members (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  league_id    uuid NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES auth.users(id),
  role         league_member_role NOT NULL DEFAULT 'member',
  draft_order  integer,
  total_points integer NOT NULL DEFAULT 0,
  joined_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (league_id, user_id)
);
```

#### `rosters`
```sql
CREATE TABLE rosters (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  league_id         uuid NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  user_id           uuid NOT NULL REFERENCES auth.users(id),
  season_id         uuid NOT NULL REFERENCES seasons(id),
  total_salary_used integer NOT NULL DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (league_id, user_id)
);
```

#### `roster_athletes`
```sql
CREATE TABLE roster_athletes (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  roster_id   uuid NOT NULL REFERENCES rosters(id) ON DELETE CASCADE,
  athlete_id  uuid NOT NULL REFERENCES athletes(id),
  slot_type   roster_slot_type NOT NULL DEFAULT 'starter',
  acquired_at timestamptz NOT NULL DEFAULT now(),
  dropped_at  timestamptz
);

-- Only one captain per roster at a time
CREATE UNIQUE INDEX one_captain_per_roster
  ON roster_athletes(roster_id)
  WHERE slot_type = 'captain' AND dropped_at IS NULL;
```

#### `scoring_events`
```sql
CREATE TABLE scoring_events (
  id                    uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  meet_id               uuid NOT NULL REFERENCES meets(id),
  athlete_id            uuid NOT NULL REFERENCES athletes(id),
  event                 text NOT NULL,
  place                 integer,
  result                finish_result NOT NULL,
  mark                  text,
  base_points           integer NOT NULL DEFAULT 0,
  tier_multiplier       numeric(4,2) NOT NULL DEFAULT 1.0,
  total_points          numeric(8,2) NOT NULL DEFAULT 0,
  dnf_insurance_applied boolean NOT NULL DEFAULT false,
  created_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (meet_id, athlete_id, event)
);
```

#### `dnf_insurance_tokens`
```sql
CREATE TABLE dnf_insurance_tokens (
  id        uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id   uuid NOT NULL REFERENCES auth.users(id),
  season_id uuid NOT NULL REFERENCES seasons(id),
  used      boolean NOT NULL DEFAULT false,
  used_at   timestamptz,
  UNIQUE (user_id, season_id)
);
```

#### `pickem_entries`
```sql
CREATE TABLE pickem_entries (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      uuid NOT NULL REFERENCES auth.users(id),
  meet_id      uuid NOT NULL REFERENCES meets(id),
  submitted_at timestamptz NOT NULL DEFAULT now(),
  total_points integer NOT NULL DEFAULT 0,
  UNIQUE (user_id, meet_id)
);
```

#### `pickem_picks`
```sql
CREATE TABLE pickem_picks (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  entry_id       uuid NOT NULL REFERENCES pickem_entries(id) ON DELETE CASCADE,
  event          text NOT NULL,
  athlete_id     uuid NOT NULL REFERENCES athletes(id),
  is_correct     boolean,
  points_awarded integer NOT NULL DEFAULT 0,
  UNIQUE (entry_id, event)
);
```

#### `draft_picks`
```sql
CREATE TABLE draft_picks (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  league_id   uuid NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id),
  athlete_id  uuid NOT NULL REFERENCES athletes(id),
  pick_number integer NOT NULL,
  round_number integer NOT NULL,
  salary      integer NOT NULL,
  picked_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (league_id, pick_number),
  UNIQUE (league_id, athlete_id)
);
```

### 6.4 Row Level Security (RLS)

All tables have RLS enabled. Summary of policies:

| Table | Read | Write |
|---|---|---|
| `user_profiles` | Anyone | Self only |
| `athletes` | Active athletes, anyone | Admins only |
| `seasons` | Anyone | Admins only |
| `meets` | Anyone | Admins only |
| `leagues` (public) | Anyone | Creator |
| `leagues` (private) | Members only | Commissioner |
| `league_members` | Members of that league | Self (join/leave) |
| `rosters` | Members of that league | Self |
| `roster_athletes` | Members of that league | Self |
| `scoring_events` | Anyone | Admins only |
| `dnf_insurance_tokens` | Self | Self |
| `pickem_entries` | Anyone | Self |
| `pickem_picks` | Anyone | Self |
| `draft_picks` | League members | Edge function (service role) |

> **Note:** The `league_members` RLS policies had a recursion issue (selecting league members to check if you're a league member). This was patched in migrations `000009` and `000010` using security-definer functions to break the cycle.

### 6.5 Database Triggers

```sql
-- Auto-create user_profile on signup
CREATE FUNCTION handle_new_user() RETURNS trigger AS $$
BEGIN
  INSERT INTO user_profiles (user_id, username, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'username', NEW.raw_user_meta_data->>'displayName');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();
```

---

## 7. Supabase Edge Functions

All edge functions are in `supabase/functions/` and run on Deno.

### 7.1 `make-draft-pick`

**Endpoint:** `POST /functions/v1/make-draft-pick`
**Auth:** Bearer token (user JWT)

**Request:**
```json
{
  "leagueId": "uuid",
  "athleteId": "uuid"
}
```

**Validation Steps (in order):**
1. User is authenticated (from JWT)
2. League exists and `draft_status = 'active'`
3. User is a member of the league
4. It is the user's turn (computed via snake draft order from `draft_order` + existing pick count)
5. Athlete is not already picked in this league (`draft_picks` unique constraint)
6. Pick does not exceed salary cap — with a minimum $1,000 reserve per remaining pick

**Snake Draft Turn Logic:**
```typescript
// totalPicks = count of picks already made
// numMembers = number of members in league
// round = Math.floor(totalPicks / numMembers)
// positionInRound = totalPicks % numMembers
// if (round % 2 === 0) → ascending order: draftOrder === positionInRound + 1
// if (round % 2 === 1) → descending order: draftOrder === numMembers - positionInRound
```

**Slot Assignment Logic:**
```typescript
// picksOnRoster = user's current draft picks count
// if (picksOnRoster === 0) → 'captain'
// else if (picksOnRoster < STARTING_SLOTS) → 'starter'
// else → 'bench'
```

**Side Effects:**
1. `INSERT INTO draft_picks` — records the pick
2. `INSERT INTO roster_athletes` — assigns slot (captain/starter/bench)
3. `UPDATE rosters SET total_salary_used` — adds athlete salary
4. If `totalPicks + 1 === numMembers * ROSTER_SIZE` → `UPDATE leagues SET draft_status = 'completed'`

**Response (success):**
```json
{
  "ok": true,
  "pick": {
    "pickNumber": 1,
    "round": 1,
    "athleteId": "uuid",
    "athleteName": "John Doe",
    "salary": 5000
  }
}
```

---

### 7.2 `score-meet`

**Endpoint:** `POST /functions/v1/score-meet`
**Auth:** `Authorization: Bearer <FUNCTION_SECRET>` header (not user JWT)

**Request:**
```json
{ "meetId": "uuid" }
```

**Logic:**
1. Fetch all `scoring_events` for the meet
2. Build `Map<athleteId, totalPoints>`
3. Fetch all leagues linked to the meet's season
4. For each league, fetch all active `roster_athletes` with slot types
5. Compute roster score:
   - captain: athlete_points × 2
   - starter: athlete_points × 1
   - bench: 0
6. `UPDATE league_members SET total_points` for each user
7. `UPDATE meets SET is_scored = true`

---

### 7.3 `ingest-world-athletics`

**Status:** Placeholder — not implemented.

Intended to pull real meet results from the World Athletics API and insert `scoring_events`.

---

## 8. Web App (Next.js)

**Location:** `apps/web/src/`

### 8.1 File Structure

```
src/
├── app/
│   ├── layout.tsx                      # Root layout (fonts, metadata)
│   ├── page.tsx                        # Root redirect
│   ├── globals.css                     # Tailwind import
│   ├── auth/
│   │   ├── sign-in/
│   │   │   └── page.tsx               # Sign-in form
│   │   └── sign-up/
│   │       └── page.tsx               # Sign-up form
│   └── (app)/
│       ├── layout.tsx                  # Protected shell (sidebar + bottom nav)
│       ├── home/
│       │   └── page.tsx               # Dashboard
│       ├── seasons/
│       │   ├── page.tsx               # Season grid
│       │   └── [id]/
│       │       └── page.tsx           # Season detail
│       ├── leagues/
│       │   ├── page.tsx               # My leagues list
│       │   ├── new/
│       │   │   └── page.tsx           # Create league form
│       │   └── [id]/
│       │       ├── page.tsx           # League hub
│       │       ├── StartDraftButton.tsx
│       │       └── draft/
│       │           ├── page.tsx       # SSR data loader
│       │           └── DraftRoom.tsx  # Interactive client component
│       ├── athletes/
│       │   └── page.tsx               # Athlete table
│       └── profile/
│           └── page.tsx               # User profile
└── lib/
    └── supabase/
        ├── client.ts                  # Browser Supabase client
        └── server.ts                  # Server Supabase client (SSR)
```

### 8.2 Route Behavior

| Route | Access | Behavior |
|---|---|---|
| `/` | Public | Redirect to `/home` (authed) or `/auth/sign-in` (not authed) |
| `/auth/sign-in` | Public | Email/password sign in |
| `/auth/sign-up` | Public | Create account |
| `/(app)/*` | Protected | Redirect to `/auth/sign-in` if no session |

### 8.3 App Shell Layout (`(app)/layout.tsx`)

- **Desktop:** Fixed left sidebar (64px wide) with icon nav
- **Mobile:** Bottom tab bar
- Sidebar/tabs include: Home, Seasons, My Leagues, Athletes, Profile
- Active route highlighted with primary color (#E8FF00)
- User avatar or initials in bottom corner of sidebar

### 8.4 Page Descriptions

#### `/auth/sign-in`
- Fields: email, password
- Validates via `SignInSchema` (Zod)
- Calls `supabase.auth.signInWithPassword()`
- On success: redirect to `/home`
- Shows field-level validation errors inline

#### `/auth/sign-up`
- Fields: email, password, username, displayName
- Validates via `SignUpSchema` (Zod)
- Password rules: 8+ chars, 1 uppercase, 1 number
- Username rules: 3–20 chars, alphanumeric + underscore
- Calls `supabase.auth.signUp()` with metadata `{ username, displayName }`
- Trigger creates `user_profiles` row automatically
- Shows field-level validation errors inline

#### `/(app)/home`
- Shows active/upcoming seasons (filtered from `seasons` table)
- Quick-action buttons: "Browse Seasons", "Create League", "Join League"
- If user has leagues, shows a "My Leagues" summary card

#### `/(app)/seasons`
- Grid of all seasons
- Each card: season name, level (pro/college), discipline, status badge, date range
- Status badge colors: upcoming = yellow, active = green, completed = gray

#### `/(app)/seasons/[id]`
- Season name, level, discipline, status
- Salary cap display
- Meet schedule table (name, location, tier, date, scored status)
- Points scoring guide (table showing place → points)
- Countdown to next meet or season start

#### `/(app)/athletes`
- Table of pro athletes
- Columns: name, country, primary event, salary (credits)
- Filter by gender, event
- Search by name

#### `/(app)/leagues`
- List of user's leagues with total points, draft status
- "Create League" button → `/leagues/new`
- "Join League" flow with invite code input

#### `/(app)/leagues/new`
- Form fields:
  - Name (text, 3–50 chars)
  - Season (dropdown from active/upcoming seasons)
  - Type (public / private toggle)
  - Max Members (slider 2–20, default 10)
- On submit: inserts `leagues` row, `league_members` row (commissioner), `rosters` row
- Private: generates random 8-char uppercase invite code
- Redirect to `/leagues/[newId]`

#### `/(app)/leagues/[id]`

**Pre-Draft State (`draft_status = 'pending'`):**
- League name, season, member count
- Member list with avatars and roles
- If commissioner: invite code (private league) + "Start Draft" button
- Start Draft button triggers `StartDraftButton.tsx` component

**Draft Active State (`draft_status = 'active'`):**
- "🟡 Draft Live" indicator
- Link to draft room `/leagues/[id]/draft`

**Post-Draft State (`draft_status = 'completed'`):**
- Standings table (rank, username, total_points)
- Roster viewer per member
- Meet schedule with scores

#### `/(app)/leagues/[id]/draft`

**`page.tsx`** (server component):
- Fetches initial state server-side:
  - League + members + draft order
  - All active athletes + salaries
  - Existing draft picks
  - User's current session
- Passes to `DraftRoom.tsx` as props

**`DraftRoom.tsx`** (client component):

Features:
- Left panel: filterable athlete list (search, gender filter, event filter)
- Right panel: my roster + draft order
- Top bar: current turn indicator ("Your Pick" or "Waiting for X"), salary cap remaining, round/pick number
- Realtime: subscribes to `draft_picks` table for live updates
- Clicking an athlete → confirmation modal → calls `make-draft-pick` edge function
- Already-picked athletes grayed out / unclickable
- Turn highlight: current picker's name highlighted in draft order list

#### `/(app)/profile`
- Avatar display (or initials)
- Email and username
- Display name
- Sign out button → calls `supabase.auth.signOut()` → redirect to `/auth/sign-in`

### 8.5 Supabase Clients

**Browser client (`lib/supabase/client.ts`):**
```typescript
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@fieldday/db'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
```

**Server client (`lib/supabase/server.ts`):**
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
// Uses cookie store from Next.js headers for SSR auth
```

### 8.6 Next.js Configuration

```typescript
// next.config.ts
const nextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: '...',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: '...',
  },
}
```

---

## 9. Mobile App (Expo)

**Location:** `apps/mobile/`

### 9.1 File Structure

```
app/
├── index.tsx               # Root redirect (auth check)
├── _layout.tsx             # Root layout (QueryClient, auth init)
├── (auth)/
│   ├── _layout.tsx         # Stack navigator for auth screens
│   ├── welcome.tsx         # Landing screen
│   ├── sign-in.tsx         # Sign in form
│   └── sign-up.tsx         # Sign up form (placeholder)
└── (tabs)/
    ├── _layout.tsx         # Tab bar with auth guard
    ├── home.tsx            # Home tab (placeholder)
    ├── seasons.tsx         # Seasons tab (placeholder)
    ├── leagues.tsx         # Leagues tab (placeholder)
    ├── athletes.tsx        # Athletes tab (placeholder)
    └── profile.tsx         # Profile tab (placeholder)

lib/
└── supabase.ts             # Supabase client (secure storage)

stores/
└── auth.ts                 # Zustand auth store
```

### 9.2 Auth Store (`stores/auth.ts`)

```typescript
import { create } from 'zustand'
import type { Session, User } from '@supabase/supabase-js'

interface AuthState {
  session: Session | null
  user: User | null
  isLoading: boolean
  setSession: (session: Session | null) => void
  setLoading: (isLoading: boolean) => void
}

const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  isLoading: true,
  setSession: (session) => set({ session, user: session?.user ?? null }),
  setLoading: (isLoading) => set({ isLoading }),
}))
```

### 9.3 Supabase Client (`lib/supabase.ts`)

Uses `expo-secure-store` as the storage adapter (replaces `localStorage`):

```typescript
import * as SecureStore from 'expo-secure-store'
import { createClient } from '@supabase/supabase-js'

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
}

export const supabase = createClient(url, anonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,  // false for native
  },
})
```

### 9.4 Root Layout (`app/_layout.tsx`)

```typescript
// On mount:
// 1. supabase.auth.getSession() → setSession()
// 2. supabase.auth.onAuthStateChange() → setSession() on change
// 3. setLoading(false)
// 4. SplashScreen.hideAsync()
// Wraps children in QueryClientProvider
```

### 9.5 Root Index (`app/index.tsx`)

```typescript
// Reads useAuthStore().session
// if (isLoading) → show nothing / splash
// if (session) → <Redirect href="/(tabs)/home" />
// else → <Redirect href="/(auth)/welcome" />
```

### 9.6 Tab Layout (`(tabs)/_layout.tsx`)

```typescript
// Auth guard: if (!session) → <Redirect href="/(auth)/welcome" />
// Tabs:
// - home:    icon 🏠  label "Home"
// - seasons: icon 🏆  label "Seasons"
// - leagues: icon 👥  label "My Leagues"
// - athletes:icon ⚡  label "Athletes"
// - profile: icon 👤  label "Profile"
// Tab bar style: background #0D0D0D, active tint #E8FF00, inactive tint #52525B
```

### 9.7 Welcome Screen (`(auth)/welcome.tsx`)

- App name "FieldDay" (large, bold, primary yellow)
- Tagline
- "Get Started" button → `/(auth)/sign-up`
- "Sign In" link → `/(auth)/sign-in`

### 9.8 Sign-In Screen (`(auth)/sign-in.tsx`)

- Email input (`TextInput`, keyboardType="email-address")
- Password input (`TextInput`, secureTextEntry)
- "Sign In" button
- Calls `supabase.auth.signInWithPassword()`
- On success: `useAuthStore.setSession()` → navigation automatically redirects via `index.tsx`

### 9.9 Expo Config (`app.json`)

```json
{
  "expo": {
    "name": "FieldDay",
    "slug": "fieldday",
    "version": "1.0.0",
    "scheme": "fieldday",
    "userInterfaceStyle": "dark",
    "splash": { "backgroundColor": "#0D0D0D" },
    "ios": { "bundleIdentifier": "com.fieldday.app" },
    "android": { "package": "com.fieldday.app", "adaptiveIcon": { ... } },
    "plugins": ["expo-router", "expo-secure-store"]
  }
}
```

---

## 10. Authentication Flow

### 10.1 Web

```
User visits any /(app) route
  → Server component checks auth via server Supabase client
  → No session? → redirect to /auth/sign-in
  → Has session? → render page

Sign Up:
  1. User fills form
  2. Zod validates (SignUpSchema)
  3. supabase.auth.signUp({ email, password, options: { data: { username, displayName } } })
  4. Supabase creates auth.users row
  5. DB trigger fires → inserts user_profiles row with username + displayName from metadata
  6. Redirect to /home

Sign In:
  1. supabase.auth.signInWithPassword({ email, password })
  2. SSR client sets cookie via @supabase/ssr
  3. Redirect to /home

Sign Out:
  1. supabase.auth.signOut()
  2. Redirect to /auth/sign-in
```

### 10.2 Mobile

```
App launches:
  1. _layout.tsx: supabase.auth.getSession()
  2. Session found → setSession() → index.tsx redirects to /(tabs)/home
  3. No session → index.tsx redirects to /(auth)/welcome

Sign In:
  1. supabase.auth.signInWithPassword()
  2. onAuthStateChange fires → setSession() in Zustand store
  3. index.tsx re-evaluates → redirect to /(tabs)/home
  (Persisted via expo-secure-store, survives app restarts)
```

---

## 11. Core Game Logic & Rules

### 11.1 Scoring Points by Place

| Place | Base Points |
|---|---|
| 1st | 20 |
| 2nd | 18 |
| 3rd | 16 |
| 4th | 14 |
| 5th | 12 |
| 6th | 10 |
| 7th | 9 |
| 8th | 8 |
| 9th | 7 |
| 10th | 6 |
| 11th–20th | 5 down to 1 |
| DNF / DQ | -2 |
| DNS / NM / NH | 0 |

### 11.2 Meet Tier Multipliers

| Meet Tier | Multiplier |
|---|---|
| World Championship | 3× |
| Diamond League | 2× |
| Gold | 1.5× |
| Silver | 1.25× |
| Bronze | 1.1× |
| Regular | 1× |

### 11.3 Roster Slot Multipliers

| Slot | Multiplier |
|---|---|
| Captain | 2× |
| Starter | 1× |
| Bench | 0× (bench athletes score nothing) |

**Final points formula:**
```
totalPoints = basePoints × tierMultiplier × slotMultiplier
```

### 11.4 DNF Insurance

- Each user gets 1 DNF insurance token per season
- When used on an athlete who DNFs, converts -2 to 0 (neutralizes penalty)
- Token is consumed; `dnf_insurance_tokens.used = true`

### 11.5 Draft Rules

- **Format:** Snake draft (rounds alternate pick order: 1→N, then N→1, then 1→N, ...)
- **Salary Cap:** 50,000 credits per roster; each pick reduces remaining cap
- **Salary Reserve:** Must keep $1,000 minimum per remaining pick (prevents cap cornering)
- **First pick = captain** automatically; picks 2–6 = starters; picks 7–8 = bench
- **Draft completion:** When all rosters have 8 athletes, `draft_status` → `'completed'`

### 11.6 Pick'em

- Independent of fantasy leagues
- Before each meet, users pick winners for each event
- After meet is scored, picks are marked correct/incorrect
- Correct pick = 5 points, incorrect = 0

---

## 12. Environment Variables

### Web (`apps/web/.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

### Mobile (`apps/mobile/.env`)

```
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

### Supabase Edge Functions

- `SUPABASE_URL` — injected automatically by Supabase
- `SUPABASE_SERVICE_ROLE_KEY` — injected automatically
- `FUNCTION_SECRET` — custom env var for `score-meet` authorization

---

## 13. Build & Tooling Config

### `turbo.json`

```json
{
  "$schema": "https://turbo.build/schema.json",
  "ui": "tui",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": { "dependsOn": ["^lint"] },
    "typecheck": { "dependsOn": ["^typecheck"] }
  }
}
```

### `tsconfig.base.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "sourceMap": true,
    "declaration": true,
    "declarationMap": true
  }
}
```

### `.prettierrc`

```json
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2
}
```

### Node Requirement

```json
"engines": { "node": ">=20" }
```

---

## 14. Reconstruction Checklist

Follow these steps in order to rebuild the app from scratch:

### Infrastructure
- [ ] Create Supabase project
- [ ] Enable `uuid-ossp` and `pgcrypto` extensions
- [ ] Run all 10 migrations in order (`20260101000001` → `20260101000010`)
- [ ] Seed database with test athletes, seasons, and meets
- [ ] Deploy edge functions: `make-draft-pick`, `score-meet`, `ingest-world-athletics`
- [ ] Set `FUNCTION_SECRET` environment variable in Supabase project

### Monorepo Setup
- [ ] Init npm workspaces with `apps/*` and `packages/*`
- [ ] Add Turborepo with pipeline config as above
- [ ] Set up shared `tsconfig.base.json` and `.prettierrc`

### Shared Packages
- [ ] Create `@fieldday/ui` with design tokens (all values in Section 4)
- [ ] Create `@fieldday/shared` with all types, schemas, and constants (Section 5.1)
- [ ] Create `@fieldday/db` with Supabase client factory
- [ ] Generate `database.types.ts` from Supabase: `supabase gen types typescript`

### Web App
- [ ] Init Next.js 16 app with App Router
- [ ] Install: `@supabase/ssr`, `zustand`, `@tanstack/react-query`, `tailwindcss@4`
- [ ] Set up browser + server Supabase clients
- [ ] Implement root layout with Geist font
- [ ] Implement auth redirect logic (`/` → `/home` or `/auth/sign-in`)
- [ ] Build auth pages: sign-in, sign-up (with Zod validation)
- [ ] Build app shell layout (sidebar desktop, bottom nav mobile)
- [ ] Build all 5 protected sections: Home, Seasons, Leagues, Athletes, Profile
- [ ] Build league creation form
- [ ] Build league hub page (pre/during/post draft states)
- [ ] Build draft room with realtime subscriptions

### Mobile App
- [ ] Init Expo 54 project with Expo Router
- [ ] Install: `@supabase/supabase-js`, `expo-secure-store`, `zustand`, `@tanstack/react-query`
- [ ] Set up Supabase client with SecureStore adapter
- [ ] Set up Zustand auth store
- [ ] Implement auth init + session persistence in root layout
- [ ] Build auth flow: welcome → sign-in → sign-up
- [ ] Build 5 tab screens (Home, Seasons, Leagues, Athletes, Profile)
- [ ] Apply dark theme: background `#0D0D0D`, active tab `#E8FF00`

### Quality
- [ ] Ensure all TypeScript is strict with no `any`
- [ ] Run `turbo typecheck` across all packages
- [ ] Run `turbo lint` across all packages
- [ ] Run `prettier --write "**/*.{ts,tsx,json,md}"` to normalize formatting
