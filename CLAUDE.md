# CLAUDE.md — Project Instructions

## Project Overview

Single Next.js 16.2.6 app (App Router) with Supabase as backend.
**Frontend + API:** Next.js 16 Server Actions, Server Components, Route Handlers
**Database/Auth:** Supabase (PostgreSQL + RLS + Auth)
**Package manager:** npm

---

## Philosophy

### 1. Think Before Coding
Don't assume. State assumptions explicitly. If uncertain, ask. Surface tradeoffs rather than picking silently. If something is unclear, stop and name what's confusing.

### 2. Simplicity First
Minimum code that solves the problem. No speculative features, abstractions for single-use code, or unnecessary "flexibility." If 200 lines could be 50, rewrite it. Would a senior engineer call this overcomplicated?

### 3. Surgical Changes
Touch only what you must. Don't improve adjacent code or refactor unbroken things. Match existing style. Remove only imports/variables/functions that *your* changes made unused. Every changed line should trace to the user's request.

### 4. Goal-Driven Execution
Define success criteria upfront. Transform tasks into verifiable goals with clear checks. Use brief plans:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
```

---

## Coding Conventions

- Use **npm** for all commands.
- Follow **ESLint + Prettier**.
- All new modules require **Vitest unit tests**.
- Prefer **async/await**.
- Use **logger utility for errors**; use `console.log()` elsewhere with pertinent objects (values passed in, method parameters, etc.).
---

## Build & Run

```bash
npm install    # Install
npm run build  # Build
npm run dev    # Dev
npm test       # Test (vitest)
npm run test:run  # Test (single run)
npm run lint   # Lint
```

---

## Tech Stack

- Next.js 16.2.6 + React 19 + TypeScript
- Tailwind v4 + design tokens (`src/app/tokens.css`)
- Supabase (`@supabase/ssr`, `@supabase/supabase-js`) — project ID: `bsghjiqmbfnmdoasmhxr`
- Lucide React for icons
- Vitest + Testing Library for tests

---

## Architecture Rules

- All data mutations use **Server Actions** (`src/actions/`).
- Supabase server client (async cookies) used in Server Components and Actions.
- Browser client used only in Client Components.
- Keep functions small and composable.

---

## Directory Structure

```
src/
  actions/        ← Server Actions (Supabase mutations)
  app/            ← Next.js App Router pages + layouts
    (auth)/       ← Login/signup (no sidebar)
    app/          ← Protected app shell (Sidebar + TopBar)
    globals.css
    tokens.css    ← Design tokens (colors, typography, spacing)
  components/
    app/          ← Shared UI components
  lib/
    supabase/     ← Browser and server Supabase clients
    types.ts      ← Shared TypeScript interfaces
    crypto.ts     ← AES-256-GCM encrypt/decrypt
    utils.ts      ← Score utilities
  __tests__/      ← Vitest tests
middleware.ts     ← Auth session refresh + /app/* → /login redirect
supabase/
  migrations/     ← SQL schema migrations
```

---

## Avoid

- No new dependencies without checking existing ones.
- No Next.js pages router.
- No long functions or deeply nested logic.

---

## Personal Preferences

- Always propose tests.
- Prefer concise diffs.
- Explain reasoning before showing code.
