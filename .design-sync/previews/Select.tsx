import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
} from "frontend";

export function Category() {
  return (
    <div style={{ padding: 24, maxWidth: 280 }}>
      <Select defaultValue="skyblock">
        <SelectTrigger>
          <SelectValue placeholder="Select a category" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Game mode</SelectLabel>
            <SelectItem value="survival">Survival</SelectItem>
            <SelectItem value="skyblock">SkyBlock</SelectItem>
            <SelectItem value="creative">Creative</SelectItem>
            <SelectItem value="minigames">Minigames</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}

export function Placeholder() {
  return (
    <div style={{ padding: 24, maxWidth: 280 }}>
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select a version" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1.21">1.21</SelectItem>
          <SelectItem value="1.20">1.20</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
