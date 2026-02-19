# Admin UX Restructure — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restructure the admin interface with better navigation, enriched dashboard, global strategy/deliverable views with filters, and improved event detail page with visual progress indicators.

**Architecture:** Progressive enhancement of existing Next.js App Router pages. All changes are frontend-only (no schema changes). New shared `ProgressBar` component for reuse. New pages use Server Components with client-side filter wrappers. Sidebar becomes server-aware via props for pending counts.

**Tech Stack:** Next.js 16 (App Router, RSC), TypeScript, Tailwind CSS 4, shadcn/ui (Tabs, Select, Card), Prisma queries, Lucide icons.

---

### Task 1: Create shared ProgressBar component

**Files:**
- Create: `src/components/shared/progress-bar.tsx`

**Step 1: Create the ProgressBar component**

```tsx
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number; // 0-100
  className?: string;
  size?: "sm" | "md";
}

function getProgressColor(value: number): string {
  if (value >= 70) return "bg-emerald-500";
  if (value >= 40) return "bg-amber-500";
  return "bg-red-500";
}

export function ProgressBar({ value, className, size = "sm" }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      className={cn(
        "w-full rounded-full bg-muted overflow-hidden",
        size === "sm" ? "h-1.5" : "h-2.5",
        className
      )}
    >
      <div
        className={cn("h-full rounded-full transition-all duration-500", getProgressColor(clamped))}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
```

**Step 2: Verify build**

Run: `cd /Users/taomariani-ferigoule/Desktop/fastlane && npx next build 2>&1 | tail -5`
Expected: Build succeeds (component not imported yet, just verify no syntax errors with a quick type check)

Alternative: `npx tsc --noEmit src/components/shared/progress-bar.tsx 2>&1` — if this fails, just proceed since component will be validated when imported.

**Step 3: Commit**

```bash
git add src/components/shared/progress-bar.tsx
git commit -m "feat: add shared ProgressBar component with color thresholds"
```

---

### Task 2: Fix sidebar navigation + add pending count badges

**Files:**
- Modify: `src/components/admin/admin-sidebar.tsx`
- Modify: `src/components/admin/admin-shell.tsx`
- Modify: `src/app/admin/layout.tsx`

**Context:** The sidebar is a client component. To show live pending counts we pass them as props from the server layout. The layout already fetches notifications — we add pending counts there too.

**Step 1: Read `src/app/admin/layout.tsx` to understand how data flows to AdminShell**

This is a required read before editing.

**Step 2: Update `admin-sidebar.tsx` — fix nav links + accept counts**

Replace the entire `mainNav` array and add badge support:

```tsx
// Old mainNav (line ~20-25):
const mainNav = [
  { label: "Tableau de bord", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Evenements", href: "/admin/events", icon: Calendar },
  { label: "Entreprises", href: "/admin/companies", icon: Building2 },
  { label: "Livrables", href: "/admin/events", icon: Package },
];

// New mainNav:
const mainNav = [
  { label: "Tableau de bord", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Evenements", href: "/admin/events", icon: Calendar },
  { label: "Strategies", href: "/admin/strategies", icon: Target, countKey: "pendingStrategies" as const },
  { label: "Livrables", href: "/admin/deliverables", icon: Package, countKey: "pendingDeliverables" as const },
  { label: "Entreprises", href: "/admin/companies", icon: Building2 },
];
```

Add `Target` to the lucide imports.

Update the interface to accept `pendingCounts`:

```tsx
interface AdminSidebarProps {
  user: { name: string; email: string };
  collapsed: boolean;
  onToggle: () => void;
  pendingCounts?: { pendingStrategies: number; pendingDeliverables: number };
}
```

Update `NavItem` to show badge when `countKey` exists and count > 0:

