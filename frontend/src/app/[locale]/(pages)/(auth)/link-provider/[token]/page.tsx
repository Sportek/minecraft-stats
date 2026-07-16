"use client";
import AuthCard from "@/components/form/auth-card";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/contexts/auth";
import { confirmProviderLink } from "@/http/auth";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const LinkProvider = () => {
  const t = useTranslations("Auth");
  const { token } = useParams();
  const decodedToken = decodeURIComponent(token as string);
  const { setUser, saveToken, setIsLoggedIn } = useAuth();

  const [status, setStatus] = useState<"loading" | "linked" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Le token est à usage unique : le double-invoke des effets en dev (StrictMode)
  // rejouerait la confirmation et afficherait une erreur après un succès.
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const run = async () => {
      try {
        const response = await confirmProviderLink({ token: decodedToken });
        // Le clic sur le lien email prouve la possession du compte : le backend
        // renvoie une session, on connecte directement.
        setUser(response.user);
        saveToken(response.accessToken.token);
        setIsLoggedIn(true);
        setStatus("linked");
      } catch (error: unknown) {
        if (error instanceof Error) {
          setErrorMessage(error.message);
        }
        setStatus("error");
      }
    };

    run();
  }, [decodedToken, setUser, saveToken, setIsLoggedIn]);

  return (
    <AuthCard
      icon={<Icon icon="lucide:link" className="h-[18px] w-[18px]" />}
      title={t("linkProvider.title")}
      subtitle={t("linkProvider.subtitle")}
    >
      <div className="space-y-5 text-center">
        {status === "loading" && (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
              <Spinner size="lg" />
            </div>
            <p className="text-sm text-muted-foreground">{t("linkProvider.checking")}</p>
          </>
        )}

        {status === "linked" && (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-success/10 text-success">
              <Icon icon="material-symbols:check-circle" className="h-7 w-7" />
            </div>
            <div className="space-y-1.5">
              <p className="text-base font-semibold text-foreground">{t("linkProvider.successTitle")}</p>
              <p className="text-sm text-muted-foreground">{t("linkProvider.successDescription")}</p>
            </div>
            <Link
              href="/"
              className="inline-flex h-11 w-full items-center justify-center rounded-md bg-accent px-4 text-[15px] font-semibold text-accent-foreground shadow-xs transition-colors hover:bg-accent/90"
            >
              {t("linkProvider.continue")}
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <Icon icon="material-symbols:error-outline" className="h-7 w-7" />
            </div>
            <div className="space-y-1.5">
              <p className="text-base font-semibold text-foreground">{t("linkProvider.errorTitle")}</p>
              <p className="text-sm text-muted-foreground">
                {errorMessage ?? t("linkProvider.errorDescription")}
              </p>
            </div>
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("linkProvider.backToSignIn")}
            </Link>
          </>
        )}
      </div>
    </AuthCard>
  );
};

export default LinkProvider;
