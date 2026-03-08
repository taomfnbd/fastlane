# Admin Panel Overhaul — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete the admin panel with full CRUD, global Cmd+K search, dark mode, notification polling, pagination, enriched dashboard, and activity page.

**Architecture:** Server Components for data fetching, Client Components only for interactivity. Server Actions for all mutations (`ActionResult<T>`). Existing patterns: `InlineActions` for row actions, `Dialog` for edit forms, `revalidatePath()` after mutations.

**Tech Stack:** Next.js 16, React 19, Prisma 7, Zod 4, shadcn/ui, cmdk 1.1.1, next-themes 0.4.6, Tailwind CSS 4, Lucide React.

---

## Section 1: CRUD Complet

### Task 1: Event detail — add EditEventDialog + delete button

**Files:**
- Modify: `src/app/admin/events/[eventId]/page.tsx`

`EditEventDialog` already exists at `src/components/admin/edit-event-dialog.tsx`. `deleteEvent` server action exists. We just need to wire them on the event detail page.

**Step 1: Add imports and buttons to event detail page**

In `src/app/admin/events/[eventId]/page.tsx`, add the edit and delete buttons next to `EventStatusSelect`:

```tsx
// Add imports
import { EditEventDialog } from "@/components/admin/edit-event-dialog";
import { deleteEvent } from "@/server/actions/events";
import { EventDeleteButton } from "@/components/admin/event-delete-button";
```

Replace the `PageHeader` action with a flex container:

```tsx
<PageHeader
  title={event.name}
  description={event.description ?? undefined}
  action={
    <div className="flex items-center gap-2">
      <EditEventDialog event={{
        id: event.id,
        name: event.name,
        description: event.description,
        startDate: event.startDate,
        endDate: event.endDate,
      }} />
      <EventStatusSelect eventId={event.id} currentStatus={event.status} />
      <EventDeleteButton eventId={event.id} hasActiveItems={totalItems > 0} />
    </div>
  }
/>
```

**Step 2: Create EventDeleteButton component**

Create `src/components/admin/event-delete-button.tsx`:

```tsx
"use client";

import { Trash2 } from "lucide-react";
import { InlineActions } from "@/components/admin/inline-actions";
import { deleteEvent } from "@/server/actions/events";
import { useRouter } from "next/navigation";

interface EventDeleteButtonProps {
  eventId: string;
  hasActiveItems: boolean;
}

export function EventDeleteButton({ eventId, hasActiveItems }: EventDeleteButtonProps) {
  const router = useRouter();

  if (hasActiveItems) return null;

  return (
    <InlineActions
      actions={[
        {
          label: "Supprimer",
          icon: <Trash2 className="h-3.5 w-3.5" />,
          action: async () => {
            const result = await deleteEvent(eventId);
            if (result.success) router.push("/admin/events");
            return result;
          },
          confirm: "Supprimer cet evenement ? Cette action est irreversible.",
          variant: "destructive",
        },
      ]}
    />
  );
}
```

**Step 3: Commit**

```bash
git add src/app/admin/events/[eventId]/page.tsx src/components/admin/event-delete-button.tsx
git commit -m "feat(admin): add edit + delete buttons to event detail page"
```

---

### Task 2: Event detail — remove company button

**Files:**
- Modify: `src/app/admin/events/[eventId]/page.tsx`
- Create: `src/components/admin/remove-company-button.tsx`

**Step 1: Create RemoveCompanyButton component**

Create `src/components/admin/remove-company-button.tsx`:

```tsx
"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { removeCompanyFromEvent } from "@/server/actions/events";
import { toast } from "sonner";
import { useTransition } from "react";
import { Loader2 } from "lucide-react";

interface RemoveCompanyButtonProps {
  eventId: string;
  companyId: string;
  companyName: string;
  hasItems: boolean;
}

export function RemoveCompanyButton({ eventId, companyId, companyName, hasItems }: RemoveCompanyButtonProps) {
  const [isPending, startTransition] = useTransition();

  if (hasItems) return null;

  function handleRemove() {
    startTransition(async () => {
      const result = await removeCompanyFromEvent(eventId, companyId);
      if (!result.success) toast.error(result.error);
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" disabled={isPending}>
          {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Retirer {companyName} ?</AlertDialogTitle>
          <AlertDialogDescription>L&apos;entreprise sera retiree de cet evenement.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={handleRemove}>Retirer</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

**Step 2: Add RemoveCompanyButton to event detail page**

In `src/app/admin/events/[eventId]/page.tsx`, import and add per company row:

```tsx
import { RemoveCompanyButton } from "@/components/admin/remove-company-button";
```

In the company row, add after the plan badge:

```tsx
<div className="flex items-center gap-3">
  <Link href={`/admin/companies/${ec.companyId}`} className="text-sm font-medium hover:underline">{ec.company.name}</Link>
  <StatusBadge status={ec.company.plan} />
  <RemoveCompanyButton
    eventId={event.id}
    companyId={ec.companyId}
    companyName={ec.company.name}
    hasItems={stratCount + delivCount > 0}
  />
</div>
```

**Step 3: Commit**

```bash
git add src/components/admin/remove-company-button.tsx src/app/admin/events/[eventId]/page.tsx
git commit -m "feat(admin): add remove company button on event detail"
```

---

### Task 3: EditCompanyDialog + delete on company detail

**Files:**
- Create: `src/components/admin/edit-company-dialog.tsx`
- Modify: `src/app/admin/companies/@detail/[companyId]/page.tsx`

**Step 1: Create EditCompanyDialog**

Create `src/components/admin/edit-company-dialog.tsx` (follows EditEventDialog pattern):

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateCompany } from "@/server/actions/companies";

interface EditCompanyDialogProps {
  company: {
    id: string;
    name: string;
    industry: string | null;
    website: string | null;
    description: string | null;
  };
}

export function EditCompanyDialog({ company }: EditCompanyDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("id", company.id);
    const result = await updateCompany(formData);
    if (result.success) {
      toast.success("Entreprise mise a jour");
      setOpen(false);
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier l&apos;entreprise</DialogTitle>
        </DialogHeader>
        <form key={String(open)} onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-company-name">Nom</Label>
            <Input id="edit-company-name" name="name" defaultValue={company.name} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-company-industry">Industrie</Label>
            <Input id="edit-company-industry" name="industry" defaultValue={company.industry ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-company-website">Site web</Label>
            <Input id="edit-company-website" name="website" defaultValue={company.website ?? ""} placeholder="https://..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-company-desc">Description</Label>
            <Textarea id="edit-company-desc" name="description" defaultValue={company.description ?? ""} rows={3} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

**Step 2: Create CompanyDeleteButton**

Create `src/components/admin/company-delete-button.tsx`:

```tsx
"use client";

import { Trash2 } from "lucide-react";
import { InlineActions } from "@/components/admin/inline-actions";
import { deleteCompany } from "@/server/actions/companies";
import { useRouter } from "next/navigation";

