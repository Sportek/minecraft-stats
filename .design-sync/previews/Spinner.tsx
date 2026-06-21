import { Spinner } from "frontend";

export function Sizes() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 24, padding: 24 }}>
      <Spinner size="xs" label="Pinging server" />
      <Spinner size="sm" label="Pinging server" />
      <Spinner size="md" label="Pinging server" />
      <Spinner size="lg" label="Pinging server" />
      <Spinner size="xl" label="Pinging server" />
    </div>
  );
}

export function Tones() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 24, padding: 24 }}>
      <Spinner size="lg" tone="accent" label="Loading stats" />
      <Spinner size="lg" tone="foreground" label="Loading stats" />
      <Spinner size="lg" tone="muted" label="Loading stats" />
    </div>
  );
}

export function InlineLoading() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 24, fontSize: 14 }}>
      <Spinner size="sm" tone="muted" label="Refreshing player counts" />
      <span>Refreshing player counts for Hypixel…</span>
    </div>
  );
}
