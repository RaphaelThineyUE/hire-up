<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## What this project is

Hire Up: a job-search command center. Next.js 16 app + Supabase backend. Single repo, no monorepo.

## Key facts

- **Package manager:** npm (not pnpm)
- **Framework:** Next.js 16.2.6, React 19, TypeScript strict
- **Database:** Supabase PostgreSQL, project ID `bsghjiqmbfnmdoasmhxr`
- **Auth:** Supabase Auth via `@supabase/ssr`
- **Styling:** Tailwind v4 + CSS custom properties from `src/app/tokens.css`
- **Tests:** Vitest + Testing Library (`npm run test:run`)

## Architecture

- All mutations → Server Actions in `src/actions/`
- Server Components + Actions → `src/lib/supabase/server.ts`
- Client Components → `src/lib/supabase/client.ts`
- Middleware at `middleware.ts` refreshes sessions, redirects `/app/*` to `/login` when unauthenticated
- Design tokens: CSS variables in `src/app/tokens.css` — use `var(--bg-0)`, `var(--fg-0)`, `var(--accent)`, etc.

## Plan files

Implementation plans live in `docs/superpowers/plans/`. Active plan:
- `2026-05-23-plan-1-foundation-and-core.md` — Tasks 1–10 complete, Tasks 11–15 pending

## Conventions

- New Server Actions call `getUser()` first, redirect to `/login` on no session
- All new modules need Vitest tests
- UI components use inline `style` with CSS vars (not raw Tailwind classes)

## Design

Use the `/hire-up-design` skill in Claude Code for design questions and to access brand/token guidelines.
