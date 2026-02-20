# Admin Refonte — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refonte lourde de l'admin Fastlane — split-view master-detail, dashboard actionnable, fiabilite, navigation inline.

**Architecture:** Parallel routes Next.js pour le split-view (liste 1/3 + detail 2/3). Composant SplitViewLayout reutilisable. Dashboard refait avec actions inline. Error boundaries + loading skeletons. Queries optimisees.

**Tech Stack:** Next.js 16 App Router (parallel routes, `@detail` slot), Tailwind CSS 4, shadcn/ui (Sheet, ScrollArea, Skeleton, DropdownMenu), Prisma 7, Zod 4.

---

## Task 1: Create SplitViewLayout component

**Files:**
- Create: `src/components/shared/split-view-layout.tsx`

**Context:** This is the reusable container for all split-view pages. Left panel = list (scrollable, 1/3 width). Right panel = detail (scrollable, 2/3 width). On mobile (<lg), only the list shows unless a detail is selected.

**Step 1: Create the component**

```tsx
// src/components/shared/split-view-layout.tsx
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SplitViewLayoutProps {
  list: React.ReactNode;
  detail: React.ReactNode;
  className?: string;
}

export function SplitViewLayout({ list, detail, className }: SplitViewLayoutProps) {
  return (
    <div className={cn("flex h-[calc(100vh-7rem)] gap-0", className)}>
      {/* List panel */}
      <div className="w-full lg:w-[340px] lg:min-w-[300px] lg:max-w-[400px] lg:border-r shrink-0">
        <ScrollArea className="h-full">
          {list}
        </ScrollArea>
      </div>
      {/* Detail panel */}
      <div className="hidden lg:block flex-1 min-w-0">
        <ScrollArea className="h-full">
          {detail}
        </ScrollArea>
      </div>
    </div>
  );
}
```

**Step 2: Verify build**

Run: `npx next build 2>&1 | tail -5`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/components/shared/split-view-layout.tsx
git commit -m "feat: add SplitViewLayout component for master-detail views"
```

---

## Task 2: Create DetailPanel wrapper and DetailSkeleton

**Files:**
- Create: `src/components/shared/detail-panel.tsx`
- Create: `src/components/shared/detail-skeleton.tsx`

**Context:** DetailPanel wraps the right panel content with a consistent header (title + status + actions). DetailSkeleton shows while the detail is loading.

**Step 1: Create DetailPanel**

```tsx
// src/components/shared/detail-panel.tsx
interface DetailPanelProps {
  children: React.ReactNode;
}

export function DetailPanel({ children }: DetailPanelProps) {
  return (
    <div className="p-4 lg:p-6 space-y-6">
      {children}
    </div>
  );
}
```

**Step 2: Create DetailSkeleton**

```tsx
// src/components/shared/detail-skeleton.tsx
import { Skeleton } from "@/components/ui/skeleton";

