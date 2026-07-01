"use client";
import AuthCard from "@/components/form/auth-card";
import ForgotPasswordForm from "@/components/form/forgot-password-form";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useTranslations } from "next-intl";
import { FC } from "react";

const ForgotPasswordPage: FC = () => {
  const t = useTranslations("Auth");

  return (
    <AuthCard
      icon={<Icon icon="lucide:key-round" className="h-[18px] w-[18px]" />}
      title={t("forgotPassword.title")}
      subtitle={t("forgotPassword.subtitle")}
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
};

export default ForgotPasswordPage;
