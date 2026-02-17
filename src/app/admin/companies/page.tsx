import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Building2 } from "lucide-react";
import Link from "next/link";
import { CreateCompanyDialog } from "@/components/admin/create-company-dialog";

export const metadata = { title: "Entreprises" };

export default async function CompaniesPage() {
  await requireAdmin();
  const companies = await prisma.company.findMany({ orderBy: { name: "asc" }, include: { users: { select: { id: true } }, events: { include: { event: { select: { name: true } } }, orderBy: { event: { startDate: "desc" } }, take: 1 } } });

  return (
    <div className="space-y-4">
      <PageHeader title="Entreprises" action={<CreateCompanyDialog />} />
      {companies.length === 0 ? (
        <EmptyState icon={Building2} title="Aucune entreprise" description="Ajoutez votre premiere entreprise cliente." action={<CreateCompanyDialog />} />
      ) : (
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-xs text-muted-foreground">
                <th className="text-left font-medium px-3 py-2">Entreprise</th>
                <th className="text-left font-medium px-3 py-2 hidden sm:table-cell">Secteur</th>
                <th className="text-left font-medium px-3 py-2 hidden md:table-cell">Membres</th>
                <th className="text-left font-medium px-3 py-2 hidden lg:table-cell">Dernier evenement</th>
                <th className="text-left font-medium px-3 py-2">Plan</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {companies.map((company) => (
                <tr key={company.id} className="hover:bg-accent/50 transition-colors">
                  <td className="px-3 py-2.5">
                    <Link href={`/admin/companies/${company.id}`} className="font-medium hover:underline">{company.name}</Link>
                    {company.website && <p className="text-[11px] text-muted-foreground truncate max-w-[200px]">{company.website.replace(/https?:\/\//, "")}</p>}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground hidden sm:table-cell">{company.industry ?? "—"}</td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground hidden md:table-cell tabular-nums">{company.users.length}</td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground hidden lg:table-cell">{company.events[0]?.event.name ?? "—"}</td>
                  <td className="px-3 py-2.5"><StatusBadge status={company.plan} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
