"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Settings,
  Mail,
  Webhook,
  AlertTriangle,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Send,
  CheckCircle2,
  XCircle,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import {
  upsertSetting,
  createWebhook,
  updateWebhook,
  deleteWebhook,
  testWebhook,
  sendTestEmail,
} from "@/server/actions/settings";

const WEBHOOK_EVENTS = [
  "strategy.submitted",
  "strategy.approved",
  "strategy.rejected",
  "deliverable.submitted",
  "deliverable.approved",
  "deliverable.rejected",
  "deliverable.delivered",
  "question.created",
  "question.answered",
  "comment.added",
] as const;

type WebhookData = {
  id: string;
  name: string;
  url: string;
  events: string[];
  active: boolean;
  secret: string | null;
  createdAt: string;
};

interface SettingsClientProps {
  initialSettings: Record<string, unknown>;
  initialWebhooks: WebhookData[];
  hasResendKey: boolean;
}

export function SettingsClient({
  initialSettings,
  initialWebhooks,
  hasResendKey,
}: SettingsClientProps) {
  return (
    <Tabs defaultValue="general">
      <TabsList>
        <TabsTrigger value="general">
          <Settings className="size-3.5" />
          General
        </TabsTrigger>
        <TabsTrigger value="email">
          <Mail className="size-3.5" />
          Email
        </TabsTrigger>
        <TabsTrigger value="webhooks">
          <Webhook className="size-3.5" />
          Webhooks
        </TabsTrigger>
        <TabsTrigger value="danger">
          <AlertTriangle className="size-3.5" />
          Zone danger
        </TabsTrigger>
      </TabsList>

      <TabsContent value="general">
        <GeneralSection initialSettings={initialSettings} />
      </TabsContent>

      <TabsContent value="email">
        <EmailSection
          initialFrom={(initialSettings.email_from as string) ?? ""}
          hasResendKey={hasResendKey}
        />
      </TabsContent>

      <TabsContent value="webhooks">
        <WebhooksSection initialWebhooks={initialWebhooks} />
      </TabsContent>

      <TabsContent value="danger">
        <DangerSection />
      </TabsContent>
    </Tabs>
  );
}

// ==================== General Section ====================

