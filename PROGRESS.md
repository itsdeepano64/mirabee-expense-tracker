# Mirabee Flowers Expense Tracker — Project Progress

## 1. Project Overview

**Mirabee Flowers Expense Tracker** is a mobile-first expense tracking PWA for **Mirabee Flowers**, a local flower shop. It is built primarily for **Jenni 💐** to:

- Log shop expenses quickly
- Upload receipt photos
- Track **COGS** (inventory / cost of goods sold)
- Review spending by category and date range
- Export reports (PDF + CSV)

**Entry flow:** Landing page → tap **"Jenni 💐"** → simple `localStorage` gate (no real auth yet).

**Live URL:** https://mirabee-expense-tracker.vercel.app

**GitHub (intended):** https://github.com/itsdeepano64/mirabee-expense-tracker — `git push` has been failing with "Repository not found"; deploy via Vercel CLI works.

---

## 2. Current Tech Stack & Setup

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS v4 + shadcn-style Radix UI components |
| Database | Supabase (PostgreSQL) |
| Storage | Supabase Storage — `receipts` bucket |
| Forms | react-hook-form + zod |
| Dates | date-fns |
| Toasts | Sonner |
| PDF export | @react-pdf/renderer |
| Deploy | Vercel (`deependoesitalls-projects/mirabee-expense-tracker`) |

**Environment variables** (`.env.local` locally + set on Vercel):
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

**Supabase SQL files:**
- `supabase/schema.sql` — initial tables + seed categories
- `supabase/migration-v2.sql` — v2: `is_pinned` on categories, quick-filter seeds, update/delete/insert RLS policies

**Local dev:**
```bash
npm run dev
```

