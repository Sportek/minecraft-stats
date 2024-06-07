"use client";
import { fetcher, getBaseUrl } from "@/app/_cheatcode";
import Loader from "@/components/loader";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/auth";
import { AccessToken, User } from "@/types/auth";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import useSWR from "swr";

const CallbackPage = () => {
  const provider = useParams().provider;
  const code = useSearchParams().get("code");

  const { data, error, isLoading } = useSWR<{user: User, accessToken: AccessToken}>(`${getBaseUrl()}/callback/${provider}?code=${code}`, fetcher);
  const { setUser, saveToken } = useAuth();

  const router = useRouter();
  const {toast} = useToast();

  useEffect(() => {
    if (data?.user?.username) {
      setUser(data.user);
      saveToken(data.accessToken.token);
      router.push("/");
    } else {
      router.push("/login");
      toast({
        title: "Failed to connect with " + provider,
        description: "Please try again",
      });
    }
  }, [data, router, setUser, saveToken, toast, provider]);

  return (
    <div>
      {isLoading && <Loader message={"Connecting with " + provider} />}
    </div>
  );
};

export default CallbackPage;
