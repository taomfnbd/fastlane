"use client";

import { cn } from "@/lib/utils";
import { Clock, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface DeadlineBadgeProps {
  dueDate: Date | string;
  status: string;
  className?: string;
}

const COMPLETED_STATUSES = ["APPROVED", "DELIVERED"];

export function DeadlineBadge({ dueDate, status, className }: DeadlineBadgeProps) {
  const due = new Date(dueDate);
  const now = new Date();
  const isCompleted = COMPLETED_STATUSES.includes(status);
  const isOverdue = due < now && !isCompleted;
  const hoursUntil = (due.getTime() - now.getTime()) / (1000 * 60 * 60);
  const isDueSoon = hoursUntil > 0 && hoursUntil <= 48 && !isCompleted;

  const formattedDate = format(due, "d MMM yyyy", { locale: fr });

  if (isOverdue) {
    return (
      <span className={cn("inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-700", className)}>
        <AlertTriangle className="h-3 w-3" />
        En retard ({formattedDate})
      </span>
    );
  }

  if (isDueSoon) {
    return (
      <span className={cn("inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700", className)}>
        <Clock className="h-3 w-3" />
        Bientot ({formattedDate})
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-1 text-[11px] text-muted-foreground", className)}>
      <Clock className="h-3 w-3" />
      {formattedDate}
    </span>
  );
}
