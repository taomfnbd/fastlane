"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";
import { createHmac } from "crypto";

// ==================== Settings ====================

export async function getSetting(key: string): Promise<ActionResult<unknown>> {
  await requireAdmin();

  const setting = await prisma.setting.findUnique({ where: { key } });

  return { success: true, data: setting?.value ?? null };
}

export async function getSettings(
  keys: string[],
): Promise<ActionResult<Record<string, unknown>>> {
  await requireAdmin();

  const settings = await prisma.setting.findMany({
    where: { key: { in: keys } },
  });

  const map: Record<string, unknown> = {};
  for (const s of settings) {
    map[s.key] = s.value;
  }

  return { success: true, data: map };
}

export async function upsertSetting(
  key: string,
  value: unknown,
): Promise<ActionResult> {
  await requireAdmin();

  if (!key.trim()) {
    return { success: false, error: "La cle est requise" };
  }

  await prisma.setting.upsert({
    where: { key },
    create: { key, value: value as never },
    update: { value: value as never },
  });

  revalidatePath("/admin/settings");
  return { success: true, data: undefined };
}

// ==================== Webhooks ====================

export async function getWebhooks(): Promise<
  ActionResult<
    {
      id: string;
      name: string;
      url: string;
      events: string[];
      active: boolean;
      secret: string | null;
      createdAt: string;
    }[]
  >
> {
  await requireAdmin();

  const webhooks = await prisma.webhookConfig.findMany({
    orderBy: { createdAt: "desc" },
  });

  return {
    success: true,
    data: webhooks.map((w) => ({
      ...w,
      createdAt: w.createdAt.toISOString(),
    })),
  };
}

export async function createWebhook(data: {
  name: string;
  url: string;
  events: string[];
  secret?: string;
}): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();

  if (!data.name.trim()) {
    return { success: false, error: "Le nom est requis" };
  }
  if (!data.url.trim()) {
    return { success: false, error: "L'URL est requise" };
  }
  if (data.events.length === 0) {
    return { success: false, error: "Au moins un evenement est requis" };
  }

  try {
    new URL(data.url);
  } catch {
    return { success: false, error: "L'URL n'est pas valide" };
  }

  const webhook = await prisma.webhookConfig.create({
    data: {
      name: data.name.trim(),
      url: data.url.trim(),
      events: data.events,
      secret: data.secret?.trim() || null,
    },
  });

  revalidatePath("/admin/settings");
  return { success: true, data: { id: webhook.id } };
}

export async function updateWebhook(
  id: string,
  data: {
    name?: string;
    url?: string;
    events?: string[];
    active?: boolean;
    secret?: string;
  },
): Promise<ActionResult> {
  await requireAdmin();

  const existing = await prisma.webhookConfig.findUnique({ where: { id } });
  if (!existing) {
    return { success: false, error: "Webhook introuvable" };
  }

  if (data.url) {
    try {
      new URL(data.url);
    } catch {
      return { success: false, error: "L'URL n'est pas valide" };
    }
  }

  await prisma.webhookConfig.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name.trim() }),
      ...(data.url !== undefined && { url: data.url.trim() }),
      ...(data.events !== undefined && { events: data.events }),
      ...(data.active !== undefined && { active: data.active }),
      ...(data.secret !== undefined && {
        secret: data.secret.trim() || null,
      }),
    },
  });

  revalidatePath("/admin/settings");
  return { success: true, data: undefined };
}

export async function deleteWebhook(id: string): Promise<ActionResult> {
  await requireAdmin();

  const existing = await prisma.webhookConfig.findUnique({ where: { id } });
  if (!existing) {
    return { success: false, error: "Webhook introuvable" };
  }

  await prisma.webhookConfig.delete({ where: { id } });

  revalidatePath("/admin/settings");
  return { success: true, data: undefined };
}

export async function testWebhook(id: string): Promise<ActionResult> {
  await requireAdmin();

  const webhook = await prisma.webhookConfig.findUnique({ where: { id } });
  if (!webhook) {
    return { success: false, error: "Webhook introuvable" };
  }

  const body = JSON.stringify({
    event: "test",
    payload: {
      message: "Ceci est un test de webhook depuis Fastlane",
      webhookId: webhook.id,
      webhookName: webhook.name,
    },
    timestamp: new Date().toISOString(),
  });

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Webhook-Event": "test",
  };

  if (webhook.secret) {
    const signature = createHmac("sha256", webhook.secret)
      .update(body)
      .digest("hex");
    headers["X-Webhook-Signature"] = `sha256=${signature}`;
  }

  try {
    const response = await fetch(webhook.url, {
      method: "POST",
      headers,
      body,
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Le serveur a repondu avec le statut ${response.status}`,
      };
    }

    return { success: true, data: undefined };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erreur inconnue";
    return { success: false, error: `Echec de la requete : ${message}` };
  }
}

// ==================== Test Email ====================

export async function sendTestEmail(): Promise<ActionResult> {
  const session = await requireAdmin();

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      error: "La cle API Resend n'est pas configuree (RESEND_API_KEY)",
    };
  }

  const fromSetting = await prisma.setting.findUnique({
    where: { key: "email_from" },
  });
  const from = (fromSetting?.value as string) || "Fastlane <noreply@fastlane.io>";

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);

    const { error } = await resend.emails.send({
      from,
      to: session.user.email,
      subject: "Test Fastlane - Email fonctionne",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2 style="margin: 0 0 16px;">Test email Fastlane</h2>
          <p style="color: #666;">Cet email confirme que la configuration Resend fonctionne correctement.</p>
          <p style="color: #999; font-size: 12px; margin-top: 24px;">Envoye le ${new Date().toLocaleString("fr-FR")}</p>
        </div>
      `,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: undefined };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erreur inconnue";
    return { success: false, error: `Echec de l'envoi : ${message}` };
  }
}
