import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Target, Package, Calendar, Users } from "lucide-react";
import Link from "next/link";
import { EventStatusSelect } from "@/components/admin/event-status-select";
import { AddCompanyToEvent } from "@/components/admin/add-company-to-event";

export async function generateMetadata({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { name: true },
  });
  return { title: event?.name ?? "Event" };
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  await requireAdmin();
  const { eventId } = await params;

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      companies: {
        include: {
          company: true,
          strategies: { select: { id: true, status: true, title: true } },
          deliverables: { select: { id: true, status: true, title: true, type: true } },
        },
      },
    },
  });

  if (!event) notFound();

  const allCompanies = await prisma.company.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const availableCompanies = allCompanies.filter(
    (c) => !event.companies.some((ec) => ec.companyId === c.id)
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={event.name}
        description={event.description ?? undefined}
        action={
          <div className="flex items-center gap-2">
            <EventStatusSelect eventId={event.id} currentStatus={event.status} />
          </div>
        }
      />

      {/* Event info */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <Calendar className="h-4 w-4" />
          {new Date(event.startDate).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}{" "}
          -{" "}
          {new Date(event.endDate).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </div>
        <StatusBadge status={event.status} />
        <div className="flex items-center gap-1">
          <Building2 className="h-4 w-4" />
          {event.companies.length} companies
        </div>
      </div>

      {/* Companies in this event */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Companies</h2>
          {availableCompanies.length > 0 && (
            <AddCompanyToEvent
              eventId={event.id}
              companies={availableCompanies}
            />
          )}
        </div>

        {event.companies.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No companies added to this event yet.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {event.companies.map((ec) => {
              const stratCount = ec.strategies.length;
              const delivCount = ec.deliverables.length;
              const approvedStrats = ec.strategies.filter(
                (s) => s.status === "APPROVED"
              ).length;
              const approvedDelivs = ec.deliverables.filter(
                (d) => d.status === "APPROVED" || d.status === "DELIVERED"
              ).length;

              return (
                <Card key={ec.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-semibold">
                          {ec.company.name.charAt(0)}
                        </div>
                        <div>
                          <CardTitle className="text-base">
                            <Link
                              href={`/admin/companies/${ec.companyId}`}
                              className="hover:underline"
                            >
                              {ec.company.name}
                            </Link>
                          </CardTitle>
                          {ec.company.industry && (
                            <p className="text-xs text-muted-foreground">
                              {ec.company.industry}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline">{ec.company.plan}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {approvedStrats}/{stratCount} strategies
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {approvedDelivs}/{delivCount} deliverables
                        </span>
                      </div>
                    </div>

                    {/* Quick links */}
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link
                          href={`/admin/events/${event.id}/strategy?company=${ec.companyId}`}
                        >
                          <Target className="mr-1 h-3 w-3" />
                          Strategy
                        </Link>
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <Link
                          href={`/admin/events/${event.id}/deliverables?company=${ec.companyId}`}
                        >
                          <Package className="mr-1 h-3 w-3" />
                          Deliverables
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
