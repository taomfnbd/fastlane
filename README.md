# Fastlane

Growth Hacking event management platform. An agency-client SaaS where the Fastlane team manages strategies and deliverables for multiple companies during intensive sprints.

## Tech Stack

- **Framework**: Next.js 15+ (App Router, RSC)
- **Language**: TypeScript (strict)
- **Auth**: Better Auth
- **ORM**: Prisma + PostgreSQL
- **UI**: Tailwind CSS v4 + shadcn/ui
- **Payments**: Stripe
- **Email**: React Email + Resend

## Getting Started

```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your values

# Setup database
npx prisma migrate dev
npx prisma db seed

# Start dev server
npm run dev
```

## Project Structure

- `src/app/(marketing)/` — Public landing page
- `src/app/(auth)/` — Login / Register
- `src/app/admin/` — Admin dashboard (Fastlane team)
- `src/app/portal/` — Client portal (Companies)
- `src/server/` — Server actions & queries
- `prisma/` — Database schema & migrations
