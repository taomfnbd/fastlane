# Admin Panel Overhaul — Design

## 1. CRUD complet

### Events
- EditEventDialog sur la page detail (nom, description, dates)
- Delete event avec confirmation (bloque si strategies/deliverables actifs)
- Remove company depuis event detail

### Companies
- EditCompanyDialog (nom, industrie, website, description, plan)
- Delete company avec confirmation (bloque si users/events lies)

### Strategies
- AddStrategyItemDialog rendu sur la page detail (composant existe deja)
- Delete strategy item avec confirmation
- Delete strategy (seulement si DRAFT)

### Deliverables
- Delete deliverable (seulement si DRAFT)

### Users (inline dans le tableau)
- Dropdown InlineActions par row : change role, change company, delete
- Colonnes ajoutees : derniere connexion, cree le

## 2. UX & Navigation

### Search global Cmd+K
- Command palette avec cmdk (deja installe)
- 6 categories : Events, Companies, Strategies, Deliverables, Users, Quick Actions
- Full-text via Prisma contains (insensitive) : noms, titres, emails, contenu, commentaires
- Cmd+K ouvre, Escape ferme, Enter navigue

### Sidebar
- Persist collapsed state dans localStorage
- Badge Events : nombre d'events avec items pending (pas le total actif)
- Fix transition-all sur main content

### Notifications
- Polling 30s via setInterval + router.refresh()
- Icones par type de notification
- Lien "Voir toutes" en bas du popover

### Header
- Dark mode toggle (next-themes)
- Avatar cliquable avec dropdown (Profil, Parametres, Deconnexion)
- Breadcrumbs : resolution UUIDs en noms d'entites

### Pages globales
- Pagination (10 par page) sur Events, Companies, Users
- Search input sur chaque page de liste
- Filtres status enrichis (tabs DRAFT, APPROVED, DELIVERED)

## 3. Dashboard

### Stats cards
- Fix lien deliverables ?status=pending vers ?status=review
- Card "Questions en attente" ajoutee

### Section "A traiter"
- Lien "Voir tout" + limite 10 items
- Items cliquables directement vers le detail

### Activity feed
- 15 activites (au lieu de 5)
- Icones par type, liens cliquables vers les ressources
- Lien "Voir tout" vers /admin/activity

### Page Activity (/admin/activity)
- Timeline paginee (20 par page)
- Filtres : type, user, event
- Chaque entree : icone, avatar, message, lien, date
