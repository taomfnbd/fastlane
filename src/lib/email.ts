import { prisma } from "@/lib/prisma";
import { buildNotificationHtml } from "@/lib/email-template";

let resendClient: InstanceType<typeof import("resend").Resend> | null = null;

function getResendClient() {
  if (resendClient) return resendClient;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY is not set — emails will not be sent");
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Resend } = require("resend") as typeof import("resend");
  resendClient = new Resend(apiKey);
  return resendClient;
}

export async function sendNotificationEmail(
  to: string,
  subject: string,
  body: string,
  link?: string,
): Promise<void> {
  const client = getResendClient();
  if (!client) return;

  try {
    const notifMethod = await prisma.setting.findUnique({
      where: { key: "notification_method" },
    });
    if ((notifMethod?.value as string) === "in_app_only") return;

    const fromSetting = await prisma.setting.findUnique({
      where: { key: "email_from" },
    });
    const from = (fromSetting?.value as string) || "Fastlane <noreply@fastlane.io>";

    const html = buildNotificationHtml(subject, body, link);

    const { error } = await client.emails.send({
      from,
      to,
      subject,
      html,
    });

    if (error) {
      console.error("[email] Resend error:", error.message);
    }
  } catch (error) {
    console.error("[email] Failed to send:", error);
  }
}
