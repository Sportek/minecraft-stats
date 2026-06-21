import { Button } from "frontend";

export function Variants() {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, padding: 24 }}>
      <Button>Add server</Button>
      <Button variant="secondary">View stats</Button>
      <Button variant="accent">Track server</Button>
      <Button variant="destructive">Delete</Button>
      <Button variant="outline">Cancel</Button>
      <Button variant="ghost">Details</Button>
      <Button variant="link">Learn more</Button>
    </div>
  );
}

export function Sizes() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 24 }}>
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
    </div>
  );
}

export function States() {
  return (
    <div style={{ display: "flex", gap: 12, padding: 24 }}>
      <Button>Enabled</Button>
      <Button disabled>Disabled</Button>
      <Button variant="secondary" disabled>
        Unavailable
      </Button>
    </div>
  );
}
