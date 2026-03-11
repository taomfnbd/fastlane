import { prisma } from "@/lib/prisma";
import { createHmac } from "crypto";

/**
 * Dispatch a webhook event to all active subscribers.
 * Fire-and-forget: does not block the caller.
 */
export function dispatchWebhook(
  event: string,
  payload: Record<string, unknown>,
): void {
  void sendWebhooks(event, payload);
}

async function sendWebhooks(
  event: string,
  payload: Record<string, unknown>,
): Promise<void> {
  try {
    const webhooks = await prisma.webhookConfig.findMany({
      where: {
        active: true,
        events: { has: event },
      },
    });

    const body = JSON.stringify({
      event,
      payload,
      timestamp: new Date().toISOString(),
    });

    const requests = webhooks.map(async (webhook) => {
      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          "X-Webhook-Event": event,
        };

        if (webhook.secret) {
          const signature = createHmac("sha256", webhook.secret)
            .update(body)
            .digest("hex");
          headers["X-Webhook-Signature"] = `sha256=${signature}`;
        }

        const response = await fetch(webhook.url, {
          method: "POST",
          headers,
          body,
          signal: AbortSignal.timeout(10_000),
        });

        if (!response.ok) {
          console.error(
            `[webhook] ${webhook.name} (${webhook.url}) returned ${response.status}`,
          );
        }
      } catch (error) {
        console.error(
          `[webhook] Failed to deliver to ${webhook.name} (${webhook.url}):`,
          error,
        );
      }
    });

    await Promise.allSettled(requests);
  } catch (error) {
    console.error("[webhook] Failed to fetch webhook configs:", error);
  }
}
