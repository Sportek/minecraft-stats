import { Checkbox, Label } from "frontend";

export function States() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Checkbox id="c1" defaultChecked />
        <Label htmlFor="c1">Show offline servers</Label>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Checkbox id="c2" />
        <Label htmlFor="c2">Only favorites</Label>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Checkbox id="c3" disabled />
        <Label htmlFor="c3">Bedrock servers (coming soon)</Label>
      </div>
    </div>
  );
}
