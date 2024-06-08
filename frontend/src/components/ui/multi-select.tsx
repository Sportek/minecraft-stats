"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Badge } from "./badge";

import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";

import { Command as CommandPrimitive } from "cmdk";


interface MultiSelectProps {
  elements: readonly {
    readonly value: string;
    readonly label: string;
  }[];
  title: string;
  onSelectionChange?: (selected: string[]) => void;
}

export function FancyMultiSelect({ elements, title, onSelectionChange }: MultiSelectProps) {

  const inputRef = React.useRef<HTMLInputElement>(null);
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<readonly { value: string; label: string }[]>([elements[1]]);
  const [inputValue, setInputValue] = React.useState("");

  React.useEffect(() => {
    onSelectionChange?.(selected.map((s) => s.value));
  }, [selected, onSelectionChange]);

  const handleUnselect = React.useCallback((element: { value: string; label: string }) => {
    setSelected((prev) => prev.filter((s) => s.value !== element.value));
  }, []);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const input = inputRef.current;
      if (input) {
        if (e.key === "Delete" || e.key === "Backspace") {
          if (input.value === "") {
            setSelected((prev) => {
              const newSelected = [...prev];
              newSelected.pop();
              return newSelected;
            });
          }
        }
        if (e.key === "Escape") {
          input.blur();
        }
      }
    },
    []
  );

  if (elements.length === 0) {
    return null;
  }

  const selectables = elements.filter((element) => !selected.some((s) => s.value === element.value));

  return (
    <Command onKeyDown={handleKeyDown} className="overflow-visible bg-transparent">
      <div className="group bg-white rounded-md border border-input px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        <div className="flex flex-wrap gap-1">
          {selected.map((element) => {
            return (
              <Badge key={element.value} variant="secondary">
                {element.label}
                <button
                  className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
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
            className="ml-2 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>
      <div className="relative mt-2">
        <CommandList>
          {open && selectables.length > 0 ? (
            <div className="absolute top-0 z-10 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in bg-zinc-200">
              <CommandGroup className="h-full overflow-auto">
                {selectables.map((element) => {
                  return (
                    <CommandItem
                      key={element.value}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onSelect={() => {
                        if (!selected.some((s) => s.value === element.value)) {
                          setInputValue("");
                          setSelected((prev) => [...prev, element]);
                        }
                      }}
                      className={"cursor-pointer"}
                    >
                      {element.label}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </div>
          ) : null}
        </CommandList>
      </div>
    </Command>
  );
}
