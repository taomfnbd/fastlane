"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { markAllAsRead } from "@/server/actions/notifications";
import { toast } from "sonner";
import { Loader2, CheckCheck } from "lucide-react";

export function MarkAllReadButton() {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const result = await markAllAsRead();
    if (result.success) {
      toast.success("Toutes les notifications ont ete marquees comme lues");
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 text-xs gap-1.5"
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCheck className="h-3 w-3" />}
      Tout marquer comme lu
    </Button>
  );
}
