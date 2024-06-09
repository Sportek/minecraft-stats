"use client";
import { useAuth } from "@/contexts/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const AccountLayout = ({ children }: { children: React.ReactNode }) => {

  const { isLoggedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn) router.push("/login");
  }, [isLoggedIn, router]);

  return <>{children}</>;
};

export default AccountLayout;

