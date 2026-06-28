"use client";
import { useAuth } from "@/contexts/auth";
import { useRouter } from "@/i18n/navigation";
import Loader from "@/components/loader";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

const AccountLayout = ({ children }: { children: React.ReactNode }) => {
  const { isLoggedIn, isAuthLoading } = useAuth();
  const router = useRouter();
  const t = useTranslations("Common");

  // Wait for the /me read to settle before deciding: redirecting while the
  // session is still loading would kick out a logged-in user on a hard refresh.
  useEffect(() => {
    if (!isAuthLoading && !isLoggedIn) router.push("/login");
  }, [isAuthLoading, isLoggedIn, router]);

  if (isAuthLoading) return <Loader message={t("loading")} className="min-h-[60vh]" />;

  return <>{children}</>;
};

export default AccountLayout;