export function DetailSkeleton() {
  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-20 w-full rounded-md" />
        <Skeleton className="h-20 w-full rounded-md" />
        <Skeleton className="h-20 w-full rounded-md" />
      </div>
    </div>
  );
}
```

**Step 3: Verify build**

Run: `npx next build 2>&1 | tail -5`

**Step 4: Commit**

```bash
git add src/components/shared/detail-panel.tsx src/components/shared/detail-skeleton.tsx
git commit -m "feat: add DetailPanel and DetailSkeleton components"
```

---

## Task 3: Create Breadcrumbs component

**Files:**
- Create: `src/components/shared/breadcrumbs.tsx`

**Context:** Dynamic breadcrumb based on segments passed as props. Each crumb is a link. Last crumb is plain text.

**Step 1: Create component**

```tsx
// src/components/shared/breadcrumbs.tsx
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="h-3 w-3 shrink-0" />}
          {item.href && i < items.length - 1 ? (
            <Link href={item.href} className="hover:text-foreground transition-colors truncate max-w-[150px]">
              {item.label}
            </Link>
          ) : (
            <span className={i === items.length - 1 ? "text-foreground font-medium truncate max-w-[200px]" : "truncate max-w-[150px]"}>
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
```

**Step 2: Verify build, commit**

```bash
git add src/components/shared/breadcrumbs.tsx
git commit -m "feat: add Breadcrumbs component"
```

---

## Task 4: Create InlineActions dropdown component

**Files:**
- Create: `src/components/admin/inline-actions.tsx`

**Context:** A `...` dropdown menu that shows contextual actions based on entity type and status. Uses shadcn `DropdownMenu`. Actions call server actions directly with confirmation via `AlertDialog`.

**Step 1: Create component**

```tsx
// src/components/admin/inline-actions.tsx
"use client";

import { useState, useTransition } from "react";
import { MoreHorizontal, Check, RotateCcw, Truck, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface Action {
  label: string;
  icon: React.ReactNode;
  action: () => Promise<{ success: boolean; error?: string }>;
  confirm?: string;
  variant?: "default" | "destructive";
}

interface InlineActionsProps {
  actions: Action[];
}

export function InlineActions({ actions }: InlineActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [confirmAction, setConfirmAction] = useState<Action | null>(null);

  function execute(action: Action) {
    if (action.confirm) {
      setConfirmAction(action);
      return;
    }
    runAction(action);
  }

  function runAction(action: Action) {
    startTransition(async () => {
      const result = await action.action();
      if (!result.success) {
        toast.error(result.error ?? "Erreur");
      }
    });
  }

  if (actions.length === 0) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" disabled={isPending}>
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MoreHorizontal className="h-3.5 w-3.5" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {actions.map((action, i) => (
            <DropdownMenuItem
              key={i}
              onClick={() => execute(action)}
              className={action.variant === "destructive" ? "text-destructive focus:text-destructive" : ""}
            >
              {action.icon}
              <span className="ml-2">{action.label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer</AlertDialogTitle>
            <AlertDialogDescription>{confirmAction?.confirm}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (confirmAction) runAction(confirmAction); setConfirmAction(null); }}>
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
```

**Step 2: Verify build, commit**

```bash
git add src/components/admin/inline-actions.tsx
git commit -m "feat: add InlineActions dropdown with confirmation dialog"
```

---

## Task 5: Create admin error boundary

**Files:**
- Create: `src/app/admin/error.tsx`

**Context:** Global error boundary for all admin pages. Shows a friendly message + retry button.

**Step 1: Create error.tsx**

```tsx
// src/app/admin/error.tsx
"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <AlertTriangle className="h-10 w-10 text-amber-500" />
      <h2 className="mt-4 text-lg font-semibold">Une erreur est survenue</h2>
      <p className="mt-2 text-sm text-muted-foreground max-w-md">
        {error.message || "Quelque chose s'est mal passe. Veuillez reessayer."}
      </p>
      {error.digest && (
        <p className="mt-1 text-xs text-muted-foreground/60 font-mono">Digest: {error.digest}</p>
      )}
      <Button onClick={reset} className="mt-6" variant="outline">
        Reessayer
      </Button>
    </div>
  );
}
```

**Step 2: Verify build, commit**

```bash
git add src/app/admin/error.tsx
git commit -m "feat: add admin error boundary with retry"
```

---

## Task 6: Convert strategies to split-view with parallel routes

**Files:**
- Modify: `src/app/admin/events/[eventId]/strategy/page.tsx` (rewrite as list panel)
- Create: `src/app/admin/events/[eventId]/strategy/layout.tsx` (split-view wrapper)
- Move: `src/app/admin/events/[eventId]/strategy/[strategyId]/page.tsx` → `src/app/admin/events/[eventId]/strategy/@detail/[strategyId]/page.tsx`
- Create: `src/app/admin/events/[eventId]/strategy/@detail/default.tsx` (empty state)
- Create: `src/app/admin/events/[eventId]/strategy/@detail/[strategyId]/loading.tsx`

**Context:** The strategy list page becomes the left panel. Clicking a strategy loads its detail in the right panel via parallel routes. The existing strategy detail page moves into the `@detail` slot.

**Step 1: Create the layout**

```tsx
// src/app/admin/events/[eventId]/strategy/layout.tsx
import { SplitViewLayout } from "@/components/shared/split-view-layout";

export default function StrategyLayout({
  children,
  detail,
}: {
  children: React.ReactNode;
  detail: React.ReactNode;
}) {
  return <SplitViewLayout list={children} detail={detail} />;
}
```

**Step 2: Rewrite strategy list page as compact list panel**

Rewrite `src/app/admin/events/[eventId]/strategy/page.tsx`:
- Remove the full layout (PageHeader, back button) — use Breadcrumbs instead
- Make each strategy a compact clickable item with status dot
- Use Link that navigates to `./strategy/${strategy.id}` (loads in @detail)
- Show items count and status inline
- Keep CreateStrategyDialog + company headers

The new list page should render each strategy as:
```
[●] Strategy Title                    [status]
    3/5 items · company name
```

Key changes:
- Remove `<PageHeader>` and ArrowLeft back button — replaced by breadcrumbs in detail panel
- Each strategy is a `<Link>` to `/admin/events/${eventId}/strategy/${strategy.id}` (parallel route loads in @detail)
- Remove all `EditStrategyDialog`, `SubmitStrategyButton`, `ResubmitButton`, `EditStrategyItemDialog` from list — these live in detail panel only
- Remove individual strategy items display from list — too detailed for a list panel
- Keep `CreateStrategyDialog` button and company grouping

**Step 3: Create default.tsx (empty state)**

```tsx
// src/app/admin/events/[eventId]/strategy/@detail/default.tsx
import { Target } from "lucide-react";

export default function StrategyDetailDefault() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      <Target className="h-8 w-8 text-muted-foreground/30" />
      <p className="mt-3 text-sm text-muted-foreground">Selectionnez une strategie</p>
    </div>
  );
}
```

**Step 4: Move strategy detail page to @detail slot**

Move `src/app/admin/events/[eventId]/strategy/[strategyId]/page.tsx` to `src/app/admin/events/[eventId]/strategy/@detail/[strategyId]/page.tsx`.

Modify the moved page:
- Remove the `<Button>` back link to `/admin/events/${eventId}/strategy` — not needed in split-view
- Add `<Breadcrumbs>` at the top with: Dashboard > Events > Event Name > Strategies > Strategy Title
- Wrap content in `<DetailPanel>`

**Step 5: Create loading skeleton**

```tsx
// src/app/admin/events/[eventId]/strategy/@detail/[strategyId]/loading.tsx
import { DetailSkeleton } from "@/components/shared/detail-skeleton";

export default function StrategyDetailLoading() {
  return <DetailSkeleton />;
}
```

**Step 6: Verify build, commit**

```bash
git add -A src/app/admin/events/\[eventId\]/strategy/
git commit -m "feat: convert strategies to split-view with parallel routes"
```

---

## Task 7: Convert deliverables to split-view with parallel routes

**Files:**
- Modify: `src/app/admin/events/[eventId]/deliverables/page.tsx` (rewrite as list panel)
- Create: `src/app/admin/events/[eventId]/deliverables/layout.tsx`
- Move: `src/app/admin/events/[eventId]/deliverables/[deliverableId]/page.tsx` → `src/app/admin/events/[eventId]/deliverables/@detail/[deliverableId]/page.tsx`
- Create: `src/app/admin/events/[eventId]/deliverables/@detail/default.tsx`
- Create: `src/app/admin/events/[eventId]/deliverables/@detail/[deliverableId]/loading.tsx`

**Context:** Same pattern as Task 6 but for deliverables. The table becomes a compact list. Detail loads in @detail slot.

Follow the exact same pattern as Task 6:
- layout.tsx uses SplitViewLayout
- page.tsx becomes compact list with Link to each deliverable
- default.tsx shows "Selectionnez un livrable" with Package icon
- Detail page moves to @detail, gets Breadcrumbs and DetailPanel wrapper
- loading.tsx uses DetailSkeleton

Key differences from strategy:
- List items show: title, type badge, status, version
- No nested items (deliverables don't have sub-items like strategy items)

**Commit**

```bash
git add -A src/app/admin/events/\[eventId\]/deliverables/
git commit -m "feat: convert deliverables to split-view with parallel routes"
```

---

## Task 8: Convert events list to split-view

**Files:**
- Modify: `src/app/admin/events/page.tsx` (rewrite as list panel)
- Create: `src/app/admin/events/layout.tsx`
- Move: `src/app/admin/events/[eventId]/page.tsx` → `src/app/admin/events/@detail/[eventId]/page.tsx`
- Create: `src/app/admin/events/@detail/default.tsx`
- Create: `src/app/admin/events/@detail/[eventId]/loading.tsx`

**Context:** Events list becomes left panel. Clicking an event shows its detail (metrics, companies, links to strategies/deliverables) in the right panel.

**IMPORTANT:** The events/@detail/[eventId] route needs to coexist with events/[eventId]/strategy and events/[eventId]/deliverables which have their OWN split-view layouts. The parallel route only applies at the events list level. Navigating to /events/123/strategy leaves the events split-view and enters the strategy split-view.

The events list page should show each event as a compact card:
```
Event Name                    [status]
15 jan — 30 mar · 5 entreprises
[=======----] 70%
```

**Commit**

```bash
git add -A src/app/admin/events/
git commit -m "feat: convert events to split-view with parallel routes"
```

---

## Task 9: Convert companies to split-view

**Files:**
- Modify: `src/app/admin/companies/page.tsx` (rewrite as list panel)
- Create: `src/app/admin/companies/layout.tsx`
- Move: `src/app/admin/companies/[companyId]/page.tsx` → `src/app/admin/companies/@detail/[companyId]/page.tsx`
- Create: `src/app/admin/companies/@detail/default.tsx`
- Create: `src/app/admin/companies/@detail/[companyId]/loading.tsx`

**Context:** Companies list becomes left panel. Detail shows team + events.

**Commit**

```bash
git add -A src/app/admin/companies/
git commit -m "feat: convert companies to split-view with parallel routes"
```

---

## Task 10: Add InlineActions to all list panels

**Files:**
- Modify: `src/app/admin/events/[eventId]/strategy/page.tsx` (add InlineActions per strategy)
- Modify: `src/app/admin/events/[eventId]/deliverables/page.tsx` (add InlineActions per deliverable)

**Context:** Each item in the list panels gets a `...` menu via InlineActions component.

Strategy actions by status:
- `DRAFT` → "Soumettre" (calls `submitStrategyForReview`)
- `CHANGES_REQUESTED` → "Resoumettre" (calls `resubmitStrategy`)
- `PENDING_REVIEW` → no inline actions (client must act)

Deliverable actions by status:
- `DRAFT` → "Soumettre" (calls `submitDeliverableForReview`)
- `CHANGES_REQUESTED` → "Resoumettre" (calls `resubmitDeliverable`)
- `IN_REVIEW` → no inline actions (client must act)
- `APPROVED` → "Marquer livre" (calls `markDeliverableDelivered`)

All actions require confirmation via AlertDialog.

**Commit**

```bash
git add src/app/admin/events/\[eventId\]/strategy/page.tsx src/app/admin/events/\[eventId\]/deliverables/page.tsx
git commit -m "feat: add inline actions to strategy and deliverable list panels"
```

---

## Task 11: Refonte dashboard — layout and stat cards

**Files:**
- Modify: `src/app/admin/dashboard/page.tsx` (complete rewrite)

**Context:** Dashboard rewrite part 1: optimize queries and build new layout.

Key changes to queries:
- Move `unansweredQuestions` into the main `Promise.all` (currently sequential)
- Replace 3 separate `prisma.deliverable.count()` and `prisma.strategy.count()` calls: fetch `actionItems` data and derive counts from it, OR use a single aggregation query
- Limit `recentActivities` to 5 (currently 10)
- Make stat cards clickable (wrap in Link)

Layout structure:
```
[Stats row - 4 cards]
[A traiter (2/3) | Questions (1/3)]
[Progression events]
[Activite recente - 5 lines]
```

The "A traiter" section shows pending strategies and deliverables with:
- Title, company, event name
- Status badge
- InlineActions dropdown (approve/reject/view)
- Link to detail view

**Commit**

```bash
git add src/app/admin/dashboard/page.tsx
git commit -m "feat: refonte dashboard with actionable items and optimized queries"
```

---

## Task 12: Fix race condition in strategy item status

**Files:**
- Modify: `src/server/actions/strategy.ts` (updateStrategyItemStatus, lines 111-213)

**Context:** Currently notifications are sent OUTSIDE the transaction (lines 190-207). If two concurrent updates happen, the notification may report wrong final status.

Fix: Move the notification logic inside the `prisma.$transaction()` callback. The notification itself doesn't need to be transactional (it's a separate table), but the STATUS CHECK that determines WHAT to notify about must be inside the transaction.

Solution: Capture the final strategy status inside the transaction and return it, then send notifications based on the returned value.

```typescript
// In updateStrategyItemStatus:
const result = await prisma.$transaction(async (tx) => {
  // ... existing item update and status checks ...
  // Return what happened so we can notify outside
  return { allApproved, hasRejected, strategyTitle: item.strategy.title };
});

// Notify based on transaction result
if (!isAdmin(user.role)) {
  if (parsed.data.status === "APPROVED") {
    await notifyAdmins(/* ... */);
  } else if (parsed.data.status === "REJECTED") {
    await notifyAdmins(/* ... */);
  }
}
```

Also add state validation: reject the action if item status is already the target status.

**Commit**

```bash
git add src/server/actions/strategy.ts
git commit -m "fix: move status check inside transaction to prevent race condition"
```

---

## Task 13: Fix state validation in all approval/submit actions

**Files:**
- Modify: `src/server/actions/strategy.ts` (submitStrategyForReview)
- Modify: `src/server/actions/deliverables.ts` (submitDeliverableForReview, approveDeliverable, requestDeliverableChanges)

**Context:** Several actions don't validate the current status before transitioning:
- `submitStrategyForReview` doesn't check status is DRAFT
- `approveDeliverable` doesn't reject DELIVERED status
- `requestDeliverableChanges` doesn't validate current status

Add status validation at the beginning of each action:

```typescript
// submitStrategyForReview: add after finding strategy
const strategy = await prisma.strategy.findUnique({ where: { id: strategyId }, select: { status: true, ... } });
if (!strategy) return { success: false, error: "Not found" };
if (strategy.status !== "DRAFT") return { success: false, error: "Strategy must be in DRAFT status to submit" };
// Then update...

// approveDeliverable: change existing check
if (deliverable.status !== "IN_REVIEW" && deliverable.status !== "CHANGES_REQUESTED") {
  return { success: false, error: "Deliverable must be in review to approve" };
}

// requestDeliverableChanges: add status check
if (deliverable.status !== "IN_REVIEW" && deliverable.status !== "PENDING_REVIEW") {
  return { success: false, error: "Deliverable is not in a reviewable state" };
}
```

**Commit**

```bash
git add src/server/actions/strategy.ts src/server/actions/deliverables.ts
git commit -m "fix: add state validation to all approval and submit actions"
```

---

## Task 14: Update AdminSidebar with dynamic badges

**Files:**
- Modify: `src/app/admin/layout.tsx` (add unanswered questions count)
- Modify: `src/components/admin/admin-sidebar.tsx` (add events badge, questions badge)
- Modify: `src/components/admin/admin-shell.tsx` (pass new counts)

**Context:** Sidebar should show pending counts on more items:
- Events: count of active events (already available but not shown)
- Questions: count of unanswered questions (new)

Add to layout.tsx query:
```typescript
prisma.question.count({ where: { answeredAt: null } }),
```

Pass through AdminShell → AdminSidebar.

Add to sidebar nav items: `{ label: "Evenements", href: "/admin/events", icon: Calendar, countKey: "activeEvents" }`.

**Commit**

```bash
git add src/app/admin/layout.tsx src/components/admin/admin-sidebar.tsx src/components/admin/admin-shell.tsx
git commit -m "feat: add dynamic badge counts to sidebar for events and questions"
```

---

## Task 15: Verify full build and deploy

**Files:** None (verification only)

**Step 1: TypeScript check**

Run: `npx tsc --noEmit 2>&1 | tail -5`
Expected: 0 errors

**Step 2: Full build**

Run: `npx next build 2>&1 | tail -30`
Expected: Build succeeds, all routes listed

**Step 3: Check all parallel routes appear**

Expected routes:
```
├ ƒ /admin/events
├ ƒ /admin/events/[eventId]                    (in @detail)
├ ƒ /admin/events/[eventId]/strategy
├ ƒ /admin/events/[eventId]/strategy/[strategyId]  (in @detail)
├ ƒ /admin/events/[eventId]/deliverables
├ ƒ /admin/events/[eventId]/deliverables/[deliverableId]  (in @detail)
├ ƒ /admin/companies
├ ƒ /admin/companies/[companyId]               (in @detail)
```

**Step 4: Push and deploy**

```bash
git push
npx vercel --prod
```
