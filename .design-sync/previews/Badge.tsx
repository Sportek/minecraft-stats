import { Badge } from "frontend";

export function Variants() {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, padding: 24 }}>
      <Badge>Featured</Badge>
      <Badge variant="secondary">Survival</Badge>
      <Badge variant="success">Online</Badge>
      <Badge variant="destructive">Offline</Badge>
      <Badge variant="accent">New</Badge>
      <Badge variant="outline">Whitelisted</Badge>
    </div>
  );
}

export function ServerStatus() {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, padding: 24 }}>
      <Badge variant="success">Online · 38,402 players</Badge>
      <Badge variant="destructive">Offline</Badge>
      <Badge variant="secondary">1.21.4</Badge>
    </div>
  );
}

export function ServerTags() {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, padding: 24 }}>
      <Badge>Java</Badge>
      <Badge variant="accent">Bedrock</Badge>
      <Badge variant="secondary">Skyblock</Badge>
      <Badge variant="secondary">PvP</Badge>
      <Badge variant="outline">English</Badge>
      <Badge variant="outline">Español</Badge>
    </div>
  );
}
