# Mirabee Flowers Expense Tracker - Project Guidelines

## Project Overview
This is a simple, beautiful expense tracking PWA for Mirabee Flowers (a local flower shop). It is built for Jenni 💐 first. The app should feel sleek, professional, and easy to use on mobile and iPad.

## Branding
- Logo: `public/mirabee-logo.png`
- Primary Blue: `#6BA8BA`
- Rose Pink Accent: `#E07A8C`
- Sage Green: `#8FAE8B`
- Dark Text: `#3A2F2F`
- Warm Background: `#FDF8F3`
- Cards: `#FFFFFF`
- Muted: `#EDE4DB`
- Personalized entry button for "Jenni 💐"

## Tech Stack
- Next.js 16 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui style components
- Supabase (database + storage for receipts)
- @react-pdf/renderer for PDF reports

## Key Rules
- Prioritize mobile-first experience
- Use date-fns for all date handling
- Use react-hook-form + zod for forms
- Make receipt upload work smoothly (camera + gallery)
- Use Sonner for toast notifications
- COGS toggle is optional on expense entry (never auto-forced)

## v2 Features
1. Branded landing with Jenni 💐 entry
2. Dashboard with monthly totals, COGS, expense count, top category, average
3. Fast expense entry with category chips and optional COGS switch
4. Expenses list with search, quick-filter chips, custom categories, date range
5. Tap-to-edit and delete expenses
6. Reports with category breakdown, PDF export (primary), CSV (secondary)

## Supabase Setup
1. Run `supabase/schema.sql` for initial setup
2. Run `supabase/migration-v2.sql` for v2 features (pinned categories, edit/delete policies)

Do not over-engineer auth yet. Use a simple entry for now.