```tsx
function NavItem({ item }: { item: (typeof mainNav)[0] }) {
  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
  const count = item.countKey && pendingCounts ? pendingCounts[item.countKey] : 0;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors duration-150",
        isActive
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
      )}
      title={collapsed ? item.label : undefined}
    >
      <item.icon className="h-4 w-4 shrink-0" />
      {!collapsed && (
        <>
          <span className="flex-1">{item.label}</span>
          {count > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500/15 px-1.5 text-[11px] font-medium text-amber-600 tabular-nums">
              {count}
            </span>
          )}
        </>
      )}
      {collapsed && count > 0 && (
        <span className="absolute right-1 top-0.5 h-2 w-2 rounded-full bg-amber-500" />
      )}
    </Link>
  );
}
```

Note: Add `relative` to the Link className for the collapsed dot to position correctly.

**Step 3: Update `admin-shell.tsx` — pass pendingCounts through**

Add `pendingCounts` to `AdminShellProps` interface and pass to `AdminSidebar`:

```tsx
interface AdminShellProps {
  user: { name: string; email: string };
  notifications: Notification[];
  unreadCount: number;
  pendingCounts: { pendingStrategies: number; pendingDeliverables: number };
  children: React.ReactNode;
}
```

Pass `pendingCounts={pendingCounts}` to both `AdminSidebar` instances (desktop + mobile sheet).

**Step 4: Update `src/app/admin/layout.tsx` — fetch pending counts**

Add two Prisma count queries to the existing `Promise.all`:

```ts
const pendingStrategies = await prisma.strategy.count({ where: { status: { in: ["PENDING_REVIEW", "CHANGES_REQUESTED"] } } });
const pendingDeliverables = await prisma.deliverable.count({ where: { status: { in: ["IN_REVIEW", "CHANGES_REQUESTED"] } } });
```

Pass `pendingCounts={{ pendingStrategies, pendingDeliverables }}` to `<AdminShell>`.

**Step 5: Verify dev server**

Run: `cd /Users/taomariani-ferigoule/Desktop/fastlane && npm run dev`
Check: Navigate to `/admin/dashboard` — sidebar should show "Strategies" and "Livrables" with correct links and badges.

**Step 6: Commit**

```bash
git add src/components/admin/admin-sidebar.tsx src/components/admin/admin-shell.tsx src/app/admin/layout.tsx
git commit -m "fix: sidebar nav links + add pending count badges for strategies/deliverables"
```

---

### Task 3: Enriched admin dashboard

**Files:**
- Modify: `src/app/admin/dashboard/page.tsx`

**Context:** Currently shows 4 flat stat counters + recent events + activity feed. We enrich with: colored progress bars in stat cards, event progression section, and "items needing action" section.

**Step 1: Rewrite the dashboard page**

Replace the entire content of `src/app/admin/dashboard/page.tsx` with the enriched version.

**Data fetching** — expand the existing `Promise.all` to include:
```ts
const [
  activeEventsCount, totalEvents, totalCompanies,
  pendingDeliverables, totalDeliverables, approvedDeliverables,
  pendingStrategies, totalStrategies, approvedStrategies,
  activeEvents, // with companies, strategies, deliverables for progress
  actionItems, // strategies + deliverables needing attention
  recentActivities,
] = await Promise.all([
  prisma.event.count({ where: { status: "ACTIVE" } }),
  prisma.event.count(),
  prisma.company.count(),
  prisma.deliverable.count({ where: { status: { in: ["IN_REVIEW", "CHANGES_REQUESTED"] } } }),
  prisma.deliverable.count(),
  prisma.deliverable.count({ where: { status: { in: ["APPROVED", "DELIVERED"] } } }),
  prisma.strategy.count({ where: { status: { in: ["PENDING_REVIEW", "CHANGES_REQUESTED"] } } }),
  prisma.strategy.count(),
  prisma.strategy.count({ where: { status: "APPROVED" } }),
  prisma.event.findMany({
    where: { status: "ACTIVE" },
    orderBy: { startDate: "desc" },
    include: {
      companies: {
        include: {
          company: { select: { name: true } },
          strategies: { select: { status: true } },
          deliverables: { select: { status: true } },
        },
      },
    },
  }),
  // Action items: strategies pending + deliverables in review
  Promise.all([
    prisma.strategy.findMany({
      where: { status: { in: ["PENDING_REVIEW", "CHANGES_REQUESTED"] } },
      take: 10,
      orderBy: { updatedAt: "desc" },
      include: { eventCompany: { include: { company: { select: { name: true } }, event: { select: { id: true, name: true } } } } },
    }),
    prisma.deliverable.findMany({
      where: { status: { in: ["IN_REVIEW", "CHANGES_REQUESTED"] } },
      take: 10,
      orderBy: { updatedAt: "desc" },
      include: { eventCompany: { include: { company: { select: { name: true } }, event: { select: { id: true, name: true } } } } },
    }),
  ]),
  prisma.activity.findMany({ take: 10, orderBy: { createdAt: "desc" }, include: { user: { select: { name: true } } } }),
]);
```

