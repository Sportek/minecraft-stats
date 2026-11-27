export type WebhookEvent = "ownership_claim.created" | "server.submitted" | "server_report.created";

export const WEBHOOK_EVENTS: WebhookEvent[] = ["ownership_claim.created", "server.submitted", "server_report.created"];

export interface Webhook {
  id: number;
  name: string;
  maskedUrl: string;
  events: WebhookEvent[];
  enabled: boolean;
  lastStatus: number | null;
  lastError: string | null;
  lastSentAt: string | null;
  createdAt: string;
}

export interface WebhookDelivery {
  ok: boolean;
  status: number | null;
  error: string | null;
}
