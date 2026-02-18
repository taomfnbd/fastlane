"use client";

import { Check, ChevronDown, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { StatusBadge } from "@/components/shared/status-badge";
import { CommentSection } from "@/components/shared/comment-section";
import { StrategyItemReview } from "@/components/portal/strategy-item-review";

interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  author: { name: string; image: string | null };
  replies: {
    id: string;
    content: string;
    createdAt: Date;
    author: { name: string; image: string | null };
  }[];
}

interface StrategyItemCardProps {
  item: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    comments: Comment[];
    _count: { comments: number };
  };
  index: number;
  strategyId: string;
  strategyStatus: string;
}

export function StrategyItemCard({
  item,
  index,
  strategyId,
  strategyStatus,
}: StrategyItemCardProps) {
  const isApproved = item.status === "APPROVED";
  const isPending = item.status === "PENDING" || item.status === "MODIFIED";
  const needsAction =
    isPending && (strategyStatus === "PENDING_REVIEW" || strategyStatus === "REVISED");

  return (
    <Collapsible defaultOpen={!isApproved}>
      <div
        className={cn(
          "rounded-lg border bg-card transition-opacity",
          isApproved && "opacity-50",
          needsAction && "ring-1 ring-amber-500/20",
        )}
      >
        <CollapsibleTrigger className="flex w-full items-center justify-between px-3 py-2.5 text-left hover:bg-accent/30 transition-colors">
          <div className="flex items-center gap-2 min-w-0">
            {isApproved ? (
              <Check className="h-4 w-4 text-emerald-500 shrink-0" />
            ) : (
              <span className="flex h-4 w-4 items-center justify-center rounded-full border text-[10px] text-muted-foreground shrink-0">
                {index + 1}
              </span>
            )}
            <span className="text-sm font-medium truncate">{item.title}</span>
            {needsAction && (
              <span className="shrink-0 inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-950 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-400">
                A valider
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-3">
            {item._count.comments > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                <MessageSquare className="h-3 w-3" />
                {item._count.comments}
              </span>
            )}
            <StatusBadge status={item.status} />
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform [[data-state=open]_&]:rotate-180" />
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t px-3 py-3 space-y-3">
            {/* Description */}
            {item.description && (
              <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                {item.description}
              </p>
            )}

            {/* Comments */}
            <CommentSection
              comments={item.comments}
              strategyItemId={item.id}
              strategyId={strategyId}
            />

            {/* Review actions */}
            {needsAction && (
              <div className="pt-2 border-t">
                <StrategyItemReview itemId={item.id} strategyId={strategyId} />
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
