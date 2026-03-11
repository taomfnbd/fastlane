"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, UserPlus, X } from "lucide-react";
import {
  inviteTeamMember,
  removeTeamMember,
  updateMemberRole,
} from "@/server/actions/client-settings";

interface TeamUser {
  id: string;
  name: string;
  email: string;
  role: "CLIENT_ADMIN" | "CLIENT_MEMBER";
}

interface SettingsTeamSectionProps {
  users: TeamUser[];
  currentUserId: string;
  isAdmin: boolean;
}

const roleDot: Record<string, string> = {
  CLIENT_ADMIN: "bg-emerald-500",
  CLIENT_MEMBER: "bg-muted-foreground/50",
};

export function SettingsTeamSection({ users, currentUserId, isAdmin }: SettingsTeamSectionProps) {
  const [showInvite, setShowInvite] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"CLIENT_ADMIN" | "CLIENT_MEMBER">("CLIENT_MEMBER");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  async function handleInvite() {
    if (!inviteName.trim() || !inviteEmail.trim()) {
      toast.error("Nom et email requis");
      return;
    }
    setLoadingAction("invite");
    const result = await inviteTeamMember({
      name: inviteName,
      email: inviteEmail,
      role: inviteRole,
    });
    if (result.success) {
      toast.success("Membre invite");
      setShowInvite(false);
      setInviteName("");
      setInviteEmail("");
      setInviteRole("CLIENT_MEMBER");
    } else {
      toast.error(result.error);
    }
    setLoadingAction(null);
  }

  async function handleRemove(userId: string, userName: string) {
    if (!confirm(`Retirer ${userName} de l'equipe ?`)) return;
    setLoadingAction(`remove-${userId}`);
    const result = await removeTeamMember(userId);
    if (result.success) {
      toast.success("Membre retire");
    } else {
      toast.error(result.error);
    }
    setLoadingAction(null);
  }

  async function handleRoleChange(userId: string, newRole: "CLIENT_ADMIN" | "CLIENT_MEMBER") {
    setLoadingAction(`role-${userId}`);
    const result = await updateMemberRole(userId, newRole);
    if (result.success) {
      toast.success("Role mis a jour");
    } else {
      toast.error(result.error);
    }
    setLoadingAction(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium flex items-center gap-2">
          <span className="material-symbols-outlined text-base text-muted-foreground">group</span>
          Equipe ({users.length})
        </h2>
        {isAdmin && (
          <button
            type="button"
            className="inline-flex items-center gap-1 text-xs text-[#6961ff] hover:text-[#6961ff]/80 transition-colors"
            onClick={() => setShowInvite(!showInvite)}
          >
            {showInvite ? (
              <>
                <X className="h-3 w-3" />
                Annuler
              </>
            ) : (
              <>
                <UserPlus className="h-3 w-3" />
                Inviter
              </>
            )}
          </button>
        )}
      </div>

      <div className="bg-card rounded-xl border border-primary/5 divide-y divide-primary/5">
        {/* Invite form */}
        {isAdmin && showInvite && (
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Nom"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                className="text-sm"
              />
              <Input
                placeholder="Email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="text-sm"
              />
            </div>
            <div className="flex items-center gap-3">
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as "CLIENT_ADMIN" | "CLIENT_MEMBER")}
                className="h-8 rounded-md border bg-transparent px-2 text-xs"
              >
                <option value="CLIENT_MEMBER">Membre</option>
                <option value="CLIENT_ADMIN">Admin</option>
              </select>
              <Button
                size="sm"
                className="h-8 text-xs"
                onClick={handleInvite}
                disabled={loadingAction === "invite" || !inviteName.trim() || !inviteEmail.trim()}
              >
                {loadingAction === "invite" && <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />}
                Inviter
              </Button>
            </div>
          </div>
        )}

        {/* User list */}
        {users.map((user) => {
          const isSelf = user.id === currentUserId;

          return (
            <div key={user.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-medium">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {user.name}
                    {isSelf && <span className="text-muted-foreground ml-1 text-[10px]">(vous)</span>}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {isAdmin && !isSelf ? (
                  <>
                    <select
                      value={user.role}
                      onChange={(e) =>
                        handleRoleChange(user.id, e.target.value as "CLIENT_ADMIN" | "CLIENT_MEMBER")
                      }
                      disabled={loadingAction === `role-${user.id}`}
                      className="h-7 rounded-md border bg-transparent px-2 text-[11px] text-muted-foreground"
                    >
                      <option value="CLIENT_MEMBER">membre</option>
                      <option value="CLIENT_ADMIN">admin</option>
                    </select>
                    <button
                      type="button"
                      className="text-muted-foreground/60 hover:text-destructive transition-colors p-1"
                      onClick={() => handleRemove(user.id, user.name)}
                      disabled={loadingAction === `remove-${user.id}`}
                      title="Retirer"
                    >
                      {loadingAction === `remove-${user.id}` ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <span className="material-symbols-outlined text-base">person_remove</span>
                      )}
                    </button>
                  </>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className={`h-1.5 w-1.5 rounded-full ${roleDot[user.role] ?? "bg-muted-foreground/50"}`} />
                    {user.role === "CLIENT_ADMIN" ? "admin" : "membre"}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
