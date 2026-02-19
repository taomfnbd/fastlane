"use client";

import { cn } from "@/lib/utils";
import { STATUS_DESCRIPTIONS } from "@/lib/portal-constants";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type StatusColor = "gray" | "amber" | "green" | "red" | "blue" | "purple" | "sky";

const dotColors: Record<StatusColor, string> = {
  gray: "bg-muted-foreground/50",
  amber: "bg-amber-500",
  green: "bg-emerald-500",
  red: "bg-red-500",
  blue: "bg-blue-500",
  purple: "bg-purple-500",
  sky: "bg-sky-500",
};

const statusColorMap: Record<string, StatusColor> = {
  DRAFT: "gray",
  PREPARATION: "sky",
  ACTIVE: "blue",
  REVIEW: "purple",
  COMPLETED: "green",
  ARCHIVED: "gray",
  PENDING_REVIEW: "amber",
  APPROVED: "green",
  CHANGES_REQUESTED: "red",
  REVISED: "amber",
  IN_REVIEW: "amber",
  DELIVERED: "green",
  PENDING: "amber",
  REJECTED: "red",
  MODIFIED: "amber",
  FREE: "gray",
  STARTER: "blue",
  PRO: "green",
  ENTERPRISE: "purple",
};

const statusLabelMap: Record<string, string> = {
  DRAFT: "brouillon",
  PREPARATION: "preparation",
  ACTIVE: "actif",
  REVIEW: "revision",
  COMPLETED: "termine",
  ARCHIVED: "archive",
  PENDING_REVIEW: "en attente",
  APPROVED: "approuve",
  CHANGES_REQUESTED: "modifications demandees",
  REVISED: "revise",
  IN_REVIEW: "en revision",
  DELIVERED: "livre",
  PENDING: "en attente",
  REJECTED: "rejete",
  MODIFIED: "modifie",
  FREE: "gratuit",
  STARTER: "starter",
  PRO: "pro",
  ENTERPRISE: "enterprise",
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const color = statusColorMap[status] ?? "gray";
  const label = statusLabelMap[status] ?? status.replace(/_/g, " ").toLowerCase();
  const description = STATUS_DESCRIPTIONS[status];

  const badge = (
    <span className={cn("inline-flex items-center gap-1.5 text-xs text-muted-foreground", className)}>
      <span className={cn("h-2 w-2 rounded-full shrink-0", dotColors[color])} />
      {label}
    </span>
  );

  if (!description) return badge;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent side="top" className="max-w-60">
          {description}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
