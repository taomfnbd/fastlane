import { requireClient, getUserWithRole } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/shared/status-badge";
import { SettingsCompanyForm } from "@/components/portal/settings-company-form";
import { SettingsTeamSection } from "@/components/portal/settings-team-section";
import { ChangePasswordForm } from "@/components/portal/change-password-form";

export const metadata = { title: "Parametres" };

export default async function PortalSettingsPage() {
  const session = await requireClient();

  const [company, currentUser] = await Promise.all([
    prisma.company.findUnique({
      where: { id: session.companyId },
      include: {
        users: {
          select: { id: true, name: true, email: true, role: true },
          orderBy: { createdAt: "asc" },
        },
      },
    }),
    getUserWithRole(session.user.id),
  ]);

  if (!company || !currentUser) return null;

  const isAdmin = currentUser.role === "CLIENT_ADMIN";

  return (
    <div className="space-y-8 animate-fade-up">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Parametres</h1>
        <p className="text-sm text-muted-foreground">
          Gerez votre entreprise et votre equipe
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Company info */}
        <SettingsCompanyForm
          company={{
            name: company.name,
            website: company.website ?? "",
            industry: company.industry ?? "",
          }}
          isAdmin={isAdmin}
        />

        {/* Team members */}
        <SettingsTeamSection
          users={company.users.map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role as "CLIENT_ADMIN" | "CLIENT_MEMBER",
          }))}
          currentUserId={session.user.id}
          isAdmin={isAdmin}
        />
      </div>

      {/* Security */}
      <div>
        <h2 className="text-sm font-medium mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-base text-muted-foreground">lock</span>
          Securite
        </h2>
        <div className="bg-card rounded-xl border border-primary/5 p-6">
          <ChangePasswordForm />
        </div>
      </div>

      {/* Plan info */}
      <div>
        <h2 className="text-sm font-medium mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-base text-muted-foreground">credit_card</span>
          Plan
        </h2>
        <div className="bg-card rounded-xl border border-primary/5 p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Plan actuel</p>
              <StatusBadge status={company.plan} />
            </div>
            <p className="text-xs text-muted-foreground max-w-48 text-right">
              Contactez Fastlane pour modifier votre plan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
