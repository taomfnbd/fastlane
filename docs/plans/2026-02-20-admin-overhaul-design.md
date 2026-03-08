# Admin Overhaul — Design Document

**Date** : 2026-02-20
**Scope** : Workflow complet + Communication admin-client + Bugfixes
**Impact DB** : Oui (nouveau modele Question + relations)

---

## Bloc 1 : Workflow complet (edit / resubmit / contenu)

### Nouvelles server actions
- `updateStrategy(formData)` — modifier titre/description
- `updateStrategyItem(formData)` — modifier titre/description d'un item
- `resubmitStrategy(strategyId)` — CHANGES_REQUESTED → REVISED → PENDING_REVIEW + increment version + notif client
- `updateDeliverable(formData)` — modifier titre/description/type/contenu texte + upload fichier
- `resubmitDeliverable(deliverableId)` — CHANGES_REQUESTED → REVISED → IN_REVIEW + increment version + notif client
- `markDeliverableDelivered(deliverableId)` — APPROVED → DELIVERED
- `updateEvent(formData)` — modifier nom/description/dates

### Nouveaux composants admin
- `EditStrategyDialog` — modale edit strategie
- `EditStrategyItemDialog` — modale edit item
- `EditDeliverableDialog` — modale avec textarea contenu + upload fichier
- `EditEventDialog` — modale edit evenement
- `ResubmitButton` — bouton quand status = CHANGES_REQUESTED

### Contenu livrable
- Champ `content` (textarea) pour le texte/script
- Champ `fileUrl` + `fileName` pour les fichiers uploades
- Le client voit le texte + peut telecharger le fichier dans le portal

---

## Bloc 2 : Communication admin <-> client

### Pages detail admin (NOUVELLES)
- `/admin/events/[eventId]/strategy/[strategyId]` — vue detail strategie avec items + commentaires par item
- `/admin/events/[eventId]/deliverables/[deliverableId]` — vue detail livrable avec contenu + commentaires

Reutilisent `CommentSection` existant.

### Systeme Q&A formel (NOUVEAU)

Modele Prisma :
```prisma
model Question {
  id              String        @id @default(cuid())
  content         String        @db.Text
  answer          String?       @db.Text
  answeredAt      DateTime?
  authorId        String
  author          User          @relation("QuestionsAsked", fields: [authorId], references: [id])
  targetCompanyId String
  targetCompany   Company       @relation(fields: [targetCompanyId], references: [id])
  strategyId      String?
  strategy        Strategy?     @relation(fields: [strategyId], references: [id], onDelete: Cascade)
  deliverableId   String?
  deliverable     Deliverable?  @relation(fields: [deliverableId], references: [id], onDelete: Cascade)
  strategyItemId  String?
  strategyItem    StrategyItem? @relation(fields: [strategyItemId], references: [id], onDelete: Cascade)
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@index([targetCompanyId])
  @@index([strategyId])
  @@index([deliverableId])
  @@index([authorId])
  @@index([answeredAt])
}
```

### Server actions Q&A
- `createQuestion(formData)` — admin pose une question
- `answerQuestion(formData)` — client repond
- `getUnansweredQuestions()` — pour le dashboard admin

### Composant QuestionSection
- Affiche les questions liees a un item
- Admin : peut poser des questions, voir les reponses
- Client : voit les questions, peut repondre
- Questions non-repondues marquees visuellement

### Widget dashboard
- "Questions en attente" — liste des questions sans reponse

---

## Bloc 3 : Bugfixes

1. Fix `strategyItemId` manquant dans les reply de commentaires (comment-section.tsx)
2. Fix `revalidatePath` manquant dans API route event status
3. Utiliser status REVISED : CHANGES_REQUESTED → admin modifie → REVISED → resubmit → PENDING_REVIEW/IN_REVIEW
4. Ameliorer notifications : inclure le nom de l'item dans le message
5. Logger l'activite STRATEGY_REJECTED quand strategie passe a CHANGES_REQUESTED

---

## Resume fichiers

| Bloc | Nouveaux | Modifies |
|------|----------|----------|
| Workflow | 5 dialog components + ResubmitButton | strategy.ts, deliverables.ts, events.ts, strategy/page.tsx, deliverables/page.tsx, event detail page |
| Communication | 2 pages detail admin + QuestionSection + question.ts actions | schema.prisma, comment-section.tsx, notify.ts, dashboard/page.tsx, portal pages |
| Bugfixes | — | comment-section.tsx, API route, notify.ts, strategy.ts |
