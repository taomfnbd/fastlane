"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { approveDeliverable, requestDeliverableChanges } from "@/server/actions/deliverables";
import { addComment } from "@/server/actions/feedback";

interface DeliverableReviewActionsProps {
  deliverableId: string;
}

export function DeliverableReviewActions({ deliverableId }: DeliverableReviewActionsProps) {
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [comment, setComment] = useState("");

  async function handleApprove() {
    setLoading(true);
    const result = await approveDeliverable(deliverableId);
    if (result.success) {
      toast.success("Livrable approuve");
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  }

  async function handleRequestChanges() {
    if (!comment.trim()) return;
    setLoading(true);

    // Post comment first
    const commentForm = new FormData();
    commentForm.set("content", comment);
    commentForm.set("deliverableId", deliverableId);
    await addComment(commentForm);

    // Then change status
    const result = await requestDeliverableChanges(deliverableId);
    if (result.success) {
      toast("Commentaire envoye — l'equipe Fastlane sera notifiee");
      setDialogOpen(false);
      setComment("");
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  }

  return (
    <>
      <div className="flex items-center justify-end gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setDialogOpen(true)}
          disabled={loading}
        >
          Demander des modifications
        </Button>
        <Button
          size="sm"
          onClick={handleApprove}
          disabled={loading}
        >
          {loading && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
          Approuver ce livrable
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Demander des modifications</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Expliquez ce que vous souhaitez modifier. L&apos;equipe Fastlane sera notifiee.
          </p>
          <Textarea
            placeholder="Decrivez les modifications souhaitees..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            className="mt-2"
            disabled={loading}
          />
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDialogOpen(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              size="sm"
              onClick={handleRequestChanges}
              disabled={loading || !comment.trim()}
            >
              {loading && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Envoyer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
