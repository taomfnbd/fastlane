# Admin UX Restructure — Design Document

**Date** : 2026-02-19
**Approche** : Refonte progressive (page par page)
**Style** : Visuellement riche (progress bars colorees, indicateurs vert/orange/rouge, cartes metriques)
**Impact DB** : Aucun (frontend only, donnees existantes)

---

## 1. Sidebar corrigee + navigation

**Probleme** : "Livrables" pointe vers `/admin/events` (casse). Pas d'acces direct aux strategies.

**Navigation principale** :
- Tableau de bord → `/admin/dashboard`
- Evenements → `/admin/events`
- Strategies (NOUVEAU) → `/admin/strategies`
- Livrables (CORRIGE) → `/admin/deliverables`
- Entreprises → `/admin/companies`

**Navigation workspace** (inchange) :
- Utilisateurs → `/admin/users`
- Parametres → `/admin/settings`

**Badges compteurs** : nombre d'items en attente de review a cote de "Strategies" et "Livrables".

**Fichiers** : `src/components/admin/admin-sidebar.tsx`

---

## 2. Dashboard enrichi

### 2a. Stats enrichies (4 cartes)
- Events actifs : nombre + mini progress bar (% events termines/total)
- Entreprises : nombre total
- Livrables en attente : nombre + barre (approuves/total) + couleur vert/orange/rouge
- Strategies en attente : idem

### 2b. Progression par evenement
- Chaque event actif avec barre de progression coloree
- % = (strategies approuvees + livrables approuves) / total
- Code couleur : vert (>70%), orange (40-70%), rouge (<40%)
- Lien cliquable vers l'event

### 2c. Items en attente d'action
- Liste des livrables/strategies necessitant une action
- Statuts affiches : IN_REVIEW, CHANGES_REQUESTED, PENDING_REVIEW
- Cliquable → navigation directe vers l'item
- Indicateur temps ecoule ("il y a 2j")

### 2d. Activite recente (existant, conserve)

**Fichiers** : `src/app/admin/dashboard/page.tsx`

---

## 3. Page `/admin/strategies` (nouvelle)

### Vue par defaut
Items necessitant une action (PENDING_REVIEW, CHANGES_REQUESTED).

### Filtres
- Tabs par statut : [En attente] [Modif. demandees] [Tout]
- Dropdown event
- Dropdown entreprise

### Carte strategie
- Titre + entreprise + event
- Progress bar items (X/Y approuves)
- Statut colore (badge)
- Temps ecoule depuis soumission
- Lien vers la page strategie dans l'event

**Fichiers** : `src/app/admin/strategies/page.tsx` (nouveau)

---

## 4. Page `/admin/deliverables` (nouvelle)

### Vue par defaut
Items necessitant une action (IN_REVIEW, CHANGES_REQUESTED).

### Filtres
- Tabs par statut : [En review] [Modif. demandees] [Tout]
- Dropdown event
- Dropdown entreprise

### Carte livrable
- Icone par type (email, landing page, script, etc.)
- Titre + entreprise + event
- Version + temps ecoule
- Statut colore (badge)
- Lien vers la page livrable dans l'event

**Fichiers** : `src/app/admin/deliverables/page.tsx` (nouveau)

---

## 5. Event detail ameliore

### Metriques en haut (3 cartes)
- Progression globale (%) avec barre coloree
- Strategies : X/Y approuvees avec barre
- Livrables : X/Y approuves avec barre

### Entreprises enrichies
- Barre de progression par entreprise
- Code couleur vert/orange/rouge
- Compteurs strategies + livrables
- Boutons acces rapide (Strategie, Livrables)

**Fichiers** : `src/app/admin/events/[eventId]/page.tsx`

---

## Resume des fichiers

| # | Changement | Fichiers |
|---|-----------|----------|
| 1 | Sidebar corrigee + badges | `src/components/admin/admin-sidebar.tsx` |
| 2 | Dashboard enrichi | `src/app/admin/dashboard/page.tsx` |
| 3 | Page strategies globale | `src/app/admin/strategies/page.tsx` (nouveau) |
| 4 | Page livrables globale | `src/app/admin/deliverables/page.tsx` (nouveau) |
| 5 | Event detail ameliore | `src/app/admin/events/[eventId]/page.tsx` |

## Composants partages potentiels
- `ProgressBar` : barre de progression coloree reutilisable
- Filtres (tabs statut, dropdown event/entreprise)
