"use client";
import AuthCard from "@/components/form/auth-card";
import LoginForm from "@/components/form/login-form";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { FC } from "react";

const LoginPage: FC = () => {
  const t = useTranslations("Auth");

  return (
    <AuthCard
      icon={<Icon icon="lucide:log-in" className="h-[18px] w-[18px]" />}
      title={t("login.title")}
      subtitle={t("login.subtitle")}
    >
      <LoginForm />

      <p className="mt-5 text-center text-sm text-muted-foreground">
        {t("login.noAccount")}{" "}
        <Link href="/sign-up" className="font-semibold text-accent hover:underline">
          {t("login.signUp")}
        </Link>
      </p>
    </AuthCard>
  );
};

export default LoginPage;
