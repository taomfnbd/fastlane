import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Users,
  Globe,
  Target,
  Package,
  ArrowLeft,
  Mail,
} from "lucide-react";
import Link from "next/link";

export async function generateMetadata({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { name: true },
  });
  return { title: company?.name ?? "Company" };
}

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
        select: { id: true, name: true, email: true, role: true, image: true },
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

  const roleColors: Record<string, string> = {
    CLIENT_ADMIN:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
    CLIENT_MEMBER: "bg-muted text-muted-foreground",
  };

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2">
          <Link href="/admin/companies">
            <ArrowLeft className="mr-1 h-3 w-3" />
            Back to Companies
          </Link>
        </Button>
        <PageHeader
          title={company.name}
          description={company.description ?? undefined}
        />
      </div>

      {/* Company info */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        {company.industry && <Badge variant="outline">{company.industry}</Badge>}
        <StatusBadge status={company.plan} />
        {company.website && (
          <a
            href={company.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-primary"
          >
            <Globe className="h-4 w-4" />
            {company.website.replace(/https?:\/\//, "")}
          </a>
        )}
        <div className="flex items-center gap-1">
          <Users className="h-4 w-4" />
          {company.users.length} members
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Team Members */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {company.users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{user.name}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      {user.email}
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className={`text-xs ${roleColors[user.role] ?? ""}`}
                  >
                    {user.role === "CLIENT_ADMIN" ? "Admin" : "Member"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Events */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Events</CardTitle>
          </CardHeader>
          <CardContent>
            {company.events.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Not part of any events yet.
              </p>
            ) : (
              <div className="space-y-3">
                {company.events.map((ec) => (
                  <Link
                    key={ec.id}
                    href={`/admin/events/${ec.eventId}`}
                    className="block rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm">{ec.event.name}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(ec.event.startDate).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric" }
                          )}{" "}
                          -{" "}
                          {new Date(ec.event.endDate).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric", year: "numeric" }
                          )}
                        </div>
                      </div>
                      <StatusBadge status={ec.event.status} />
                    </div>
                    <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        {ec.strategies.length} strategies
                      </div>
                      <div className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        {ec.deliverables.length} deliverables
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
