import { requireAdmin } from "@/lib/auth-server";
import { PageHeader } from "@/components/shared/page-header";

export const metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-md border p-4 space-y-2">
          <h2 className="text-sm font-medium">General</h2>
          <p className="text-xs text-muted-foreground">
            Platform settings and configuration will be available here.
          </p>
        </div>

        <div className="rounded-md border p-4 space-y-2">
          <h2 className="text-sm font-medium">Billing</h2>
          <p className="text-xs text-muted-foreground">
            Stripe integration and subscription management will be available once connected.
          </p>
        </div>
      </div>
    </div>
  );
}
