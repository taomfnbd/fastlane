# Fastlane

Growth Hacking event management platform. An agency-client SaaS where the Fastlane team manages strategies and deliverables for multiple companies during intensive sprints.

## Tech Stack

- **Framework**: Next.js 16 (App Router, RSC, Turbopack)
- **Language**: TypeScript (strict)
- **Auth**: Better Auth (credential-based)
- **ORM**: Prisma + PostgreSQL
- **UI**: Tailwind CSS v4 + shadcn/ui
- **Payments**: Stripe (planned)
- **Email**: React Email + Resend (planned)

## Features

### Admin Dashboard
- Manage events, companies, and users
- Create and submit strategies & deliverables for client review
- Real-time notification bell with unread badge and mark-as-read
- Activity timeline

### Client Portal
- Review strategies item by item (approve / request changes)
- Mandatory comment on rejection with dialog prompt
- Review deliverables (approve / request changes)
- Comment threads on strategies and deliverables
- Notification bell with optimistic mark-as-read

### Bidirectional Notifications
- Admin submits for review -> client gets notified
- Client approves/rejects -> admin gets notified
- Comment posted -> the other party gets notified
- Click notification -> marks as read + navigates to target
- "Mark all as read" button on both sides

## Getting Started

```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL and BETTER_AUTH_SECRET

# Setup database
npx prisma migrate dev
npx prisma db seed

# Start dev server
npm run dev
```

## Test Accounts

All seeded accounts use password `password123`:

| Role | Email |
|------|-------|
| Super Admin | admin@fastlane.io |
| Admin | team1@fastlane.io |
| Admin | team2@fastlane.io |
| Client Admin (TechVision) | sophie@techvision.io |
| Client Member (TechVision) | thomas@techvision.io |
| Client Admin (GreenLeaf) | emma@greenleaf.shop |
| Client Member (GreenLeaf) | hugo@greenleaf.shop |
| Client Admin (FinFlow) | lea@finflow.com |
| Client Member (FinFlow) | nathan@finflow.com |

## Project Structure

```
src/
  app/
    admin/          # Admin dashboard (Fastlane team)
    portal/         # Client portal (Companies)
    api/            # API routes (auth, webhooks)
    login/          # Auth pages
  components/
    admin/          # Admin-specific components
    portal/         # Portal-specific components
    shared/         # Shared components (AppHeader, StatusBadge, etc.)
    ui/             # shadcn/ui primitives
  server/
    actions/        # Server actions (deliverables, strategy, feedback, notifications)
  lib/              # Utilities (auth, prisma, notify helpers)
  types/            # Zod schemas & TypeScript types
prisma/
  schema.prisma     # Database schema
  seed.ts           # Seed data
```

## Key Architecture Decisions

- **Server Actions** for all mutations (no API routes for CRUD)
- **Optimistic UI** via `useOptimistic` for notification read state
- **Notification helpers** (`src/lib/notify.ts`) abstract away user lookups — call `notifyAdmins()` or `notifyClientUsers()` with just an `eventCompanyId`
- **ActionResult pattern** — all server actions return `{ success: true, data } | { success: false, error }` for consistent error handling
