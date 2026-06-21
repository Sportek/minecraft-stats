import { Popover, PopoverTrigger, PopoverContent, Button, Label, Input } from "frontend";

export function Filters() {
  return (
    <div style={{ padding: 40, display: "flex", justifyContent: "center" }}>
      <Popover open>
        <PopoverTrigger asChild>
          <Button variant="outline">Filters</Button>
        </PopoverTrigger>
        <PopoverContent>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <p style={{ fontWeight: 600, margin: 0 }}>Filter servers</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <Label htmlFor="min-players">Minimum players</Label>
              <Input id="min-players" type="number" defaultValue={1000} />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
