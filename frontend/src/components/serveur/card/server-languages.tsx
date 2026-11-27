"use client";

import { useRef, useState, type MouseEvent, type PointerEvent } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Language } from "@/types/server";

interface ServerLanguagesProps {
  languages: Language[]
  className?: string
}

// Leaves time to move the pointer from the flags to the list without it closing.
const HOVER_CLOSE_DELAY_MS = 150;

// Hosts render inside a card <Link>: keep clicks from navigating. Radix also skips
// its own trigger toggle on a defaultPrevented click, so `open` stays ours.
const preventNavigation = (e: MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
};

const ServerLanguages = ({ languages, className }: ServerLanguagesProps) => {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  if (languages.length === 0) return null;

  const displayedFlags = languages.slice(0, 3);
  const remainingCount = languages.length - 3;

  // Touch has no hover: there the list opens on tap and closes on an outside tap.
  const openOnHover = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    clearTimeout(closeTimer.current);
    setOpen(true);
  };

  const closeOnLeave = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    closeTimer.current = setTimeout(() => setOpen(false), HOVER_CLOSE_DELAY_MS);
  };

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          aria-label={languages.map((language) => language.name).join(", ")}
          onClick={(e) => {
            preventNavigation(e);
            setOpen(true);
          }}
          onPointerEnter={openOnHover}
          onPointerLeave={closeOnLeave}
          className="flex flex-row items-center cursor-pointer rounded-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex -space-x-2">
            {displayedFlags.map((language, index) => (
              <span
                key={language.id}
                className="text-lg relative hover:z-20 hover:-translate-y-0.5 hover:drop-shadow-xs transition-all duration-200 ease-in-out"
                style={{ zIndex: 10 - index }}
              >
                {language.flag}
              </span>
            ))}
          </span>
          {remainingCount > 0 && (
            <span className="text-sm text-muted-foreground ml-1.5 font-medium">
              +{remainingCount}
            </span>
          )}
        </PopoverTrigger>

        <PopoverContent
          side="top"
          align="start"
          sideOffset={8}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onClick={preventNavigation}
          onPointerEnter={openOnHover}
          onPointerLeave={closeOnLeave}
          className="w-auto p-1 rounded-lg shadow-lg"
        >
          {/* ~5.5 rows tall: the half-visible row hints that the list scrolls. */}
          <ul className="flex max-h-[13.5rem] flex-col gap-0.5 overflow-y-auto overscroll-contain">
            {languages.map((language) => (
              <li
                key={language.id}
                className="flex h-9 shrink-0 items-center gap-3 rounded px-3 hover:bg-secondary transition-colors"
              >
                <span className="text-lg">{language.flag}</span>
                <span className="text-sm whitespace-nowrap">{language.name}</span>
              </li>
            ))}
          </ul>
        </PopoverContent>
      </Popover>
    </div>
  )
}

export default ServerLanguages
