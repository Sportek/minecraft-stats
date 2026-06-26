"use client";
import AuthCard from "@/components/form/auth-card";
import SignUpForm from "@/components/form/sign-up-form";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { FC } from "react";

const SignUpPage: FC = () => {
  const t = useTranslations("Auth");

  return (
    <AuthCard
      icon={<Icon icon="lucide:user-plus" className="h-[18px] w-[18px]" />}
      title={t("signUp.title")}
      subtitle={t("signUp.subtitle")}
    >
      <SignUpForm />

      <p className="mt-5 text-center text-sm text-muted-foreground">
        {t("signUp.haveAccount")}{" "}
        <Link href="/login" className="font-semibold text-accent hover:underline">
          {t("signUp.signIn")}
        </Link>
      </p>
    </AuthCard>
  );
};

export default SignUpPage;
