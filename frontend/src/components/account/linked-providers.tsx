"use client";

import { DiscordGlyph, GoogleGlyph } from "@/components/form/auth-card/oauth-buttons";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/auth";
import { getLinkedProviders, unlinkProvider } from "@/http/auth";
import { OAuthProvider } from "@/types/auth";
import { Link2 } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import useSWR from "swr";

const PROVIDERS: { id: OAuthProvider; name: string; glyph: React.ReactNode }[] = [
  { id: "google", name: "Google", glyph: <GoogleGlyph /> },
  { id: "discord", name: "Discord", glyph: <DiscordGlyph /> },
];

/**
 * Section "méthodes de connexion" du compte : liste Google/Discord avec leur état,
 * permet d'en lier (via le flow OAuth + email de confirmation) ou d'en délier.
 */
const LinkedProviders = () => {
  const t = useTranslations("Account");
  const format = useFormatter();
  const { user, getToken, loginWithDiscord, loginWithGoogle } = useAuth();
  const { toast } = useToast();
  const [unlinking, setUnlinking] = useState<OAuthProvider | null>(null);

  const token = getToken();
  const { data: linked, mutate } = useSWR(
    token ? (["account-providers", token] as const) : null,
    ([, accessToken]) => getLinkedProviders(accessToken)
  );

  // Un compte créé par email/mot de passe garde toujours ce moyen de connexion ;
  // un compte créé via OAuth doit conserver au moins un provider lié. Le backend
  // applique la même règle — ceci évite juste un aller-retour voué à l'échec.
  const hasPassword = user?.provider === null;
  const canUnlink = hasPassword || (linked?.length ?? 0) >= 2;

  const connect: Record<OAuthProvider, () => void> = {
    discord: loginWithDiscord,
    google: loginWithGoogle,
  };

  const handleUnlink = async (provider: OAuthProvider, name: string) => {
    if (!token) return;
    if (!window.confirm(t("signInMethods.unlinkConfirm", { provider: name }))) return;
    setUnlinking(provider);
    try {
      await unlinkProvider(provider, token);
      await mutate();
      toast({
        title: t("signInMethods.unlinkedTitle"),
        description: t("signInMethods.unlinkedDescription", { provider: name }),
        variant: "success",
      });
    } catch (error) {
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : t("common.somethingWentWrong"),
        variant: "error",
      });
    } finally {
      setUnlinking(null);
    }
  };

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
      <div className="flex items-center gap-2.5 border-b border-border px-6 py-4">
        <Link2 className="h-5 w-5 shrink-0 text-muted-foreground" />
        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            {t("signInMethods.title")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("signInMethods.subtitle", { email: user?.email ?? "" })}
          </p>
        </div>
      </div>

      {linked === undefined ? (
        <p className="px-6 py-5 text-sm text-muted-foreground">{t("common.loading")}</p>
      ) : (
        <div className="divide-y divide-border px-6">
          {PROVIDERS.map(({ id, name, glyph }) => {
            const link = linked.find((candidate) => candidate.provider === id);
            return (
              <div key={id} className="flex items-center justify-between gap-4 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-secondary/50">
                    {glyph}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{name}</p>
                    <p className="text-sm text-muted-foreground">
                      {link
                        ? t("signInMethods.linkedSince", {
                            date: format.dateTime(new Date(link.linkedAt), { dateStyle: "medium" }),
                          })
                        : t("signInMethods.notLinked")}
                    </p>
                  </div>
                </div>
                {link ? (
                  <Button
                    variant="outline"
                    className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    disabled={!canUnlink || unlinking === id}
                    title={canUnlink ? undefined : t("signInMethods.lastMethodHint")}
                    onClick={() => handleUnlink(id, name)}
                  >
                    {unlinking === id ? t("signInMethods.unlinking") : t("signInMethods.unlink")}
                  </Button>
                ) : (
                  <Button variant="outline" onClick={connect[id]}>
                    {t("signInMethods.link")}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default LinkedProviders;
