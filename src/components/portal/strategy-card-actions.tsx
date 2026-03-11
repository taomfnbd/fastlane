"use client";

import { useState, useTransition } from "react";
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
import { Loader2 } from "lucide-react";
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
        toast.success("Stratégie validée", {
          description: "L'équipe Fastlane a été notifiée",
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
        toast("Modifications demandées", {
          description: "Votre commentaire a été envoyé à l'équipe",
        });
      } else {
        toast.error("Erreur", { description: result.error });
      }
    });
  }

  if (resolved === "approved") {
    return (
      <div className="flex items-center gap-2 text-xs text-emerald-400 animate-fade-up">
        <span className="material-symbols-outlined text-lg">check_circle</span>
        Validée
      </div>
    );
  }

  if (resolved === "rejected") {
    return (
      <div className="flex items-center gap-2 text-xs text-red-400 animate-fade-up">
        <span className="material-symbols-outlined text-lg">cancel</span>
        Modifications demandées
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 pt-2">
        <button
          onClick={handleApprove}
          disabled={isPending}
          className="flex items-center justify-center gap-2 h-11 bg-[#6961ff] hover:bg-[#6961ff]/90 text-white rounded-full font-bold text-sm transition-colors disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <span className="material-symbols-outlined text-lg">check_circle</span>
          )}
          Valider
        </button>
        <button
          onClick={() => setRejectOpen(true)}
          disabled={isPending}
          className="flex items-center justify-center gap-2 h-11 border-2 border-red-500/30 hover:border-red-500 text-red-500 rounded-full font-bold text-sm transition-colors disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <span className="material-symbols-outlined text-lg">cancel</span>
          )}
          Refuser
        </button>
      </div>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Refuser la stratégie</DialogTitle>
            <DialogDescription>
              Expliquez les modifications souhaitées. Ce commentaire sera visible
              par l&apos;équipe.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Décrivez les modifications attendues..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={4}
            className="resize-none"
          />
          <DialogFooter>
            <button
              onClick={() => setRejectOpen(false)}
              disabled={isPending}
              className="px-4 py-2 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleRejectConfirm}
              disabled={isPending || !rejectReason.trim()}
              className="px-4 py-2 rounded-full bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors disabled:opacity-50"
            >
              {isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin inline" />}
              Confirmer
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
