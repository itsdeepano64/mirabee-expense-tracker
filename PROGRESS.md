# Mirabee Flowers Expense Tracker — Project Progress

## 1. Project Overview

**Mirabee Flowers Expense Tracker** is a mobile-first expense tracking PWA built exclusively for **Jenni** at **Mirabee Flowers** (Carlinville, IL). Features:

- Fast expense entry with receipt photos
- COGS (inventory / cost of goods sold) tracking
- Category breakdown with pinned quick-filters
- Reports with PDF + CSV export
- 18-theme appearance system (6 light + 12 dark)

**Entry flow:** Landing page → tap **"Jenni 💐"** → `localStorage` gate → Dashboard

**Live URL:** https://mirabee-expense-tracker.vercel.app

**GitHub:** https://github.com/itsdeepano64/mirabee-expense-tracker
> ⚠️ `git push` has been failing with "Repository not found". Use `npx vercel --prod --force` to deploy until fixed.

---

## 2. Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router + Turbopack) + TypeScript |
| Styling | Tailwind CSS v4 + custom CSS variable design system |
| Database | Supabase (PostgreSQL) |
| Storage | Supabase Storage — `receipts` bucket |
| Forms | react-hook-form + zod |
| Dates | date-fns |
| Toasts | Sonner |
| PDF export | @react-pdf/renderer |
| Deploy | Vercel (`deependoesitalls-projects/mirabee-expense-tracker`) |

**Environment variables** (`.env.local` + Vercel dashboard):
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

**Local dev:**
```bash
npm run dev
```

**Deploy:**
```bash
npx vercel --prod --force
```
Always use `--force` — avoids stale Vercel build cache, especially after CSS or asset changes.

---

## 3. CSS Architecture — CRITICAL

**All styles live in one file: `app/globals.css`**

This is the only CSS file. It is imported by `app/layout.tsx`. There is NO separate root `globals.css`.

### Structure (ORDER MATTERS):
```
1. @import "tailwindcss"          ← Tailwind v4 import (NOT @tailwind base/components/utilities)
2. @theme inline { ... }         ← Tailwind theme token overrides
3. :root { --mb-* variables }    ← Default (warm cream) CSS custom properties
4. body, .mb-page, etc.          ← Base element + utility class styles
5. [data-theme="lavender"] { }   ← Light theme overrides  ← MUST BE AFTER :root
6. [data-theme="rose"] { }
7. [data-theme="midnight-rose"]  ← Dark theme overrides
8. ... (all 17 non-default themes)
9. .mb-card, .mb-btn-*, etc.     ← Component classes
```

**WHY ORDER MATTERS:** `[data-theme="x"]` and `:root` have the same CSS specificity (0,1,0). Last declaration wins. Theme blocks MUST come after `:root` or they get overridden.

### CSS Variable System (`--mb-*`)

| Variable | Role |
|----------|------|
| `--mb-bg` | Page background |
| `--mb-card` | Card / surface background |
| `--mb-border` | Subtle borders |
| `--mb-border-strong` | Strong borders |
| `--mb-text` | Primary text |
| `--mb-text-muted` | Secondary text |
| `--mb-text-soft` | Tertiary/hint text |
| `--mb-blue` | Primary brand color (buttons, nav, links) |
| `--mb-blue-dark` | Darker blue (gradients, hover) |
| `--mb-blue-light` | Light blue (borders, chips) |
| `--mb-blue-xlight` | Extra-light blue (backgrounds) |
| `--mb-pink` | Rose pink accent (FAB, sign-in CTA) |
| `--mb-pink-light` | Light pink background |
| `--mb-green` | Sage green (COGS) |
| `--mb-green-light` | Light green background |
| `--mb-green-dark` | Dark green text |
| `--mb-shadow-sm/md/lg` | Box shadows |
| `--mb-page-x` | Horizontal page padding |
| `--mb-r-sm/md/lg/xl` | Border radius scale |

---

## 4. Theme System

### How It Works
1. User picks a theme in Settings → `applyTheme(key)` called
2. `applyTheme` sets `localStorage.setItem('mirabee-theme', key)` and `document.documentElement.setAttribute('data-theme', key)`
3. CSS `[data-theme="key"]` block overrides `--mb-*` variables
4. All components use `var(--mb-*)` → instantly re-themed, zero JS framework needed

