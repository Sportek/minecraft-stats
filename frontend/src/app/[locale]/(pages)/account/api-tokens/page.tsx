"use client";

import DashboardLayout from "@/components/account/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/auth";
import { createApiToken, getApiTokens, revokeApiToken } from "@/http/api-token";
import { ApiToken, CreatedApiToken } from "@/types/api-token";
import { Check, Copy, KeyRound, Trash2 } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

const ApiTokensPage = () => {
  const t = useTranslations("Account");
  const { user, getToken } = useAuth();
  const { toast } = useToast();
  const formatter = useFormatter();
  const formatDate = (value: string | null) =>
    value ? formatter.dateTime(new Date(value), { dateStyle: "medium" }) : "—";

  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [name, setName] = useState("");
  const [expiresInDays, setExpiresInDays] = useState("365");
  const [isCreating, setIsCreating] = useState(false);
  const [createdToken, setCreatedToken] = useState<CreatedApiToken | null>(null);
  const [copied, setCopied] = useState(false);

  const loadTokens = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      setTokens(await getApiTokens(token));
    } catch (error) {
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : t("apiTokens.loadError"),
        variant: "error",
      });
    }
  }, [getToken, toast, t]);

  useEffect(() => {
    loadTokens();
  }, [loadTokens]);

  const handleCreate = async () => {
    const token = getToken();
    if (!token || !name.trim()) return;
    setIsCreating(true);
    try {
      const created = await createApiToken(
        { name: name.trim(), expiresInDays: Number(expiresInDays) || undefined },
        token
      );
      setCreatedToken(created);
      setName("");
      await loadTokens();
    } catch (error) {
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : t("apiTokens.createError"),
        variant: "error",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopy = async () => {
    if (!createdToken) return;
    await navigator.clipboard.writeText(createdToken.token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRevoke = async (id: ApiToken["id"], tokenName: string) => {
    const token = getToken();
    if (!token) return;
    if (!window.confirm(t("apiTokens.revokeConfirm", { name: tokenName }))) return;
    try {
      await revokeApiToken(id, token);
      toast({ title: t("apiTokens.revoked"), variant: "success" });
      await loadTokens();
    } catch (error) {
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : t("apiTokens.revokeError"),
        variant: "error",
      });
    }
  };

  if (!user) {
    return <div className="text-muted-foreground">{t("common.loading")}</div>;
  }

  return (
    <DashboardLayout>
      <section className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
        <div className="flex items-center gap-2.5 border-b border-border px-6 py-4">
          <KeyRound className="h-5 w-5 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <h2 className="text-base font-semibold tracking-tight text-foreground">{t("apiTokens.title")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("apiTokens.subtitle")}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 px-6 py-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_140px_auto] sm:items-end">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="token-name">{t("apiTokens.nameLabel")}</Label>
              <Input
                id="token-name"
                placeholder={t("apiTokens.namePlaceholder")}
                value={name}
                maxLength={100}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="token-expiry">{t("apiTokens.expiryLabel")}</Label>
              <Input
                id="token-expiry"
                type="number"
                min={1}
                max={3650}
                value={expiresInDays}
                onChange={(event) => setExpiresInDays(event.target.value)}
              />
            </div>
            <Button onClick={handleCreate} disabled={isCreating || !name.trim()}>
              {isCreating ? t("apiTokens.creating") : t("apiTokens.create")}
            </Button>
          </div>

          {createdToken && (
            <div className="rounded-lg border border-accent/30 bg-accent/10 p-4">
              <p className="text-sm font-medium text-foreground">
                {t("apiTokens.copyWarning")}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <code className="min-w-0 flex-1 truncate rounded-md bg-background px-3 py-2 font-mono text-sm">
                  {createdToken.token}
                </code>
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold tracking-tight text-foreground">{t("apiTokens.yourTokens")}</h2>
        </div>
        {tokens.length === 0 ? (
          <p className="px-6 py-5 text-sm text-muted-foreground">{t("apiTokens.empty")}</p>
        ) : (
          <ul className="divide-y divide-border">
            {tokens.map((token) => (
              <li key={token.id} className="flex items-center justify-between gap-4 px-6 py-4">
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{token.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("apiTokens.meta", {
                      created: formatDate(token.createdAt),
                      lastUsed: formatDate(token.lastUsedAt),
                      expires: formatDate(token.expiresAt),
                    })}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => handleRevoke(token.id, token.name)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </DashboardLayout>
  );
};

export default ApiTokensPage;
