"use client";

import DashboardHero from "@/components/account/dashboard-hero";
import DashboardLayout from "@/components/account/dashboard-layout";
import { AdminLoadingState, AdminMessageState } from "@/components/admin/admin-states";
import ModerationReports from "@/components/admin/server-moderation/moderation-reports";
import ModerationSearch from "@/components/admin/server-moderation/moderation-search";
import PendingQueue from "@/components/admin/server-moderation/pending-queue";
import { useAuth } from "@/contexts/auth";
import { getPendingServers } from "@/http/server";
import { isModerator } from "@/lib/roles";
import type { Server } from "@/types/server";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

const AdminServersPendingPage = () => {
  const { user, getToken } = useAuth();
  const t = useTranslations("Admin.serversPending");
  const token = getToken();

  // La file reste ici : sa taille alimente le badge du hero.
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    getPendingServers(token)
      .then(setServers)
      .catch(() => setServers([]))
      .finally(() => setLoading(false));
  }, [token]);

  if (!user || !token) return <AdminLoadingState label={t("loading")} />;
  if (!isModerator(user)) {
    return (
      <AdminMessageState tone="destructive" title={t("accessDenied")} description={t("moderatorOnly")} />
    );
  }

  return (
    <DashboardLayout>
      <DashboardHero
        title={t("title")}
        subtitle={t("subtitle")}
        badge={t("queueBadge", { count: servers.length })}
      />
      <ModerationSearch token={token} />
      <ModerationReports token={token} />
      <PendingQueue
        servers={servers}
        loading={loading}
        onReviewed={(id) => setServers((current) => current.filter((s) => s.id !== id))}
      />
    </DashboardLayout>
  );
};

export default AdminServersPendingPage;
