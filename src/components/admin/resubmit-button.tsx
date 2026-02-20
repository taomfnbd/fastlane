"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { resubmitStrategy } from "@/server/actions/strategy";
import { resubmitDeliverable } from "@/server/actions/deliverables";

interface ResubmitButtonProps {
  id: string;
  type: "strategy" | "deliverable";
}

export function ResubmitButton({ id, type }: ResubmitButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const result = type === "strategy"
      ? await resubmitStrategy(id)
      : await resubmitDeliverable(id);
    if (result.success) {
      toast.success(type === "strategy" ? "Strategie resoumise" : "Livrable resoumis");
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  }

  return (
    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleClick} disabled={loading}>
      {loading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <RotateCcw className="mr-1 h-3 w-3" />}
      Resoumettre
    </Button>
  );
}
