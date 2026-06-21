"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getPlaceholders, PlaceholderInfo } from "@/http/post";
import { BookText, Copy, Info, X } from "lucide-react";
import { useEffect, useState } from "react";

interface PlaceholderPickerProps {
  onInsert: (placeholder: string) => void;
}

export function PlaceholderPicker({ onInsert }: PlaceholderPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [placeholders, setPlaceholders] = useState<PlaceholderInfo[]>([]);
  const [serverId, setServerId] = useState("");
  const [copiedPlaceholder, setCopiedPlaceholder] = useState<string | null>(null);

  useEffect(() => {
    const loadPlaceholders = async () => {
      try {
        const data = await getPlaceholders();
        setPlaceholders(data);
      } catch (error) {
        console.error("Failed to load placeholders:", error);
      }
    };

    if (isOpen) {
      loadPlaceholders();
    }
  }, [isOpen]);

  const handleInsert = (placeholderName: string) => {
    if (!serverId || isNaN(Number(serverId))) {
      alert("Please enter a valid server ID");
      return;
    }

    const placeholder = `%${placeholderName}_${serverId}%`;
    onInsert(placeholder);
    setIsOpen(false);
    setServerId("");
  };

  const handleCopy = (placeholderName: string) => {
    if (!serverId || isNaN(Number(serverId))) {
      alert("Please enter a valid server ID");
      return;
    }

    const placeholder = `%${placeholderName}_${serverId}%`;
    navigator.clipboard.writeText(placeholder);
    setCopiedPlaceholder(placeholderName);
    setTimeout(() => setCopiedPlaceholder(null), 2000);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        title="Insert Placeholder"
      >
        <BookText className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[80vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border p-4">
              <h2 className="text-xl font-bold text-foreground">Insert Placeholder</h2>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Server ID Input */}
            <div className="border-b border-border bg-secondary/50 p-4">
              <Label className="mb-2 block">Server ID</Label>
              <Input
                type="number"
                value={serverId}
                onChange={(e) => setServerId(e.target.value)}
                placeholder="Enter server ID (e.g., 125)"
              />
              <p className="mt-2 flex items-start gap-1 text-xs text-muted-foreground">
                <Info className="mt-0.5 w-3 h-3 shrink-0" />
                <span>
                  Enter the ID of the server you want to reference. You can find server IDs in the URL when
                  viewing a server page (e.g., /server/125).
                </span>
              </p>
            </div>

            {/* Placeholders List */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-3">
                {placeholders.map((placeholder) => {
                  const isCopied = copiedPlaceholder === placeholder.name;

                  return (
                    <div
                      key={placeholder.name}
                      className="rounded-lg border border-border bg-secondary/50 p-4 transition-all"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <h3 className="font-mono text-sm font-bold text-accent">
                              {placeholder.name}
                            </h3>
                          </div>
                          <p className="mb-2 text-sm text-muted-foreground">
                            {placeholder.description}
                          </p>
                          <code className="rounded bg-secondary px-2 py-1 text-xs text-foreground">
                            {serverId
                              ? `%${placeholder.name}_${serverId}%`
                              : placeholder.example}
                          </code>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            className={isCopied ? "bg-success text-success-foreground hover:bg-success/90" : ""}
                            onClick={() => handleCopy(placeholder.name)}
                            disabled={!serverId}
                            title={!serverId ? "Enter a server ID first" : "Copy to clipboard"}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="accent"
                            onClick={() => handleInsert(placeholder.name)}
                            disabled={!serverId}
                            title={!serverId ? "Enter a server ID first" : "Insert into editor"}
                          >
                            Insert
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-border bg-secondary/50 p-4">
              <p className="text-xs text-muted-foreground">
                <strong>How it works:</strong> Placeholders are replaced with real-time server data when the
                article is displayed. The format is{" "}
                <code className="rounded bg-secondary px-1 py-0.5">
                  %PLACEHOLDER_NAME_SERVER_ID%
                </code>
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
