"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <AlertTriangle className="h-10 w-10 text-amber-500" />
      <h2 className="mt-4 text-lg font-semibold">Une erreur est survenue</h2>
      <p className="mt-2 text-sm text-muted-foreground max-w-md">
        {error.message || "Quelque chose s'est mal passe. Veuillez reessayer."}
      </p>
      {error.digest && (
        <p className="mt-1 text-xs text-muted-foreground/60 font-mono">Digest: {error.digest}</p>
      )}
      <Button onClick={reset} className="mt-6" variant="outline">
        Reessayer
      </Button>
    </div>
  );
}
