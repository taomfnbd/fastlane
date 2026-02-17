import { requireClient } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";

export const metadata = { title: "Settings" };

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
      <PageHeader title="Settings" description="Company profile and team" />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Company Profile</CardTitle>
            <CardDescription>Your company information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Name</p>
              <p className="font-medium">{company.name}</p>
            </div>
            {company.industry && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Industry</p>
                <p>{company.industry}</p>
              </div>
            )}
            {company.website && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Website</p>
                <p>{company.website}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-muted-foreground">Plan</p>
              <StatusBadge status={company.plan} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>{company.users.length} members</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {company.users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {user.role === "CLIENT_ADMIN" ? "Admin" : "Member"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
