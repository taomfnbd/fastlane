"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, PackageCheck } from "lucide-react";
import { toast } from "sonner";
import { markDeliverableDelivered } from "@/server/actions/deliverables";

interface MarkDeliveredButtonProps {
  deliverableId: string;
}

export function MarkDeliveredButton({ deliverableId }: MarkDeliveredButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const result = await markDeliverableDelivered(deliverableId);
    if (result.success) {
      toast.success("Livrable marque comme livre");
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  }

  return (
    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleClick} disabled={loading}>
      {loading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <PackageCheck className="mr-1 h-3 w-3" />}
      Livrer
    </Button>
  );
}
