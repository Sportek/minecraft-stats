import { useState } from "react";
import useSWR from "swr";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetcher } from "@/app/_cheatcode";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getClientApiUrl } from "@/lib/domain";

export interface Server {
  id: number;
  name: string;
}

interface ServerListEntry {
  server?: {
    id?: number;
    name?: string;
  };
}

interface ServerSelectProps {
  selectedServers: number[];
  onChange: (servers: number[]) => void;
  disabled: boolean;
}

export const ServerSelect = ({ selectedServers, onChange, disabled }: ServerSelectProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const apiUrl = getClientApiUrl();

  const { data } = useSWR<ServerListEntry[]>(`${apiUrl}/servers`, fetcher);

  // Vérifier et formater les données du serveur
  const servers: Server[] = Array.isArray(data)
    ? data
        .map((obtainData) => ({
          id: obtainData.server?.id,
          name: obtainData.server?.name ?? `Server ${obtainData.server?.id ?? "Unknown"}`,
        }))
        .filter((server): server is Server => server.id != null)
    : [];

  const handleServerToggle = (serverId: number) => {
    const newSelection = selectedServers.includes(serverId)
      ? selectedServers.filter(id => id !== serverId)
      : [...selectedServers, serverId];
    onChange(newSelection);
  };

  const normalizeString = (str: string) => {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  };

  const filteredServers = search.length > 0 
    ? servers.filter(server => normalizeString(server.name).includes(normalizeString(search)))
    : servers;

  // Trier les serveurs pour afficher d'abord les sélectionnés
  const sortedServers = [...filteredServers].sort((a, b) => {
    const aSelected = selectedServers.includes(a.id);
    const bSelected = selectedServers.includes(b.id);
    if (aSelected && !bSelected) return -1;
    if (!aSelected && bSelected) return 1;
    return 0;
  });

  // Limiter l'affichage à 10 serveurs maximum seulement si on ne fait pas de recherche
  const displayedServers = search.length > 0
    ? sortedServers
    : sortedServers.filter((server, index) => 
        selectedServers.includes(server.id) || index < 10
      );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select servers to compare"
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedServers.length === 0
            ? "All monitored servers"
            : `${selectedServers.length} server${selectedServers.length > 1 ? "s" : ""} selected`}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Search for a server..." value={search} onValueChange={setSearch} />
          <CommandEmpty>No server found.</CommandEmpty>
          <CommandGroup>
            <CommandItem
              onSelect={() => {
                onChange([]);
                setOpen(false);
              }}
              className="cursor-pointer"
            >
              <Check className={cn("mr-2 h-4 w-4", selectedServers.length === 0 ? "opacity-100" : "opacity-0")} />
              All monitored servers
            </CommandItem>
            {displayedServers.map((server) => (
              <CommandItem
                key={server.id}
                onSelect={() => {
                  handleServerToggle(server.id);
                  setOpen(false);
                }}
                className="cursor-pointer"
              >
                <Check
                  className={cn("mr-2 h-4 w-4", selectedServers.includes(server.id) ? "opacity-100" : "opacity-0")}
                />
                {server.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}; 