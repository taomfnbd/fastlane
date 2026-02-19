"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <AlertTriangle className="h-10 w-10 text-destructive/60 mb-4" />
      <h2 className="text-sm font-semibold">Une erreur est survenue</h2>
      <p className="mt-2 text-xs text-muted-foreground max-w-xs">
        Quelque chose s&apos;est mal passe. Reessayez ou contactez le support si le probleme persiste.
      </p>
      <Button variant="outline" size="sm" className="mt-6" onClick={reset}>
        Reessayer
      </Button>
    </div>
  );
}
