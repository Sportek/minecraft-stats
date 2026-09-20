"use client";
import { fetcher, getBaseUrl } from "@/app/_cheatcode";
import DashboardHero from "@/components/account/dashboard-hero";
import DashboardLayout from "@/components/account/dashboard-layout";
import EditServerForm from "@/components/form/edit-server-form";
import ServerCustomizationForm from "@/components/form/server-customization-form";
import CustomizationLocked from "@/components/form/server-customization-form/locked";
import Loader from "@/components/loader";
import { useAuth } from "@/contexts/auth";
import { Category, Server, ServerStat } from "@/types/server";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import useSWR from "swr";

const ServerEditPage = () => {
  const t = useTranslations("Servers");
  const { serverId } = useParams();
  const { user } = useAuth();

  const { data: server, isLoading, mutate } = useSWR<{ server: Server; stats: ServerStat[]; categories: Category[] }>(
    `${getBaseUrl()}/servers/${serverId}`,
    fetcher
  );

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-1 flex-col items-center justify-center py-10">
          <Loader message={t("edit.loading")} />
        </div>
      </DashboardLayout>
    );
  }

  if (!server) {
    return null;
  }

  const canCustomize = server.server.ownerVerifiedAt !== null || user?.role === "admin";

  return (
    <DashboardLayout>
      <DashboardHero
        title={t("edit.heroTitle")}
        badge={t("edit.heroBadge")}
        subtitle={t("edit.heroSubtitle")}
      />

      {/* Server details */}
      <section className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
        <div className="flex items-center gap-3 border-b border-border px-6 py-4">
          <Icon icon="material-symbols:edit-outline" className="h-5 w-5 shrink-0 text-foreground" />
          <div className="min-w-0">
            <h2 className="text-base font-semibold tracking-tight text-foreground">{t("edit.detailsTitle")}</h2>
            <p className="text-sm text-muted-foreground">{t("edit.detailsSubtitle")}</p>
          </div>
        </div>
        <div className="px-6 py-5">
          <EditServerForm server={server.server} serverCategories={server.categories} updateServer={mutate} />
        </div>
      </section>

      {/* Personnalisation de la fiche : réservée aux propriétaires vérifiés (et aux admins). */}
      <section className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
        <div className="flex items-center gap-3 border-b border-border px-6 py-4">
          <Icon icon="material-symbols:palette-outline" className="h-5 w-5 shrink-0 text-foreground" />
          <div className="min-w-0">
            <h2 className="text-base font-semibold tracking-tight text-foreground">{t("customization.title")}</h2>
            <p className="text-sm text-muted-foreground">{t("customization.subtitle")}</p>
          </div>
        </div>
        <div className="px-6 py-5">
          {canCustomize ? (
            <ServerCustomizationForm
              server={server.server}
              stats={server.stats}
              categories={server.categories}
              onUpdated={mutate}
            />
          ) : (
            <CustomizationLocked server={server.server} />
          )}
        </div>
      </section>
    </DashboardLayout>
  );
};

export default ServerEditPage;
