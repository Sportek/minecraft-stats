import { Input, Label } from "frontend";

export function FormFields() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: 24, width: 320 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <Label htmlFor="name">Server name</Label>
        <Input id="name" type="text" placeholder="Hypixel" />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <Label htmlFor="address">Address</Label>
        <Input id="address" type="text" defaultValue="mc.hypixel.net" />
      </div>
    </div>
  );
}

export function Disabled() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: 24, width: 320 }}>
      <Label htmlFor="region" className="peer">
        Region (locked)
      </Label>
      <Input id="region" className="peer" type="text" defaultValue="EU-West" disabled />
    </div>
  );
}
