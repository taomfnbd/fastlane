"use client";

import { useState, useSyncExternalStore } from "react";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "fastlane-welcome-dismissed";

function getSnapshot() {
  return localStorage.getItem(STORAGE_KEY) === null;
}

function getServerSnapshot() {
  return false;
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

export function WelcomeBanner() {
  const shouldShow = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [dismissed, setDismissed] = useState(false);

  if (!shouldShow || dismissed) return null;

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setDismissed(true);
  }

  return (
    <div className="relative rounded-md border border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/30 px-4 py-3">
      <div className="flex items-start gap-3">
        <Sparkles className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Bienvenue sur votre espace client</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Retrouvez ici vos strategies et livrables. Quand une action est requise de votre part, elle apparaitra dans la section &ldquo;A faire&rdquo; ci-dessous.
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0 text-muted-foreground"
          onClick={dismiss}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
