"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Badge } from "./badge";

import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";

import { Command as CommandPrimitive } from "cmdk";
import { cn } from "@/lib/utils";


interface MultiSelectProps {
  readonly elements: readonly {
    readonly value: string;
    readonly label: string;
  }[];
  readonly title: string;
  readonly onSelectionChange?: (selected: string[]) => void;
  readonly className?: string;
  readonly defaultSelected?: readonly string[];
}

export function FancyMultiSelect({ elements, title, onSelectionChange, className, defaultSelected }: MultiSelectProps) {

  const inputRef = React.useRef<HTMLInputElement>(null);
  const [open, setOpen] = React.useState(false);
  const [selectedValues, setSelectedValues] = React.useState<readonly string[]>(defaultSelected ?? []);
  const [inputValue, setInputValue] = React.useState("");

  // Libellés relus dans `elements` à chaque rendu : la liste peut arriver après le premier rendu.
  const selected = selectedValues.map(
    (value) => elements.find((element) => element.value === value) ?? { value, label: value }
  );

  const updateSelection = (next: readonly string[]) => {
    setSelectedValues(next);
    onSelectionChange?.([...next]);
  };

  const handleUnselect = (element: { value: string; label: string }) => {
    updateSelection(selectedValues.filter((value) => value !== element.value));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const input = inputRef.current;
    if (input) {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (input.value === "") {
          updateSelection(selectedValues.slice(0, -1));
        }
      }
      if (e.key === "Escape") {
        input.blur();
      }
    }
  };

  if (elements.length === 0) {
    return null;
  }

  const selectables = elements.filter((element) => !selectedValues.includes(element.value));

  return (
    <Popover open={open && selectables.length > 0}>
      <Command onKeyDown={handleKeyDown} className={cn("overflow-visible bg-transparent h-full dark:bg-transparent", className)}>
        <PopoverAnchor asChild>
          <div className="group rounded-md px-3 py-2 text-sm h-full w-full">
            <div className="flex flex-wrap gap-1">
              {selected.map((element) => {
                return (
                  <Badge key={element.value} variant="secondary">
                    {element.label}
                    <button
                      className="rounded-full outline-hidden"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleUnselect(element);
                        }
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onClick={() => handleUnselect(element)}
                    >
                      <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </button>
                  </Badge>
                );
              })}
              <CommandPrimitive.Input
                ref={inputRef}
                value={inputValue}
                onValueChange={setInputValue}
                onBlur={() => setOpen(false)}
                onFocus={() => setOpen(true)}
                placeholder={selected.length === 0 ? title : ""}
                className="ml-2 flex-1 bg-transparent outline-hidden placeholder:text-muted-foreground"
              />
            </div>
          </div>
        </PopoverAnchor>
        <PopoverContent
          align="start"
          className="w-(--radix-popover-trigger-width) p-0"
          // Le focus doit rester dans l'input : c'est son blur qui referme la liste.
          onOpenAutoFocus={(e) => e.preventDefault()}
          onMouseDown={(e) => e.preventDefault()}
        >
          <CommandList className="max-h-60">
            <CommandGroup>
              {selectables.map((element) => {
                return (
                  <CommandItem
                    key={element.value}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onSelect={() => {
                      setInputValue("");
                      updateSelection([...selectedValues, element.value]);
                    }}
                    className={"cursor-pointer"}
                  >
                    {element.label}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </PopoverContent>
      </Command>
    </Popover>
  );
}