**Layout structure:**

```
1. PageHeader "Tableau de bord"
2. Stats grid (4 enriched cards) — each with icon, label, value, sub-text, mini ProgressBar
3. "Progression des evenements" section — list of active events with progress bars
4. Two-column grid:
   - Left: "En attente d'action" — merged list of strategies + deliverables needing attention
   - Right: "Activite recente" (existing, kept as-is)
```

**Stat cards design:**
```tsx
<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
  {stats.map((stat) => (
    <div key={stat.label} className="rounded-lg border bg-background p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <stat.icon className="h-3.5 w-3.5" />
          {stat.label}
        </div>
        {stat.trend && (
          <span className={cn("text-[11px] font-medium", stat.trendColor)}>{stat.trend}</span>
        )}
      </div>
      <p className="text-2xl font-semibold tabular-nums">{stat.value}</p>
      {stat.progress !== undefined && (
        <div className="space-y-1">
          <ProgressBar value={stat.progress} />
          <p className="text-[11px] text-muted-foreground">{stat.subText}</p>
        </div>
      )}
    </div>
  ))}
</div>
```

**Event progression section:**
```tsx
<div className="space-y-3">
  <h2 className="text-sm font-medium">Progression des evenements</h2>
  <div className="rounded-md border divide-y">
    {activeEvents.map((event) => {
      // Calculate progress: (approved strategies + approved deliverables) / total
      const totalItems = event.companies.reduce((sum, ec) => sum + ec.strategies.length + ec.deliverables.length, 0);
      const approvedItems = event.companies.reduce((sum, ec) => (
        sum +
        ec.strategies.filter(s => s.status === "APPROVED").length +
        ec.deliverables.filter(d => d.status === "APPROVED" || d.status === "DELIVERED").length
      ), 0);
      const pct = totalItems > 0 ? Math.round((approvedItems / totalItems) * 100) : 0;
      return (
        <Link key={event.id} href={`/admin/events/${event.id}`} className="flex items-center gap-4 px-4 py-3 hover:bg-accent/50 transition-colors">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{event.name}</p>
            <p className="text-[11px] text-muted-foreground">{event.companies.length} entreprise{event.companies.length !== 1 ? "s" : ""} · {approvedItems}/{totalItems} valides</p>
          </div>
          <div className="flex items-center gap-3 shrink-0 w-40">
            <ProgressBar value={pct} className="flex-1" />
            <span className={cn("text-xs font-medium tabular-nums w-8 text-right", pct >= 70 ? "text-emerald-600" : pct >= 40 ? "text-amber-600" : "text-red-600")}>{pct}%</span>
          </div>
          <StatusBadge status={event.status} />
        </Link>
      );
    })}
  </div>
</div>
```

