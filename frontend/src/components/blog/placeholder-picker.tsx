"use client";

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
  const [selectedPlaceholder, setSelectedPlaceholder] = useState<string | null>(null);
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
    setSelectedPlaceholder(null);
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
        className="p-2 rounded hover:bg-gray-200 dark:hover:bg-stats-blue-800"
        title="Insert Placeholder"
      >
        <BookText className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-stats-blue-950 rounded-lg border border-gray-300 dark:border-stats-blue-700 max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-300 dark:border-stats-blue-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Insert Placeholder</h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 rounded hover:bg-gray-200 dark:hover:bg-stats-blue-800 text-gray-600 dark:text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Server ID Input */}
            <div className="p-4 border-b border-gray-300 dark:border-stats-blue-700 bg-gray-50 dark:bg-stats-blue-900/30">
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Server ID
              </label>
              <input
                type="number"
                value={serverId}
                onChange={(e) => setServerId(e.target.value)}
                placeholder="Enter server ID (e.g., 125)"
                className="w-full px-3 py-2 border border-gray-300 dark:border-stats-blue-700 rounded-lg bg-white dark:bg-stats-blue-950 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-stats-blue-500"
              />
              <p className="mt-2 text-xs text-gray-600 dark:text-slate-400 flex items-start gap-1">
                <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
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
                  const isSelected = selectedPlaceholder === placeholder.name;
                  const isCopied = copiedPlaceholder === placeholder.name;

                  return (
                    <div
                      key={placeholder.name}
                      className={`p-4 rounded-lg border transition-all ${
                        isSelected
                          ? "border-stats-blue-500 bg-stats-blue-50 dark:bg-stats-blue-900/30"
                          : "border-gray-200 dark:border-stats-blue-800 bg-gray-50 dark:bg-stats-blue-900/20"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-mono text-sm font-bold text-stats-blue-600 dark:text-stats-blue-400">
                              {placeholder.name}
                            </h3>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-slate-400 mb-2">
                            {placeholder.description}
                          </p>
                          <code className="text-xs bg-gray-200 dark:bg-stats-blue-800 px-2 py-1 rounded text-gray-800 dark:text-slate-200">
                            {serverId
                              ? `%${placeholder.name}_${serverId}%`
                              : placeholder.example}
                          </code>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleCopy(placeholder.name)}
                            disabled={!serverId}
                            className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                              !serverId
                                ? "bg-gray-200 dark:bg-stats-blue-800 text-gray-400 dark:text-slate-600 cursor-not-allowed"
                                : isCopied
                                  ? "bg-green-600 text-white"
                                  : "bg-gray-300 dark:bg-stats-blue-700 text-gray-800 dark:text-white hover:bg-gray-400 dark:hover:bg-stats-blue-600"
                            }`}
                            title={!serverId ? "Enter a server ID first" : "Copy to clipboard"}
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleInsert(placeholder.name)}
                            disabled={!serverId}
                            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                              !serverId
                                ? "bg-gray-300 dark:bg-stats-blue-800 text-gray-400 dark:text-slate-600 cursor-not-allowed"
                                : "bg-stats-blue-600 text-white hover:bg-stats-blue-700"
                            }`}
                            title={!serverId ? "Enter a server ID first" : "Insert into editor"}
                          >
                            Insert
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-300 dark:border-stats-blue-700 bg-gray-50 dark:bg-stats-blue-900/30">
              <p className="text-xs text-gray-600 dark:text-slate-400">
                <strong>How it works:</strong> Placeholders are replaced with real-time server data when the
                article is displayed. The format is{" "}
                <code className="bg-gray-200 dark:bg-stats-blue-800 px-1 py-0.5 rounded">
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