### Flash Prevention
`app/layout.tsx` `<head>` contains an inline `<script>` that reads localStorage and sets `data-theme` synchronously before first paint:
```tsx
<script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('mirabee-theme');if(t&&t!=='default')document.documentElement.setAttribute('data-theme',t);}catch(e){}})();` }} />
```

### Light Themes (6)
| Key | Label |
|-----|-------|
| `default` | Warm Cream (no `data-theme` attribute needed) |
| `lavender` | Lavender Mist |
| `rose` | Rose Petal |
| `sage` | Sage Garden |
| `peach` | Peach Blossom |
| `sky` | Sky Blue |

### Dark Themes (12)
| Key | Label |
|-----|-------|
| `midnight-rose` | Midnight Rose |
| `dark-forest` | Dark Forest |
| `velvet-plum` | Velvet Plum |
| `slate-ocean` | Slate Ocean |
| `charcoal-peach` | Charcoal Peach |
| `obsidian-gold` | Obsidian Gold |
| `deep-navy` | Deep Navy |
| `mocha` | Mocha |
| `dark-lavender` | Dark Lavender |
| `noir-blush` | Noir Blush |
| `dark-sage` | Dark Sage |
| `twilight` | Twilight |

Dark themes override ALL `--mb-*` variables including backgrounds, text, borders, and the blue family.

---

## 5. Auth Pattern

**No Supabase Auth** — single-user localStorage gate.

- `app/page.tsx`: On mount, checks `localStorage.getItem('mirabee-entry')`. If exists → redirect to `/dashboard`. If missing → show landing page.
- `app/(app)/layout.tsx` (EntryGate): On mount, checks same key. If missing → redirect to `/`. This protects all `(app)` routes.
- **Sign-out:** Calls `localStorage.removeItem('mirabee-entry')`, then `router.replace('/')`. The landing page does NOT auto-set the key, so the user stays on the sign-in screen.

---

## 6. Pages & Routes

| Route | File | Status | Notes |
|-------|------|--------|-------|
| `/` | `app/page.tsx` | ✅ Done | Landing, "Jenni 💐" button, feature cards, session check |
| `/dashboard` | `app/(app)/dashboard/page.tsx` | ✅ Done | Month stats, spend hero, stat cards, quick actions, recent expenses |
| `/expenses` | `app/(app)/expenses/page.tsx` | ✅ Done | Month nav, calendar sheet, filter sheet, search, summary strip |
| `/expenses/new` | `app/(app)/expenses/new/page.tsx` | ✅ Done | Fast entry form |
| `/reports` | `app/(app)/reports/page.tsx` | ✅ Done | Gradient hero card, COGS split bar, category breakdown, sign-out |
| `/settings` | `app/(app)/settings/page.tsx` | ✅ Done | Shop card, 18-theme picker, categories list, add category, sign-out |

All `(app)` routes wrapped by `app/(app)/layout.tsx` (EntryGate + AppShell).

---

## 7. Component Map

```
app/
  layout.tsx                        # Root layout — imports globals.css, inline theme script
  page.tsx                          # Landing page
  globals.css                       # ALL styles — CSS vars, 18 themes, component classes
  (app)/
    layout.tsx                      # EntryGate + AppShell wrapper
    dashboard/page.tsx
    expenses/page.tsx               # Wrapped in Suspense for useSearchParams
    expenses/new/page.tsx
    reports/page.tsx
    settings/page.tsx               # New — theme picker, categories, attribution

components/
  brand/mirabee-logo.tsx            # Logo image + wordmark
  shell/app-shell.tsx               # Sticky header + bottom nav + scrollable body
  expenses/expense-form.tsx
  expenses/expense-edit-sheet.tsx
  expenses/expense-search-bar.tsx
  expenses/quick-filter-chips.tsx
  reports/export-pdf-button.tsx

lib/
  actions/expenses.ts               # All Supabase server actions
  types.ts
  pdf/expense-report-document.tsx

public/
  mirabee-flowers-logo.png          # ACTIVE LOGO — do not rename

supabase/
  schema.sql
  migration-v2.sql