**Action items section:**
```tsx
// Merge strategies and deliverables into a single sorted list
const [pendingStrats, pendingDelivs] = actionItems;
const allActionItems = [
  ...pendingStrats.map(s => ({ kind: "strategy" as const, id: s.id, title: s.title, status: s.status, company: s.eventCompany.company.name, event: s.eventCompany.event.name, eventId: s.eventCompany.event.id, updatedAt: s.updatedAt, companyId: s.eventCompany.companyId })),
  ...pendingDelivs.map(d => ({ kind: "deliverable" as const, id: d.id, title: d.title, status: d.status, company: d.eventCompany.company.name, event: d.eventCompany.event.name, eventId: d.eventCompany.event.id, updatedAt: d.updatedAt, companyId: d.eventCompany.companyId })),
].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 8);
```

Each action item renders as:
```tsx
<Link href={item.kind === "strategy" ? `/admin/events/${item.eventId}/strategy?company=${item.companyId}` : `/admin/events/${item.eventId}/deliverables?company=${item.companyId}`} className="flex items-start gap-3 px-3 py-2.5 hover:bg-accent/50 transition-colors">
  <div className={cn("mt-0.5 h-2 w-2 shrink-0 rounded-full", item.status === "CHANGES_REQUESTED" ? "bg-red-500" : "bg-amber-500")} />
  <div className="min-w-0 flex-1">
    <p className="text-xs font-medium truncate">{item.title}</p>
    <p className="text-[11px] text-muted-foreground">{item.company} · {item.event}</p>
  </div>
  <div className="shrink-0 text-right">
    <StatusBadge status={item.status} />
    <p className="text-[11px] text-muted-foreground/60 mt-0.5">{relativeTime(item.updatedAt)}</p>
  </div>
</Link>
```

**Step 2: Import ProgressBar and relativeTime**

Add to imports:
```ts
import { ProgressBar } from "@/components/shared/progress-bar";
import { relativeTime } from "@/lib/utils";
```

**Step 3: Verify dev server**

Run: `npm run dev`
Check: Navigate to `/admin/dashboard` — verify stats, event progression, and action items display correctly.

**Step 4: Commit**

```bash
git add src/app/admin/dashboard/page.tsx
git commit -m "feat: enriched admin dashboard with progress bars, event progression, and action items"
```

---

### Task 4: Create `/admin/strategies` page

**Files:**
- Create: `src/app/admin/strategies/page.tsx`
- Create: `src/components/admin/strategies-filter.tsx` (client component for tabs/filters)

**Step 1: Create the filter client component**

```tsx
// src/components/admin/strategies-filter.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface StrategiesFilterProps {
  events: { id: string; name: string }[];
  companies: { id: string; name: string }[];
  counts: { pending: number; changes: number; all: number };
}

export function StrategiesFilter({ events, companies, counts }: StrategiesFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentStatus = searchParams.get("status") ?? "pending";
  const currentEvent = searchParams.get("event") ?? "all";
  const currentCompany = searchParams.get("company") ?? "all";

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all" || value === "pending") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    // Reset to default tab when changing filters
    if (key !== "status" && !params.has("status")) {
      // keep default
    }
    router.push(`/admin/strategies?${params.toString()}`);
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      <Tabs value={currentStatus} onValueChange={(v) => updateParam("status", v)}>
        <TabsList>
          <TabsTrigger value="pending">En attente ({counts.pending})</TabsTrigger>
          <TabsTrigger value="changes">Modif. demandees ({counts.changes})</TabsTrigger>
          <TabsTrigger value="all">Tout ({counts.all})</TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="flex items-center gap-2 ml-auto">
        <Select value={currentEvent} onValueChange={(v) => updateParam("event", v)}>
          <SelectTrigger size="sm" className="text-xs">
            <SelectValue placeholder="Evenement" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les evenements</SelectItem>
            {events.map((e) => (
              <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={currentCompany} onValueChange={(v) => updateParam("company", v)}>
          <SelectTrigger size="sm" className="text-xs">
            <SelectValue placeholder="Entreprise" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les entreprises</SelectItem>
            {companies.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
```

