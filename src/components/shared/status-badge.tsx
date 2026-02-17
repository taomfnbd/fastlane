import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusVariant = "draft" | "pending" | "approved" | "rejected" | "active" | "completed" | "archived" | "review" | "preparation" | "delivered" | "revised";

const variantStyles: Record<StatusVariant, string> = {
  draft: "bg-muted text-muted-foreground border-muted",
  pending: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
  approved: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
  rejected: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
  active: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  completed: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
  archived: "bg-muted text-muted-foreground border-muted",
  review: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800",
  preparation: "bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:border-sky-800",
  delivered: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
  revised: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
};

const statusMap: Record<string, StatusVariant> = {
  DRAFT: "draft",
  PREPARATION: "preparation",
  ACTIVE: "active",
  REVIEW: "review",
  COMPLETED: "completed",
  ARCHIVED: "archived",
  PENDING_REVIEW: "pending",
  APPROVED: "approved",
  CHANGES_REQUESTED: "rejected",
  REVISED: "revised",
  IN_REVIEW: "pending",
  DELIVERED: "delivered",
  PENDING: "pending",
  REJECTED: "rejected",
  MODIFIED: "revised",
  FREE: "draft",
  STARTER: "active",
  PRO: "approved",
  ENTERPRISE: "completed",
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variant = statusMap[status] ?? "draft";
  const label = status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <Badge
      variant="outline"
      className={cn("text-xs font-medium", variantStyles[variant], className)}
    >
      {label}
    </Badge>
  );
}
