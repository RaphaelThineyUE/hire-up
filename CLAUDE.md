# CLAUDE.md — Project Instructions
 
## Project Overview
 
TypeScript monorepo using pnpm workspaces.  
**Frontend:** Next.js 14 (App Router)  
**Backend:** Fastify services  
**Infra:** Azure Container Apps + Terraform
 
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
 
- Use **pnpm** for all commands.
- Follow **ESLint + Prettier**.
- All new modules require **Vitest unit tests**.
- Prefer **async/await**.
- Use **logger utility for errors**; use `console.log()` elsewhere with pertinent objects (values passed in, method parameters, etc.).
---
 
## Build & Run
 
```bash
pnpm install    # Install
pnpm build      # Build
pnpm dev        # Dev
pnpm test       # Test
pnpm lint       # Lint
```
 
---
 
## Architecture Rules
 
- Frontend cannot import backend code.
- Shared utilities live in `/packages/shared`.
- API responses must use `Result<T>` wrapper.
- Keep functions small and composable.
---
 
## Directory Conventions
 
- `/api` — backend services
- `/web` — frontend
- `/packages/shared` — shared utilities
- `/config` — build and infra configs
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