function GeneralSection({
  initialSettings,
}: {
  initialSettings: Record<string, unknown>;
}) {
  const [platformName, setPlatformName] = useState(
    (initialSettings.platform_name as string) ?? "",
  );
  const [supportEmail, setSupportEmail] = useState(
    (initialSettings.support_email as string) ?? "",
  );
  const [notificationMethod, setNotificationMethod] = useState(
    (initialSettings.notification_method as string) ?? "in_app",
  );
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const results = await Promise.all([
        upsertSetting("platform_name", platformName),
        upsertSetting("support_email", supportEmail),
        upsertSetting("notification_method", notificationMethod),
      ]);

      const failed = results.find((r) => !r.success);
      if (failed && !failed.success) {
        toast.error(failed.error);
      } else {
        toast.success("Parametres sauvegardes");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">General</CardTitle>
        <CardDescription>
          Parametres generaux de la plateforme
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="platform_name">Nom de la plateforme</Label>
          <Input
            id="platform_name"
            placeholder="Fastlane"
            value={platformName}
            onChange={(e) => setPlatformName(e.target.value)}
            disabled={saving}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="support_email">Email de support</Label>
          <Input
            id="support_email"
            type="email"
            placeholder="support@fastlane.io"
            value={supportEmail}
            onChange={(e) => setSupportEmail(e.target.value)}
            disabled={saving}
          />
        </div>

        <div className="space-y-2">
          <Label>Methode de notification par defaut</Label>
          <Select
            value={notificationMethod}
            onValueChange={setNotificationMethod}
            disabled={saving}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="in_app">In-app uniquement</SelectItem>
              <SelectItem value="in_app_email">In-app + Email</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Controle comment les utilisateurs recoivent les notifications.
          </p>
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={handleSave} disabled={saving} size="sm">
            {saving ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Save className="size-3.5" />
            )}
            Sauvegarder
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ==================== Email Section ====================

function EmailSection({
  initialFrom,
  hasResendKey,
}: {
  initialFrom: string;
  hasResendKey: boolean;
}) {
  const [emailFrom, setEmailFrom] = useState(initialFrom);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  async function handleSave() {
    setSaving(true);
    const result = await upsertSetting("email_from", emailFrom);
    if (result.success) {
      toast.success("Adresse d'envoi sauvegardee");
    } else {
      toast.error(result.error);
    }
    setSaving(false);
  }

  async function handleTestEmail() {
    setTesting(true);
    const result = await sendTestEmail();
    if (result.success) {
      toast.success("Email de test envoye");
    } else {
      toast.error(result.error);
    }
    setTesting(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Email (Resend)</CardTitle>
        <CardDescription>
          Configuration de l'envoi d'emails via Resend
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email_from">Adresse d'envoi</Label>
          <Input
            id="email_from"
            type="email"
            placeholder="Fastlane <noreply@fastlane.io>"
            value={emailFrom}
            onChange={(e) => setEmailFrom(e.target.value)}
            disabled={saving}
          />
          <p className="text-xs text-muted-foreground">
            Format accepte : "Nom &lt;email@domaine.com&gt;" ou
            "email@domaine.com"
          </p>
        </div>

        <div className="space-y-2">
          <Label>Statut de la cle API Resend</Label>
          <div className="flex items-center gap-2">
            {hasResendKey ? (
              <>
                <CheckCircle2 className="size-4 text-emerald-500" />
                <span className="text-sm text-emerald-600">
                  Cle API configuree
                </span>
              </>
            ) : (
              <>
                <XCircle className="size-4 text-destructive" />
                <span className="text-sm text-destructive">
                  RESEND_API_KEY non definie
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTestEmail}
            disabled={testing || !hasResendKey}
          >
            {testing ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Send className="size-3.5" />
            )}
            Envoyer un email de test
          </Button>
          <Button onClick={handleSave} disabled={saving} size="sm">
            {saving ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Save className="size-3.5" />
            )}
            Sauvegarder
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ==================== Webhooks Section ====================

function WebhooksSection({
  initialWebhooks,
}: {
  initialWebhooks: WebhookData[];
}) {
  const [webhooks, setWebhooks] = useState(initialWebhooks);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<WebhookData | null>(
    null,
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function handleToggle(id: string, active: boolean) {
    setTogglingId(id);
    const result = await updateWebhook(id, { active });
    if (result.success) {
      setWebhooks((prev) =>
        prev.map((w) => (w.id === id ? { ...w, active } : w)),
      );
      toast.success(active ? "Webhook active" : "Webhook desactive");
    } else {
      toast.error(result.error);
    }
    setTogglingId(null);
  }

  async function handleDelete(id: string) {
    const result = await deleteWebhook(id);
    if (result.success) {
      setWebhooks((prev) => prev.filter((w) => w.id !== id));
      toast.success("Webhook supprime");
    } else {
      toast.error(result.error);
    }
    setDeletingId(null);
  }

  async function handleTest(id: string) {
    setTestingId(id);
    const result = await testWebhook(id);
    if (result.success) {
      toast.success("Test envoye avec succes");
    } else {
      toast.error(result.error);
    }
    setTestingId(null);
  }

  function handleCreated(webhook: WebhookData) {
    setWebhooks((prev) => [webhook, ...prev]);
    setCreateOpen(false);
  }

  function handleUpdated(webhook: WebhookData) {
    setWebhooks((prev) =>
      prev.map((w) => (w.id === webhook.id ? webhook : w)),
    );
    setEditingWebhook(null);
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm">Webhooks</CardTitle>
              <CardDescription>
                Envoyer des notifications HTTP lors d'evenements
              </CardDescription>
            </div>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="size-3.5" />
              Creer
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {webhooks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Webhook className="size-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">
                Aucun webhook configure
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Creez un webhook pour recevoir des notifications en temps reel.
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="text-left font-medium px-3 py-2">Nom</th>
                    <th className="text-left font-medium px-3 py-2 hidden sm:table-cell">
                      URL
                    </th>
                    <th className="text-left font-medium px-3 py-2 hidden md:table-cell">
                      Evenements
                    </th>
                    <th className="text-left font-medium px-3 py-2">Actif</th>
                    <th className="w-28" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {webhooks.map((webhook) => (
                    <tr
                      key={webhook.id}
                      className="hover:bg-accent/50 transition-colors"
                    >
                      <td className="px-3 py-2.5 font-medium">
                        {webhook.name}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground hidden sm:table-cell max-w-48 truncate">
                        {webhook.url}
                      </td>
                      <td className="px-3 py-2.5 hidden md:table-cell">
                        <Badge variant="secondary">
                          {webhook.events.length} evenement
                          {webhook.events.length > 1 ? "s" : ""}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5">
                        <Switch
                          size="sm"
                          checked={webhook.active}
                          disabled={togglingId === webhook.id}
                          onCheckedChange={(checked) =>
                            handleToggle(webhook.id, checked)
                          }
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            title="Tester"
                            disabled={testingId === webhook.id}
                            onClick={() => handleTest(webhook.id)}
                          >
                            {testingId === webhook.id ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : (
                              <Send className="size-3" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            title="Modifier"
                            onClick={() => setEditingWebhook(webhook)}
                          >
                            <Pencil className="size-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            title="Supprimer"
                            onClick={() => setDeletingId(webhook.id)}
                          >
                            <Trash2 className="size-3 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <WebhookFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSaved={handleCreated}
      />

      {editingWebhook && (
        <WebhookFormDialog
          open={true}
          onOpenChange={() => setEditingWebhook(null)}
          webhook={editingWebhook}
          onSaved={handleUpdated}
        />
      )}

      <AlertDialog
        open={!!deletingId}
        onOpenChange={() => setDeletingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le webhook ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irreversible. Le webhook ne recevra plus aucune
              notification.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => deletingId && handleDelete(deletingId)}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ==================== Webhook Form Dialog ====================

function WebhookFormDialog({
  open,
  onOpenChange,
  webhook,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  webhook?: WebhookData;
  onSaved: (data: WebhookData) => void;
}) {
  const isEdit = !!webhook;
  const [name, setName] = useState(webhook?.name ?? "");
  const [url, setUrl] = useState(webhook?.url ?? "");
  const [secret, setSecret] = useState(webhook?.secret ?? "");
  const [events, setEvents] = useState<string[]>(webhook?.events ?? []);
  const [saving, setSaving] = useState(false);

  function toggleEvent(event: string) {
    setEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event],
    );
  }

  function selectAll() {
    setEvents([...WEBHOOK_EVENTS]);
  }

  function selectNone() {
    setEvents([]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    if (isEdit && webhook) {
      const result = await updateWebhook(webhook.id, {
        name,
        url,
        events,
        secret,
      });
      if (result.success) {
        toast.success("Webhook mis a jour");
        onSaved({
          ...webhook,
          name,
          url,
          events,
          secret: secret || null,
        });
      } else {
        toast.error(result.error);
      }
    } else {
      const result = await createWebhook({
        name,
        url,
        events,
        secret: secret || undefined,
      });
      if (result.success) {
        toast.success("Webhook cree");
        onSaved({
          id: result.data.id,
          name,
          url,
          events,
          active: true,
          secret: secret || null,
          createdAt: new Date().toISOString(),
        });
      } else {
        toast.error(result.error);
      }
    }
    setSaving(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "Modifier le webhook" : "Creer un webhook"}
            </DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Modifiez les informations du webhook."
                : "Configurez un endpoint pour recevoir des evenements."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="wh-name">Nom</Label>
              <Input
                id="wh-name"
                placeholder="Mon webhook"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="wh-url">URL</Label>
              <Input
                id="wh-url"
                type="url"
                placeholder="https://exemple.com/webhook"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="wh-secret">
                Secret (optionnel)
              </Label>
              <Input
                id="wh-secret"
                placeholder="Utilise pour signer les requetes (HMAC SHA-256)"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                disabled={saving}
              />
              <p className="text-xs text-muted-foreground">
                Si defini, chaque requete inclura un header
                X-Webhook-Signature.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Evenements</Label>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={selectAll}
                    disabled={saving}
                  >
                    Tous
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={selectNone}
                    disabled={saving}
                  >
                    Aucun
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto rounded-md border p-2">
                {WEBHOOK_EVENTS.map((event) => (
                  <label
                    key={event}
                    className="flex items-center gap-2 rounded px-2 py-1.5 text-xs hover:bg-accent cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={events.includes(event)}
                      onChange={() => toggleEvent(event)}
                      disabled={saving}
                      className="rounded border-input"
                    />
                    {event}
                  </label>
                ))}
              </div>
              {events.length === 0 && (
                <p className="text-xs text-destructive">
                  Selectionnez au moins un evenement.
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={saving || events.length === 0}
            >
              {saving && <Loader2 className="size-3.5 animate-spin" />}
              {isEdit ? "Mettre a jour" : "Creer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ==================== Danger Section ====================

function DangerSection() {
  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="text-sm text-destructive">
          Zone danger
        </CardTitle>
        <CardDescription>
          Actions irreversibles sur votre compte
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-destructive/20 bg-destructive/5 p-4">
          <p className="text-sm font-medium">Suppression du compte</p>
          <p className="text-xs text-muted-foreground mt-1">
            Pour supprimer votre compte et toutes les donnees associees,
            contactez le support a{" "}
            <span className="font-medium text-foreground">
              support@fastlane.io
            </span>
            .
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
