# Sprintal

Multi-tenant SaaS for **strategic portfolio management on a sprint cadence**.

This repository is the application skeleton — folder structure, clients, design
system, and i18n scaffolding. No product pages or business logic yet.

## Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** with a CSS-variable design system
- **Supabase** (Postgres + Auth) — `service_role` used only in `/app/api` routes
- **Zustand** for client state
- **Anthropic API** for the AI coaches (formulation + semantic)
- **Paddle Billing** (Merchant of Record)
- **Resend** for transactional email
- **Playwright** for E2E
- Hosted on **Vercel**

## Project structure

```
/app                  App Router routes
/app/api              API routes (server-only, service_role after auth)
/components           Reusable UI
/lib                  Supabase clients, auth, rate limiter, i18n
/lib/ai               AI coach clients + prompt templates
/lib/i18n             useT() hook + locale dictionaries (en/es/pt)
/lib/supabase         browserClient() (anon) + serviceClient() (service_role)
/stores               Zustand stores
/types                Shared TS types
/supabase/migrations  SQL migrations (RLS enabled per table)
/styles               globals.css design tokens (spec section 10)
/e2e                  Playwright specs
```

## Architectural rules (non-negotiable)

1. All data loading goes through `/app/api` routes using `service_role`. The
   client **never** touches `service_role`.
2. **RLS is enabled on every table.** API routes bypass RLS via `service_role`
   only after authorizing the caller.
3. Plan is always read from the root L1 org via `getRootPlan()` — never trust a
   sub-org plan.
4. AI model IDs come from env vars (`AI_MODEL_FORMULATION`, `AI_MODEL_SEMANTIC`,
   `AI_MODEL_FALLBACK`) — never hardcoded.
5. Rate limits are enforced at the route level (per IP).
6. i18n via the custom `useT()` hook — EN / ES / PT. Every user-visible string
   is translated.
7. Design tokens live in CSS variables; primary buttons are the fixed `#5C6AC4`
   (not `var(--brand)`).

## Getting started

### 1. Prerequisites

- Node.js 20+ and npm 10+
- A Supabase project, Anthropic API key, Paddle + Resend accounts

### 2. Install dependencies

```bash
npm install
```

Playwright browsers (only needed to run E2E locally):

```bash
npx playwright install
```

### 3. Configure environment

```bash
cp .env.example .env.local
```

Fill in every value in `.env.local`. See `.env.example` for the full list and
which vars are browser-exposed (`NEXT_PUBLIC_*`) vs server-only.

### 4. Run the dev server

```bash
npm run dev
```

Open http://localhost:3000. The reference API route is at `/api/health`.

### 5. Database migrations

SQL migrations live in `/supabase/migrations`. Apply them with the Supabase CLI:

```bash
supabase db push
```

Every table must have RLS enabled (rule #2).

## Scripts

| Script              | Description                          |
| ------------------- | ------------------------------------ |
| `npm run dev`       | Start the Next.js dev server         |
| `npm run build`     | Production build                     |
| `npm run start`     | Start the production server          |
| `npm run lint`      | ESLint                               |
| `npm run typecheck` | TypeScript type-check (no emit)      |
| `npm run test:e2e`  | Run Playwright E2E specs             |

## Internationalization

Locale is resolved on the server (`resolveLocale()`: cookie →
`Accept-Language` → default `en`) and provided to the client via
`<LocaleProvider>`. Components read strings with the `useT()` hook:

```tsx
"use client";
import { useT } from "@/lib/i18n";

export function Nav() {
  const t = useT();
  return <span>{t("nav.portfolio")}</span>;
}
```

Dictionaries live in `lib/i18n/dictionaries/{en,es,pt}.ts`; `en.ts` is the
source of truth for keys.
