"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Check, X, Loader2 } from "lucide-react";
import { updateStrategyItemStatus } from "@/server/actions/strategy";

interface StrategyItemReviewProps {
  itemId: string;
}

export function StrategyItemReview({ itemId }: StrategyItemReviewProps) {
  const [loading, setLoading] = useState(false);

  async function handleAction(status: "APPROVED" | "REJECTED") {
    setLoading(true);
    const result = await updateStrategyItemStatus({ id: itemId, status });

    if (result.success) {
      toast.success(status === "APPROVED" ? "Item approved" : "Changes requested");
    } else {
      toast.error(result.error);
    }

    setLoading(false);
  }

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="outline"
        className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-900/20"
        onClick={() => handleAction("APPROVED")}
        disabled={loading}
      >
        {loading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Check className="mr-1 h-3 w-3" />}
        Approve
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
        onClick={() => handleAction("REJECTED")}
        disabled={loading}
      >
        {loading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <X className="mr-1 h-3 w-3" />}
        Request Changes
      </Button>
    </div>
  );
}
