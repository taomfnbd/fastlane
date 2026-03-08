"use client";

import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { removeCompanyFromEvent } from "@/server/actions/events";
import { toast } from "sonner";
import { useTransition } from "react";

interface RemoveCompanyButtonProps {
  eventId: string;
  companyId: string;
  companyName: string;
  hasItems: boolean;
}

export function RemoveCompanyButton({ eventId, companyId, companyName, hasItems }: RemoveCompanyButtonProps) {
  const [isPending, startTransition] = useTransition();

  if (hasItems) return null;

  function handleRemove() {
    startTransition(async () => {
      const result = await removeCompanyFromEvent(eventId, companyId);
      if (!result.success) toast.error(result.error);
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" disabled={isPending}>
          {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Retirer {companyName} ?</AlertDialogTitle>
          <AlertDialogDescription>L&apos;entreprise sera retiree de cet evenement.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={handleRemove}>Retirer</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
