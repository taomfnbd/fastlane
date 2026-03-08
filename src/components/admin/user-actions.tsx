"use client";

import { useState, useTransition } from "react";
import { MoreHorizontal, Shield, Building2, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { updateUserRole, updateUserCompany, deleteUser } from "@/server/actions/users";

interface UserActionsProps {
  userId: string;
  currentRole: string;
  currentCompanyId: string | null;
  companies: { id: string; name: string }[];
}

const roles = [
  { value: "ADMIN", label: "Admin" },
  { value: "CLIENT_ADMIN", label: "Admin client" },
  { value: "CLIENT_MEMBER", label: "Membre client" },
] as const;

export function UserActions({ userId, currentRole, currentCompanyId, companies }: UserActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  function handleRoleChange(role: "ADMIN" | "CLIENT_ADMIN" | "CLIENT_MEMBER") {
    startTransition(async () => {
      const result = await updateUserRole(userId, role);
      if (!result.success) toast.error(result.error);
    });
  }

  function handleCompanyChange(companyId: string | null) {
    startTransition(async () => {
      const result = await updateUserCompany(userId, companyId);
      if (!result.success) toast.error(result.error);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteUser(userId);
      if (!result.success) toast.error(result.error);
      setConfirmDelete(false);
    });
  }

  if (currentRole === "SUPER_ADMIN") return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" disabled={isPending}>
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MoreHorizontal className="h-3.5 w-3.5" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Shield className="h-3.5 w-3.5 mr-2" />Changer le role
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {roles.map((role) => (
                <DropdownMenuItem
                  key={role.value}
                  onClick={() => handleRoleChange(role.value)}
                  className={currentRole === role.value ? "bg-accent" : ""}
                >
                  {role.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Building2 className="h-3.5 w-3.5 mr-2" />Entreprise
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem
                onClick={() => handleCompanyChange(null)}
                className={!currentCompanyId ? "bg-accent" : ""}
              >
                Aucune
              </DropdownMenuItem>
              {companies.map((c) => (
                <DropdownMenuItem
                  key={c.id}
                  onClick={() => handleCompanyChange(c.id)}
                  className={currentCompanyId === c.id ? "bg-accent" : ""}
                >
                  {c.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setConfirmDelete(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5 mr-2" />Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet utilisateur ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irreversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
