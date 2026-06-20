import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from "frontend";

export function Palette() {
  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          width: 400,
          height: 320,
          border: "1px solid hsl(var(--border))",
          borderRadius: 8,
          overflow: "hidden",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        }}
      >
        <Command>
          <CommandInput placeholder="Search servers and commands..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Servers">
              <CommandItem>Hypixel</CommandItem>
              <CommandItem>CubeCraft</CommandItem>
              <CommandItem>Mineplex</CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Actions">
              <CommandItem>
                Add a server
                <CommandShortcut>⌘N</CommandShortcut>
              </CommandItem>
              <CommandItem>
                View favorites
                <CommandShortcut>⌘F</CommandShortcut>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </div>
    </div>
  );
}
