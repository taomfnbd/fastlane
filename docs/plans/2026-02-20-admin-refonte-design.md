# Admin Refonte — Design Document

**Date** : 2026-02-20
**Scope** : Refonte lourde de l'experience admin — split-view, dashboard actionnable, fiabilite, navigation
**Impact DB** : Non (optimisation queries uniquement)

---

## Architecture : Split-View Master-Detail

Chaque page "liste" devient un layout split-view via les parallel routes Next.js.
La liste occupe ~1/3 a gauche, le detail ~2/3 a droite.
Cliquer sur un item charge son detail a droite sans recharger la liste.

### Structure fichiers

```
src/app/admin/
├── error.tsx                              # Error boundary global admin
├── events/
│   ├── layout.tsx                         # Split-view container
│   ├── page.tsx                           # Liste evenements (panneau gauche)
│   ├── @detail/default.tsx                # Placeholder "Selectionnez un evenement"
│   └── @detail/[eventId]/page.tsx         # Detail evenement (panneau droit)
├── events/[eventId]/strategy/
│   ├── layout.tsx                         # Split-view container
│   ├── page.tsx                           # Liste strategies
│   ├── @detail/default.tsx                # Placeholder
│   └── @detail/[strategyId]/page.tsx      # Detail strategie
├── events/[eventId]/deliverables/
│   ├── layout.tsx                         # Split-view container
│   ├── page.tsx                           # Liste livrables
│   ├── @detail/default.tsx                # Placeholder
│   └── @detail/[deliverableId]/page.tsx   # Detail livrable
└── companies/
    ├── layout.tsx                         # Split-view container
    ├── page.tsx                           # Liste entreprises
    ├── @detail/default.tsx                # Placeholder
    └── @detail/[companyId]/page.tsx       # Detail entreprise
```

### Mobile
- La liste prend toute la largeur
- Le detail s'ouvre en pleine page (navigation classique)

### URLs
- `/admin/events` — liste seule
- `/admin/events/123` — liste + detail evenement 123 (split-view)
- `/admin/events/123/strategy` — liste strategies
- `/admin/events/123/strategy/456` — liste + detail strategie 456

---

## Dashboard Actionnable

### Layout

```
┌─────────────────────────────────────────────────┐
│  4 stat cards (compacts, cliquables)             │
├────────────────────────┬────────────────────────┤
│  "A traiter" (60%)     │  "Questions" (40%)     │
│  Items tries par       │  Questions sans         │
│  urgence + actions     │  reponse + lien direct  │
│  inline (approuver,    │                        │
│  voir, rejeter)        │                        │
├────────────────────────┴────────────────────────┤
│  "Progression evenements" (barres, cliquables)   │
├─────────────────────────────────────────────────┤
│  "Activite recente" (compact, 5 dernieres)       │
└─────────────────────────────────────────────────┘
```

### Changements
- "A traiter" : boutons d'action directe (Approuver / Voir / Demander changements)
- Stats cards cliquables (naviguent vers la liste filtree)
- Questions en attente : plus visibles, lien direct vers la page detail
- Activite reduite a 5 lignes
- 1 seul Promise.all, groupBy pour les compteurs

---

## Fiabilite et Performance

### Race conditions
- `updateStrategyItemStatus` : notifications dans la transaction Prisma
- Toutes les approbations : validation d'etat stricte

### Error handling
- `error.tsx` dans `src/app/admin/` avec message + bouton retry
- `loading.tsx` avec skeleton dans chaque layout split-view

### Queries optimisees
- Dashboard : 1 seul Promise.all (questions incluses)
- Listes : groupBy pour compteurs (1 query au lieu de 3)
- Pages detail : charger comments et questions separement (pas 4 niveaux de nesting)

### Loading states
- Skeleton dans le panneau detail pendant le fetch
- Boutons d'action : spinner + disable pendant l'appel
- Optimistic updates sur commentaires, questions, changements de status

### Notifications
- Marquees "lues" quand l'utilisateur agit, pas quand il ouvre la cloche

---

## Navigation et Actions Inline

### Breadcrumbs
- Fil d'Ariane persistant : `Dashboard > Evenements > Event X > Strategies`
- Chaque segment cliquable
- Filtres preserves dans l'URL (query params)

### Actions inline
- Menu `...` au hover sur chaque item de la liste
- Actions contextuelles selon le status :
  - PENDING_REVIEW → Approuver / Demander changements
  - IN_REVIEW → Approuver / Demander changements
  - APPROVED → Marquer livre
- Popover de confirmation (pas modale plein ecran)
- Mise a jour de l'item sans rechargement

### Raccourcis clavier
- Fleches haut/bas : naviguer entre items dans la liste
- Enter : ouvrir le detail
- Escape : fermer le detail

### Sidebar
- Badges compteurs sur chaque lien : `Strategies (3)`
- Compteurs mis a jour apres chaque action

---

## Nouveaux Composants

| Composant | Type | Description |
|-----------|------|-------------|
| `SplitViewLayout` | shared | Container flex (liste 1/3 + detail 2/3), responsive |
| `DetailPanel` | shared | Wrapper panneau droit (header + scroll + skeleton) |
| `InlineActions` | admin | Menu contextuel `...` + popover confirmation |
| `Breadcrumbs` | shared | Fil d'Ariane dynamique depuis le path URL |
| `AdminErrorBoundary` | admin | error.tsx avec message + retry |
| `DashboardActionCard` | admin | Card "A traiter" avec actions inline |
| `DetailSkeleton` | shared | Skeleton loading pour panneau detail |

## Composants Modifies

| Composant | Modification |
|-----------|-------------|
| `AdminSidebar` | Badges compteurs dynamiques |
| `CommentSection` | Optimistic updates |
| `QuestionSection` | Optimistic updates |
| `StatusBadge` | Animation de transition |
| `NotificationBell` | Mark-as-read sur action |
| Tous les boutons d'action | Spinner + disable pendant appel |

---

## Resume fichiers

| Categorie | Nouveaux | Modifies |
|-----------|----------|----------|
| Layouts split-view | 4 layout.tsx + 4 default.tsx | — |
| Pages detail (parallel) | 4 page.tsx dans @detail/ | 4 page.tsx listes existantes |
| Composants | 7 nouveaux | 6 modifies |
| Server actions | — | strategy.ts, deliverables.ts (race conditions) |
| Dashboard | — | dashboard/page.tsx (refonte complete) |
| Error/Loading | error.tsx + loading.tsx | — |
