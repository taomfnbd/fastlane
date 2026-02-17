"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Send, Loader2 } from "lucide-react";
import { submitDeliverableForReview } from "@/server/actions/deliverables";

export function SubmitDeliverableButton({ deliverableId }: { deliverableId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    const result = await submitDeliverableForReview(deliverableId);
    if (result.success) {
      toast.success("Livrable soumis pour revision");
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  }

  return (
    <Button size="sm" variant="outline" onClick={handleSubmit} disabled={loading}>
      {loading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Send className="mr-1 h-3 w-3" />}
      Soumettre
    </Button>
  );
}
