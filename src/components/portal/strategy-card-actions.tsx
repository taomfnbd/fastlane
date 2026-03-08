"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Check, X, Loader2 } from "lucide-react";
import { approveAllStrategyItems, rejectStrategy } from "@/server/actions/strategy";

interface StrategyCardActionsProps {
  strategyId: string;
}

export function StrategyCardActions({ strategyId }: StrategyCardActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [resolved, setResolved] = useState<"approved" | "rejected" | null>(null);

  function handleApprove() {
    startTransition(async () => {
      const result = await approveAllStrategyItems(strategyId);
      if (result.success) {
        setResolved("approved");
        toast.success("Strategie validee", {
          description: "L'equipe Fastlane a ete notifiee",
        });
      } else {
        toast.error("Erreur", { description: result.error });
      }
    });
  }

  function handleRejectConfirm() {
    if (!rejectReason.trim()) return;

    startTransition(async () => {
      const result = await rejectStrategy(strategyId, rejectReason.trim());
      if (result.success) {
        setResolved("rejected");
        setRejectOpen(false);
        setRejectReason("");
        toast("Modifications demandees", {
          description: "Votre commentaire a ete envoye a l'equipe",
        });
      } else {
        toast.error("Erreur", { description: result.error });
      }
    });
  }

  if (resolved === "approved") {
    return (
      <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 animate-fade-up">
        <Check className="h-3.5 w-3.5" />
        Validee
      </div>
    );
  }

  if (resolved === "rejected") {
    return (
      <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 animate-fade-up">
        <X className="h-3.5 w-3.5" />
        Modifications demandees
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-2 pt-1">
        <Button
          size="sm"
          onClick={handleApprove}
          disabled={isPending}
          className="flex-1"
        >
          {isPending ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Check className="mr-1.5 h-3.5 w-3.5" />
          )}
          Valider
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1 text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
          onClick={() => setRejectOpen(true)}
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <X className="mr-1.5 h-3.5 w-3.5" />
          )}
          Refuser
        </Button>
      </div>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Refuser la strategie</DialogTitle>
            <DialogDescription>
              Expliquez les modifications souhaitees. Ce commentaire sera visible
              par l&apos;equipe.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Decrivez les modifications attendues..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={4}
            className="resize-none"
          />
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRejectOpen(false)}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={isPending || !rejectReason.trim()}
            >
              {isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