**Deploy (when Git auto-deploy isn't working):**
```bash
npx vercel --prod --force
```
Use `--force` after replacing static assets (e.g. logo) to avoid stale build cache.

---

## 3. Branding & Design

### Logo
- **Active file:** `public/mirabee-flowers-logo.png`
- **Component:** `components/brand/mirabee-logo.tsx`
- Used on: landing, app header, empty states, PDF export, PWA manifest
- Renamed from `mirabee-logo.png` to fix Vercel CDN caching
- To swap logo: replace `mirabee-flowers-logo.png`, then `npx vercel --prod --force`

### Color palette

| Token | Hex | Usage |
|-------|-----|-------|
| Primary Blue | `#6BA8BA` | Buttons, nav active, links, report bars |
| Rose Pink Accent | `#E07A8C` | FAB (+), destructive actions, Jenni CTA |
| Sage Green | `#8FAE8B` | COGS badges, COGS toggle, COGS stat cards |
| Dark Text | `#3A2F2F` | Body text |
| Warm Background | `#FDF8F3` | Page background |
| Cards | `#FFFFFF` | Cards, inputs |
| Muted | `#EDE4DB` | Borders, chip backgrounds |

Defined in `app/globals.css` as CSS variables.

### Design direction
- Sleek, professional, mobile-first
- Warm floral brand without being overly cute
- Bottom nav on mobile; logo in header
- Light-first (no dark-mode priority)

---

## 4. Features Implemented So Far

### Pages / routes

| Route | Status | Notes |
|-------|--------|-------|
| `/` | Done | Logo-forward landing, Jenni 💐 entry button |
| `/dashboard` | Done | Monthly stats + recent expenses |
| `/expenses` | Done | Search, chips, date filters, tap-to-edit |
| `/expenses/new` | Done | Fast entry form |
| `/reports` | Done | Breakdown + PDF + CSV export |

App routes wrapped in `EntryGate` + `AppShell` via `app/(app)/layout.tsx`.

### Working functionality

**Expense entry (`/expenses/new`)**
- Large amount field, description, category chips
- Date picker (defaults to today)
- Optional "This is inventory / COGS" switch (not auto-forced by category)
- Collapsible "More details": notes + receipt photo (camera/gallery)
- "+ Add" category dialog → saves to Supabase

**Expenses list (`/expenses`)**
- Search bar (debounced; description + notes)
- Quick-filter chips for pinned categories
- Custom categories via Supabase (`createCategory`)
- Date range (From/To) via URL params
- Composable filters: `?q=&categories=&start=&end=`

**Edit & delete**
- Tap expense card → bottom Sheet with full edit form
- Delete with confirmation AlertDialog
- Receipt replace on edit; storage cleanup on delete

**Dashboard**
- Total spent this month, COGS total, expense count, top category, average expense
- Recent expenses (tappable → edit sheet)

**Reports**
- Date range presets + custom range
- Category breakdown with progress bars
- Export PDF (primary, branded with logo)
- Export CSV (secondary)

**Server actions** (`lib/actions/expenses.ts`)
- `getCategories`, `getExpenses`, `getExpenseById`, `getDashboardStats`, `getCategoryBreakdown`
- `createExpense`, `updateExpense`, `deleteExpense`, `createCategory`

---

## 5. Features & Improvements Still Needed

Most v2 plan items are implemented. Remaining gaps:

### High priority
- [ ] Confirm `migration-v2.sql` ran in Supabase (edit/delete, custom categories, pinned chips depend on it)
- [ ] Fix GitHub → Vercel auto-deploy (`git push` fails; use `npx vercel --prod --force` until fixed)
- [ ] Remove stale `public/mirabee-logo.png` (optional cleanup)

### Nice-to-have / v2.1
- [ ] Category edit/delete (create-only today)
- [ ] Real authentication + secure RLS
- [ ] Offline / PWA service worker caching
- [ ] Edit category COGS default after creation
- [ ] Loading skeletons on more pages
- [ ] iPad layout polish
- [ ] Receipt lightbox view
- [ ] Month-over-month comparison on dashboard

---

## 6. Important Decisions & Custom Logic

### Auth
- No Supabase Auth in v1/v2
- `localStorage` key `mirabee-entry` set by Jenni 💐 button
- `EntryGate` redirects to `/` if missing

### COGS
- Stored as `is_cogs` boolean on each expense
- User toggles "This is inventory / COGS" manually
- Not auto-set when category changes (v2 decision)

### Categories
- Supabase `categories` table; `is_pinned = true` → quick-filter chips
- Seeded: Flowers & Plants, Supplies, Rent, Utilities, Marketing, Payroll, Other
- v2 seeds: Wholesale Flowers, Vases, Tape (pinned)
- User-added categories via `createCategory` (pinned by default)

### Filtering (expenses page)
- URL-driven: `q` (search), `categories` (comma-separated UUIDs), `start` / `end` (date range)
- Defaults to current month when dates omitted

### Receipts
- Supabase Storage `receipts/{uuid}.{ext}`; public URL in `expenses.receipt_url`
- Storage file removed on expense delete

### RLS (open for anon — tighten when auth added)
- Read categories + expenses: anyone
- Insert/update/delete expenses: anyone
- Insert categories: anyone

### Logo / Vercel caching
- Use `mirabee-flowers-logo.png` only
- Logo component uses `unoptimized` Next.js Image
- Redeploy with `--force` after asset swaps

---

## 7. Next Priorities

1. **Verify Supabase** — Run `migration-v2.sql` if not done; test add/edit/delete and custom categories on production
2. **Fix GitHub access** — Restore `git push` and connect Vercel Git integration
3. **Smoke-test production** — https://mirabee-expense-tracker.vercel.app (hard refresh / re-add PWA if logo stale)
4. **Polish pass** — Loading states, empty states, iPad layout
5. **v2.1 backlog** — Category management, real auth, offline support (if needed)

---

## Key file map

```
app/
  page.tsx                      # Landing
  (app)/dashboard/page.tsx
  (app)/expenses/page.tsx
  (app)/expenses/new/page.tsx
  (app)/reports/page.tsx
  globals.css                     # Brand tokens
components/
  brand/mirabee-logo.tsx
  expenses/expense-form.tsx
  expenses/expense-edit-sheet.tsx
  expenses/expense-search-bar.tsx
  expenses/quick-filter-chips.tsx
  reports/export-pdf-button.tsx
lib/
  actions/expenses.ts
  pdf/expense-report-document.tsx
public/
  mirabee-flowers-logo.png        # ACTIVE LOGO
supabase/
  schema.sql
  migration-v2.sql
AGENTS.md                         # Project guidelines
```

---

## Recent git history (local)

```
296a924 Use mirabee-flowers-logo.png to fix stale Vercel CDN cache
656224a Fix logo caching and sizing for Vercel deploys
556e2fd update1 (logo file swap)
29f6d59 Mirabee v2 redesign
b5d42ff Initial v1
```

---

*Last updated: June 2026*