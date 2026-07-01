"use client";
import AuthCard from "@/components/form/auth-card";
import ResetPasswordForm from "@/components/form/reset-password-form";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { FC } from "react";

const ResetPasswordPage: FC = () => {
  const t = useTranslations("Auth");
  const { token } = useParams();
  const decodedToken = decodeURIComponent(token as string);

  return (
    <AuthCard
      icon={<Icon icon="lucide:lock-keyhole" className="h-[18px] w-[18px]" />}
      title={t("resetPassword.title")}
      subtitle={t("resetPassword.subtitle")}
    >
      <ResetPasswordForm token={decodedToken} />
    </AuthCard>
  );
};

export default ResetPasswordPage;
