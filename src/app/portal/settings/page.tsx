import { requireClient } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";

export const metadata = { title: "Parametres" };

const roleDot: Record<string, string> = {
  CLIENT_ADMIN: "bg-emerald-500",
  CLIENT_MEMBER: "bg-muted-foreground/50",
};

export default async function PortalSettingsPage() {
  const session = await requireClient();

  const company = await prisma.company.findUnique({
    where: { id: session.companyId },
    include: {
      users: {
        select: { id: true, name: true, email: true, role: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!company) return null;

  return (
    <div className="space-y-6">
      <PageHeader title="Parametres" />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Company info */}
        <div>
          <h2 className="text-sm font-medium mb-3">Entreprise</h2>
          <div className="rounded-md border divide-y">
            <div className="px-3 py-2.5 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Nom</span>
              <span className="text-sm font-medium">{company.name}</span>
            </div>
            {company.industry && (
              <div className="px-3 py-2.5 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Secteur</span>
                <span className="text-sm">{company.industry}</span>
              </div>
            )}
            {company.website && (
              <div className="px-3 py-2.5 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Site web</span>
                <span className="text-sm">{company.website}</span>
              </div>
            )}
            <div className="px-3 py-2.5 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Plan</span>
              <StatusBadge status={company.plan} />
            </div>
          </div>
        </div>

        {/* Team */}
        <div>
          <h2 className="text-sm font-medium mb-3">Equipe ({company.users.length})</h2>
          <div className="rounded-md border divide-y">
            {company.users.map((user) => (
              <div key={user.id} className="flex items-center justify-between px-3 py-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-medium">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{user.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                  <span className={`h-1.5 w-1.5 rounded-full ${roleDot[user.role] ?? "bg-muted-foreground/50"}`} />
                  {user.role === "CLIENT_ADMIN" ? "admin" : "membre"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