**Step 2: Create the strategies page (Server Component)**

```tsx
// src/app/admin/strategies/page.tsx
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { ProgressBar } from "@/components/shared/progress-bar";
import { StrategiesFilter } from "@/components/admin/strategies-filter";
import { Target } from "lucide-react";
import { relativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import Link from "next/link";

export const metadata = { title: "Strategies" };

export default async function AdminStrategiesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; event?: string; company?: string }>;
}) {
  await requireAdmin();
  const { status = "pending", event, company } = await searchParams;

  // Build where clause based on filters
  const statusFilter =
    status === "pending"
      ? { status: "PENDING_REVIEW" as const }
      : status === "changes"
        ? { status: "CHANGES_REQUESTED" as const }
        : {}; // "all" shows everything

  const relationFilter: Record<string, unknown> = {};
  if (event) relationFilter.eventId = event;
  if (company) relationFilter.companyId = company;

  const ecWhere = Object.keys(relationFilter).length > 0 ? { eventCompany: relationFilter } : {};

  const [strategies, counts, events, companies] = await Promise.all([
    prisma.strategy.findMany({
      where: { ...statusFilter, ...ecWhere },
      orderBy: { updatedAt: "desc" },
      include: {
        items: { select: { status: true } },
        eventCompany: {
          include: {
            company: { select: { id: true, name: true } },
            event: { select: { id: true, name: true } },
          },
        },
      },
    }),
    Promise.all([
      prisma.strategy.count({ where: { status: "PENDING_REVIEW", ...ecWhere } }),
      prisma.strategy.count({ where: { status: "CHANGES_REQUESTED", ...ecWhere } }),
      prisma.strategy.count({ where: ecWhere }),
    ]),
    prisma.event.findMany({ select: { id: true, name: true }, orderBy: { startDate: "desc" } }),
    prisma.company.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  const [pendingCount, changesCount, allCount] = counts;

  return (
    <div className="space-y-4">
      <PageHeader title="Strategies" />
      <StrategiesFilter
        events={events}
        companies={companies}
        counts={{ pending: pendingCount, changes: changesCount, all: allCount }}
      />
      {strategies.length === 0 ? (
        <EmptyState
          icon={Target}
          title="Aucune strategie"
          description={status === "all" ? "Aucune strategie creee." : "Aucune strategie avec ce statut."}
        />
      ) : (
        <div className="space-y-3">
          {strategies.map((strategy) => {
            const approvedItems = strategy.items.filter((i) => i.status === "APPROVED").length;
            const totalItems = strategy.items.length;
            const pct = totalItems > 0 ? Math.round((approvedItems / totalItems) * 100) : 0;
            return (
              <Link
                key={strategy.id}
                href={`/admin/events/${strategy.eventCompany.event.id}/strategy?company=${strategy.eventCompany.company.id}`}
                className="flex items-center gap-4 rounded-lg border p-4 hover:bg-accent/50 transition-colors"
              >
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{strategy.title}</p>
                    <StatusBadge status={strategy.status} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {strategy.eventCompany.company.name} · {strategy.eventCompany.event.name}
                  </p>
                  {totalItems > 0 && (
                    <div className="flex items-center gap-3 max-w-xs">
                      <ProgressBar value={pct} className="flex-1" />
                      <span className={cn(
                        "text-[11px] font-medium tabular-nums",
                        pct >= 70 ? "text-emerald-600" : pct >= 40 ? "text-amber-600" : "text-red-600"
                      )}>
                        {approvedItems}/{totalItems}
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground/60 shrink-0">
                  {relativeTime(strategy.updatedAt)}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

**Step 3: Verify dev server**

Run: `npm run dev`
Check: Navigate to `/admin/strategies` — verify filter tabs work, cards display correctly, links navigate properly.

**Step 4: Commit**

```bash
git add src/app/admin/strategies/page.tsx src/components/admin/strategies-filter.tsx
git commit -m "feat: add global strategies page with status tabs and event/company filters"
```

---

### Task 5: Create `/admin/deliverables` page

**Files:**
- Create: `src/app/admin/deliverables/page.tsx`
- Create: `src/components/admin/deliverables-filter.tsx` (client component for tabs/filters)

**Step 1: Create the filter client component**

Same pattern as `StrategiesFilter` but with deliverable statuses:

```tsx
// src/components/admin/deliverables-filter.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface DeliverablesFilterProps {
  events: { id: string; name: string }[];
  companies: { id: string; name: string }[];
  counts: { review: number; changes: number; all: number };
}

