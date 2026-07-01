"use client";

import ChangePasswordForm from "@/components/form/change-password-form";
import ChangeUsernameForm from "@/components/form/change-username-form";
import DashboardLayout from "@/components/account/dashboard-layout";
import DashboardHero from "@/components/account/dashboard-hero";
import DangerZoneCard from "@/components/account/danger-zone-card";
import InfoField from "@/components/account/info-field";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/auth";
import { KeyRound, User as UserIcon, UserCog } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";

const SettingsPage = () => {
  const t = useTranslations("Account");
  const { user, logoutAll } = useAuth();
  const { toast } = useToast();
  const format = useFormatter();
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false);

  const handleLogoutAll = async () => {
    const confirmed = window.confirm(t("settings.logoutAllConfirm"));
    if (!confirmed) return;
    setIsLoggingOutAll(true);
    try {
      await logoutAll();
      toast({
        title: t("settings.sessionsRevokedTitle"),
        description: t("settings.sessionsRevokedDescription"),
        variant: "success",
      });
    } catch (error) {
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : t("common.somethingWentWrong"),
        variant: "error",
      });
    } finally {
      setIsLoggingOutAll(false);
    }
  };

  if (!user) {
    return <div className="text-muted-foreground">{t("common.loading")}</div>;
  }

  const roleLabels: Record<string, string> = {
    user: t("settings.roles.user"),
    writer: t("settings.roles.writer"),
    admin: t("settings.roles.admin"),
  };

  const createdAt = new Date(user.createdAt);
  const memberSince = format.dateTime(createdAt, { month: "long", year: "numeric" });
  const roleLabel = roleLabels[user.role] ?? user.role;

  return (
    <DashboardLayout>
      <DashboardHero
        avatar={{ name: user.username, src: user.avatarUrl, editable: true }}
        title={user.username}
        badge={roleLabel}
        subtitle={t("settings.memberSince", { email: user.email, date: memberSince })}
      />

      {/* Your information (read-only) */}
      <section className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
        <div className="flex items-center justify-between gap-3 border-b border-border px-6 py-4">
          <div className="flex items-center gap-2.5">
            <UserIcon className="h-5 w-5 shrink-0 text-muted-foreground" />
            <h2 className="text-base font-semibold tracking-tight text-foreground">{t("settings.yourInformation")}</h2>
          </div>
          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            {t("settings.readOnly")}
          </span>
        </div>
        <div className="grid grid-cols-1 gap-x-6 gap-y-5 px-6 py-5 sm:grid-cols-2">
          <InfoField label={t("settings.username")} value={user.username} />
          <InfoField label={t("settings.email")} value={user.email} />
          <InfoField label={t("settings.role")} value={roleLabel} />
          <InfoField
            label={t("settings.registeredAt")}
            value={`${format.dateTime(createdAt, { dateStyle: "medium" })} ${format.dateTime(createdAt, { timeStyle: "short" })}`}
          />
        </div>
      </section>

      {/* Manage username */}
      <section className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
        <div className="flex items-center gap-2.5 border-b border-border px-6 py-4">
          <UserCog className="h-5 w-5 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <h2 className="text-base font-semibold tracking-tight text-foreground">{t("settings.manageUsername")}</h2>
            <p className="text-sm text-muted-foreground">{t("settings.manageUsernameSubtitle")}</p>
          </div>
        </div>
        <div className="px-6 py-5">
          <ChangeUsernameForm />
        </div>
      </section>

      {/* Manage password */}
      <section className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
        <div className="flex items-center gap-2.5 border-b border-border px-6 py-4">
          <KeyRound className="h-5 w-5 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <h2 className="text-base font-semibold tracking-tight text-foreground">{t("settings.managePassword")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("settings.managePasswordSubtitle")}
            </p>
          </div>
        </div>
        <div className="px-6 py-5">
          <ChangePasswordForm />
        </div>
      </section>

      {/* Danger zone */}
      <DangerZoneCard
        title={t("settings.dangerTitle")}
        description={t("settings.dangerDescription")}
        action={
          <Button
            variant="outline"
            className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={handleLogoutAll}
            disabled={isLoggingOutAll}
          >
            {isLoggingOutAll ? t("settings.loggingOut") : t("settings.logoutEverywhere")}
          </Button>
        }
      />
    </DashboardLayout>
  );
};

export default SettingsPage;
