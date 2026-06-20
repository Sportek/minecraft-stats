"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

interface ServerInfoProps {
  name: string;
  address: string | null;
}

const ServerInfo = ({ name, address }: ServerInfoProps) => {
  const [copied, setCopied] = useState(false);

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

  return (
    <div className="min-w-0 shrink flex flex-col gap-0.5">
      <div className="text-xl font-semibold truncate text-foreground">{name}</div>
      {address ? (
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? "Address copied" : "Copy server address"}
          title={copied ? "Copied!" : "Click to copy"}
          className="group/copy inline-flex max-w-full items-center gap-1.5 self-start text-sm text-muted-foreground hover:text-accent transition-colors"
        >
          <span className="truncate">{address.toLowerCase()}</span>
          {copied ? (
            <Check className="h-3.5 w-3.5 shrink-0 text-success" />
          ) : (
            <Copy className="h-3.5 w-3.5 shrink-0 opacity-60 transition-opacity md:opacity-0 md:group-hover/copy:opacity-100" />
          )}
        </button>
      ) : null}
    </div>
  );
};

export default ServerInfo;
