"use client";
import { fetcher, getBaseUrl } from "@/app/_cheatcode";
import Loader from "@/components/loader";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/auth";
import { AccessToken, User } from "@/types/auth";
import { useTranslations } from "next-intl";
import { useParams, useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useEffect } from "react";
import useSWR from "swr";

const CallbackPage = () => {
  const t = useTranslations("Auth");
  const provider = useParams().provider;
  const code = useSearchParams().get("code");

  const { data, isLoading } = useSWR<{user: User, accessToken: AccessToken}>(`${getBaseUrl()}/callback/${provider}?code=${code}`, fetcher);
  const { setUser, saveToken, setIsLoggedIn } = useAuth();

  const router = useRouter();
  const {toast} = useToast();

  useEffect(() => {
    if(isLoading) return;
    if (data?.user?.username) {
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
  }, [data, router, setUser, saveToken, setIsLoggedIn, toast, provider, isLoading, t]);

  return (
    <div>
      {isLoading && <Loader message={t("callback.connecting", { provider: String(provider) })} />}
    </div>
  );
};

export default CallbackPage;
