import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Users } from "lucide-react";
import { InviteUserDialog } from "@/components/admin/invite-user-dialog";

export const metadata = { title: "Utilisateurs" };

const roleDot: Record<string, string> = { SUPER_ADMIN: "bg-purple-500", ADMIN: "bg-blue-500", CLIENT_ADMIN: "bg-emerald-500", CLIENT_MEMBER: "bg-muted-foreground/50" };
const roleLabel: Record<string, string> = { SUPER_ADMIN: "super admin", ADMIN: "admin", CLIENT_ADMIN: "admin client", CLIENT_MEMBER: "membre client" };

export default async function UsersPage() {
  await requireAdmin();
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" }, include: { company: { select: { name: true } } } });

  return (
    <div className="space-y-4">
      <PageHeader title="Utilisateurs" action={<InviteUserDialog />} />
      {users.length === 0 ? (
        <EmptyState icon={Users} title="Aucun utilisateur" description="Invitez des utilisateurs." action={<InviteUserDialog />} />
      ) : (
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-xs text-muted-foreground">
                <th className="text-left font-medium px-3 py-2">Utilisateur</th>
                <th className="text-left font-medium px-3 py-2 hidden sm:table-cell">Email</th>
                <th className="text-left font-medium px-3 py-2 hidden md:table-cell">Entreprise</th>
                <th className="text-left font-medium px-3 py-2">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-accent/50 transition-colors">
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-medium">{user.name.charAt(0).toUpperCase()}</div>
                      <span className="font-medium">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground hidden sm:table-cell">{user.email}</td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground hidden md:table-cell">{user.company?.name ?? "—"}</td>
                  <td className="px-3 py-2.5">
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${roleDot[user.role] ?? "bg-muted-foreground/50"}`} />
                      {roleLabel[user.role] ?? user.role.toLowerCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