interface CompanyDeleteButtonProps {
  companyId: string;
  hasUsersOrEvents: boolean;
}

export function CompanyDeleteButton({ companyId, hasUsersOrEvents }: CompanyDeleteButtonProps) {
  const router = useRouter();

  if (hasUsersOrEvents) return null;

  return (
    <InlineActions
      actions={[
        {
          label: "Supprimer",
          icon: <Trash2 className="h-3.5 w-3.5" />,
          action: async () => {
            const result = await deleteCompany(companyId);
            if (result.success) router.push("/admin/companies");
            return result;
          },
          confirm: "Supprimer cette entreprise ? Cette action est irreversible.",
          variant: "destructive",
        },
      ]}
    />
  );
}
```

**Step 3: Wire into company detail page**

In `src/app/admin/companies/@detail/[companyId]/page.tsx`, add:

```tsx
import { EditCompanyDialog } from "@/components/admin/edit-company-dialog";
import { CompanyDeleteButton } from "@/components/admin/company-delete-button";
```

Replace the PageHeader line with:

```tsx
<PageHeader
  title={company.name}
  description={company.description ?? undefined}
  action={
    <div className="flex items-center gap-2">
      <EditCompanyDialog company={{
        id: company.id,
        name: company.name,
        industry: company.industry,
        website: company.website,
        description: company.description,
      }} />
      <CompanyDeleteButton
        companyId={company.id}
        hasUsersOrEvents={company.users.length > 0 || company.events.length > 0}
      />
    </div>
  }
/>
```

**Step 4: Commit**

```bash
git add src/components/admin/edit-company-dialog.tsx src/components/admin/company-delete-button.tsx src/app/admin/companies/@detail/[companyId]/page.tsx
git commit -m "feat(admin): add edit/delete company on company detail page"
```

---

### Task 4: Delete strategy (DRAFT only)

**Files:**
- Modify: `src/server/actions/strategy.ts`
- Modify: `src/components/admin/strategy-list-actions.tsx`

**Step 1: Add deleteStrategy server action**

In `src/server/actions/strategy.ts`, add:

```tsx
export async function deleteStrategy(strategyId: string): Promise<ActionResult> {
  await requireAdmin();

  const strategy = await prisma.strategy.findUnique({
    where: { id: strategyId },
    select: { id: true, status: true },
  });

  if (!strategy) return { success: false, error: "Strategie introuvable" };
  if (strategy.status !== "DRAFT") {
    return { success: false, error: "Seules les strategies en brouillon peuvent etre supprimees" };
  }

  await prisma.strategy.delete({ where: { id: strategyId } });

  revalidatePath("/admin/events");
  revalidatePath("/admin/strategies");
  revalidatePath("/portal/strategy");
  revalidatePath("/admin/dashboard");
  return { success: true, data: undefined };
}
```

**Step 2: Add delete action to StrategyListActions**

In `src/components/admin/strategy-list-actions.tsx`, add:

```tsx
import { Send, RotateCcw, Trash2 } from "lucide-react";
import { submitStrategyForReview, resubmitStrategy, deleteStrategy } from "@/server/actions/strategy";
```

Add after the resubmit block:

```tsx
if (status === "DRAFT") {
  actions.push({
    label: "Supprimer",
    icon: <Trash2 className="h-3.5 w-3.5" />,
    action: () => deleteStrategy(strategyId),
    confirm: "Supprimer cette strategie ? Cette action est irreversible.",
    variant: "destructive",
  });
}
```

**Step 3: Commit**

```bash
git add src/server/actions/strategy.ts src/components/admin/strategy-list-actions.tsx
git commit -m "feat(admin): add delete strategy action (DRAFT only)"
```

---

### Task 5: Delete deliverable (DRAFT only)

**Files:**
- Modify: `src/server/actions/deliverables.ts`
- Modify: `src/components/admin/deliverable-list-actions.tsx`

**Step 1: Add deleteDeliverable server action**

In `src/server/actions/deliverables.ts`, add:

```tsx
export async function deleteDeliverable(deliverableId: string): Promise<ActionResult> {
  await requireAdmin();

  const deliverable = await prisma.deliverable.findUnique({
    where: { id: deliverableId },
    select: { id: true, status: true },
  });

  if (!deliverable) return { success: false, error: "Livrable introuvable" };
  if (deliverable.status !== "DRAFT") {
    return { success: false, error: "Seuls les livrables en brouillon peuvent etre supprimes" };
  }

  await prisma.deliverable.delete({ where: { id: deliverableId } });

  revalidatePath("/admin/events");
  revalidatePath("/admin/deliverables");
  revalidatePath("/portal/deliverables");
  revalidatePath("/admin/dashboard");
  return { success: true, data: undefined };
}
```

**Step 2: Add delete action to DeliverableListActions**

In `src/components/admin/deliverable-list-actions.tsx`, add:

```tsx
import { Send, RotateCcw, Truck, Trash2 } from "lucide-react";
import { submitDeliverableForReview, resubmitDeliverable, markDeliverableDelivered, deleteDeliverable } from "@/server/actions/deliverables";
```

Add after the mark-delivered block:

```tsx
if (status === "DRAFT") {
  actions.push({
    label: "Supprimer",
    icon: <Trash2 className="h-3.5 w-3.5" />,
    action: () => deleteDeliverable(deliverableId),
    confirm: "Supprimer ce livrable ? Cette action est irreversible.",
    variant: "destructive",
  });
}
```

**Step 3: Commit**

```bash
git add src/server/actions/deliverables.ts src/components/admin/deliverable-list-actions.tsx
git commit -m "feat(admin): add delete deliverable action (DRAFT only)"
```

---

### Task 6: User inline actions (change role, change company, delete)

**Files:**
- Modify: `src/server/actions/users.ts`
- Create: `src/components/admin/user-actions.tsx`
- Modify: `src/app/admin/users/page.tsx`

**Step 1: Add updateUserCompany server action**

In `src/server/actions/users.ts`, add:

```tsx
export async function updateUserCompany(
  userId: string,
  companyId: string | null
): Promise<ActionResult> {
  await requireAdmin();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (!user) return { success: false, error: "User not found" };

  await prisma.user.update({
    where: { id: userId },
    data: { companyId },
  });

  revalidatePath("/admin/users");
  revalidatePath("/admin/companies");
  return { success: true, data: undefined };
}
```

**Step 2: Create UserActions component**

Create `src/components/admin/user-actions.tsx`:

```tsx
"use client";

