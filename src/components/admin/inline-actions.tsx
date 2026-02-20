"use client";

import { useState, useTransition } from "react";
import { MoreHorizontal, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface Action {
  label: string;
  icon: React.ReactNode;
  action: () => Promise<{ success: boolean; error?: string }>;
  confirm?: string;
  variant?: "default" | "destructive";
}

interface InlineActionsProps {
  actions: Action[];
}

export function InlineActions({ actions }: InlineActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [confirmAction, setConfirmAction] = useState<Action | null>(null);

  function execute(action: Action) {
    if (action.confirm) {
      setConfirmAction(action);
      return;
    }
    runAction(action);
  }

  function runAction(action: Action) {
    startTransition(async () => {
      const result = await action.action();
      if (!result.success) {
        toast.error(result.error ?? "Erreur");
      }
    });
  }

  if (actions.length === 0) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" disabled={isPending}>
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MoreHorizontal className="h-3.5 w-3.5" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {actions.map((action, i) => (
            <DropdownMenuItem
              key={i}
              onClick={() => execute(action)}
              className={action.variant === "destructive" ? "text-destructive focus:text-destructive" : ""}
            >
              {action.icon}
              <span className="ml-2">{action.label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer</AlertDialogTitle>
            <AlertDialogDescription>{confirmAction?.confirm}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (confirmAction) runAction(confirmAction); setConfirmAction(null); }}>
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
