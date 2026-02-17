import { prisma } from "@/lib/prisma";
import { requireClient } from "@/lib/auth-server";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, FileText, Mail, Globe, Megaphone, Phone, PenTool } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Deliverables" };

const typeIcons: Record<string, typeof FileText> = {
  EMAIL_TEMPLATE: Mail,
  LANDING_PAGE: Globe,
  SOCIAL_POST: Megaphone,
  SCRIPT: Phone,
  DOCUMENT: FileText,
  AD_CREATIVE: PenTool,
  OTHER: FileText,
};

export default async function PortalDeliverablesPage() {
  const session = await requireClient();

  const deliverables = await prisma.deliverable.findMany({
    where: {
      eventCompany: { companyId: session.companyId },
      status: { not: "DRAFT" },
    },
    include: {
      eventCompany: {
        include: { event: { select: { name: true } } },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Deliverables"
        description="Review deliverables prepared by the Fastlane team"
      />

      {deliverables.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No deliverables yet"
          description="Deliverables like email templates, landing pages, and scripts will appear here."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {deliverables.map((deliverable) => {
            const TypeIcon = typeIcons[deliverable.type] ?? FileText;
            return (
              <Link key={deliverable.id} href={`/portal/deliverables/${deliverable.id}`}>
                <Card className="hover:shadow-md transition-shadow h-full">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <TypeIcon className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{deliverable.title}</h3>
                          {deliverable.description && (
                            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                              {deliverable.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <StatusBadge status={deliverable.status} />
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {deliverable.type.replace(/_/g, " ")}
                      </Badge>
                      <span>&middot;</span>
                      <span>v{deliverable.version}</span>
                      <span>&middot;</span>
                      <span>{deliverable.eventCompany.event.name}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
