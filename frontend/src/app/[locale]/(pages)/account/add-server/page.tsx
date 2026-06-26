"use client";

import AddServerForm from "@/components/form/add-server-form";
import DashboardLayout from "@/components/account/dashboard-layout";
import DashboardHero from "@/components/account/dashboard-hero";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useTranslations } from "next-intl";
import { FC } from "react";

interface AddServerPageProps {}

const AddServerPage: FC<AddServerPageProps> = () => {
  const t = useTranslations("Account");

  return (
    <DashboardLayout>
      <DashboardHero
        title={t("addServer.title")}
        badge={t("addServer.badge")}
        subtitle={t("addServer.subtitle")}
      />

      {/* Server details */}
      <section className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
        <div className="flex items-center gap-2.5 border-b border-border px-6 py-4">
          <Icon icon="material-symbols:add-circle-outline" className="h-5 w-5 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <h2 className="text-base font-semibold tracking-tight text-foreground">{t("addServer.detailsTitle")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("addServer.detailsSubtitle")}
            </p>
          </div>
        </div>
        <div className="px-6 py-5">
          <AddServerForm />
        </div>
      </section>
    </DashboardLayout>
  );
};

export default AddServerPage;
