import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Calendar, Globe, Target, Package, ArrowLeft } from "lucide-react";
import Link from "next/link";

export async function generateMetadata({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { name: true },
  });
  return { title: company?.name ?? "Company" };
}

const roleDot: Record<string, string> = {
  CLIENT_ADMIN: "bg-emerald-500",
  CLIENT_MEMBER: "bg-muted-foreground/50",
};

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  await requireAdmin();
  const { companyId } = await params;

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: {
      users: {
        select: { id: true, name: true, email: true, role: true },
        orderBy: { createdAt: "asc" },
      },
      events: {
        include: {
          event: true,
          strategies: { select: { id: true, status: true } },
          deliverables: { select: { id: true, status: true } },
        },
        orderBy: { event: { startDate: "desc" } },
      },
    },
  });

  if (!company) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2 h-7 text-xs text-muted-foreground">
          <Link href="/admin/companies">
            <ArrowLeft className="mr-1 h-3 w-3" />
            Companies
          </Link>
        </Button>
        <PageHeader
          title={company.name}
          description={company.description ?? undefined}
        />
      </div>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        {company.industry && <span>{company.industry}</span>}
        <StatusBadge status={company.plan} />
        {company.website && (
          <a
            href={company.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <Globe className="h-3 w-3" />
            {company.website.replace(/https?:\/\//, "")}
          </a>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Team */}
        <div>
          <h2 className="text-sm font-medium mb-3">Team ({company.users.length})</h2>
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
                  {user.role === "CLIENT_ADMIN" ? "admin" : "member"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Events */}
        <div>
          <h2 className="text-sm font-medium mb-3">Events ({company.events.length})</h2>
          {company.events.length === 0 ? (
            <p className="text-xs text-muted-foreground py-8 text-center">Not part of any events yet.</p>
          ) : (
            <div className="rounded-md border divide-y">
              {company.events.map((ec) => (
                <Link
                  key={ec.id}
                  href={`/admin/events/${ec.eventId}`}
                  className="block px-3 py-2.5 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{ec.event.name}</p>
                    <StatusBadge status={ec.event.status} />
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(ec.event.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      {" — "}
                      {new Date(ec.event.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      {ec.strategies.length}
                    </span>
                    <span className="flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      {ec.deliverables.length}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
