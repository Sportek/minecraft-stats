"use client";
import { fetcher, getBaseUrl } from "@/app/_cheatcode";
import AuthCard from "@/components/form/auth-card";
import Loader from "@/components/loader";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/auth";
import { AccessToken, User } from "@/types/auth";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useParams, useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useEffect } from "react";
import useSWR from "swr";

type CallbackResponse =
  | { user: User; accessToken: AccessToken }
  // Un compte existe avec cet email mais ce provider n'y est pas encore lié :
  // le backend a envoyé un email de confirmation au lieu de connecter.
  | { status: "link_email_sent"; message: string };

const CallbackPage = () => {
  const t = useTranslations("Auth");
  const provider = useParams().provider;
  const code = useSearchParams().get("code");
  const providerName = provider === "google" ? "Google" : "Discord";

  const { data, isLoading } = useSWR<CallbackResponse>(
    `${getBaseUrl()}/callback/${provider}?code=${code}`,
    fetcher
  );
  const { setUser, saveToken, setIsLoggedIn } = useAuth();

  const router = useRouter();
  const { toast } = useToast();

  const isLinkEmailSent = data !== undefined && "status" in data;

  useEffect(() => {
    if (isLoading || isLinkEmailSent) return;
    if (data && "user" in data && data.user.username) {
      setUser(data.user);
      saveToken(data.accessToken.token);
      setIsLoggedIn(true);
      router.push("/");
    } else {
      router.push("/login");
      setIsLoggedIn(false);
      toast({
        title: t("callback.errorTitle", { provider: String(provider) }),
        description: t("callback.errorDescription"),
      });
    }
  }, [data, router, setUser, saveToken, setIsLoggedIn, toast, provider, isLoading, isLinkEmailSent, t]);

  if (isLinkEmailSent) {
    return (
      <AuthCard
        icon={<Icon icon="lucide:mail-check" className="h-[18px] w-[18px]" />}
        title={t("callback.linkEmailSentTitle")}
        subtitle={t("callback.linkEmailSentSubtitle", { provider: providerName })}
      >
        <div className="space-y-5 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
            <Icon icon="lucide:mail" className="h-7 w-7" />
          </div>
          <div className="space-y-1.5">
            <p className="text-sm text-muted-foreground">
              {t("callback.linkEmailSentDescription", { provider: providerName })}
            </p>
            <p className="text-sm text-muted-foreground">{t("callback.linkEmailSentExpiry")}</p>
          </div>
          <Link
            href="/login"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("callback.backToSignIn")}
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <div>
      {isLoading && <Loader message={t("callback.connecting", { provider: String(provider) })} />}
    </div>
  );
};

export default CallbackPage;