export function DeliverablesFilter({ events, companies, counts }: DeliverablesFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentStatus = searchParams.get("status") ?? "review";
  const currentEvent = searchParams.get("event") ?? "all";
  const currentCompany = searchParams.get("company") ?? "all";

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all" || value === "review") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/admin/deliverables?${params.toString()}`);
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      <Tabs value={currentStatus} onValueChange={(v) => updateParam("status", v)}>
        <TabsList>
          <TabsTrigger value="review">En review ({counts.review})</TabsTrigger>
          <TabsTrigger value="changes">Modif. demandees ({counts.changes})</TabsTrigger>
          <TabsTrigger value="all">Tout ({counts.all})</TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="flex items-center gap-2 ml-auto">
        <Select value={currentEvent} onValueChange={(v) => updateParam("event", v)}>
          <SelectTrigger size="sm" className="text-xs">
            <SelectValue placeholder="Evenement" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les evenements</SelectItem>
            {events.map((e) => (
              <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={currentCompany} onValueChange={(v) => updateParam("company", v)}>
          <SelectTrigger size="sm" className="text-xs">
            <SelectValue placeholder="Entreprise" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les entreprises</SelectItem>
            {companies.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
```

**Step 2: Create the deliverables page (Server Component)**

```tsx
// src/app/admin/deliverables/page.tsx
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { DeliverablesFilter } from "@/components/admin/deliverables-filter";
import { Package, Mail, Globe, MessageSquare, FileText, Megaphone, ImageIcon, MoreHorizontal } from "lucide-react";
import { relativeTime } from "@/lib/utils";
import { getDeliverableTypeLabel } from "@/lib/portal-constants";
import Link from "next/link";

export const metadata = { title: "Livrables" };

const typeIcons: Record<string, typeof Mail> = {
  EMAIL_TEMPLATE: Mail,
  LANDING_PAGE: Globe,
  SOCIAL_POST: MessageSquare,
  SCRIPT: FileText,
  DOCUMENT: FileText,
  AD_CREATIVE: Megaphone,
  OTHER: MoreHorizontal,
};

export default async function AdminDeliverablesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; event?: string; company?: string }>;
}) {
  await requireAdmin();
  const { status = "review", event, company } = await searchParams;

  const statusFilter =
    status === "review"
      ? { status: "IN_REVIEW" as const }
      : status === "changes"
        ? { status: "CHANGES_REQUESTED" as const }
        : {};

  const relationFilter: Record<string, unknown> = {};
  if (event) relationFilter.eventId = event;
  if (company) relationFilter.companyId = company;

  const ecWhere = Object.keys(relationFilter).length > 0 ? { eventCompany: relationFilter } : {};

  const [deliverables, counts, events, companies] = await Promise.all([
    prisma.deliverable.findMany({
      where: { ...statusFilter, ...ecWhere },
      orderBy: { updatedAt: "desc" },
      include: {
        eventCompany: {
          include: {
            company: { select: { id: true, name: true } },
            event: { select: { id: true, name: true } },
          },
        },
      },
    }),
    Promise.all([
      prisma.deliverable.count({ where: { status: "IN_REVIEW", ...ecWhere } }),
      prisma.deliverable.count({ where: { status: "CHANGES_REQUESTED", ...ecWhere } }),
      prisma.deliverable.count({ where: ecWhere }),
    ]),
    prisma.event.findMany({ select: { id: true, name: true }, orderBy: { startDate: "desc" } }),
    prisma.company.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  const [reviewCount, changesCount, allCount] = counts;

  return (
    <div className="space-y-4">
      <PageHeader title="Livrables" />
      <DeliverablesFilter
        events={events}
        companies={companies}
        counts={{ review: reviewCount, changes: changesCount, all: allCount }}
      />
      {deliverables.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Aucun livrable"
          description={status === "all" ? "Aucun livrable cree." : "Aucun livrable avec ce statut."}
        />
      ) : (
        <div className="space-y-3">
          {deliverables.map((d) => {
            const TypeIcon = typeIcons[d.type] ?? Package;
            return (
              <Link
                key={d.id}
                href={`/admin/events/${d.eventCompany.event.id}/deliverables?company=${d.eventCompany.company.id}`}
                className="flex items-center gap-4 rounded-lg border p-4 hover:bg-accent/50 transition-colors"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <TypeIcon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{d.title}</p>
                    <StatusBadge status={d.status} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {d.eventCompany.company.name} · {d.eventCompany.event.name} · {getDeliverableTypeLabel(d.type)} · v{d.version}
                  </p>
                </div>
                <p className="text-[11px] text-muted-foreground/60 shrink-0">
                  {relativeTime(d.updatedAt)}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

**Step 3: Verify dev server**

Run: `npm run dev`
Check: Navigate to `/admin/deliverables` — verify filter tabs, type icons, card links work.

**Step 4: Commit**

```bash
git add src/app/admin/deliverables/page.tsx src/components/admin/deliverables-filter.tsx
git commit -m "feat: add global deliverables page with status tabs and event/company filters"
```

---

### Task 6: Improve event detail page with visual metrics

**Files:**
- Modify: `src/app/admin/events/[eventId]/page.tsx`

**Step 1: Rewrite the event detail page**

Keep existing structure but add metric cards at the top and progress bars per company.

**Add imports:**
```ts
import { ProgressBar } from "@/components/shared/progress-bar";
import { cn } from "@/lib/utils";
```

**Metrics section** (insert after the date/status line, before companies):

```tsx
// Calculate global metrics from event.companies
const totalStrategies = event.companies.reduce((sum, ec) => sum + ec.strategies.length, 0);
const approvedStrategies = event.companies.reduce((sum, ec) => sum + ec.strategies.filter(s => s.status === "APPROVED").length, 0);
const totalDeliverables = event.companies.reduce((sum, ec) => sum + ec.deliverables.length, 0);
const approvedDeliverables = event.companies.reduce((sum, ec) => sum + ec.deliverables.filter(d => d.status === "APPROVED" || d.status === "DELIVERED").length, 0);
const totalItems = totalStrategies + totalDeliverables;
const approvedItems = approvedStrategies + approvedDeliverables;
const globalPct = totalItems > 0 ? Math.round((approvedItems / totalItems) * 100) : 0;
const stratPct = totalStrategies > 0 ? Math.round((approvedStrategies / totalStrategies) * 100) : 0;
const delivPct = totalDeliverables > 0 ? Math.round((approvedDeliverables / totalDeliverables) * 100) : 0;

// Render:
<div className="grid grid-cols-3 gap-4">
  <div className="rounded-lg border p-4 space-y-2">
    <p className="text-xs text-muted-foreground">Progression globale</p>
    <p className="text-2xl font-semibold tabular-nums">{globalPct}%</p>
    <ProgressBar value={globalPct} size="md" />
    <p className="text-[11px] text-muted-foreground">{approvedItems}/{totalItems} valides</p>
  </div>
  <div className="rounded-lg border p-4 space-y-2">
    <p className="text-xs text-muted-foreground">Strategies</p>
    <p className="text-2xl font-semibold tabular-nums">{approvedStrategies}/{totalStrategies}</p>
    <ProgressBar value={stratPct} size="md" />
    <p className="text-[11px] text-muted-foreground">{stratPct}% approuvees</p>
  </div>
  <div className="rounded-lg border p-4 space-y-2">
    <p className="text-xs text-muted-foreground">Livrables</p>
    <p className="text-2xl font-semibold tabular-nums">{approvedDeliverables}/{totalDeliverables}</p>
    <ProgressBar value={delivPct} size="md" />
    <p className="text-[11px] text-muted-foreground">{delivPct}% approuves</p>
  </div>
</div>
```

**Updated company cards** — add progress bar:

```tsx
{event.companies.map((ec) => {
  const stratCount = ec.strategies.length;
  const delivCount = ec.deliverables.length;
  const approvedStrats = ec.strategies.filter((s) => s.status === "APPROVED").length;
  const approvedDelivs = ec.deliverables.filter((d) => d.status === "APPROVED" || d.status === "DELIVERED").length;
  const ecTotal = stratCount + delivCount;
  const ecApproved = approvedStrats + approvedDelivs;
  const ecPct = ecTotal > 0 ? Math.round((ecApproved / ecTotal) * 100) : 0;
  return (
    <div key={ec.id} className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/admin/companies/${ec.companyId}`} className="text-sm font-medium hover:underline">{ec.company.name}</Link>
          <StatusBadge status={ec.company.plan} />
        </div>
        <span className={cn(
          "text-xs font-medium tabular-nums",
          ecPct >= 70 ? "text-emerald-600" : ecPct >= 40 ? "text-amber-600" : "text-red-600"
        )}>
          {ecPct}%
        </span>
      </div>
      <ProgressBar value={ecPct} />
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Target className="h-3 w-3" />{approvedStrats}/{stratCount} strategies</span>
        <span className="flex items-center gap-1"><Package className="h-3 w-3" />{approvedDelivs}/{delivCount} livrables</span>
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" asChild className="h-7 text-xs"><Link href={`/admin/events/${event.id}/strategy?company=${ec.companyId}`}>Strategie</Link></Button>
        <Button size="sm" variant="outline" asChild className="h-7 text-xs"><Link href={`/admin/events/${event.id}/deliverables?company=${ec.companyId}`}>Livrables</Link></Button>
      </div>
    </div>
  );
})}
```

**Step 2: Verify dev server**

Run: `npm run dev`
Check: Navigate to `/admin/events/<some-event-id>` — verify metric cards and progress bars render correctly.

**Step 3: Commit**

```bash
git add src/app/admin/events/\[eventId\]/page.tsx
git commit -m "feat: enriched event detail with metric cards and per-company progress bars"
```

---

### Task 7: Final verification and build check

**Step 1: Run full build**

Run: `cd /Users/taomariani-ferigoule/Desktop/fastlane && npm run build`
Expected: Build succeeds with no errors.

**Step 2: Fix any type errors**

If build fails, fix TypeScript errors in the affected files.

**Step 3: Manual verification checklist**

- [ ] Sidebar shows "Strategies" and "Livrables" with correct links
- [ ] Sidebar badges show pending counts when > 0
- [ ] Dashboard shows enriched stats with progress bars
- [ ] Dashboard shows event progression section
- [ ] Dashboard shows action items section
- [ ] `/admin/strategies` — tabs filter correctly, cards show progress
- [ ] `/admin/deliverables` — tabs filter correctly, type icons display
- [ ] Event detail shows metric cards at top
- [ ] Event detail shows progress bars per company
- [ ] All links navigate to correct pages

**Step 4: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: resolve build issues from admin UX restructure"
```
