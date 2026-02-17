"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Check, X, Loader2 } from "lucide-react";
import { approveDeliverable, requestDeliverableChanges } from "@/server/actions/deliverables";

interface DeliverableReviewActionsProps {
  deliverableId: string;
}

export function DeliverableReviewActions({ deliverableId }: DeliverableReviewActionsProps) {
  const [loading, setLoading] = useState(false);

  async function handleApprove() {
    setLoading(true);
    const result = await approveDeliverable(deliverableId);
    if (result.success) {
      toast.success("Deliverable approved");
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  }

  async function handleRequestChanges() {
    setLoading(true);
    const result = await requestDeliverableChanges(deliverableId);
    if (result.success) {
      toast.success("Changes requested");
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  }

  return (
    <div className="flex gap-2">
      <Button
        className="bg-emerald-600 hover:bg-emerald-700 text-white"
        onClick={handleApprove}
        disabled={loading}
      >
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
        Approve
      </Button>
      <Button
        variant="outline"
        className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800"
        onClick={handleRequestChanges}
        disabled={loading}
      >
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />}
        Request Changes
      </Button>
    </div>
  );
}
