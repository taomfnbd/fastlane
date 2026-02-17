import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Users, Globe } from "lucide-react";
import Link from "next/link";
import { CreateCompanyDialog } from "@/components/admin/create-company-dialog";

export const metadata = { title: "Companies" };

export default async function CompaniesPage() {
  await requireAdmin();

  const companies = await prisma.company.findMany({
    orderBy: { name: "asc" },
    include: {
      users: { select: { id: true } },
      events: {
        include: { event: { select: { name: true, status: true } } },
        orderBy: { event: { startDate: "desc" } },
        take: 1,
      },
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Companies"
        description="Manage client companies"
        action={<CreateCompanyDialog />}
      />

      {companies.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No companies yet"
          description="Add your first client company to start collaborating."
          action={<CreateCompanyDialog />}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => (
            <Link key={company.id} href={`/admin/companies/${company.id}`}>
              <Card className="hover:shadow-md transition-shadow h-full">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-semibold">
                        {company.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-semibold">{company.name}</h3>
                        {company.industry && (
                          <p className="text-xs text-muted-foreground">
                            {company.industry}
                          </p>
                        )}
                      </div>
                    </div>
                    <StatusBadge status={company.plan} />
                  </div>
                  <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {company.users.length} members
                    </div>
                    {company.website && (
                      <div className="flex items-center gap-1">
                        <Globe className="h-3.5 w-3.5" />
                        <span className="truncate max-w-[150px]">
                          {company.website.replace(/https?:\/\//, "")}
                        </span>
                      </div>
                    )}
                  </div>
                  {company.events[0] && (
                    <div className="mt-3 text-xs text-muted-foreground">
                      Latest event: {company.events[0].event.name}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
