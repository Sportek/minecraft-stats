"use client";
import AuthCard from "@/components/form/auth-card";
import { Spinner } from "@/components/ui/spinner";
import { verifyEmail } from "@/http/auth";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

const VerifyEmail = () => {
  const t = useTranslations("Auth");
  const { token } = useParams();
  const decodedToken = decodeURIComponent(token as string);

  const [status, setStatus] = useState<"loading" | "verified" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        await verifyEmail({ token: decodedToken });
        setStatus("verified");
      } catch (error: unknown) {
        if (error instanceof Error) {
          setErrorMessage(error.message);
        }
        setStatus("error");
      }
    };

    run();
  }, [decodedToken]);

  return (
    <AuthCard
      icon={<Icon icon="lucide:mail-check" className="h-[18px] w-[18px]" />}
      title={t("verifyEmail.title")}
      subtitle={t("verifyEmail.subtitle")}
    >
      <div className="space-y-5 text-center">
        {status === "loading" && (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
              <Spinner size="lg" />
            </div>
            <p className="text-sm text-muted-foreground">{t("verifyEmail.checking")}</p>
          </>
        )}

        {status === "verified" && (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-success/10 text-success">
              <Icon icon="material-symbols:check-circle" className="h-7 w-7" />
            </div>
            <div className="space-y-1.5">
              <p className="text-base font-semibold text-foreground">{t("verifyEmail.successTitle")}</p>
              <p className="text-sm text-muted-foreground">{t("verifyEmail.successDescription")}</p>
            </div>
            <Link
              href="/login"
              className="inline-flex h-11 w-full items-center justify-center rounded-md bg-accent px-4 text-[15px] font-semibold text-accent-foreground shadow-xs transition-colors hover:bg-accent/90"
            >
              {t("verifyEmail.continueToSignIn")}
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <Icon icon="material-symbols:error-outline" className="h-7 w-7" />
            </div>
            <div className="space-y-1.5">
              <p className="text-base font-semibold text-foreground">{t("verifyEmail.errorTitle")}</p>
              <p className="text-sm text-muted-foreground">
                {errorMessage ?? t("verifyEmail.errorDescription")}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Link
                href="/sign-up"
                className="inline-flex h-11 w-full items-center justify-center rounded-md bg-accent px-4 text-[15px] font-semibold text-accent-foreground shadow-xs transition-colors hover:bg-accent/90"
              >
                {t("verifyEmail.createNewAccount")}
              </Link>
              <Link
                href="/login"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {t("verifyEmail.backToSignIn")}
              </Link>
            </div>
          </>
        )}
      </div>
    </AuthCard>
  );
};

export default VerifyEmail;
