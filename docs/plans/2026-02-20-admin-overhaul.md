# Admin Overhaul Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete the admin workflow (edit/resubmit), add formal Q&A communication between admin and client, and fix existing bugs.

**Architecture:** Three blocks implemented sequentially. Block 3 (bugfixes) first since they're small and unblock correct behavior. Block 1 (workflow) second since edit/resubmit are prerequisites for the full communication loop. Block 2 (communication) last — new Prisma model, admin detail pages, Q&A system, and dashboard widget.

**Tech Stack:** Next.js 16 (App Router, Server Components, Server Actions), TypeScript 5 strict, Tailwind CSS 4, shadcn/ui, Prisma 7, Zod 4, Better Auth.

---

## Task 1: Bugfix — strategyItemId missing in comment replies

**Files:**
- Modify: `src/components/shared/comment-section.tsx:67-75`

**Step 1: Fix the handleReply function**

In `comment-section.tsx`, the `handleReply` function at line 67 passes `strategyId` and `deliverableId` but NOT `strategyItemId`. Add the missing line:

```tsx
async function handleReply(parentId: string) {
    if (!replyContent.trim()) return;
    setLoading(true);

    const formData = new FormData();
    formData.set("content", replyContent);
    formData.set("parentId", parentId);
    if (strategyId) formData.set("strategyId", strategyId);
    if (strategyItemId) formData.set("strategyItemId", strategyItemId);
    if (deliverableId) formData.set("deliverableId", deliverableId);

    const result = await addComment(formData);
    if (result.success) {
      setReplyTo(null);
      setReplyContent("");
    } else {
      toast.error(result.error);
    }

    setLoading(false);
  }
```

The only change is adding `if (strategyItemId) formData.set("strategyItemId", strategyItemId);` after the strategyId line.

**Step 2: Verify TypeScript**

Run: `cd /Users/taomariani-ferigoule/Desktop/fastlane && npx tsc --noEmit`
Expected: 0 errors

**Step 3: Commit**

```bash
git add src/components/shared/comment-section.tsx
git commit -m "fix: pass strategyItemId in comment reply handler"
```

---

## Task 2: Bugfix — revalidatePath missing in event status API route

**Files:**
- Modify: `src/app/api/admin/events/[eventId]/status/route.ts`

**Step 1: Add revalidatePath import and calls**

After the `prisma.event.update()` call, add revalidation. The current code returns `{ success: true }` immediately without revalidating.

```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, isAdmin } from "@/lib/auth-server";
import { z } from "zod";
import { revalidatePath } from "next/cache";

// ... existing code unchanged until after prisma.event.update ...

  await prisma.event.update({
    where: { id: eventId },
    data: { status: parsed.data.status },
  });

  revalidatePath("/admin/events");
  revalidatePath(`/admin/events/${eventId}`);
  revalidatePath("/admin/dashboard");

  return NextResponse.json({ success: true });
```

**Step 2: Verify TypeScript**

Run: `cd /Users/taomariani-ferigoule/Desktop/fastlane && npx tsc --noEmit`
Expected: 0 errors

**Step 3: Commit**

```bash
git add src/app/api/admin/events/[eventId]/status/route.ts
git commit -m "fix: add revalidatePath to event status API route"
```

---

## Task 3: Bugfix — Use REVISED status + log STRATEGY_REJECTED activity

**Files:**
- Modify: `src/server/actions/strategy.ts`
- Modify: `src/server/actions/deliverables.ts`
- Modify: `src/lib/notify.ts`

**Step 1: Log STRATEGY_REJECTED in updateStrategyItemStatus**

In `strategy.ts`, inside the `$transaction`, after the `hasRejected` block that sets status to `CHANGES_REQUESTED`, add activity logging:

```ts
    } else if (hasRejected) {
      await tx.strategy.update({
        where: { id: item.strategyId },
        data: { status: "CHANGES_REQUESTED" },
      });

      await tx.activity.create({
        data: {
          type: "STRATEGY_REJECTED",
          message: `requested changes on strategy "${item.strategy.title}"`,
          userId: session.user.id,
          strategyId: item.strategyId,
        },
      });
    }
```

**Step 2: Improve notification messages with item names**

In the notification block of `updateStrategyItemStatus` (outside the transaction, around line 182-198), improve messages to include strategy title context:

```ts
  if (!isAdmin(user.role)) {
    if (parsed.data.status === "APPROVED") {
      await notifyAdmins(
        item.strategy.eventCompany.id,
        "Element approuve",
        `"${item.title}" (strategie "${item.strategy.title}") a ete approuve par le client.`,
        `/admin/events`,
      );
    } else if (parsed.data.status === "REJECTED") {
      await notifyAdmins(
        item.strategy.eventCompany.id,
        "Modifications demandees",
        `"${item.title}" (strategie "${item.strategy.title}") a ete refuse par le client.`,
        `/admin/events`,
      );
    }
  }
```

**Step 3: Verify TypeScript**

Run: `cd /Users/taomariani-ferigoule/Desktop/fastlane && npx tsc --noEmit`
Expected: 0 errors

**Step 4: Commit**

```bash
git add src/server/actions/strategy.ts
git commit -m "fix: log STRATEGY_REJECTED activity + improve notification messages"
```

---

## Task 4: New Zod schemas for update operations

**Files:**
- Modify: `src/types/index.ts`

**Step 1: Add update schemas**

Add the following schemas after the existing ones in `src/types/index.ts`:

```ts
// After createStrategySchema:
export const updateStrategySchema = z.object({
  id: z.string().cuid(),
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional(),
});

// After createStrategyItemSchema:
export const updateStrategyItemSchema = z.object({
  id: z.string().cuid(),
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional(),
});

// After createDeliverableSchema:
export const updateDeliverableSchema = z.object({
  id: z.string().cuid(),
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional(),
  type: z.enum([
    "EMAIL_TEMPLATE",
    "LANDING_PAGE",
    "SOCIAL_POST",
    "SCRIPT",
    "DOCUMENT",
    "AD_CREATIVE",
    "OTHER",
  ]),
  content: z.string().max(50000).optional(),
});

// After createCommentSchema:
export const createQuestionSchema = z.object({
  content: z.string().min(1, "Question cannot be empty").max(5000),
  targetCompanyId: z.string().cuid(),
  strategyId: z.string().cuid().optional(),
  deliverableId: z.string().cuid().optional(),
  strategyItemId: z.string().cuid().optional(),
});

export const answerQuestionSchema = z.object({
  id: z.string().cuid(),
  answer: z.string().min(1, "Answer cannot be empty").max(5000),
});
```

**Step 2: Verify TypeScript**

Run: `cd /Users/taomariani-ferigoule/Desktop/fastlane && npx tsc --noEmit`
Expected: 0 errors

**Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add Zod schemas for update operations and Q&A"
```

---

## Task 5: New server actions — updateStrategy, updateStrategyItem, resubmitStrategy

**Files:**
- Modify: `src/server/actions/strategy.ts`

**Step 1: Add import for new schemas**

Update the import at line 5:

```ts
import { createStrategySchema, createStrategyItemSchema, updateStrategyItemStatusSchema, updateStrategySchema, updateStrategyItemSchema } from "@/types";
```

**Step 2: Add updateStrategy action**

```ts
export async function updateStrategy(formData: FormData): Promise<ActionResult> {
  const session = await requireAdmin();

  const parsed = updateStrategySchema.safeParse({
    id: formData.get("id"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const strategy = await prisma.strategy.findUnique({
    where: { id: parsed.data.id },
    select: { id: true, title: true },
  });
  if (!strategy) return { success: false, error: "Strategy not found" };

  await prisma.strategy.update({
    where: { id: parsed.data.id },
    data: {
      title: parsed.data.title,
      description: parsed.data.description ?? null,
    },
  });

  await prisma.activity.create({
    data: {
      type: "STRATEGY_UPDATED",
      message: `updated strategy "${parsed.data.title}"`,
      userId: session.user.id,
      strategyId: parsed.data.id,
    },
  });

  revalidatePath("/admin/events");
  revalidatePath("/admin/strategies");
  revalidatePath("/portal/strategy");
  return { success: true, data: undefined };
}
```

**Step 3: Add updateStrategyItem action**

```ts
export async function updateStrategyItem(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const parsed = updateStrategyItemSchema.safeParse({
    id: formData.get("id"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const item = await prisma.strategyItem.findUnique({
    where: { id: parsed.data.id },
    select: { id: true },
  });
  if (!item) return { success: false, error: "Item not found" };

  await prisma.strategyItem.update({
    where: { id: parsed.data.id },
    data: {
      title: parsed.data.title,
      description: parsed.data.description ?? null,
    },
  });

  revalidatePath("/admin/events");
  revalidatePath("/admin/strategies");
  revalidatePath("/portal/strategy");
  return { success: true, data: undefined };
}
```

**Step 4: Add resubmitStrategy action**

```ts
export async function resubmitStrategy(strategyId: string): Promise<ActionResult> {
  const session = await requireAdmin();

  const strategy = await prisma.strategy.findUnique({
    where: { id: strategyId },
    select: { id: true, title: true, status: true, version: true, eventCompanyId: true },
  });

  if (!strategy) return { success: false, error: "Strategy not found" };
  if (strategy.status !== "CHANGES_REQUESTED") {
    return { success: false, error: "Strategy must be in CHANGES_REQUESTED status to resubmit" };
  }

  await prisma.$transaction(async (tx) => {
    // Reset all item statuses to PENDING
    await tx.strategyItem.updateMany({
      where: { strategyId },
      data: { status: "PENDING" },
    });

    await tx.strategy.update({
      where: { id: strategyId },
      data: {
        status: "PENDING_REVIEW",
        version: { increment: 1 },
      },
    });
  });

  await prisma.activity.create({
    data: {
      type: "STRATEGY_SUBMITTED",
      message: `resubmitted strategy "${strategy.title}" (v${strategy.version + 1})`,
      userId: session.user.id,
      strategyId,
    },
  });

  await notifyClientUsers(
    strategy.eventCompanyId,
    "Strategie revisee",
    `"${strategy.title}" a ete revisee et soumise a nouveau (v${strategy.version + 1}).`,
    `/portal/strategy/${strategyId}`,
  );

  revalidatePath("/admin/events");
  revalidatePath("/admin/strategies");
  revalidatePath("/portal/strategy");
  revalidatePath("/portal/dashboard");
  return { success: true, data: undefined };
}
```

**Step 5: Verify TypeScript**

Run: `cd /Users/taomariani-ferigoule/Desktop/fastlane && npx tsc --noEmit`
Expected: 0 errors

**Step 6: Commit**

```bash
git add src/server/actions/strategy.ts
git commit -m "feat: add updateStrategy, updateStrategyItem, resubmitStrategy actions"
```

---

## Task 6: New server actions — updateDeliverable, resubmitDeliverable, markDeliverableDelivered

**Files:**
- Modify: `src/server/actions/deliverables.ts`

**Step 1: Add import for new schema**

```ts
import { createDeliverableSchema, updateDeliverableSchema } from "@/types";
```

**Step 2: Add updateDeliverable action**

```ts
export async function updateDeliverable(formData: FormData): Promise<ActionResult> {
  const session = await requireAdmin();

  const parsed = updateDeliverableSchema.safeParse({
    id: formData.get("id"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    type: formData.get("type"),
    content: formData.get("content") || undefined,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const deliverable = await prisma.deliverable.findUnique({
    where: { id: parsed.data.id },
    select: { id: true, title: true },
  });
  if (!deliverable) return { success: false, error: "Deliverable not found" };

  await prisma.deliverable.update({
    where: { id: parsed.data.id },
    data: {
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      type: parsed.data.type,
      ...(parsed.data.content !== undefined ? { content: { text: parsed.data.content } } : {}),
    },
  });

  await prisma.activity.create({
    data: {
      type: "DELIVERABLE_SUBMITTED",
      message: `updated deliverable "${parsed.data.title}"`,
      userId: session.user.id,
      deliverableId: parsed.data.id,
    },
  });

  revalidatePath("/admin/events");
  revalidatePath("/admin/deliverables");
  revalidatePath("/portal/deliverables");
  return { success: true, data: undefined };
}
```

**Step 3: Add resubmitDeliverable action**

```ts
export async function resubmitDeliverable(deliverableId: string): Promise<ActionResult> {
  const session = await requireAdmin();

  const deliverable = await prisma.deliverable.findUnique({
    where: { id: deliverableId },
    select: { id: true, title: true, status: true, version: true, eventCompanyId: true },
  });

  if (!deliverable) return { success: false, error: "Deliverable not found" };
  if (deliverable.status !== "CHANGES_REQUESTED") {
    return { success: false, error: "Deliverable must be in CHANGES_REQUESTED status to resubmit" };
  }

  await prisma.deliverable.update({
    where: { id: deliverableId },
    data: {
      status: "IN_REVIEW",
      version: { increment: 1 },
    },
  });

  await prisma.activity.create({
    data: {
      type: "DELIVERABLE_SUBMITTED",
      message: `resubmitted "${deliverable.title}" (v${deliverable.version + 1})`,
      userId: session.user.id,
      deliverableId,
    },
  });

  await notifyClientUsers(
    deliverable.eventCompanyId,
    "Livrable revise",
    `"${deliverable.title}" a ete revise et soumis a nouveau (v${deliverable.version + 1}).`,
    `/portal/deliverables/${deliverableId}`,
  );

  revalidatePath("/admin/events");
  revalidatePath("/admin/deliverables");
  revalidatePath("/portal/deliverables");
  revalidatePath("/portal/dashboard");
  return { success: true, data: undefined };
}
```

**Step 4: Add markDeliverableDelivered action**

```ts
export async function markDeliverableDelivered(deliverableId: string): Promise<ActionResult> {
  const session = await requireAdmin();

  const deliverable = await prisma.deliverable.findUnique({
    where: { id: deliverableId },
    select: { id: true, title: true, status: true, eventCompanyId: true },
  });

  if (!deliverable) return { success: false, error: "Deliverable not found" };
  if (deliverable.status !== "APPROVED") {
    return { success: false, error: "Deliverable must be APPROVED before marking as delivered" };
  }

  await prisma.deliverable.update({
    where: { id: deliverableId },
    data: { status: "DELIVERED" },
  });

  await prisma.activity.create({
    data: {
      type: "STATUS_CHANGED",
      message: `marked "${deliverable.title}" as delivered`,
      userId: session.user.id,
      deliverableId,
    },
  });

  await notifyClientUsers(
    deliverable.eventCompanyId,
    "Livrable livre",
    `"${deliverable.title}" a ete livre.`,
    `/portal/deliverables/${deliverableId}`,
  );

  revalidatePath("/admin/events");
  revalidatePath("/admin/deliverables");
  revalidatePath("/portal/deliverables");
  revalidatePath("/portal/dashboard");
  return { success: true, data: undefined };
}
```

**Step 5: Verify TypeScript**

Run: `cd /Users/taomariani-ferigoule/Desktop/fastlane && npx tsc --noEmit`
Expected: 0 errors

**Step 6: Commit**

```bash
git add src/server/actions/deliverables.ts
git commit -m "feat: add updateDeliverable, resubmitDeliverable, markDeliverableDelivered actions"
```

---

## Task 7: Edit dialog components + ResubmitButton

**Files:**
- Create: `src/components/admin/edit-strategy-dialog.tsx`
- Create: `src/components/admin/edit-strategy-item-dialog.tsx`
- Create: `src/components/admin/edit-deliverable-dialog.tsx`
- Create: `src/components/admin/edit-event-dialog.tsx`
- Create: `src/components/admin/resubmit-button.tsx`

**Step 1: Create EditStrategyDialog**

```tsx
// src/components/admin/edit-strategy-dialog.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateStrategy } from "@/server/actions/strategy";

interface EditStrategyDialogProps {
  strategy: { id: string; title: string; description: string | null };
}

export function EditStrategyDialog({ strategy }: EditStrategyDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("id", strategy.id);
    const result = await updateStrategy(formData);
    if (result.success) {
      toast.success("Strategie mise a jour");
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
          <DialogTitle>Modifier la strategie</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titre</Label>
            <Input id="title" name="title" defaultValue={strategy.title} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" defaultValue={strategy.description ?? ""} rows={3} />
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

**Step 2: Create EditStrategyItemDialog**

```tsx
// src/components/admin/edit-strategy-item-dialog.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateStrategyItem } from "@/server/actions/strategy";

interface EditStrategyItemDialogProps {
  item: { id: string; title: string; description: string | null };
}

export function EditStrategyItemDialog({ item }: EditStrategyItemDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("id", item.id);
    const result = await updateStrategyItem(formData);
    if (result.success) {
      toast.success("Element mis a jour");
      setOpen(false);
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
          <Pencil className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier l&apos;element</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titre</Label>
            <Input id="title" name="title" defaultValue={item.title} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" defaultValue={item.description ?? ""} rows={3} />
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

**Step 3: Create EditDeliverableDialog**

```tsx
// src/components/admin/edit-deliverable-dialog.tsx
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
import { updateDeliverable } from "@/server/actions/deliverables";

const DELIVERABLE_TYPES = [
  { value: "EMAIL_TEMPLATE", label: "Email template" },
  { value: "LANDING_PAGE", label: "Landing page" },
  { value: "SOCIAL_POST", label: "Post social" },
  { value: "SCRIPT", label: "Script" },
  { value: "DOCUMENT", label: "Document" },
  { value: "AD_CREATIVE", label: "Publicite" },
  { value: "OTHER", label: "Autre" },
];

interface EditDeliverableDialogProps {
  deliverable: {
    id: string;
    title: string;
    description: string | null;
    type: string;
    content: unknown;
  };
}

export function EditDeliverableDialog({ deliverable }: EditDeliverableDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState(deliverable.type);

  const textContent = deliverable.content && typeof deliverable.content === "object" && deliverable.content !== null && "text" in deliverable.content
    ? String((deliverable.content as Record<string, unknown>).text ?? "")
    : "";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("id", deliverable.id);
    formData.set("type", type);
    const result = await updateDeliverable(formData);
    if (result.success) {
      toast.success("Livrable mis a jour");
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Modifier le livrable</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre</Label>
              <Input id="title" name="title" defaultValue={deliverable.title} required />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DELIVERABLE_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" defaultValue={deliverable.description ?? ""} rows={2} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">Contenu</Label>
            <Textarea id="content" name="content" defaultValue={textContent} rows={8} placeholder="Contenu du livrable (texte, script, etc.)" />
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

**Step 4: Create EditEventDialog**

```tsx
// src/components/admin/edit-event-dialog.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateEvent } from "@/server/actions/events";

interface EditEventDialogProps {
  event: {
    id: string;
    name: string;
    description: string | null;
    startDate: Date;
    endDate: Date;
  };
}

export function EditEventDialog({ event }: EditEventDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const startStr = new Date(event.startDate).toISOString().slice(0, 10);
  const endStr = new Date(event.endDate).toISOString().slice(0, 10);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("id", event.id);
    const result = await updateEvent(formData);
    if (result.success) {
      toast.success("Evenement mis a jour");
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
          <DialogTitle>Modifier l&apos;evenement</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom</Label>
            <Input id="name" name="name" defaultValue={event.name} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" defaultValue={event.description ?? ""} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Date de debut</Label>
              <Input id="startDate" name="startDate" type="date" defaultValue={startStr} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Date de fin</Label>
              <Input id="endDate" name="endDate" type="date" defaultValue={endStr} required />
            </div>
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

**Step 5: Create ResubmitButton**

```tsx
// src/components/admin/resubmit-button.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { resubmitStrategy } from "@/server/actions/strategy";
import { resubmitDeliverable } from "@/server/actions/deliverables";

interface ResubmitButtonProps {
  id: string;
  type: "strategy" | "deliverable";
}

export function ResubmitButton({ id, type }: ResubmitButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const result = type === "strategy"
      ? await resubmitStrategy(id)
      : await resubmitDeliverable(id);
    if (result.success) {
      toast.success(type === "strategy" ? "Strategie resoumise" : "Livrable resoumis");
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  }

  return (
    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleClick} disabled={loading}>
      {loading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <RotateCcw className="mr-1 h-3 w-3" />}
      Resoumettre
    </Button>
  );
}
```

**Step 6: Verify TypeScript**

Run: `cd /Users/taomariani-ferigoule/Desktop/fastlane && npx tsc --noEmit`
Expected: 0 errors

**Step 7: Commit**

```bash
git add src/components/admin/edit-strategy-dialog.tsx src/components/admin/edit-strategy-item-dialog.tsx src/components/admin/edit-deliverable-dialog.tsx src/components/admin/edit-event-dialog.tsx src/components/admin/resubmit-button.tsx
git commit -m "feat: add edit dialog components and ResubmitButton"
```

---

## Task 8: Wire edit/resubmit into strategy and deliverable admin pages

**Files:**
- Modify: `src/app/admin/events/[eventId]/strategy/page.tsx`
- Modify: `src/app/admin/events/[eventId]/deliverables/page.tsx`

**Step 1: Update strategy page**

Add imports and wire the edit + resubmit components:

```tsx
import { EditStrategyDialog } from "@/components/admin/edit-strategy-dialog";
import { EditStrategyItemDialog } from "@/components/admin/edit-strategy-item-dialog";
import { ResubmitButton } from "@/components/admin/resubmit-button";
```

In the strategy card header (around line 42-51), add EditStrategyDialog next to the status badge, and add ResubmitButton when status is CHANGES_REQUESTED:

Replace the strategy header div:
```tsx
<div className="flex items-center gap-2 shrink-0 ml-3">
  <StatusBadge status={strategy.status} />
  <EditStrategyDialog strategy={{ id: strategy.id, title: strategy.title, description: strategy.description }} />
  {strategy.status === "DRAFT" && <SubmitStrategyButton strategyId={strategy.id} />}
  {strategy.status === "CHANGES_REQUESTED" && <ResubmitButton id={strategy.id} type="strategy" />}
</div>
```

In the strategy item rows (around line 53-61), add EditStrategyItemDialog:

Replace the item row:
```tsx
<div key={item.id} className="flex items-center justify-between px-3 py-2">
  <div className="min-w-0">
    <p className="text-sm"><span className="text-muted-foreground tabular-nums">{index + 1}.</span> {item.title}</p>
    {item.description && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5 pl-5">{item.description}</p>}
  </div>
  <div className="flex items-center gap-1.5 shrink-0 ml-3">
    <StatusBadge status={item.status} />
    <EditStrategyItemDialog item={{ id: item.id, title: item.title, description: item.description }} />
  </div>
</div>
```

**Step 2: Update deliverables page**

Add imports:

```tsx
import { EditDeliverableDialog } from "@/components/admin/edit-deliverable-dialog";
import { ResubmitButton } from "@/components/admin/resubmit-button";
import { MarkDeliveredButton } from "@/components/admin/mark-delivered-button";
```

In the table rows, add action buttons in the last `<td>`:

```tsx
<td className="px-3 py-2.5">
  <div className="flex items-center gap-1">
    <EditDeliverableDialog deliverable={{ id: d.id, title: d.title, description: d.description, type: d.type, content: d.content }} />
    {d.status === "DRAFT" && <SubmitDeliverableButton deliverableId={d.id} />}
    {d.status === "CHANGES_REQUESTED" && <ResubmitButton id={d.id} type="deliverable" />}
    {d.status === "APPROVED" && <MarkDeliveredButton deliverableId={d.id} />}
  </div>
</td>
```

**Step 3: Create MarkDeliveredButton**

```tsx
// src/components/admin/mark-delivered-button.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, PackageCheck } from "lucide-react";
import { toast } from "sonner";
import { markDeliverableDelivered } from "@/server/actions/deliverables";

interface MarkDeliveredButtonProps {
  deliverableId: string;
}

export function MarkDeliveredButton({ deliverableId }: MarkDeliveredButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const result = await markDeliverableDelivered(deliverableId);
    if (result.success) {
      toast.success("Livrable marque comme livre");
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  }

  return (
    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleClick} disabled={loading}>
      {loading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <PackageCheck className="mr-1 h-3 w-3" />}
      Livrer
    </Button>
  );
}
```

**Step 4: Verify TypeScript**

Run: `cd /Users/taomariani-ferigoule/Desktop/fastlane && npx tsc --noEmit`
Expected: 0 errors

**Step 5: Commit**

```bash
git add src/app/admin/events/[eventId]/strategy/page.tsx src/app/admin/events/[eventId]/deliverables/page.tsx src/components/admin/mark-delivered-button.tsx
git commit -m "feat: wire edit/resubmit/deliver buttons into admin strategy and deliverables pages"
```

---

## Task 9: Prisma schema — add Question model

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Add Question model and update relations**

Add relations to the User model (after the `notifications` relation):

```prisma
  questionsAsked    Question[] @relation("QuestionsAsked")
```

Add relation to the Company model (after the `events` relation):

```prisma
  questions Question[]
```

Add relations to Strategy, StrategyItem, and Deliverable models:

In Strategy (after `activities`):
```prisma
  questions  Question[]
```

In StrategyItem (after `comments`):
```prisma
  questions  Question[]
```

In Deliverable (after `activities`):
```prisma
  questions  Question[]
```

Add the Question model at the end of the file (before the Notification model or after it):

```prisma
// ==================== QUESTIONS (Q&A) ====================

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
  @@index([strategyItemId])
  @@index([authorId])
  @@index([answeredAt])
}
```

**Step 2: Push schema to database**

Run: `cd /Users/taomariani-ferigoule/Desktop/fastlane && npx prisma db push`
Expected: Schema changes applied successfully

**Step 3: Verify TypeScript**

Run: `cd /Users/taomariani-ferigoule/Desktop/fastlane && npx tsc --noEmit`
Expected: 0 errors (Prisma client regenerated)

**Step 4: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: add Question model for Q&A system"
```

---

## Task 10: Q&A server actions

**Files:**
- Create: `src/server/actions/questions.ts`

**Step 1: Create the questions server actions file**

```ts
// src/server/actions/questions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin, getSession, getUserWithRole, isAdmin } from "@/lib/auth-server";
import { createQuestionSchema, answerQuestionSchema } from "@/types";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";
import { notifyClientUsers, notifyAdmins } from "@/lib/notify";

export async function createQuestion(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const session = await requireAdmin();

  const parsed = createQuestionSchema.safeParse({
    content: formData.get("content"),
    targetCompanyId: formData.get("targetCompanyId"),
    strategyId: formData.get("strategyId") || undefined,
    deliverableId: formData.get("deliverableId") || undefined,
    strategyItemId: formData.get("strategyItemId") || undefined,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  // Find the eventCompanyId for notification
  let eventCompanyId: string | null = null;
  if (parsed.data.strategyId) {
    const s = await prisma.strategy.findUnique({ where: { id: parsed.data.strategyId }, select: { eventCompanyId: true } });
    eventCompanyId = s?.eventCompanyId ?? null;
  } else if (parsed.data.deliverableId) {
    const d = await prisma.deliverable.findUnique({ where: { id: parsed.data.deliverableId }, select: { eventCompanyId: true } });
    eventCompanyId = d?.eventCompanyId ?? null;
  }

  const question = await prisma.question.create({
    data: {
      content: parsed.data.content,
      authorId: session.user.id,
      targetCompanyId: parsed.data.targetCompanyId,
      strategyId: parsed.data.strategyId ?? null,
      deliverableId: parsed.data.deliverableId ?? null,
      strategyItemId: parsed.data.strategyItemId ?? null,
    },
  });

  // Notify client
  if (eventCompanyId) {
    await notifyClientUsers(
      eventCompanyId,
      "Nouvelle question",
      "L'equipe vous a pose une question.",
      parsed.data.strategyId
        ? `/portal/strategy/${parsed.data.strategyId}`
        : parsed.data.deliverableId
          ? `/portal/deliverables/${parsed.data.deliverableId}`
          : "/portal/dashboard",
    );
  }

  revalidatePath("/admin");
  revalidatePath("/portal");
  return { success: true, data: { id: question.id } };
}

export async function answerQuestion(formData: FormData): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { success: false, error: "Not authenticated" };

  const parsed = answerQuestionSchema.safeParse({
    id: formData.get("id"),
    answer: formData.get("answer"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const question = await prisma.question.findUnique({
    where: { id: parsed.data.id },
    select: { id: true, targetCompanyId: true, strategyId: true, deliverableId: true, answeredAt: true },
  });

  if (!question) return { success: false, error: "Question not found" };
  if (question.answeredAt) return { success: false, error: "Question already answered" };

  // Verify access: only target company users can answer
  const user = await getUserWithRole(session.user.id);
  if (!user) return { success: false, error: "User not found" };

  if (!isAdmin(user.role) && user.companyId !== question.targetCompanyId) {
    return { success: false, error: "Access denied" };
  }

  await prisma.question.update({
    where: { id: parsed.data.id },
    data: {
      answer: parsed.data.answer,
      answeredAt: new Date(),
    },
  });

  // Notify admins that client answered
  // Find eventCompanyId for the notification
  let eventCompanyId: string | null = null;
  if (question.strategyId) {
    const s = await prisma.strategy.findUnique({ where: { id: question.strategyId }, select: { eventCompanyId: true } });
    eventCompanyId = s?.eventCompanyId ?? null;
  } else if (question.deliverableId) {
    const d = await prisma.deliverable.findUnique({ where: { id: question.deliverableId }, select: { eventCompanyId: true } });
    eventCompanyId = d?.eventCompanyId ?? null;
  }

  if (eventCompanyId) {
    await notifyAdmins(
      eventCompanyId,
      "Reponse recue",
      "Le client a repondu a votre question.",
      "/admin/dashboard",
    );
  }

  revalidatePath("/admin");
  revalidatePath("/portal");
  return { success: true, data: undefined };
}

export async function getUnansweredQuestions() {
  await requireAdmin();

  return prisma.question.findMany({
    where: { answeredAt: null },
    include: {
      author: { select: { name: true } },
      targetCompany: { select: { name: true } },
      strategy: { select: { id: true, title: true } },
      deliverable: { select: { id: true, title: true } },
      strategyItem: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
```

**Step 2: Verify TypeScript**

Run: `cd /Users/taomariani-ferigoule/Desktop/fastlane && npx tsc --noEmit`
Expected: 0 errors

**Step 3: Commit**

```bash
git add src/server/actions/questions.ts
git commit -m "feat: add Q&A server actions (createQuestion, answerQuestion, getUnansweredQuestions)"
```

---

## Task 11: QuestionSection component

**Files:**
- Create: `src/components/shared/question-section.tsx`

**Step 1: Create the QuestionSection component**

```tsx
// src/components/shared/question-section.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, MessageCircleQuestion, CheckCircle2 } from "lucide-react";
import { createQuestion } from "@/server/actions/questions";
import { answerQuestion } from "@/server/actions/questions";
import { relativeTime } from "@/lib/utils";

interface Question {
  id: string;
  content: string;
  answer: string | null;
  answeredAt: Date | null;
  createdAt: Date;
  author: { name: string };
}

interface QuestionSectionProps {
  questions: Question[];
  isAdmin: boolean;
  targetCompanyId?: string;
  strategyId?: string;
  strategyItemId?: string;
  deliverableId?: string;
}

export function QuestionSection({
  questions,
  isAdmin,
  targetCompanyId,
  strategyId,
  strategyItemId,
  deliverableId,
}: QuestionSectionProps) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState("");

  async function handleAskQuestion() {
    if (!content.trim() || !targetCompanyId) return;
    setLoading(true);

    const formData = new FormData();
    formData.set("content", content);
    formData.set("targetCompanyId", targetCompanyId);
    if (strategyId) formData.set("strategyId", strategyId);
    if (strategyItemId) formData.set("strategyItemId", strategyItemId);
    if (deliverableId) formData.set("deliverableId", deliverableId);

    const result = await createQuestion(formData);
    if (result.success) {
      setContent("");
      toast.success("Question envoyee");
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  }

  async function handleAnswer(questionId: string) {
    if (!answerText.trim()) return;
    setLoading(true);

    const formData = new FormData();
    formData.set("id", questionId);
    formData.set("answer", answerText);

    const result = await answerQuestion(formData);
    if (result.success) {
      setAnsweringId(null);
      setAnswerText("");
      toast.success("Reponse envoyee");
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  }

  const unanswered = questions.filter((q) => !q.answeredAt);
  const answered = questions.filter((q) => q.answeredAt);

  return (
    <div className="space-y-3">
      {unanswered.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-medium text-amber-600 uppercase tracking-wide">En attente de reponse ({unanswered.length})</p>
          {unanswered.map((q) => (
            <div key={q.id} className="rounded-lg border border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20 p-3 space-y-2">
              <div className="flex items-start gap-2">
                <MessageCircleQuestion className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">{q.author.name}</span>
                    <span className="text-[11px] text-muted-foreground">{relativeTime(q.createdAt)}</span>
                  </div>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{q.content}</p>
                </div>
              </div>
              {!isAdmin && (
                answeringId === q.id ? (
                  <div className="ml-6 space-y-2">
                    <Textarea
                      placeholder="Votre reponse..."
                      value={answerText}
                      onChange={(e) => setAnswerText(e.target.value)}
                      rows={2}
                      className="text-xs"
                      onKeyDown={(e) => {
                        if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && answerText.trim()) {
                          e.preventDefault();
                          handleAnswer(q.id);
                        }
                      }}
                    />
                    <div className="flex gap-1">
                      <Button size="sm" className="h-6 text-xs" onClick={() => handleAnswer(q.id)} disabled={loading || !answerText.trim()}>
                        {loading && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                        Repondre
                      </Button>
                      <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => { setAnsweringId(null); setAnswerText(""); }}>
                        Annuler
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" className="h-6 text-xs ml-6" onClick={() => setAnsweringId(q.id)}>
                    Repondre
                  </Button>
                )
              )}
            </div>
          ))}
        </div>
      )}

      {answered.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Repondues ({answered.length})</p>
          {answered.map((q) => (
            <div key={q.id} className="rounded-lg border p-3 space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">{q.author.name}</span>
                    <span className="text-[11px] text-muted-foreground">{relativeTime(q.createdAt)}</span>
                  </div>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{q.content}</p>
                  <div className="mt-2 pl-3 border-l-2 border-emerald-200 dark:border-emerald-800">
                    <p className="text-sm whitespace-pre-wrap">{q.answer}</p>
                    {q.answeredAt && (
                      <p className="text-[11px] text-muted-foreground mt-1">Repondu {relativeTime(q.answeredAt)}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Admin: ask new question */}
      {isAdmin && targetCompanyId && (
        <div className="flex gap-2 pt-1">
          <Textarea
            placeholder="Poser une question au client... (Ctrl+Entree pour envoyer)"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && content.trim()) {
                e.preventDefault();
                handleAskQuestion();
              }
            }}
            rows={1}
            className="text-xs min-h-8"
            disabled={loading}
          />
          <Button
            size="sm"
            className="h-8 text-xs shrink-0"
            onClick={handleAskQuestion}
            disabled={loading || !content.trim()}
          >
            {loading && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
            Poser
          </Button>
        </div>
      )}

      {questions.length === 0 && !isAdmin && (
        <p className="text-xs text-muted-foreground text-center py-2">Aucune question.</p>
      )}
    </div>
  );
}
```

**Step 2: Verify TypeScript**

Run: `cd /Users/taomariani-ferigoule/Desktop/fastlane && npx tsc --noEmit`
Expected: 0 errors

**Step 3: Commit**

```bash
git add src/components/shared/question-section.tsx
git commit -m "feat: add QuestionSection component for Q&A"
```

---

## Task 12: Admin detail pages (strategy + deliverable)

**Files:**
- Create: `src/app/admin/events/[eventId]/strategy/[strategyId]/page.tsx`
- Create: `src/app/admin/events/[eventId]/deliverables/[deliverableId]/page.tsx`

**Step 1: Create admin strategy detail page**

```tsx
// src/app/admin/events/[eventId]/strategy/[strategyId]/page.tsx
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { StatusBadge } from "@/components/shared/status-badge";
import { CommentSection } from "@/components/shared/comment-section";
import { QuestionSection } from "@/components/shared/question-section";
import { EditStrategyDialog } from "@/components/admin/edit-strategy-dialog";
import { EditStrategyItemDialog } from "@/components/admin/edit-strategy-item-dialog";
import { ResubmitButton } from "@/components/admin/resubmit-button";
import { SubmitStrategyButton } from "@/components/admin/submit-strategy-button";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export async function generateMetadata({ params }: { params: Promise<{ strategyId: string }> }) {
  const { strategyId } = await params;
  const strategy = await prisma.strategy.findUnique({ where: { id: strategyId }, select: { title: true } });
  return { title: strategy?.title ?? "Strategie" };
}

export default async function AdminStrategyDetailPage({
  params,
}: {
  params: Promise<{ eventId: string; strategyId: string }>;
}) {
  const session = await requireAdmin();
  const { eventId, strategyId } = await params;

  const strategy = await prisma.strategy.findUnique({
    where: { id: strategyId },
    include: {
      eventCompany: {
        include: {
          event: { select: { name: true } },
          company: { select: { id: true, name: true } },
        },
      },
      items: {
        orderBy: { order: "asc" },
        include: {
          comments: {
            include: {
              author: { select: { name: true, image: true, id: true } },
              replies: {
                include: { author: { select: { name: true, image: true, id: true } } },
                orderBy: { createdAt: "asc" },
              },
            },
            where: { parentId: null },
            orderBy: { createdAt: "asc" },
          },
          questions: {
            include: { author: { select: { name: true } } },
            orderBy: { createdAt: "desc" },
          },
        },
      },
      comments: {
        include: {
          author: { select: { name: true, image: true, id: true } },
          replies: {
            include: { author: { select: { name: true, image: true, id: true } } },
            orderBy: { createdAt: "asc" },
          },
        },
        where: { parentId: null, strategyItemId: null },
        orderBy: { createdAt: "asc" },
      },
      questions: {
        where: { strategyItemId: null },
        include: { author: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!strategy) notFound();

  const approvedItems = strategy.items.filter((i) => i.status === "APPROVED").length;
  const totalItems = strategy.items.length;
  const companyId = strategy.eventCompany.company.id;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2 h-7 text-xs text-muted-foreground">
          <Link href={`/admin/events/${eventId}/strategy`}><ArrowLeft className="mr-1 h-3 w-3" />Strategies</Link>
        </Button>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold tracking-tight">{strategy.title}</h1>
          <EditStrategyDialog strategy={{ id: strategy.id, title: strategy.title, description: strategy.description }} />
        </div>
        {strategy.description && <p className="text-sm text-muted-foreground mt-0.5">{strategy.description}</p>}
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-2">
          <StatusBadge status={strategy.status} />
          <span>{strategy.eventCompany.company.name}</span>
          <span>{strategy.eventCompany.event.name}</span>
          <span>v{strategy.version}</span>
          {totalItems > 0 && <span>{approvedItems}/{totalItems} approuves</span>}
        </div>
        {strategy.status === "DRAFT" && <div className="mt-2"><SubmitStrategyButton strategyId={strategy.id} /></div>}
        {strategy.status === "CHANGES_REQUESTED" && <div className="mt-2"><ResubmitButton id={strategy.id} type="strategy" /></div>}
      </div>

      {/* Strategy items */}
      {strategy.items.map((item, index) => (
        <div key={item.id} className="rounded-md border">
          <div className="flex items-center justify-between px-3 py-2.5 border-b">
            <div className="min-w-0">
              <p className="text-sm font-medium"><span className="text-muted-foreground tabular-nums">{index + 1}.</span> {item.title}</p>
              {item.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 pl-5">{item.description}</p>}
            </div>
            <div className="flex items-center gap-1.5 shrink-0 ml-3">
              <StatusBadge status={item.status} />
              <EditStrategyItemDialog item={{ id: item.id, title: item.title, description: item.description }} />
            </div>
          </div>
          {/* Item comments */}
          <div className="px-3 py-2.5 space-y-3">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Commentaires</p>
            <CommentSection
              comments={item.comments.map((c) => ({ ...c, authorId: c.author.id ?? undefined, replies: c.replies.map((r) => ({ ...r, authorId: r.author.id ?? undefined })) }))}
              currentUserId={session.user.id}
              strategyId={strategy.id}
              strategyItemId={item.id}
            />
          </div>
          {/* Item questions */}
          <div className="px-3 py-2.5 border-t space-y-3">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Questions</p>
            <QuestionSection
              questions={item.questions}
              isAdmin={true}
              targetCompanyId={companyId}
              strategyId={strategy.id}
              strategyItemId={item.id}
            />
          </div>
        </div>
      ))}

      {/* Global comments */}
      <div>
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">Commentaires generaux</h2>
        <div className="rounded-xl border p-3">
          <CommentSection
            comments={strategy.comments.map((c) => ({ ...c, authorId: c.author.id ?? undefined, replies: c.replies.map((r) => ({ ...r, authorId: r.author.id ?? undefined })) }))}
            currentUserId={session.user.id}
            strategyId={strategy.id}
          />
        </div>
      </div>

      {/* Global questions */}
      <div>
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">Questions generales</h2>
        <div className="rounded-xl border p-3">
          <QuestionSection
            questions={strategy.questions}
            isAdmin={true}
            targetCompanyId={companyId}
            strategyId={strategy.id}
          />
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Create admin deliverable detail page**

```tsx
// src/app/admin/events/[eventId]/deliverables/[deliverableId]/page.tsx
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { StatusBadge } from "@/components/shared/status-badge";
import { CommentSection } from "@/components/shared/comment-section";
import { QuestionSection } from "@/components/shared/question-section";
import { EditDeliverableDialog } from "@/components/admin/edit-deliverable-dialog";
import { ResubmitButton } from "@/components/admin/resubmit-button";
import { MarkDeliveredButton } from "@/components/admin/mark-delivered-button";
import { SubmitDeliverableButton } from "@/components/admin/submit-deliverable-button";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Download } from "lucide-react";
import Link from "next/link";
import { relativeTime } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ deliverableId: string }> }) {
  const { deliverableId } = await params;
  const d = await prisma.deliverable.findUnique({ where: { id: deliverableId }, select: { title: true } });
  return { title: d?.title ?? "Livrable" };
}

export default async function AdminDeliverableDetailPage({
  params,
}: {
  params: Promise<{ eventId: string; deliverableId: string }>;
}) {
  const session = await requireAdmin();
  const { eventId, deliverableId } = await params;

  const deliverable = await prisma.deliverable.findUnique({
    where: { id: deliverableId },
    include: {
      eventCompany: {
        include: {
          event: { select: { name: true } },
          company: { select: { id: true, name: true } },
        },
      },
      comments: {
        include: {
          author: { select: { name: true, image: true, id: true } },
          replies: {
            include: { author: { select: { name: true, image: true, id: true } } },
            orderBy: { createdAt: "asc" },
          },
        },
        where: { parentId: null },
        orderBy: { createdAt: "asc" },
      },
      questions: {
        include: { author: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!deliverable) notFound();

  const content = deliverable.content as Record<string, unknown> | null;
  const textContent = content && "text" in content ? String(content.text) : null;
  const companyId = deliverable.eventCompany.company.id;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2 h-7 text-xs text-muted-foreground">
          <Link href={`/admin/events/${eventId}/deliverables`}><ArrowLeft className="mr-1 h-3 w-3" />Livrables</Link>
        </Button>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold tracking-tight">{deliverable.title}</h1>
          <EditDeliverableDialog deliverable={{ id: deliverable.id, title: deliverable.title, description: deliverable.description, type: deliverable.type, content: deliverable.content }} />
        </div>
        {deliverable.description && <p className="text-sm text-muted-foreground mt-0.5">{deliverable.description}</p>}
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-2">
          <StatusBadge status={deliverable.status} />
          <span>{deliverable.eventCompany.company.name}</span>
          <span>{deliverable.type.replace(/_/g, " ").toLowerCase()}</span>
          <span>v{deliverable.version}</span>
          <span>Mis a jour {relativeTime(deliverable.updatedAt)}</span>
        </div>
        <div className="flex gap-2 mt-2">
          {deliverable.status === "DRAFT" && <SubmitDeliverableButton deliverableId={deliverable.id} />}
          {deliverable.status === "CHANGES_REQUESTED" && <ResubmitButton id={deliverable.id} type="deliverable" />}
          {deliverable.status === "APPROVED" && <MarkDeliveredButton deliverableId={deliverable.id} />}
        </div>
      </div>

      {/* Content */}
      {textContent && (
        <div>
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Contenu</h2>
          <div className="rounded-xl border p-4">
            <pre className="whitespace-pre-wrap font-sans text-sm">{textContent}</pre>
          </div>
        </div>
      )}

      {/* File */}
      {deliverable.fileUrl && (
        <div className="flex items-center gap-3 rounded-xl border p-4">
          <FileText className="h-8 w-8 text-muted-foreground shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{deliverable.fileName ?? "Fichier joint"}</p>
          </div>
          <Button variant="outline" size="sm" asChild className="h-7 text-xs">
            <a href={deliverable.fileUrl} download><Download className="mr-1 h-3 w-3" />Telecharger</a>
          </Button>
        </div>
      )}

      {/* Comments */}
      <div>
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Commentaires ({deliverable.comments.length})</h2>
        <div className="rounded-xl border p-3">
          <CommentSection
            comments={deliverable.comments.map((c) => ({ ...c, authorId: c.author.id ?? undefined, replies: c.replies.map((r) => ({ ...r, authorId: r.author.id ?? undefined })) }))}
            currentUserId={session.user.id}
            deliverableId={deliverable.id}
          />
        </div>
      </div>

      {/* Questions */}
      <div>
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Questions</h2>
        <div className="rounded-xl border p-3">
          <QuestionSection
            questions={deliverable.questions}
            isAdmin={true}
            targetCompanyId={companyId}
            deliverableId={deliverable.id}
          />
        </div>
      </div>
    </div>
  );
}
```

**Step 3: Make strategies and deliverables clickable in the admin list pages**

In `src/app/admin/events/[eventId]/strategy/page.tsx`, wrap strategy titles with a link to the detail page:

Replace the strategy title `<p>`:
```tsx
<Link href={`/admin/events/${eventId}/strategy/${strategy.id}`} className="text-sm font-medium hover:underline">
  {strategy.title}
</Link>
```

In `src/app/admin/events/[eventId]/deliverables/page.tsx`, wrap deliverable titles with a link:

Replace the deliverable title `<p>`:
```tsx
<Link href={`/admin/events/${eventId}/deliverables/${d.id}`} className="font-medium hover:underline">
  {d.title}
</Link>
```

**Step 4: Verify TypeScript**

Run: `cd /Users/taomariani-ferigoule/Desktop/fastlane && npx tsc --noEmit`
Expected: 0 errors

**Step 5: Commit**

```bash
git add src/app/admin/events/[eventId]/strategy/[strategyId]/page.tsx src/app/admin/events/[eventId]/deliverables/[deliverableId]/page.tsx src/app/admin/events/[eventId]/strategy/page.tsx src/app/admin/events/[eventId]/deliverables/page.tsx
git commit -m "feat: add admin detail pages for strategies and deliverables with comments + Q&A"
```

---

## Task 13: Update portal pages to show Q&A

**Files:**
- Modify: `src/app/portal/strategy/[strategyId]/page.tsx`
- Modify: `src/app/portal/deliverables/[deliverableId]/page.tsx`

**Step 1: Add QuestionSection to portal strategy detail**

Add import:
```tsx
import { QuestionSection } from "@/components/shared/question-section";
```

Add to the Prisma query's `items.include`:
```tsx
questions: {
  include: { author: { select: { name: true } } },
  orderBy: { createdAt: "desc" },
},
```

Also add to the top-level strategy include (for general questions):
```tsx
questions: {
  where: { strategyItemId: null },
  include: { author: { select: { name: true } } },
  orderBy: { createdAt: "desc" },
},
```

Add QuestionSection after the CommentSection in StrategyItemCard (or after the global comments section). Since StrategyItemCard is a separate component, the simplest approach is to add a global questions section after the existing global comments:

```tsx
{/* Global questions */}
<div>
  <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">Questions</h2>
  <div className="rounded-xl border p-3">
    <QuestionSection
      questions={strategy.questions}
      isAdmin={false}
      strategyId={strategy.id}
    />
  </div>
</div>
```

**Step 2: Add QuestionSection to portal deliverable detail**

Add import:
```tsx
import { QuestionSection } from "@/components/shared/question-section";
```

Add to the Prisma query include:
```tsx
questions: {
  include: { author: { select: { name: true } } },
  orderBy: { createdAt: "desc" },
},
```

Add after the comments section:
```tsx
{/* Questions */}
<div>
  <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
    Questions
  </h2>
  <div className="rounded-xl border p-3">
    <QuestionSection
      questions={deliverable.questions}
      isAdmin={false}
      deliverableId={deliverable.id}
    />
  </div>
</div>
```

**Step 3: Verify TypeScript**

Run: `cd /Users/taomariani-ferigoule/Desktop/fastlane && npx tsc --noEmit`
Expected: 0 errors

**Step 4: Commit**

```bash
git add src/app/portal/strategy/[strategyId]/page.tsx src/app/portal/deliverables/[deliverableId]/page.tsx
git commit -m "feat: add Q&A sections to portal strategy and deliverable pages"
```

---

## Task 14: Dashboard widget — unanswered questions

**Files:**
- Modify: `src/app/admin/dashboard/page.tsx`

**Step 1: Add unanswered questions query**

In the existing `Promise.all` or after the data fetching, add:

```ts
const unansweredQuestions = await prisma.question.findMany({
  where: { answeredAt: null },
  include: {
    author: { select: { name: true } },
    targetCompany: { select: { name: true } },
    strategy: { select: { id: true, title: true, eventCompany: { select: { eventId: true } } } },
    deliverable: { select: { id: true, title: true, eventCompany: { select: { eventId: true } } } },
    strategyItem: { select: { id: true, title: true } },
  },
  orderBy: { createdAt: "desc" },
  take: 10,
});
```

**Step 2: Add questions widget section**

After the "Items en attente" section and before the activity section, add:

```tsx
{/* Unanswered questions */}
{unansweredQuestions.length > 0 && (
  <div>
    <h2 className="text-sm font-medium mb-3">Questions en attente ({unansweredQuestions.length})</h2>
    <div className="space-y-2">
      {unansweredQuestions.map((q) => {
        const eventId = q.strategy?.eventCompany?.eventId ?? q.deliverable?.eventCompany?.eventId;
        const link = q.strategy && eventId
          ? `/admin/events/${eventId}/strategy/${q.strategy.id}`
          : q.deliverable && eventId
            ? `/admin/events/${eventId}/deliverables/${q.deliverable.id}`
            : null;
        return (
          <div key={q.id} className="rounded-md border p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <span className="font-medium text-foreground">{q.targetCompany.name}</span>
              {q.strategy && <span>• {q.strategy.title}</span>}
              {q.deliverable && <span>• {q.deliverable.title}</span>}
              {q.strategyItem && <span>• {q.strategyItem.title}</span>}
            </div>
            <p className="text-sm line-clamp-2">{q.content}</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-[11px] text-muted-foreground">{relativeTime(q.createdAt)}</span>
              {link && (
                <Link href={link} className="text-xs text-primary hover:underline">Voir</Link>
              )}
            </div>
          </div>
        );
      })}
    </div>
  </div>
)}
```

Add necessary imports if missing: `Link` from `next/link`, `relativeTime` from `@/lib/utils`.

**Step 3: Verify TypeScript**

Run: `cd /Users/taomariani-ferigoule/Desktop/fastlane && npx tsc --noEmit`
Expected: 0 errors

**Step 4: Commit**

```bash
git add src/app/admin/dashboard/page.tsx
git commit -m "feat: add unanswered questions widget to admin dashboard"
```

---

## Task 15: Final build verification

**Step 1: TypeScript check**

Run: `cd /Users/taomariani-ferigoule/Desktop/fastlane && npx tsc --noEmit`
Expected: 0 errors

**Step 2: Check for import issues**

Run: `cd /Users/taomariani-ferigoule/Desktop/fastlane && npx tsc --noEmit 2>&1 | head -50`
If errors, fix them.

**Step 3: Final commit (if any fixes)**

If any fixes were needed:
```bash
git add -A
git commit -m "fix: resolve build errors from admin overhaul"
```
