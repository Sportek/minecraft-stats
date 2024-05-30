"use client";
import { fetcher, getBaseUrl } from "@/app/_cheatcode";
import { useAuth } from "@/contexts/auth";
import { User } from "@/types/auth";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import useSWR from "swr";

const CallbackPage = () => {
  const provider = useParams().provider;
  const code = useSearchParams().get("code");

  const { data, error, isLoading } = useSWR<User>(`${getBaseUrl()}/callback/${provider}?code=${code}`, fetcher);
  const { setUser } = useAuth();

  const router = useRouter();

  useEffect(() => {
    if (data?.username) {
      setUser(data);
      router.push("/");
    }
  }, [data, router, setUser]);

  return (
    <div>
      {isLoading && <div>Loading...</div>}
      {error && <div>Error</div>}
      {data && <div>Data: {data.username}</div>}
    </div>
  );
};

export default CallbackPage;
