



# Hire Up App — UI Kit

The in-product dashboard. A two-column layout (sidebar + main) with five primary surfaces:

1. **Dashboard** — your numbers at a glance, plus today's new matches
2. **Scan** — kick off a fresh scan across 10 boards, watch results stream in
3. **Applications** — the ledger of every submission, with stage tracking
4. **Job detail** — opened from any list; tabs for Job → CV → Cover letter → Outreach
5. **Outreach** — drafted emails to hiring contacts, awaiting your approval

## Files

| File | What it is |
| ---- | ---------- |
| `index.html` | Click-thru demo. Switches between Dashboard / Scan / Applications / Detail. Tweakable theme. |
| `components.tsx` | Shared primitives + global types (`Job`, `Stage`, `Theme`, `View`) — `Button`, `Chip`, `IconButton`, `Card`, `Icon`, `Avatar` |
| `Sidebar.tsx` | Left nav with active state, counts, saved searches |
| `TopBar.tsx` | Search + ⌘K, theme toggle, avatar |
| `Dashboard.tsx` | Numbers + today's matches |
| `ScanView.tsx` | Live scan: per-board progress, results streaming |
| `Applications.tsx` | Sortable table of submissions |
| `JobDetail.tsx` | Right-panel detail with tabs |

## TypeScript notes

- Files use **`.tsx`** with Babel Standalone's `typescript` preset — no build step, no `tsc`. Babel strips type annotations at runtime.
- Each script is loaded with `data-presets="react,typescript"`. Presets run in reverse order, so TypeScript strips types first and React transforms JSX second.
- All `.tsx` files in the kit are **script-mode** (no `import` / `export`), so type declarations made in `components.tsx` (like `Job`, `Stage`, `Theme`, `View`, `ChipKind`) are globally visible across every file in the kit. Your editor will pick this up if you point `tsconfig.json` at this directory.
- If you want real type checking (not just stripping), drop a `tsconfig.json` in this folder with `"strict": true, "jsx": "preserve"` and run `tsc --noEmit`.

## Running

Open `index.html`. Everything is inline React (Babel CDN). No build.

## Visual fidelity

These are recreations made to match the design system in `../../colors_and_type.css`. Real production code may diverge. Use these as a pattern reference, not a copy target.



This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
