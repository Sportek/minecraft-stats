import { getBaseUrl } from "@/app/_cheatcode";
import { AnalyticsDashboard } from "@/types/analytics";
import { getErrorMessage } from "./auth";

// --- Tracking public (best-effort, fire-and-forget) ---

interface TrackPageViewInput {
  visitorId: string;
  path: string;
  referrer: string | null;
  title: string | null;
  durationMs?: number | null;
  token?: string | null;
}

/**
 * Enregistre une page vue. Best-effort : les erreurs sont silencieuses. Le token
 * est joint quand l'utilisateur est connecté, pour attribuer la vue au compte.
 */
export const trackPageView = (input: TrackPageViewInput): void => {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (input.token) {
    headers.Authorization = `Bearer ${input.token}`;
  }

  try {
    fetch(`${getBaseUrl()}/analytics/pageview`, {
      method: "POST",
      headers,
      keepalive: true,
      body: JSON.stringify({
        visitorId: input.visitorId,
        path: input.path,
        referrer: input.referrer,
        title: input.title,
        durationMs: input.durationMs ?? undefined,
      }),
    }).catch(() => {});
  } catch {
    // best-effort
  }
};

/**
 * Anonymous, consent-free hit used only for aggregate counts (unique visitors,
 * per-country traffic). Sends no identifier; the backend folds the IP/UA into a
 * HyperLogLog estimator. Fires for everyone, opt-outs included. Best-effort.
 */
export const recordHit = (): void => {
  try {
    fetch(`${getBaseUrl()}/analytics/hit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
    }).catch(() => {});
  } catch {
    // best-effort
  }
};

/**
 * Relie le visiteur anonyme courant au compte connecté (émis au login).
 */
export const identifyVisitor = (visitorId: string, token: string): void => {
  try {
    fetch(`${getBaseUrl()}/analytics/identify`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      keepalive: true,
      body: JSON.stringify({ visitorId }),
    }).catch(() => {});
  } catch {
    // best-effort
  }
};

// --- Dashboard admin ---

export const getAnalyticsDashboard = async (
  token: string,
  options: { fromDate?: number; toDate?: number } = {}
): Promise<AnalyticsDashboard> => {
  const params = new URLSearchParams();
  if (options.fromDate) params.set("fromDate", String(options.fromDate));
  if (options.toDate) params.set("toDate", String(options.toDate));

  const response = await fetch(`${getBaseUrl()}/admin/analytics?${params.toString()}`, {
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json() as Promise<AnalyticsDashboard>;
};
