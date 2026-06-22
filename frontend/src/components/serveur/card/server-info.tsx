"use client";

import { Check, Copy, ExternalLink, Gamepad2, Globe } from "lucide-react";
import { useState } from "react";
import { cleanWebsiteHost, deriveServerWebsite, toWebsiteHref } from "@/utils/server-website";
import { Language } from "@/types/server";
import ServerLanguages from "./server-languages";

interface ServerInfoProps {
  name: string;
  address: string | null;
  website?: string | null;
  languages?: Language[];
}

const ServerInfo = ({ name, address, website, languages }: ServerInfoProps) => {
  const [copied, setCopied] = useState(false);
  // Persisted value (derived server-side), falling back to the client-side
  // derivation for servers not backfilled yet. Normalised so a stored scheme
  // (or a malformed one like `https//host`) never doubles up when we open it.
  const resolvedWebsite = cleanWebsiteHost(website) || deriveServerWebsite(address);

  const handleCopy = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address.toLowerCase());
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API non disponible (HTTP en local) — ignorer silencieusement
    }
  };

  const openWebsite = (e: React.MouseEvent<HTMLButtonElement>) => {
    // The whole card is a <Link>: open the site without triggering navigation
    // or nesting an anchor inside an anchor.
    e.preventDefault();
    e.stopPropagation();
    if (resolvedWebsite) window.open(toWebsiteHref(resolvedWebsite), "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-w-0 flex flex-col gap-0.5">
      <div className="flex min-w-0 items-center gap-2">
        <span className="truncate text-lg font-bold leading-tight text-foreground">{name}</span>
        {languages && languages.length > 0 && <ServerLanguages languages={languages} className="shrink-0" />}
      </div>
      {address ? (
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? "Address copied" : "Copy server address"}
          title={copied ? "Copied!" : "Click to copy"}
          className="group/copy inline-flex max-w-full items-center gap-1.5 self-start text-sm text-muted-foreground hover:text-accent transition-colors"
        >
          <Gamepad2 className="h-3.5 w-3.5 shrink-0 opacity-70" />
          <span className="truncate font-mono text-[13px]">{address.toLowerCase()}</span>
          {copied ? (
            <Check className="h-3.5 w-3.5 shrink-0 text-success" />
          ) : (
            <Copy className="h-3.5 w-3.5 shrink-0 opacity-60 transition-opacity md:opacity-0 md:group-hover/copy:opacity-100" />
          )}
        </button>
      ) : null}
      {resolvedWebsite ? (
        <button
          type="button"
          onClick={openWebsite}
          aria-label={`Visit ${resolvedWebsite}`}
          title={`Visit ${resolvedWebsite}`}
          className="group/web inline-flex max-w-full items-center gap-1.5 self-start text-xs text-muted-foreground hover:text-accent transition-colors"
        >
          <Globe className="h-3.5 w-3.5 shrink-0 opacity-70" />
          <span className="truncate">{resolvedWebsite}</span>
          <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-60 transition-opacity md:opacity-0 md:group-hover/web:opacity-100" />
        </button>
      ) : null}
    </div>
  );
};

export default ServerInfo;