```

---

## 8. Server Actions (`lib/actions/expenses.ts`)

- `getCategories()` — all categories, ordered pinned first
- `getExpenses(filters)` — list with category join; supports q/categories/start/end
- `getExpenseById(id)`
- `getDashboardStats()` — monthly totals, COGS, count, avg, top category, recent 5
- `getCategoryBreakdown(start, end)` — per-category totals for reports page
- `createExpense(data)` — insert + optional receipt upload
- `updateExpense(id, data)` — update + optional receipt replace
- `deleteExpense(id)` — delete + storage cleanup
- `createCategory(data)` — insert (pinned by default)

---

## 9. Supabase Schema

**`categories`:** `id, name, is_cogs, is_pinned, created_at`

**`expenses`:** `id, description, amount, date, category_id, is_cogs, notes, receipt_url, created_at`

Run `supabase/schema.sql` first, then `supabase/migration-v2.sql` (adds `is_pinned`, RLS policies, pinned seed data).

**RLS:** Currently open (anon read/write). Tighten when real auth is added.

---

## 10. Bugs Fixed This Session

| Bug | Root Cause | Fix |
|-----|-----------|-----|
| Vercel build error | `useSearchParams()` outside Suspense in static generation | Wrapped expenses page content in `<Suspense fallback={null}>` |
| Blank/unstyled page | Tailwind v4 migration created new `app/globals.css` that didn't include 600+ lines of `--mb-*` vars | Merged everything into `app/globals.css` |
| Themes not working | `[data-theme]` blocks placed before `:root` — same specificity, `:root` (later) always won | Moved all theme blocks to after `:root` in CSS |
| Sign-out loop | `app/page.tsx` was auto-setting `mirabee-entry` and redirecting on every visit | Changed to check localStorage first; only redirect if session exists |
| Global skinny layout | `.mb-page` had `max-width: 430px` but no `width: 100%` in flex-column body | Added `width: 100%` to `.mb-page` and `w-full` to body |
| Theme flash on load | ThemeProvider used `useEffect` (runs after hydration) | Replaced with inline `<script>` in `<head>` that applies theme synchronously |
| Settings 404 | Page didn't exist | Built full `app/(app)/settings/page.tsx` |

---

## 11. Known Issues & Backlog

### Immediate checks
- [ ] **Confirm `migration-v2.sql` ran in production Supabase** — edit/delete, custom categories, and pinned chips depend on it
- [ ] **Fix GitHub → Vercel auto-deploy** (`git push` fails; many session changes may only exist in Vercel deploy, not committed to Git)

### v2.1 backlog
- [ ] Category edit/delete (create-only today)
- [ ] Real Supabase Auth + secure RLS
- [ ] PWA service worker (offline support)
- [ ] Receipt lightbox (tap to view full size)
- [ ] Month-over-month comparison on Dashboard
- [ ] Loading skeletons on Reports/Settings
- [ ] iPad layout polish

---

## 12. Key Architecture Notes for Next Dev

**Tailwind v4 syntax:** Use `@import "tailwindcss"` not `@tailwind base/components/utilities`. CSS variables go in `:root`, not `tailwind.config.js`.

**Theme specificity rule:** Any `[data-theme]` block in `globals.css` MUST appear after the `:root` block. If you add new variables to `:root`, add matching overrides to every theme block.

**No ThemeProvider component.** Theme is applied by: (1) inline script in `layout.tsx` on initial load, and (2) `applyTheme()` function in `settings/page.tsx` on user selection.

**`useSearchParams` requires Suspense.** Any page using it must be extracted to a child component wrapped in `<Suspense>`.

**Logo caching.** Always use `mirabee-flowers-logo.png`. Use `unoptimized` prop on Next.js Image. Redeploy with `--force` after any public asset swap.

**Attribution:** This app was built exclusively for Jenni at Mirabee Flowers by **Deepen Patel**.

---

## 13. Recent Git History

```
296a924 Use mirabee-flowers-logo.png to fix stale Vercel CDN cache
656224a Fix logo caching and sizing for Vercel deploys
556e2fd update1 (logo file swap)
29f6d59 Mirabee v2 redesign
b5d42ff Initial v1
```

> ⚠️ All work done in the June 2026 Claude session (Settings page, 18 themes, Reports redesign, Expenses wiring, global CSS fixes, sign-out fix, Dashboard cleanup) was deployed via Vercel CLI but has NOT been committed to Git. Commit all of `app/` and `components/` before continuing.

---

*Last updated: June 16, 2026*
