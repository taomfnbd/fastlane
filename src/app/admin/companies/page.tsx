import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { SearchInput } from "@/components/shared/search-input";
import { Building2 } from "lucide-react";
import Link from "next/link";
import { CreateCompanyDialog } from "@/components/admin/create-company-dialog";

export const metadata = { title: "Entreprises" };

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  await requireAdmin();
  const { page = "1", q } = await searchParams;
  const currentPage = Math.max(1, Number(page));
  const perPage = 10;

  const where = q ? {
    OR: [
      { name: { contains: q, mode: "insensitive" as const } },
      { industry: { contains: q, mode: "insensitive" as const } },
    ],
  } : {};

  const [companies, totalCount] = await Promise.all([
    prisma.company.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (currentPage - 1) * perPage,
      take: perPage,
      include: {
        users: { select: { id: true } },
        events: { select: { id: true }, take: 1 },
      },
    }),
    prisma.company.count({ where }),
  ]);

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Entreprises</h2>
        <CreateCompanyDialog />
      </div>
      <SearchInput basePath="/admin/companies" placeholder="Rechercher..." />
      {companies.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Aucune entreprise"
          description="Ajoutez votre premiere entreprise."
          action={<CreateCompanyDialog />}
        />
      ) : (
        companies.map((company) => (
          <Link
            key={company.id}
            href={`/admin/companies/${company.id}`}
            className="flex items-center gap-2.5 rounded-md px-2 py-2 hover:bg-accent/50 transition-colors"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
              {company.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{company.name}</p>
              <p className="text-[11px] text-muted-foreground">
                {company.industry ?? "\u2014"} · {company.users.length} membre{company.users.length !== 1 ? "s" : ""}
              </p>
            </div>
            <StatusBadge status={company.plan} />
          </Link>
        ))
      )}
      <Pagination total={totalCount} perPage={perPage} basePath="/admin/companies" />
    </div>
  );
}
