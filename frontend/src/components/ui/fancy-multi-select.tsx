import { useState } from "react";
import { Check, ChevronsUpDown, X, Search } from "lucide-react";
import { cn } from "@/lib/utils";
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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export interface SelectOption {
  id: number;
  name: string;
  flag?: string;
}

interface FancyMultiSelectProps {
  options?: SelectOption[];
  selectedIds?: number[];
  onChange?: (ids: number[]) => void;
  placeholder: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
  searchOnly?: boolean;
  onSearch?: (value: string) => void;
  searchValue?: string;
}

export const FancyMultiSelect = ({
  options = [],
  selectedIds = [],
  onChange = () => {},
  placeholder,
  searchPlaceholder = "Search...",
  emptyMessage = "No results found.",
  disabled = false,
  className,
  searchOnly = false,
  onSearch,
  searchValue,
}: FancyMultiSelectProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const handleToggle = (id: number) => {
    const newSelection = selectedIds.includes(id)
      ? selectedIds.filter(selectedId => selectedId !== id)
      : [...selectedIds, id];
    onChange(newSelection);
  };

  const normalizeString = (str: string) => {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  };

  const filteredOptions = search.length > 0 
    ? options.filter(option => normalizeString(option.name).includes(normalizeString(search)))
    : options;

  // Trier les options pour afficher d'abord les sélectionnés
  const sortedOptions = [...filteredOptions].sort((a, b) => {
    const aSelected = selectedIds.includes(a.id);
    const bSelected = selectedIds.includes(b.id);
    if (aSelected && !bSelected) return -1;
    if (!aSelected && bSelected) return 1;
    return 0;
  });

  // Limiter l'affichage à 10 options maximum seulement si on ne fait pas de recherche
  const displayedOptions = search.length > 0
    ? sortedOptions
    : sortedOptions.filter((option, index) => 
        selectedIds.includes(option.id) || index < 10
      );

  if (searchOnly) {
    return (
      <div className={cn("relative", className)}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
        <Input
          placeholder={placeholder}
          value={searchValue}
          onChange={(e) => onSearch?.(e.target.value)}
          className="pl-9 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 transition-colors focus:bg-white dark:focus:bg-zinc-950"
        />
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            {selectedIds.length === 0
              ? placeholder
              : `${selectedIds.length} selected`}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput 
              placeholder={searchPlaceholder} 
              value={search} 
              onValueChange={setSearch} 
            />
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  onChange([]);
                  setOpen(false);
                }}
                className="cursor-pointer"
              >
                <Check className={cn("mr-2 h-4 w-4", selectedIds.length === 0 ? "opacity-100" : "opacity-0")} />
                {placeholder}
              </CommandItem>
              {displayedOptions.map((option) => (
                <CommandItem
                  key={option.id}
                  onSelect={() => {
                    handleToggle(option.id);
                    setOpen(false);
                  }}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn("mr-2 h-4 w-4", selectedIds.includes(option.id) ? "opacity-100" : "opacity-0")}
                  />
                  {option.flag && <span className="mr-1">{option.flag}</span>}
                  {option.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      <div className="flex flex-wrap gap-2 min-h-[1.75rem]">
        {selectedIds.map((id) => {
          const option = options.find(opt => opt.id === id);
          if (!option) return null;
          
          return (
            <Badge
              key={id}
              variant="outline"
              className={cn(
                "cursor-pointer transition-all hover:scale-105",
                "hover:bg-zinc-100 dark:hover:bg-zinc-800",
                "bg-primary/10 border-primary/50 text-primary"
              )}
              onClick={() => handleToggle(id)}
            >
              {option.flag && <span className="mr-1">{option.flag}</span>}
              {option.name}
              <span className="inline-flex ml-1 w-3">
                <X className="h-3 w-3" />
              </span>
            </Badge>
          );
        })}
      </div>
    </div>
  );
}; 