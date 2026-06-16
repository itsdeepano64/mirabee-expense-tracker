# Mirabee Flowers Expense Tracker - Project Guidelines

## Project Overview
This is a simple, beautiful expense tracking PWA for Mirabee Flowers (a local flower shop). It is built for Jenni 💐 first. The app should feel warm, clean, and easy to use on mobile and iPad.

## Core Goals for v1
- Fast expense entry (minimal friction)
- Receipt photo / file upload
- Clear dashboard with monthly overview
- Good reporting (date range + category breakdown + COGS tracking)
- Export-friendly reports
- Soft floral aesthetic (rose/pink + sage green tones)

## Branding
- Personalized entry button for "Jenni 💐"
- Use the bouquet emoji 💐 where it feels natural
- Keep the UI warm and professional, not overly cute

## Tech Stack
- Next.js 15 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui style components
- Supabase (database + storage for receipts)
- Keep it lightweight on Supabase usage

## Key Rules
- Prioritize mobile-first experience
- Use date-fns for all date handling
- Use react-hook-form + zod for forms
- Make receipt upload work smoothly (camera + gallery)
- Categories should include COGS tracking (Flowers & Plants = COGS)
- Keep the code clean and well-organized
- Use Sonner for toast notifications

## Current Priorities (v1)
1. Simple branded landing with "Jenni 💐" entry
2. Dashboard with monthly totals and quick stats
3. Add Expense form with photo upload
4. Expenses list view
5. Basic Reports page (date range filter + breakdown + export)

Do not over-engineer auth yet. Use a simple entry for now.