# Fastlane — CLAUDE.md

## Projet

Plateforme SaaS de gestion d'événements growth hacking. Portail admin + portail client avec workflow bidirectionnel (admin crée → client review → notifications).

## Stack

- **Framework** : Next.js 16 (App Router, Turbopack, React Compiler)
- **Langage** : TypeScript 5 (strict)
- **UI** : Tailwind CSS 4 + shadcn/ui + Lucide React
- **Auth** : Better Auth (email/password, sessions 7j)
- **ORM** : Prisma 7 + PostgreSQL (Neon en prod)
- **Validation** : Zod 4
- **State client** : Zustand (léger), useOptimistic (notifications)
- **Déploiement** : Vercel (https://fastlane-theta.vercel.app)
- **Langue UI** : Français

## Structure

```
src/
├── app/                    # Routes Next.js App Router
│   ├── admin/              # Dashboard admin (SUPER_ADMIN, ADMIN)
│   │   ├── dashboard/      # Tableau de bord actionnable
│   │   ├── events/         # Liste événements (cards + breadcrumbs)
│   │   │   └── [eventId]/
│   │   │       ├── strategy/       # Split-view (parallel routes @detail)
│   │   │       └── deliverables/   # Split-view (parallel routes @detail)
│   │   ├── companies/      # Split-view (parallel routes @detail)
│   │   ├── strategies/     # Liste globale stratégies
│   │   ├── deliverables/   # Liste globale livrables
│   │   └── users/          # Gestion utilisateurs
│   ├── portal/             # Portail client (CLIENT_ADMIN, CLIENT_MEMBER)
│   ├── api/auth/[...all]/  # Better Auth handler
│   └── api/admin/          # Routes API admin
├── components/
│   ├── admin/              # Composants admin (AdminShell, AdminSidebar, InlineActions...)
│   ├── portal/             # Composants portail (PortalShell, PortalTopnav...)
│   ├── shared/             # Composants partagés (SplitViewLayout, DetailPanel, Breadcrumbs, StatusBadge, CommentSection, QuestionSection...)
│   └── ui/                 # Primitives shadcn/ui (~30 composants)
├── server/actions/         # Server Actions (toutes les mutations)
├── lib/
│   ├── auth.ts             # Config Better Auth
│   ├── auth-server.ts      # requireAdmin(), requireClient(), getSession()
│   ├── auth-client.ts      # signIn, signUp, signOut, useSession
│   ├── prisma.ts           # Singleton Prisma (pool max 5, Neon serverless)
│   ├── notify.ts           # notifyAdmins(), notifyClientUsers()
│   └── utils.ts            # cn(), relativeTime()
├── types/index.ts          # Tous les schemas Zod
└── middleware.ts           # Protection routes /admin/* et /portal/*
```

### Architecture admin : Split-View (Parallel Routes)

Les pages stratégies, livrables et entreprises utilisent des **parallel routes Next.js** (`@detail/`) pour un layout master-detail :
- Liste à gauche (~340px), détail à droite (flex-1)
- `SplitViewLayout` dans `components/shared/split-view-layout.tsx`
- `loading.tsx` avec skeleton dans chaque `@detail/[id]/`
- Les événements n'utilisent PAS le split-view (incompatible avec les sous-routes imbriquées)

## Patterns obligatoires

### Server Actions (pas de REST API pour le CRUD)
- Toutes les mutations dans `src/server/actions/`
- Retour obligatoire : `ActionResult<T>` → `{ success: true, data } | { success: false, error }`
- Toujours appeler `revalidatePath()` après mutation
- Utiliser `prisma.$transaction()` pour les opérations concurrentes

### Auth & Rôles
- Server Components : `requireAdmin()`, `requireClient()`, `requireSession()`
- Middleware : vérifie le cookie session pour `/admin/*` et `/portal/*`
- 4 rôles : `SUPER_ADMIN`, `ADMIN`, `CLIENT_ADMIN`, `CLIENT_MEMBER`
- Toujours vérifier le rôle ET le companyId pour les accès client

### Composants
- Server Components par défaut (data fetching)
- `"use client"` uniquement quand nécessaire (interactivité)
- Layout shells : `AdminShell`, `PortalShell` wrappent les pages
- shadcn/ui pour tous les primitives UI

### Validation
- Zod pour TOUTES les entrées (formulaires, API)
- Schemas dans `src/types/index.ts`
- Nommage : `create{Entity}Schema`, `update{Entity}Schema`

### Notifications
- Bidirectionnelles : admin → client et client → admin
- Helpers : `notifyAdmins()`, `notifyClientUsers()` dans `src/lib/notify.ts`
- UI optimiste via `useOptimistic()`

## Conventions de nommage

| Élément | Convention | Exemple |
|---------|-----------|---------|
| Fichiers composants | kebab-case | `strategy-item-card.tsx` |
| Exports composants | PascalCase | `StrategyItemCard` |
| Server actions | camelCase verb-first | `createStrategy()`, `approveDeliverable()` |
| Fichiers actions | pluriel | `strategies.ts`, `deliverables.ts` |
| Schemas Zod | camelCase | `createStrategySchema` |
| Enums Prisma | UPPER_SNAKE | `PENDING_REVIEW`, `CHANGES_REQUESTED` |

## Base de données

17 modèles Prisma. Les principaux :

- **User** (role, companyId) → **Company** → **EventCompany** → **Event**
- **Strategy** → **StrategyItem** (items de stratégie avec statut individuel)
- **Deliverable** (livrables : email, landing page, script...)
- **Comment** (self-relation parentId pour les réponses)
- **Question** (Q&A bidirectionnel, lié à strategy/deliverable/strategyItem, avec answeredAt)
- **Activity** (log de toutes les actions, timeline)
- **Notification** (bidirectionnelle, read/unread)

## Commandes

```bash
npm run dev          # Dev server (Turbopack)
npm run build        # prisma generate && next build
npx prisma db push   # Sync schema → DB locale
npx tsx prisma/seed.ts  # Seed la base
```

**Déploiement** : push sur `main` → Vercel auto-deploy. Le build script inclut `prisma generate`.

**Après un changement de schema** : toujours synchroniser la DB prod avec `npx prisma db push` (avec l'URL Neon) avant ou après le déploiement.

## Premier démarrage

La base de données de production est vide. Pour commencer :
1. Créer un premier compte Super Admin via le seed : `npx tsx prisma/seed.ts`
2. Ou créer un compte directement via `/register` puis mettre à jour le rôle en base

## Environnement

Variables requises (voir `.env.example`) :
- `DATABASE_URL` — PostgreSQL (Neon en prod)
- `BETTER_AUTH_SECRET` — Min 32 chars
- `BETTER_AUTH_URL` — URL de l'app
- `NEXT_PUBLIC_APP_URL` — URL publique

## Performance

- **Prisma pool** : `max: 5`, `idleTimeoutMillis: 10000` (Neon free tier = ~10 connexions max)
- **Dashboard** : utiliser `groupBy` pour les compteurs (1 query au lieu de 3 par entité)
- **SplitViewLayout** : hauteur = `calc(100vh - 4rem)` (header h-12 + py-4)
- **Pas de ScrollArea** sur les Server Components — utiliser `overflow-y-auto`
- **loading.tsx** obligatoire sur chaque page admin pour feedback instantané

## Bugs connus à ne PAS réintroduire

- **Race condition strategy** : `updateStrategyItemStatus()` DOIT être dans `prisma.$transaction()`
- **Self-deletion users** : `deleteUser()` DOIT vérifier `session.user.id !== userId`
- **Double-approbation** : `approveDeliverable()` DOIT vérifier si déjà approuvé
- **Validation d'état** : `submitStrategyForReview` → DRAFT uniquement, `requestDeliverableChanges` → IN_REVIEW uniquement
- **IDOR API** : Toujours vérifier l'existence de la ressource avant modification
- **Revalidation** : Ne pas oublier `revalidatePath()` après les suppressions
- **Connection pooling** : Ne JAMAIS retirer les options `max`/`idleTimeoutMillis` de `prisma.ts`
