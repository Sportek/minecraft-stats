import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuShortcut,
  Button,
} from "frontend";

export function ServerActions() {
  return (
    <div style={{ padding: 24, display: "flex", justifyContent: "center" }}>
      <DropdownMenu open>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">Options</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Server actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            View stats
            <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>Edit server</DropdownMenuItem>
          <DropdownMenuCheckboxItem checked>Show in favorites</DropdownMenuCheckboxItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
