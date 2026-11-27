import type { Webhook, WebhookDelivery, WebhookEvent } from "@/types/webhook";
import { apiFetch } from "./client";

export const getWebhooks = (token: string) => apiFetch<Webhook[]>("/admin/webhooks", { token });

export const createWebhook = (data: { name: string; url: string; events: WebhookEvent[] }, token: string) =>
  apiFetch<Webhook>("/admin/webhooks", { method: "POST", token, body: data });

export const updateWebhook = (
  id: number,
  data: Partial<Pick<Webhook, "name" | "events" | "enabled">>,
  token: string
) => apiFetch<Webhook>(`/admin/webhooks/${id}`, { method: "PATCH", token, body: data });

export const deleteWebhook = (id: number, token: string) =>
  apiFetch<void>(`/admin/webhooks/${id}`, { method: "DELETE", token });

export const testWebhook = (id: number, token: string) =>
  apiFetch<WebhookDelivery>(`/admin/webhooks/${id}/test`, { method: "POST", token });
