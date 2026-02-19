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
import { updateStrategyItemStatus } from "@/server/actions/strategy";
import { addComment } from "@/server/actions/feedback";

interface StrategyItemReviewProps {
  itemId: string;
  strategyId: string;
}

export function StrategyItemReview({ itemId, strategyId }: StrategyItemReviewProps) {
  const [isPending, startTransition] = useTransition();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectComment, setRejectComment] = useState("");
  const [optimisticStatus, setOptimisticStatus] = useState<"idle" | "approved" | "rejected">("idle");

  function handleApprove() {
    setOptimisticStatus("approved");
    startTransition(async () => {
      const result = await updateStrategyItemStatus({ id: itemId, status: "APPROVED" });
      if (result.success) {
        toast.success("Approuve", { description: "L'equipe Fastlane a ete notifiee" });
      } else {
        setOptimisticStatus("idle");
        toast.error("Erreur", { description: result.error });
      }
    });
  }

  function handleRejectConfirm() {
    if (!rejectComment.trim()) return;

    setOptimisticStatus("rejected");
    startTransition(async () => {
      // Post the comment first
      const commentData = new FormData();
      commentData.set("content", rejectComment.trim());
      commentData.set("strategyId", strategyId);
      commentData.set("strategyItemId", itemId);
      await addComment(commentData);

      // Then change the status
      const result = await updateStrategyItemStatus({ id: itemId, status: "REJECTED" });
      if (result.success) {
        toast("Modifications demandees", { description: "Votre commentaire a ete envoye a l'equipe" });
        setRejectOpen(false);
        setRejectComment("");
      } else {
        setOptimisticStatus("idle");
        toast.error("Erreur", { description: result.error });
      }
    });
  }

  if (optimisticStatus === "approved") {
    return (
      <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 animate-fade-up">
        <Check className="h-3.5 w-3.5" />
        Approuve
      </div>
    );
  }

  if (optimisticStatus === "rejected") {
    return (
      <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 animate-fade-up">
        <X className="h-3.5 w-3.5" />
        Modifications demandees
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-2">
        <Button
          size="sm" variant="outline"
          className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-900/20"
          onClick={handleApprove} disabled={isPending}
        >
          {isPending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Check className="mr-1 h-3 w-3" />}
          Approuver
        </Button>
        <Button
          size="sm" variant="outline"
          className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
          onClick={() => setRejectOpen(true)} disabled={isPending}
        >
          {isPending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <X className="mr-1 h-3 w-3" />}
          Demander des modifications
        </Button>
      </div>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Demander des modifications</DialogTitle>
            <DialogDescription>
              Expliquez les modifications souhaitees. Ce commentaire sera visible par l&apos;equipe.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Decrivez les modifications attendues..."
            value={rejectComment}
            onChange={(e) => setRejectComment(e.target.value)}
            rows={4}
            className="resize-none"
          />
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setRejectOpen(false)} disabled={isPending}>
              Annuler
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={isPending || !rejectComment.trim()}
            >
              {isPending && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