import { useState, useTransition } from "react";
import { MoreHorizontal, Shield, Building2, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { updateUserRole, updateUserCompany, deleteUser } from "@/server/actions/users";

interface UserActionsProps {
  userId: string;
  currentRole: string;
  currentCompanyId: string | null;
  companies: { id: string; name: string }[];
}

const roles = [
  { value: "ADMIN", label: "Admin" },
  { value: "CLIENT_ADMIN", label: "Admin client" },
  { value: "CLIENT_MEMBER", label: "Membre client" },
] as const;

export function UserActions({ userId, currentRole, currentCompanyId, companies }: UserActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  function handleRoleChange(role: "ADMIN" | "CLIENT_ADMIN" | "CLIENT_MEMBER") {
    startTransition(async () => {
      const result = await updateUserRole(userId, role);
      if (!result.success) toast.error(result.error);
    });
  }

  function handleCompanyChange(companyId: string | null) {
    startTransition(async () => {
      const result = await updateUserCompany(userId, companyId);
      if (!result.success) toast.error(result.error);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteUser(userId);
      if (!result.success) toast.error(result.error);
      setConfirmDelete(false);
    });
  }

  if (currentRole === "SUPER_ADMIN") return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" disabled={isPending}>
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MoreHorizontal className="h-3.5 w-3.5" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Shield className="h-3.5 w-3.5 mr-2" />Changer le role
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {roles.map((role) => (
                <DropdownMenuItem
                  key={role.value}
                  onClick={() => handleRoleChange(role.value)}
                  className={currentRole === role.value ? "bg-accent" : ""}
                >
                  {role.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Building2 className="h-3.5 w-3.5 mr-2" />Entreprise
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem
                onClick={() => handleCompanyChange(null)}
                className={!currentCompanyId ? "bg-accent" : ""}
              >
                Aucune
              </DropdownMenuItem>
              {companies.map((c) => (
                <DropdownMenuItem
                  key={c.id}
                  onClick={() => handleCompanyChange(c.id)}
                  className={currentCompanyId === c.id ? "bg-accent" : ""}
                >
                  {c.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setConfirmDelete(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5 mr-2" />Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet utilisateur ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irreversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
```

**Step 3: Update users page**

Rewrite `src/app/admin/users/page.tsx` to add UserActions per row, createdAt column, and pass companies:

```tsx
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Users } from "lucide-react";
import { InviteUserDialog } from "@/components/admin/invite-user-dialog";
import { UserActions } from "@/components/admin/user-actions";

export const metadata = { title: "Utilisateurs" };

const roleDot: Record<string, string> = { SUPER_ADMIN: "bg-purple-500", ADMIN: "bg-blue-500", CLIENT_ADMIN: "bg-emerald-500", CLIENT_MEMBER: "bg-muted-foreground/50" };
const roleLabel: Record<string, string> = { SUPER_ADMIN: "super admin", ADMIN: "admin", CLIENT_ADMIN: "admin client", CLIENT_MEMBER: "membre client" };

export default async function UsersPage() {
  await requireAdmin();
  const [users, companies] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: { company: { select: { name: true } } },
    }),
    prisma.company.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-4">
      <PageHeader title="Utilisateurs" action={<InviteUserDialog />} />
      {users.length === 0 ? (
        <EmptyState icon={Users} title="Aucun utilisateur" description="Invitez des utilisateurs." action={<InviteUserDialog />} />
      ) : (
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-xs text-muted-foreground">
                <th className="text-left font-medium px-3 py-2">Utilisateur</th>
                <th className="text-left font-medium px-3 py-2 hidden sm:table-cell">Email</th>
                <th className="text-left font-medium px-3 py-2 hidden md:table-cell">Entreprise</th>
                <th className="text-left font-medium px-3 py-2">Role</th>
                <th className="text-left font-medium px-3 py-2 hidden lg:table-cell">Cree le</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-accent/50 transition-colors">
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-medium">{user.name.charAt(0).toUpperCase()}</div>
                      <span className="font-medium">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground hidden sm:table-cell">{user.email}</td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground hidden md:table-cell">{user.company?.name ?? "—"}</td>
                  <td className="px-3 py-2.5">
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${roleDot[user.role] ?? "bg-muted-foreground/50"}`} />
                      {roleLabel[user.role] ?? user.role.toLowerCase()}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-[11px] text-muted-foreground hidden lg:table-cell">
                    {new Date(user.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-3 py-2.5">
                    <UserActions
                      userId={user.id}
                      currentRole={user.role}
                      currentCompanyId={user.companyId}
                      companies={companies}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

**Step 4: Commit**

```bash
git add src/server/actions/users.ts src/components/admin/user-actions.tsx src/app/admin/users/page.tsx
git commit -m "feat(admin): add inline user actions (role, company, delete)"
```

---

## Section 2: UX & Navigation

### Task 7: Command Palette (Cmd+K)

**Files:**
- Create: `src/server/actions/search.ts`
- Create: `src/components/admin/command-palette.tsx`
- Modify: `src/components/admin/admin-shell.tsx`

**Step 1: Create search server action**

Create `src/server/actions/search.ts`:

```tsx
"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";

interface SearchResult {
  id: string;
  type: "event" | "company" | "strategy" | "deliverable" | "user";
  title: string;
  subtitle: string;
  href: string;
}

export async function globalSearch(query: string): Promise<SearchResult[]> {
  await requireAdmin();

  if (!query || query.length < 2) return [];

  const q = query.trim();
  const contains = { contains: q, mode: "insensitive" as const };

  const [events, companies, strategies, deliverables, users] = await Promise.all([
    prisma.event.findMany({
      where: { OR: [{ name: contains }, { description: contains }] },
      take: 5,
      select: { id: true, name: true, status: true },
    }),
    prisma.company.findMany({
      where: { OR: [{ name: contains }, { industry: contains }, { description: contains }] },
      take: 5,
      select: { id: true, name: true, industry: true },
    }),
    prisma.strategy.findMany({
      where: { OR: [{ title: contains }, { description: contains }] },
      take: 5,
      select: {
        id: true, title: true,
        eventCompany: { select: { event: { select: { id: true, name: true } }, company: { select: { name: true } } } },
      },
    }),
    prisma.deliverable.findMany({
      where: { OR: [{ title: contains }, { description: contains }] },
      take: 5,
      select: {
        id: true, title: true, type: true,
        eventCompany: { select: { event: { select: { id: true, name: true } }, company: { select: { name: true } } } },
      },
    }),
    prisma.user.findMany({
      where: { OR: [{ name: contains }, { email: contains }] },
      take: 5,
      select: { id: true, name: true, email: true },
    }),
  ]);

  const results: SearchResult[] = [
    ...events.map((e) => ({
      id: e.id,
      type: "event" as const,
      title: e.name,
      subtitle: e.status.toLowerCase(),
      href: `/admin/events/${e.id}`,
    })),
    ...companies.map((c) => ({
      id: c.id,
      type: "company" as const,
      title: c.name,
      subtitle: c.industry ?? "",
      href: `/admin/companies/${c.id}`,
    })),
    ...strategies.map((s) => ({
      id: s.id,
      type: "strategy" as const,
      title: s.title,
      subtitle: `${s.eventCompany.company.name} · ${s.eventCompany.event.name}`,
      href: `/admin/events/${s.eventCompany.event.id}/strategy`,
    })),
    ...deliverables.map((d) => ({
      id: d.id,
      type: "deliverable" as const,
      title: d.title,
      subtitle: `${d.eventCompany.company.name} · ${d.eventCompany.event.name}`,
      href: `/admin/events/${d.eventCompany.event.id}/deliverables`,
    })),
    ...users.map((u) => ({
      id: u.id,
      type: "user" as const,
      title: u.name,
      subtitle: u.email,
      href: `/admin/users`,
    })),
  ];

  return results;
}
```

**Step 2: Create CommandPalette component**

Create `src/components/admin/command-palette.tsx`:

```tsx
"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { Calendar, Building2, Target, Package, Users, Search, Loader2 } from "lucide-react";
import { globalSearch } from "@/server/actions/search";

const typeIcons: Record<string, typeof Calendar> = {
  event: Calendar,
  company: Building2,
  strategy: Target,
  deliverable: Package,
  user: Users,
};

const typeLabels: Record<string, string> = {
  event: "Evenement",
  company: "Entreprise",
  strategy: "Strategie",
  deliverable: "Livrable",
  user: "Utilisateur",
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Awaited<ReturnType<typeof globalSearch>>>([]);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(() => {
      startTransition(async () => {
        const data = await globalSearch(query);
        setResults(data);
      });
    }, 200);
    return () => clearTimeout(timeout);
  }, [query]);

  function handleSelect(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  if (!open) return null;

  // Group results by type
  const grouped = results.reduce<Record<string, typeof results>>((acc, r) => {
    (acc[r.type] ??= []).push(r);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-[100]">
      <div className="fixed inset-0 bg-black/50" onClick={() => setOpen(false)} />
      <div className="fixed left-1/2 top-[20%] -translate-x-1/2 w-full max-w-lg">
        <Command className="rounded-lg border bg-popover shadow-lg" shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
            ) : (
              <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder="Rechercher..."
              className="flex h-10 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
              autoFocus
            />
          </div>
          <Command.List className="max-h-80 overflow-y-auto p-1">
            {query.length >= 2 && results.length === 0 && !isPending && (
              <Command.Empty className="py-6 text-center text-xs text-muted-foreground">
                Aucun resultat.
              </Command.Empty>
            )}
            {Object.entries(grouped).map(([type, items]) => {
              const Icon = typeIcons[type] ?? Search;
              return (
                <Command.Group key={type} heading={typeLabels[type]} className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground">
                  {items.map((item) => (
                    <Command.Item
                      key={item.id}
                      value={item.id}
                      onSelect={() => handleSelect(item.href)}
                      className="flex items-center gap-2.5 rounded-md px-2 py-2 text-sm cursor-pointer aria-selected:bg-accent"
                    >
                      <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate">{item.title}</p>
                        {item.subtitle && (
                          <p className="text-[11px] text-muted-foreground truncate">{item.subtitle}</p>
                        )}
                      </div>
                    </Command.Item>
                  ))}
                </Command.Group>
              );
            })}
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
```

**Step 3: Wire CommandPalette into AdminShell**

In `src/components/admin/admin-shell.tsx`, add:

```tsx
import { CommandPalette } from "./command-palette";
```

Add `<CommandPalette />` right before the closing `</div>` of the root element.

Also wire the search button in `src/components/shared/app-header.tsx` — pass an `onSearchClick` prop and call it on the search button:

Add to `AppHeaderProps`:

```tsx
onSearchClick?: () => void;
```

On the search Button:

```tsx
<Button
  variant="ghost"
  size="icon"
  className="h-7 w-7 text-muted-foreground"
  title="Rechercher (Cmd+K)"
  onClick={onSearchClick}
>
```

In `AdminShell`, add a `searchOpen` state and pass the handler:

Actually, since CommandPalette manages its own open state via Cmd+K, and the search button just needs to open it, we can use a custom event approach or pass a ref. Simplest: just dispatch a keyboard event from the search button click:

```tsx
onClick={() => {
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
}}
```

**Step 4: Commit**

```bash
git add src/server/actions/search.ts src/components/admin/command-palette.tsx src/components/admin/admin-shell.tsx src/components/shared/app-header.tsx
git commit -m "feat(admin): add Cmd+K command palette with global search"
```

---

### Task 8: Sidebar — localStorage persistence + badge fix + transition fix

**Files:**
- Modify: `src/components/admin/admin-shell.tsx`
- Modify: `src/components/admin/admin-sidebar.tsx`

**Step 1: Persist collapsed state in localStorage**

In `src/components/admin/admin-shell.tsx`, replace:

```tsx
const [collapsed, setCollapsed] = useState(false);
```

With:

```tsx
const [collapsed, setCollapsed] = useState(() => {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("sidebar-collapsed") === "true";
});

function toggleCollapsed() {
  setCollapsed((c) => {
    const next = !c;
    localStorage.setItem("sidebar-collapsed", String(next));
    return next;
  });
}
```

Replace `onToggle={() => setCollapsed((c) => !c)}` with `onToggle={toggleCollapsed}`.

**Step 2: Fix sidebar badge — show events with pending items, not active events count**

In `src/components/admin/admin-sidebar.tsx`, change the Events `countKey`:

The Events badge currently shows `activeEvents` count. The design says it should show "nombre d'events avec items pending". This requires changing the data passed from layout.

In `src/app/admin/layout.tsx`, replace `activeEvents` query with:

```tsx
prisma.event.count({
  where: {
    companies: {
      some: {
        OR: [
          { strategies: { some: { status: { in: ["PENDING_REVIEW", "CHANGES_REQUESTED"] } } } },
          { deliverables: { some: { status: { in: ["IN_REVIEW", "CHANGES_REQUESTED"] } } } },
        ],
      },
    },
  },
}),
```

Keep the variable name `activeEvents` for the count value and the prop name unchanged.

**Step 3: Fix transition on main content**

In `src/components/admin/admin-shell.tsx`, change:

```tsx
className={cn(
  "transition-all duration-150",
```

To:

```tsx
className={cn(
  "transition-[padding] duration-150",
```

**Step 4: Commit**

```bash
git add src/components/admin/admin-shell.tsx src/app/admin/layout.tsx
git commit -m "feat(admin): persist sidebar state, fix badge counts, fix transition"
```

---

### Task 9: Notification polling (30s)

**Files:**
- Modify: `src/components/admin/notification-bell.tsx`

**Step 1: Add polling with setInterval + router.refresh()**

In `src/components/admin/notification-bell.tsx`, add `useEffect` for polling:

```tsx
import { useState, useOptimistic, useTransition, useEffect } from "react";
```

Inside the component, add:

```tsx
useEffect(() => {
  const interval = setInterval(() => {
    router.refresh();
  }, 30_000);
  return () => clearInterval(interval);
}, [router]);
```

**Step 2: Commit**

```bash
git add src/components/admin/notification-bell.tsx
git commit -m "feat(admin): add 30s notification polling"
```

---

### Task 10: Dark mode toggle (next-themes)

**Files:**
- Modify: `src/app/layout.tsx`
- Create: `src/components/shared/theme-toggle.tsx`
- Modify: `src/components/shared/app-header.tsx`
- Modify: `src/components/admin/admin-shell.tsx`

**Step 1: Wrap app with ThemeProvider**

In `src/app/layout.tsx`:

```tsx
import { ThemeProvider } from "next-themes";
```

Wrap children:

```tsx
<html lang="fr" suppressHydrationWarning>
  <body className={`${inter.variable} ${mono.variable} font-sans antialiased`}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <TooltipProvider>
        {children}
        <Toaster position="bottom-right" />
      </TooltipProvider>
    </ThemeProvider>
  </body>
</html>
```

Remove `className="dark"` from `<html>` (ThemeProvider manages it).

**Step 2: Create ThemeToggle component**

Create `src/components/shared/theme-toggle.tsx`:

```tsx
"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7 text-muted-foreground"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      title="Changer le theme"
    >
      <Sun className="h-3.5 w-3.5 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-3.5 w-3.5 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
    </Button>
  );
}
```

**Step 3: Add ThemeToggle to AppHeader**

In `src/components/shared/app-header.tsx`, add `themeToggleSlot` prop:

```tsx
interface AppHeaderProps {
  user: { name: string; email: string };
  notificationCount?: number;
  notificationSlot?: React.ReactNode;
  themeToggleSlot?: React.ReactNode;
  onMobileMenuToggle?: () => void;
  onSearchClick?: () => void;
}
```

Place it in the actions area before notification:

```tsx
{themeToggleSlot}
{notificationSlot ?? (...)}
```

**Step 4: Pass ThemeToggle from AdminShell**

In `src/components/admin/admin-shell.tsx`:

```tsx
import { ThemeToggle } from "@/components/shared/theme-toggle";
```

```tsx
<AppHeader
  user={user}
  onMobileMenuToggle={() => setMobileOpen(true)}
  themeToggleSlot={<ThemeToggle />}
  notificationSlot={...}
/>
```

**Step 5: Commit**

```bash
git add src/app/layout.tsx src/components/shared/theme-toggle.tsx src/components/shared/app-header.tsx src/components/admin/admin-shell.tsx
git commit -m "feat: add dark mode toggle with next-themes"
```

---

### Task 11: Avatar dropdown (Profil, Parametres, Deconnexion)

**Files:**
- Modify: `src/components/shared/app-header.tsx`
- Modify: `src/components/admin/admin-shell.tsx`

**Step 1: Replace static avatar with dropdown in AppHeader**

In `src/components/shared/app-header.tsx`, add imports and replace the avatar div:

```tsx
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, Settings, LogOut } from "lucide-react";
import Link from "next/link";
```

Add to props:

```tsx
onSignOut?: () => void;
```

Replace the avatar div with:

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <button className="ml-1 flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px] font-medium hover:ring-2 hover:ring-accent transition-all">
      {user.name.charAt(0).toUpperCase()}
    </button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end" className="w-48">
    <div className="px-2 py-1.5">
      <p className="text-xs font-medium">{user.name}</p>
      <p className="text-[11px] text-muted-foreground">{user.email}</p>
    </div>
    <DropdownMenuSeparator />
    <DropdownMenuItem asChild>
      <Link href="/admin/settings"><Settings className="h-3.5 w-3.5 mr-2" />Parametres</Link>
    </DropdownMenuItem>
    {onSignOut && (
      <>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onSignOut} className="text-destructive focus:text-destructive">
          <LogOut className="h-3.5 w-3.5 mr-2" />Deconnexion
        </DropdownMenuItem>
      </>
    )}
  </DropdownMenuContent>
</DropdownMenu>
```

**Step 2: Pass onSignOut from AdminShell**

In `src/components/admin/admin-shell.tsx`:

```tsx
import { signOut } from "@/lib/auth-client";
```

```tsx
<AppHeader
  user={user}
  onMobileMenuToggle={() => setMobileOpen(true)}
  themeToggleSlot={<ThemeToggle />}
  onSignOut={() => signOut({ fetchOptions: { onSuccess: () => { window.location.href = "/login"; } } })}
  notificationSlot={...}
/>
```

**Step 3: Commit**

```bash
git add src/components/shared/app-header.tsx src/components/admin/admin-shell.tsx
git commit -m "feat(admin): add avatar dropdown menu with sign out"
```

---

### Task 12: Breadcrumb UUID resolution

**Files:**
- Modify: `src/components/shared/app-header.tsx`
- Modify: `src/components/admin/admin-shell.tsx`
- Modify: `src/app/admin/layout.tsx`

**Step 1: Pass entity names map to AppHeader**

The approach: in the admin layout, we already fetch the session. We'll add a prop `entityNames` to AppHeader — a Record<string, string> mapping UUID segments to entity names.

In `AppHeaderProps`, add:

```tsx
entityNames?: Record<string, string>;
```

In the breadcrumb rendering, modify the label logic:

```tsx
const label = entityNames?.[segment] ?? labelMap[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1);
```

To detect UUIDs vs normal segments, check if the segment looks like a cuid (starts with `c` and is 25 chars) or just check if `entityNames` has it.

**Step 2: Resolve names in AdminShell via a client-side approach**

Since the header is a Client Component inside AdminShell, and we don't want to fetch on every render, the simplest approach: pass a static map from the layout.

But the admin layout doesn't know the current eventId dynamically. Instead, we'll use a lightweight client approach: extract cuid-like segments from the pathname and resolve them via a server action.

Create a small server action in `src/server/actions/search.ts`:

```tsx
export async function resolveEntityNames(ids: string[]): Promise<Record<string, string>> {
  await requireAdmin();
  if (ids.length === 0) return {};

  const [events, companies, strategies, deliverables] = await Promise.all([
    prisma.event.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } }),
    prisma.company.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } }),
    prisma.strategy.findMany({ where: { id: { in: ids } }, select: { id: true, title: true } }),
    prisma.deliverable.findMany({ where: { id: { in: ids } }, select: { id: true, title: true } }),
  ]);

  const map: Record<string, string> = {};
  for (const e of events) map[e.id] = e.name;
  for (const c of companies) map[c.id] = c.name;
  for (const s of strategies) map[s.id] = s.title;
  for (const d of deliverables) map[d.id] = d.title;
  return map;
}
```

In `src/components/shared/app-header.tsx`, use this to resolve IDs:

```tsx
import { useEffect, useState } from "react";
import { resolveEntityNames } from "@/server/actions/search";
```

Inside the component:

```tsx
const [entityNames, setEntityNames] = useState<Record<string, string>>({});

// Detect cuid-like segments (25 chars starting with c)
const idSegments = segments.filter((s) => /^c[a-z0-9]{24}$/.test(s));

useEffect(() => {
  if (idSegments.length === 0) return;
  resolveEntityNames(idSegments).then(setEntityNames);
}, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps
```

Then use `entityNames[segment]` in the label resolution.

**Step 3: Commit**

```bash
git add src/components/shared/app-header.tsx src/server/actions/search.ts
git commit -m "feat(admin): resolve UUID breadcrumb segments to entity names"
```

---

### Task 13: Pagination on list pages

**Files:**
- Create: `src/components/shared/pagination.tsx`
- Modify: `src/app/admin/events/page.tsx`
- Modify: `src/app/admin/companies/page.tsx`
- Modify: `src/app/admin/users/page.tsx`

**Step 1: Create Pagination component**

Create `src/components/shared/pagination.tsx`:

```tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  total: number;
  perPage: number;
  basePath: string;
}

export function Pagination({ total, perPage, basePath }: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get("page") ?? "1");
  const totalPages = Math.ceil(total / perPage);

  if (totalPages <= 1) return null;

  function goTo(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(page));
    }
    const qs = params.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
  }

  return (
    <div className="flex items-center justify-between pt-2">
      <p className="text-[11px] text-muted-foreground">
        {total} resultat{total !== 1 ? "s" : ""}
      </p>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" className="h-7 w-7" disabled={currentPage <= 1} onClick={() => goTo(currentPage - 1)}>
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        <span className="text-xs tabular-nums px-2">
          {currentPage} / {totalPages}
        </span>
        <Button variant="outline" size="icon" className="h-7 w-7" disabled={currentPage >= totalPages} onClick={() => goTo(currentPage + 1)}>
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
```

**Step 2: Add pagination to events page**

In `src/app/admin/events/page.tsx`:

Add `searchParams` prop:

```tsx
export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
```

Add pagination logic:

```tsx
const { page = "1" } = await searchParams;
const currentPage = Math.max(1, Number(page));
const perPage = 10;
```

Modify the Prisma query:

```tsx
const [events, totalCount] = await Promise.all([
  prisma.event.findMany({
    orderBy: { startDate: "desc" },
    skip: (currentPage - 1) * perPage,
    take: perPage,
    include: { companies: { include: { company: { select: { name: true } }, strategies: { select: { status: true } }, deliverables: { select: { status: true } } } } },
  }),
  prisma.event.count(),
]);
```

Add at the bottom after the event list:

```tsx
import { Pagination } from "@/components/shared/pagination";
```

```tsx
<Pagination total={totalCount} perPage={perPage} basePath="/admin/events" />
```

**Step 3: Add pagination to companies page**

Same pattern in `src/app/admin/companies/page.tsx` with `perPage = 10`, `basePath="/admin/companies"`.

**Step 4: Add pagination to users page**

Same pattern in `src/app/admin/users/page.tsx` with `perPage = 10`, `basePath="/admin/users"`.

**Step 5: Commit**

```bash
git add src/components/shared/pagination.tsx src/app/admin/events/page.tsx src/app/admin/companies/page.tsx src/app/admin/users/page.tsx
git commit -m "feat(admin): add pagination (10/page) to events, companies, users"
```

---

### Task 14: Search input on list pages

**Files:**
- Create: `src/components/shared/search-input.tsx`
- Modify: `src/app/admin/events/page.tsx`
- Modify: `src/app/admin/companies/page.tsx`
- Modify: `src/app/admin/users/page.tsx`

**Step 1: Create SearchInput component**

Create `src/components/shared/search-input.tsx`:

```tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useRef } from "react";

interface SearchInputProps {
  basePath: string;
  placeholder?: string;
}

export function SearchInput({ basePath, placeholder = "Rechercher..." }: SearchInputProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.get("q") ?? "";
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  function handleChange(value: string) {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("page"); // Reset to page 1 on search
      if (value) {
        params.set("q", value);
      } else {
        params.delete("q");
      }
      const qs = params.toString();
      router.push(qs ? `${basePath}?${qs}` : basePath);
    }, 300);
  }

  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
      <Input
        defaultValue={currentQuery}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="pl-8 h-8 text-xs"
      />
    </div>
  );
}
```

**Step 2: Wire into events page**

In `src/app/admin/events/page.tsx`:

Add `q` to searchParams type and filter:

```tsx
searchParams: Promise<{ page?: string; q?: string }>;
```

```tsx
const { page = "1", q } = await searchParams;
```

Add to Prisma where:

```tsx
const where = q ? { OR: [{ name: { contains: q, mode: "insensitive" as const } }, { description: { contains: q, mode: "insensitive" as const } }] } : {};
```

Use `where` in both `findMany` and `count`.

Add `<SearchInput basePath="/admin/events" placeholder="Rechercher un evenement..." />` after PageHeader.

**Step 3: Same pattern for companies and users pages**

Companies: search by name, industry. Users: search by name, email.

**Step 4: Commit**

```bash
git add src/components/shared/search-input.tsx src/app/admin/events/page.tsx src/app/admin/companies/page.tsx src/app/admin/users/page.tsx
git commit -m "feat(admin): add search input to events, companies, users pages"
```

---

### Task 15: Enriched status filter tabs on events page

**Files:**
- Create: `src/components/admin/events-filter.tsx`
- Modify: `src/app/admin/events/page.tsx`

**Step 1: Create EventsFilter component**

Create `src/components/admin/events-filter.tsx` (follows StrategiesFilter pattern):

```tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface EventsFilterProps {
  counts: { active: number; draft: number; completed: number; all: number };
}

export function EventsFilter({ counts }: EventsFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentStatus = searchParams.get("status") ?? "all";

  function updateStatus(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    if (value === "all") {
      params.delete("status");
    } else {
      params.set("status", value);
    }
    const qs = params.toString();
    router.push(qs ? `/admin/events?${qs}` : "/admin/events");
  }

  return (
    <Tabs value={currentStatus} onValueChange={updateStatus}>
      <TabsList>
        <TabsTrigger value="all">Tous ({counts.all})</TabsTrigger>
        <TabsTrigger value="active">Actifs ({counts.active})</TabsTrigger>
        <TabsTrigger value="draft">Brouillons ({counts.draft})</TabsTrigger>
        <TabsTrigger value="completed">Termines ({counts.completed})</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
```

**Step 2: Wire into events page**

In `src/app/admin/events/page.tsx`, add status filter to searchParams, Prisma where, and count queries:

```tsx
const { page = "1", q, status } = await searchParams;

const statusFilter = status === "active" ? { status: "ACTIVE" as const }
  : status === "draft" ? { status: "DRAFT" as const }
  : status === "completed" ? { status: { in: ["COMPLETED", "ARCHIVED"] as const } }
  : {};

const where = {
  ...statusFilter,
  ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" as const } }, { description: { contains: q, mode: "insensitive" as const } }] } : {}),
};
```

Add counts query:

```tsx
const [events, totalCount, activeCount, draftCount, completedCount] = await Promise.all([
  prisma.event.findMany({ where, ... }),
  prisma.event.count({ where }),
  prisma.event.count({ where: { status: "ACTIVE" } }),
  prisma.event.count({ where: { status: "DRAFT" } }),
  prisma.event.count({ where: { status: { in: ["COMPLETED", "ARCHIVED"] } } }),
]);
const allCount = activeCount + draftCount + completedCount;
```

Render filter:

```tsx
<EventsFilter counts={{ active: activeCount, draft: draftCount, completed: completedCount, all: allCount }} />
```

**Step 3: Commit**

```bash
git add src/components/admin/events-filter.tsx src/app/admin/events/page.tsx
git commit -m "feat(admin): add status filter tabs to events page"
```

---

## Section 3: Dashboard

### Task 16: Fix deliverable link + add questions stats card

**Files:**
- Modify: `src/app/admin/dashboard/page.tsx`

**Step 1: Fix deliverable link**

Change `?status=pending` to `?status=review` in the stats array:

```tsx
href: "/admin/deliverables?status=review",
```

(Already correct in current code — verify and keep.)

**Step 2: Add questions card to stats**

Add to the stats array:

```tsx
{
  label: "Questions en attente",
  value: unansweredQuestions.length,
  icon: MessageCircleQuestion,
  href: "/admin/dashboard#questions",
  progress: undefined,
  subText: undefined,
},
```

Change grid from `grid-cols-4` to `grid-cols-5` or keep responsive:

```tsx
<div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
```

**Step 3: Commit**

```bash
git add src/app/admin/dashboard/page.tsx
git commit -m "fix(admin): add questions card to dashboard stats"
```

---

### Task 17: Enhance "A traiter" + activity feed

**Files:**
- Modify: `src/app/admin/dashboard/page.tsx`

**Step 1: Add "Voir tout" link + limit 10**

Change `.slice(0, 8)` to `.slice(0, 10)` for allActionItems.

Add "Voir tout" link in the header:

```tsx
<div className="flex items-center justify-between mb-3">
  <h2 className="text-sm font-medium">A traiter</h2>
  {allActionItems.length > 0 && (
    <Link href="/admin/strategies" className="text-xs text-primary hover:underline">Voir tout</Link>
  )}
</div>
```

**Step 2: Enhance activity feed — 15 items, icons, links, "Voir tout"**

Change `take: 5` to `take: 15` in the recentActivities query. Also include strategy and deliverable for links:

```tsx
prisma.activity.findMany({
  take: 15,
  orderBy: { createdAt: "desc" },
  include: {
    user: { select: { name: true } },
    strategy: { select: { id: true, eventCompany: { select: { eventId: true } } } },
    deliverable: { select: { id: true, eventCompany: { select: { eventId: true } } } },
  },
}),
```

Add icons per activity type:

```tsx
import { Calendar, Building2, Package, Target, MessageCircleQuestion, Send, Check, XCircle, MessageSquare, FileUp, RefreshCw } from "lucide-react";
```

```tsx
const activityIcons: Record<string, typeof Calendar> = {
  STRATEGY_CREATED: Target,
  STRATEGY_UPDATED: Target,
  STRATEGY_SUBMITTED: Send,
  STRATEGY_APPROVED: Check,
  STRATEGY_REJECTED: XCircle,
  DELIVERABLE_CREATED: Package,
  DELIVERABLE_SUBMITTED: Send,
  DELIVERABLE_APPROVED: Check,
  DELIVERABLE_REJECTED: XCircle,
  COMMENT_ADDED: MessageSquare,
  STATUS_CHANGED: RefreshCw,
  FILE_UPLOADED: FileUp,
};
```

Update the activity rendering to use icons and make items clickable:

```tsx
{recentActivities.map((activity) => {
  const Icon = activityIcons[activity.type] ?? RefreshCw;
  const href = activity.strategy?.eventCompany?.eventId
    ? `/admin/events/${activity.strategy.eventCompany.eventId}/strategy`
    : activity.deliverable?.eventCompany?.eventId
      ? `/admin/events/${activity.deliverable.eventCompany.eventId}/deliverables`
      : null;

  const inner = (
    <>
      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted mt-0.5">
        <Icon className="h-3 w-3 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs">
          <span className="font-medium">{activity.user.name}</span>{" "}
          <span className="text-muted-foreground">{activity.message}</span>
        </p>
        <p className="text-[11px] text-muted-foreground/60">
          {new Date(activity.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </>
  );

  return href ? (
    <Link key={activity.id} href={href} className="flex items-start gap-2.5 py-2 text-sm hover:bg-accent/50 rounded-md px-1 -mx-1 transition-colors">
      {inner}
    </Link>
  ) : (
    <div key={activity.id} className="flex items-start gap-2.5 py-2 text-sm">
      {inner}
    </div>
  );
})}
```

Add "Voir tout" header:

```tsx
<div className="flex items-center justify-between mb-3">
  <h2 className="text-sm font-medium">Activite recente</h2>
  <Link href="/admin/activity" className="text-xs text-primary hover:underline">Voir tout</Link>
</div>
```

**Step 3: Commit**

```bash
git add src/app/admin/dashboard/page.tsx
git commit -m "feat(admin): enhance dashboard action items and activity feed"
```

---

### Task 18: Activity page (/admin/activity)

**Files:**
- Create: `src/app/admin/activity/page.tsx`
- Create: `src/components/admin/activity-filter.tsx`
- Modify: `src/components/admin/admin-sidebar.tsx`

**Step 1: Create ActivityFilter component**

Create `src/components/admin/activity-filter.tsx`:

```tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface ActivityFilterProps {
  users: { id: string; name: string }[];
  events: { id: string; name: string }[];
}

const activityTypes = [
  { value: "all", label: "Tous les types" },
  { value: "STRATEGY_CREATED", label: "Strategie creee" },
  { value: "STRATEGY_SUBMITTED", label: "Strategie soumise" },
  { value: "STRATEGY_APPROVED", label: "Strategie approuvee" },
  { value: "STRATEGY_REJECTED", label: "Strategie refusee" },
  { value: "DELIVERABLE_CREATED", label: "Livrable cree" },
  { value: "DELIVERABLE_SUBMITTED", label: "Livrable soumis" },
  { value: "DELIVERABLE_APPROVED", label: "Livrable approuve" },
  { value: "DELIVERABLE_REJECTED", label: "Livrable refuse" },
  { value: "COMMENT_ADDED", label: "Commentaire" },
  { value: "STATUS_CHANGED", label: "Statut modifie" },
  { value: "FILE_UPLOADED", label: "Fichier uploade" },
];

export function ActivityFilter({ users, events }: ActivityFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    if (value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    const qs = params.toString();
    router.push(qs ? `/admin/activity?${qs}` : "/admin/activity");
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={searchParams.get("type") ?? "all"} onValueChange={(v) => updateParam("type", v)}>
        <SelectTrigger size="sm" className="text-xs w-44">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          {activityTypes.map((t) => (
            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={searchParams.get("user") ?? "all"} onValueChange={(v) => updateParam("user", v)}>
        <SelectTrigger size="sm" className="text-xs w-40">
          <SelectValue placeholder="Utilisateur" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous</SelectItem>
          {users.map((u) => (
            <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={searchParams.get("event") ?? "all"} onValueChange={(v) => updateParam("event", v)}>
        <SelectTrigger size="sm" className="text-xs w-40">
          <SelectValue placeholder="Evenement" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous</SelectItem>
          {events.map((e) => (
            <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
```

**Step 2: Create activity page**

Create `src/app/admin/activity/page.tsx`:

```tsx
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { ActivityFilter } from "@/components/admin/activity-filter";
import { Send, Check, XCircle, MessageSquare, FileUp, RefreshCw, Target, Package } from "lucide-react";
import Link from "next/link";
import type { ActivityType } from "@/generated/prisma";

export const metadata = { title: "Activite" };

const activityIcons: Record<string, typeof Target> = {
  STRATEGY_CREATED: Target,
  STRATEGY_UPDATED: Target,
  STRATEGY_SUBMITTED: Send,
  STRATEGY_APPROVED: Check,
  STRATEGY_REJECTED: XCircle,
  DELIVERABLE_CREATED: Package,
  DELIVERABLE_SUBMITTED: Send,
  DELIVERABLE_APPROVED: Check,
  DELIVERABLE_REJECTED: XCircle,
  COMMENT_ADDED: MessageSquare,
  STATUS_CHANGED: RefreshCw,
  FILE_UPLOADED: FileUp,
};

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; type?: string; user?: string; event?: string }>;
}) {
  await requireAdmin();
  const { page = "1", type, user, event } = await searchParams;
  const currentPage = Math.max(1, Number(page));
  const perPage = 20;

  const where: Record<string, unknown> = {};
  if (type) where.type = type as ActivityType;
  if (user) where.userId = user;
  if (event) {
    where.OR = [
      { strategy: { eventCompany: { eventId: event } } },
      { deliverable: { eventCompany: { eventId: event } } },
    ];
  }

  const [activities, totalCount, users, events] = await Promise.all([
    prisma.activity.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * perPage,
      take: perPage,
      include: {
        user: { select: { name: true, image: true } },
        strategy: { select: { id: true, title: true, eventCompany: { select: { eventId: true } } } },
        deliverable: { select: { id: true, title: true, eventCompany: { select: { eventId: true } } } },
      },
    }),
    prisma.activity.count({ where }),
    prisma.user.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.event.findMany({ select: { id: true, name: true }, orderBy: { startDate: "desc" } }),
  ]);

  return (
    <div className="space-y-4">
      <PageHeader title="Activite" />
      <ActivityFilter users={users} events={events} />
      <div className="space-y-0">
        {activities.map((activity) => {
          const Icon = activityIcons[activity.type] ?? RefreshCw;
          const href = activity.strategy?.eventCompany?.eventId
            ? `/admin/events/${activity.strategy.eventCompany.eventId}/strategy`
            : activity.deliverable?.eventCompany?.eventId
              ? `/admin/events/${activity.deliverable.eventCompany.eventId}/deliverables`
              : null;
          const target = activity.strategy?.title ?? activity.deliverable?.title;

          return (
            <div key={activity.id} className="flex items-start gap-3 py-3 border-b last:border-0">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted mt-0.5">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  <span className="font-medium">{activity.user.name}</span>{" "}
                  <span className="text-muted-foreground">{activity.message}</span>
                </p>
                {target && href && (
                  <Link href={href} className="text-xs text-primary hover:underline">{target}</Link>
                )}
                <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                  {new Date(activity.createdAt).toLocaleDateString("fr-FR", {
                    day: "numeric", month: "short", year: "numeric",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      <Pagination total={totalCount} perPage={perPage} basePath="/admin/activity" />
    </div>
  );
}
```

**Step 3: Add activity link to sidebar**

In `src/components/admin/admin-sidebar.tsx`, add to mainNav:

```tsx
import { History } from "lucide-react";
```

Add after deliverables in mainNav:

```tsx
{ label: "Activite", href: "/admin/activity", icon: History },
```

(No `countKey` needed.)

**Step 4: Commit**

```bash
git add src/app/admin/activity/page.tsx src/components/admin/activity-filter.tsx src/components/admin/admin-sidebar.tsx
git commit -m "feat(admin): add /admin/activity page with timeline and filters"
```

---

### Task 19: Build verification

**Step 1: Run build**

```bash
cd /Users/taomariani-ferigoule/Desktop/fastlane && npm run build
```

Expected: Build passes with 0 errors.

**Step 2: Fix any build errors**

Address any TypeScript or Next.js errors that arise.

**Step 3: Final commit**

```bash
git add -A && git commit -m "fix: resolve build errors from admin panel overhaul"
```

---

## Summary of all new files

| File | Purpose |
|------|---------|
| `src/components/admin/event-delete-button.tsx` | Delete event button (blocks if active items) |
| `src/components/admin/remove-company-button.tsx` | Remove company from event button |
| `src/components/admin/edit-company-dialog.tsx` | Edit company dialog |
| `src/components/admin/company-delete-button.tsx` | Delete company button |
| `src/components/admin/user-actions.tsx` | User row dropdown (role, company, delete) |
| `src/server/actions/search.ts` | Global search + UUID resolution |
| `src/components/admin/command-palette.tsx` | Cmd+K command palette |
| `src/components/shared/theme-toggle.tsx` | Dark/light mode toggle |
| `src/components/shared/pagination.tsx` | Reusable pagination component |
| `src/components/shared/search-input.tsx` | Reusable search input with debounce |
| `src/components/admin/events-filter.tsx` | Event status filter tabs |
| `src/components/admin/activity-filter.tsx` | Activity page filters |
| `src/app/admin/activity/page.tsx` | Activity timeline page |

## Summary of modified files

| File | Changes |
|------|---------|
| `src/app/admin/events/[eventId]/page.tsx` | Add edit/delete event, remove company |
| `src/app/admin/companies/@detail/[companyId]/page.tsx` | Add edit/delete company |
| `src/server/actions/strategy.ts` | Add `deleteStrategy` |
| `src/components/admin/strategy-list-actions.tsx` | Add delete action |
| `src/server/actions/deliverables.ts` | Add `deleteDeliverable` |
| `src/components/admin/deliverable-list-actions.tsx` | Add delete action |
| `src/server/actions/users.ts` | Add `updateUserCompany` |
| `src/app/admin/users/page.tsx` | Rewrite with inline actions + createdAt column |
| `src/components/admin/admin-shell.tsx` | localStorage sidebar, transition fix, CommandPalette, ThemeToggle |
| `src/app/admin/layout.tsx` | Fix events badge query |
| `src/components/admin/notification-bell.tsx` | Add 30s polling |
| `src/app/layout.tsx` | ThemeProvider wrapper |
| `src/components/shared/app-header.tsx` | ThemeToggle slot, avatar dropdown, search click, UUID breadcrumbs |
| `src/app/admin/events/page.tsx` | Pagination + search + status filter |
| `src/app/admin/companies/page.tsx` | Pagination + search |
| `src/app/admin/dashboard/page.tsx` | Questions card, 15 activities, icons, links, "Voir tout" |
| `src/components/admin/admin-sidebar.tsx` | Add activity link |
