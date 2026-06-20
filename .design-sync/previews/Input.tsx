import { Input, Label } from "frontend";

export function States() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: 24, width: 320 }}>
      <Input type="text" placeholder="Server name (e.g. Hypixel)" />
      <Input type="text" defaultValue="mc.hypixel.net" />
      <Input type="text" defaultValue="Maintenance in progress" disabled />
    </div>
  );
}

export function SearchAndNumber() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: 24, width: 320 }}>
      <Input type="search" placeholder="Search servers…" />
      <Input type="number" defaultValue={25565} placeholder="Port" />
    </div>
  );
}

export function LabeledField() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: 24, width: 320 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <Label htmlFor="server-address">Server address</Label>
        <Input id="server-address" type="text" placeholder="play.example.net" />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <Label htmlFor="server-port">Port</Label>
        <Input id="server-port" type="number" defaultValue={25565} />
      </div>
    </div>
  );
}
