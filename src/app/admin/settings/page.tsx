import { requireAdmin } from "@/lib/auth-server";
import { PageHeader } from "@/components/shared/page-header";

export const metadata = { title: "Parametres" };

export default async function AdminSettingsPage() {
  await requireAdmin();
  return (
    <div className="space-y-6">
      <PageHeader title="Parametres" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-md border p-4 space-y-2">
          <h2 className="text-sm font-medium">General</h2>
          <p className="text-xs text-muted-foreground">Les parametres de la plateforme seront disponibles ici.</p>
        </div>
        <div className="rounded-md border p-4 space-y-2">
          <h2 className="text-sm font-medium">Facturation</h2>
          <p className="text-xs text-muted-foreground">Integration Stripe et gestion des abonnements.</p>
        </div>
      </div>
    </div>
  );
}
