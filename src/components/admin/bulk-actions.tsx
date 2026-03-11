"use client";

import { useTransition } from "react";
import { X, Check, Send, Trash2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  bulkApproveDeliverables,
  bulkSubmitStrategies,
  bulkMarkDelivered,
  bulkDeleteDraft,
} from "@/server/actions/bulk";
import { toast } from "sonner";

interface BulkActionsProps {
  selectedIds: string[];
  entityType: "strategy" | "deliverable";
  onClear: () => void;
}

export function BulkActions({ selectedIds, entityType, onClear }: BulkActionsProps) {
  const [isPending, startTransition] = useTransition();

  if (selectedIds.length === 0) return null;

  function handleAction(action: () => Promise<{ success: boolean; error?: string }>) {
    startTransition(async () => {
      const result = await action();
      if (result.success) {
        toast.success("Operation effectuee avec succes");
        onClear();
      } else {
        toast.error(result.error ?? "Une erreur est survenue");
      }
    });
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-backdrop-blur:bg-background/60 shadow-lg">
      <div className="mx-auto flex items-center justify-between gap-4 px-6 py-3 max-w-screen-xl">
        <div className="flex items-center gap-3">
          <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-primary px-2 text-xs font-medium text-primary-foreground tabular-nums">
            {selectedIds.length}
          </span>
          <span className="text-sm font-medium">
            {selectedIds.length === 1 ? "element selectionne" : "elements selectionnes"}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs text-muted-foreground"
            onClick={onClear}
          >
            <X className="h-3 w-3" />
            Deselectionner
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {entityType === "deliverable" && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                disabled={isPending}
                onClick={() => handleAction(() => bulkApproveDeliverables(selectedIds))}
              >
                <Check className="h-3.5 w-3.5" />
                Approuver
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                disabled={isPending}
                onClick={() => handleAction(() => bulkMarkDelivered(selectedIds))}
              >
                <Truck className="h-3.5 w-3.5" />
                Marquer livre
              </Button>
            </>
          )}

          {entityType === "strategy" && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={isPending}
              onClick={() => handleAction(() => bulkSubmitStrategies(selectedIds))}
            >
              <Send className="h-3.5 w-3.5" />
              Soumettre
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-destructive hover:bg-destructive/10"
            disabled={isPending}
            onClick={() =>
              handleAction(() => bulkDeleteDraft(entityType, selectedIds))
            }
          >
            <Trash2 className="h-3.5 w-3.5" />
            Supprimer brouillons
          </Button>
        </div>
      </div>
    </div>
  );
}
