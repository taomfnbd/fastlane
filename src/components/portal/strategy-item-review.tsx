"use client";

import { useState } from "react";
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
  const [loading, setLoading] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectComment, setRejectComment] = useState("");

  async function handleApprove() {
    setLoading(true);
    const result = await updateStrategyItemStatus({ id: itemId, status: "APPROVED" });
    if (result.success) {
      toast.success("Element approuve");
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  }

  async function handleRejectConfirm() {
    if (!rejectComment.trim()) return;

    setLoading(true);

    // Post the comment first
    const commentData = new FormData();
    commentData.set("content", rejectComment.trim());
    commentData.set("strategyId", strategyId);
    commentData.set("strategyItemId", itemId);
    await addComment(commentData);

    // Then change the status
    const result = await updateStrategyItemStatus({ id: itemId, status: "REJECTED" });
    if (result.success) {
      toast.success("Modifications demandees");
      setRejectOpen(false);
      setRejectComment("");
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  }

  return (
    <>
      <div className="flex gap-2">
        <Button
          size="sm" variant="outline"
          className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-900/20"
          onClick={handleApprove} disabled={loading}
        >
          {loading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Check className="mr-1 h-3 w-3" />}
          Approuver
        </Button>
        <Button
          size="sm" variant="outline"
          className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
          onClick={() => setRejectOpen(true)} disabled={loading}
        >
          {loading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <X className="mr-1 h-3 w-3" />}
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
            <Button variant="outline" size="sm" onClick={() => setRejectOpen(false)} disabled={loading}>
              Annuler
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={loading || !rejectComment.trim()}
            >
              {loading && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
