# Hire Up

A job-search command center. Scans 10 job boards, tailors CVs and cover letters per posting, drafts outreach, and tracks every submission.

## Stack

- **Next.js 16.2.6** (App Router) + React 19 + TypeScript
- **Supabase** — PostgreSQL + RLS + Auth (`@supabase/ssr`)
- **Tailwind v4** + custom design tokens (`src/app/tokens.css`)
- **Lucide React** for icons
- **Vitest** + Testing Library for tests

## Getting Started

```bash
npm install
cp .env.local.example .env.local  # fill in Supabase keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Commands

```bash
npm run dev        # Start dev server
npm run build      # Production build
npm run test:run        # Run tests once
npm test                # Test in watch mode
npm run lint            # Lint
npm run e2e             # Playwright E2E tests
npm run seed            # Seed dev database with test data
npm run seed:teardown   # Remove seeded data
```

## Design

Use the `/hire-up-design` skill in Claude Code for design questions and brand/token guidelines.
