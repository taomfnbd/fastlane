import { requireAdmin } from "@/lib/auth-server";
import { PageHeader } from "@/components/shared/page-header";
import { prisma } from "@/lib/prisma";
import { SettingsClient } from "@/components/admin/settings-client";

export const metadata = { title: "Parametres" };

export default async function AdminSettingsPage() {
  await requireAdmin();

  const [settings, webhooks] = await Promise.all([
    prisma.setting.findMany({
      where: {
        key: {
          in: [
            "platform_name",
            "support_email",
            "notification_method",
            "email_from",
          ],
        },
      },
    }),
    prisma.webhookConfig.findMany({
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const settingsMap: Record<string, unknown> = {};
  for (const s of settings) {
    settingsMap[s.key] = s.value;
  }

  const serializedWebhooks = webhooks.map((w) => ({
    id: w.id,
    name: w.name,
    url: w.url,
    events: w.events,
    active: w.active,
    secret: w.secret,
    createdAt: w.createdAt.toISOString(),
  }));

  const hasResendKey = !!process.env.RESEND_API_KEY;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Parametres"
        description="Configuration de la plateforme"
      />
      <SettingsClient
        initialSettings={settingsMap}
        initialWebhooks={serializedWebhooks}
        hasResendKey={hasResendKey}
      />
    </div>
  );
}
