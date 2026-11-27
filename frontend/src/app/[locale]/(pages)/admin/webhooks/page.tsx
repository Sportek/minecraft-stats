"use client";

import DashboardHero from "@/components/account/dashboard-hero";
import DashboardLayout from "@/components/account/dashboard-layout";
import { AdminLoadingState, AdminMessageState } from "@/components/admin/admin-states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/auth";
import { createWebhook, deleteWebhook, getWebhooks, testWebhook, updateWebhook } from "@/http/webhooks";
import { WEBHOOK_EVENTS, type Webhook, type WebhookEvent } from "@/types/webhook";
import { Loader2, Pause, Play, Send, Trash2, Webhook as WebhookIcon } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useState } from "react";

const toggleEvent = (events: WebhookEvent[], event: WebhookEvent) =>
  events.includes(event) ? events.filter((e) => e !== event) : [...events, event];

const AdminWebhooksPage = () => {
  const { user, getToken } = useAuth();
  const t = useTranslations("Admin.webhooks");
  const format = useFormatter();
  const { toast } = useToast();
  const token = getToken();

  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<WebhookEvent[]>(WEBHOOK_EVENTS);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!token) return;
    getWebhooks(token)
      .then(setWebhooks)
      .catch(() => setWebhooks([]))
      .finally(() => setLoading(false));
  }, [token]);

  if (!user) return <AdminLoadingState label={t("loading")} />;
  if (user.role !== "admin") {
    return <AdminMessageState tone="destructive" title={t("accessDenied")} description={t("adminOnly")} />;
  }

  const fail = (error: unknown) =>
    toast({ variant: "error", description: error instanceof Error ? error.message : t("error") });

  const replace = (updated: Webhook) =>
    setWebhooks((current) => current.map((w) => (w.id === updated.id ? updated : w)));

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) return;
    setCreating(true);
    try {
      const created = await createWebhook({ name, url, events }, token);
      setWebhooks((current) => [...current, created]);
      setName("");
      setUrl("");
      setEvents(WEBHOOK_EVENTS);
      toast({ variant: "success", description: t("created") });
    } catch (error) {
      fail(error);
    } finally {
      setCreating(false);
    }
  };

  const act = async (webhook: Webhook, action: () => Promise<void>) => {
    setActingId(webhook.id);
    try {
      await action();
    } catch (error) {
      fail(error);
    } finally {
      setActingId(null);
    }
  };

  const handleToggleEvent = (webhook: Webhook, event: WebhookEvent) => {
    const next = toggleEvent(webhook.events, event);
    if (next.length === 0) {
      toast({ variant: "error", description: t("needOneEvent") });
      return;
    }
    return act(webhook, async () => replace(await updateWebhook(webhook.id, { events: next }, token ?? "")));
  };

  const handleToggleEnabled = (webhook: Webhook) =>
    act(webhook, async () => replace(await updateWebhook(webhook.id, { enabled: !webhook.enabled }, token ?? "")));

  const handleTest = (webhook: Webhook) =>
    act(webhook, async () => {
      const delivery = await testWebhook(webhook.id, token ?? "");
      if (delivery.ok) {
        toast({ variant: "success", description: t("testSent") });
      } else {
        toast({ variant: "error", description: t("testFailed", { error: delivery.error ?? String(delivery.status) }) });
      }
      setWebhooks(await getWebhooks(token ?? ""));
    });

  const handleDelete = (webhook: Webhook) => {
    if (!confirm(t("confirmDelete", { name: webhook.name }))) return;
    return act(webhook, async () => {
      await deleteWebhook(webhook.id, token ?? "");
      setWebhooks((current) => current.filter((w) => w.id !== webhook.id));
      toast({ variant: "success", description: t("deleted") });
    });
  };

  return (
    <DashboardLayout>
      <DashboardHero title={t("title")} subtitle={t("subtitle")} badge={t("countBadge", { count: webhooks.length })} />

      <form
        onSubmit={handleCreate}
        className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6 text-card-foreground shadow-xs"
      >
        <h2 className="text-base font-semibold tracking-tight">{t("addTitle")}</h2>
        <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
          <div className="flex flex-col gap-2">
            <Label htmlFor="webhook-name">{t("nameLabel")}</Label>
            <Input
              id="webhook-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("namePlaceholder")}
              maxLength={100}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="webhook-url">{t("urlLabel")}</Label>
            <Input
              id="webhook-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://discord.com/api/webhooks/…"
              required
            />
          </div>
        </div>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium">{t("eventsLabel")}</legend>
          {WEBHOOK_EVENTS.map((event) => (
            <label key={event} className="flex items-center gap-2 text-sm">
              <Checkbox checked={events.includes(event)} onCheckedChange={() => setEvents(toggleEvent(events, event))} />
              {t(`events.${event}`)}
            </label>
          ))}
        </fieldset>
        <Button type="submit" className="w-fit" disabled={creating || events.length === 0}>
          {creating && <Loader2 className="h-4 w-4 animate-spin" />}
          {t("add")}
        </Button>
      </form>

      <div className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
        {loading && <div className="px-6 py-12 text-center text-muted-foreground">{t("loadingList")}</div>}
        {!loading && webhooks.length === 0 && (
          <div className="px-6 py-14 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
              <WebhookIcon className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold text-foreground">{t("emptyTitle")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("emptyDescription")}</p>
          </div>
        )}
        {!loading && webhooks.length > 0 && (
          <ul className="divide-y divide-border">
            {webhooks.map((webhook) => {
              const busy = actingId === webhook.id;
              return (
                <li key={webhook.id} className="flex flex-col gap-3 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="font-medium text-foreground">{webhook.name}</span>
                      {!webhook.enabled && <Badge variant="secondary">{t("paused")}</Badge>}
                    </div>
                    <code className="truncate text-xs text-muted-foreground">{webhook.maskedUrl}</code>
                  </div>

                  <div className="flex flex-wrap gap-x-5 gap-y-2">
                    {WEBHOOK_EVENTS.map((event) => (
                      <label key={event} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={webhook.events.includes(event)}
                          disabled={busy}
                          onCheckedChange={() => handleToggleEvent(webhook, event)}
                        />
                        {t(`events.${event}`)}
                      </label>
                    ))}
                  </div>

                  <p className="text-xs text-muted-foreground">
                    {webhook.lastSentAt
                      ? t(webhook.lastError ? "lastFailed" : "lastOk", {
                          date: format.dateTime(new Date(webhook.lastSentAt), {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }),
                          error: webhook.lastError ?? "",
                        })
                      : t("neverSent")}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleTest(webhook)} disabled={busy}>
                      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      {t("test")}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleToggleEnabled(webhook)} disabled={busy}>
                      {webhook.enabled ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      {webhook.enabled ? t("pause") : t("resume")}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(webhook)} disabled={busy}>
                      <Trash2 className="h-4 w-4" />
                      {t("delete")}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminWebhooksPage;
