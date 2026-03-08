import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Users } from "lucide-react";
import { InviteUserDialog } from "@/components/admin/invite-user-dialog";
import { UserActions } from "@/components/admin/user-actions";
import { Pagination } from "@/components/shared/pagination";
import { SearchInput } from "@/components/shared/search-input";

export const metadata = { title: "Utilisateurs" };

const roleDot: Record<string, string> = { SUPER_ADMIN: "bg-purple-500", ADMIN: "bg-blue-500", CLIENT_ADMIN: "bg-emerald-500", CLIENT_MEMBER: "bg-muted-foreground/50" };
const roleLabel: Record<string, string> = { SUPER_ADMIN: "super admin", ADMIN: "admin", CLIENT_ADMIN: "admin client", CLIENT_MEMBER: "membre client" };

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  await requireAdmin();
  const { page = "1", q } = await searchParams;
  const currentPage = Math.max(1, Number(page));
  const perPage = 10;
  const where = q ? { OR: [{ name: { contains: q, mode: "insensitive" as const } }, { email: { contains: q, mode: "insensitive" as const } }] } : {};

  const [users, companies, totalCount] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * perPage,
      take: perPage,
      include: { company: { select: { name: true } } },
    }),
    prisma.company.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.user.count({ where }),
  ]);

  return (
    <div className="space-y-4">
      <PageHeader title="Utilisateurs" action={<InviteUserDialog />} />
      <SearchInput basePath="/admin/users" placeholder="Rechercher un utilisateur..." />
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
                <th className="text-left font-medium px-3 py-2 hidden lg:table-cell">Cree le</th>
                <th className="w-10" />
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
                  <td className="px-3 py-2.5 text-[11px] text-muted-foreground hidden lg:table-cell">
                    {new Date(user.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-3 py-2.5">
                    <UserActions
                      userId={user.id}
                      currentRole={user.role}
                      currentCompanyId={user.companyId}
                      companies={companies}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination total={totalCount} perPage={perPage} basePath="/admin/users" />
    </div>
  );
}
