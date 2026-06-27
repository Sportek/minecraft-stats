"use client";

import DashboardHero from "@/components/account/dashboard-hero";
import DashboardLayout from "@/components/account/dashboard-layout";
import DashboardStatTile from "@/components/account/dashboard-stat-tile";
import { AdminFilterTabs } from "@/components/admin/admin-filter-tabs";
import { AdminLoadingState, AdminMessageState } from "@/components/admin/admin-states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LetterTile } from "@/components/ui/letter-tile";
import { useAuth } from "@/contexts/auth";
import { useFormatter, useTranslations } from "next-intl";
import {
  deleteAdvertisement,
  getAdminAdvertisements,
  updateAdvertisement,
} from "@/http/advertisement";
import { Advertisement } from "@/types/advertisement";
import { BarChart3, Pencil, Plus, Power, Search, Trash2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useEffect, useMemo, useState } from "react";

const AdminAdvertisementsPage = () => {
  const { user, getToken } = useAuth();
  const t = useTranslations("Admin");
  const format = useFormatter();
  const token = getToken();
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "disabled">("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!token) return;

    const fetchAds = async () => {
      try {
        setLoading(true);
        setAds(await getAdminAdvertisements(token));
      } catch (error) {
        console.error("Failed to fetch advertisements:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAds();
  }, [token]);

  const activeCount = useMemo(() => ads.filter((a) => a.enabled).length, [ads]);
  const disabledCount = ads.length - activeCount;
  const totalImpressions = useMemo(
    () => ads.reduce((sum, a) => sum + (a.impressionsCount ?? 0), 0),
    [ads]
  );

  // Status tab + name search applied client-side (ads are typically few).
  const visibleAds = useMemo(() => {
    const term = query.trim().toLowerCase();
    return ads.filter((ad) => {
      if (filter === "active" && !ad.enabled) return false;
      if (filter === "disabled" && ad.enabled) return false;
      if (term && !ad.name.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [ads, filter, query]);

  if (!user) {
    return <AdminLoadingState label={t("states.loading")} />;
  }

  if (user.role !== "admin") {
    return (
      <AdminMessageState
        tone="destructive"
        title={t("states.accessDenied")}
        description={t("states.adminOnly")}
      />
    );
  }

  const handleToggle = async (ad: Advertisement) => {
    if (!token) return;
    try {
      const updated = await updateAdvertisement(ad.id, { enabled: !ad.enabled }, token);
      setAds((prev) => prev.map((a) => (a.id === ad.id ? { ...a, enabled: updated.enabled } : a)));
    } catch (error) {
      console.error("Failed to toggle advertisement:", error);
      alert(t("ads.toggleError"));
    }
  };

  const handleDelete = async (adId: number) => {
    if (!token) return;
    if (!confirm(t("ads.deleteConfirm"))) return;
    try {
      await deleteAdvertisement(adId, token);
      setAds((prev) => prev.filter((a) => a.id !== adId));
    } catch (error) {
      console.error("Failed to delete advertisement:", error);
      alert(t("ads.deleteError"));
    }
  };

  const placementLabel = (ad: Advertisement) => {
    const slots: string[] = [];
    if (ad.showOnHome) slots.push(t("ads.placements.home"));
    if (ad.showOnServer) slots.push(t("ads.placements.servers"));
    return slots.length > 0 ? slots.join(" + ") : t("ads.placements.none");
  };

  return (
    <DashboardLayout>
      <DashboardHero
        title={t("ads.title")}
        subtitle={t("ads.subtitle")}
        badge={t("ads.totalBadge", { count: ads.length })}
        action={
          <Button asChild variant="accent">
            <Link href="/admin/advertisements/new">
              <Plus className="h-5 w-5" />
              <span>{t("ads.new")}</span>
            </Link>
          </Button>
        }
      />

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <DashboardStatTile label={t("ads.tiles.total")} value={String(ads.length)} />
        <DashboardStatTile label={t("ads.tiles.active")} value={String(activeCount)} dot="success" />
        <DashboardStatTile label={t("ads.tiles.inactive")} value={String(disabledCount)} dot="muted" />
        <DashboardStatTile label={t("ads.tiles.views")} value={format.number(totalImpressions)} />
      </div>

      {/* Advertisements card */}
      <div className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <AdminFilterTabs
            value={filter}
            onChange={setFilter}
            tabs={[
              { value: "all", label: t("ads.tabs.all", { count: ads.length }) },
              { value: "active", label: t("ads.tabs.active", { count: activeCount }) },
              { value: "disabled", label: t("ads.tabs.inactive", { count: disabledCount }) },
            ]}
          />
          <div className="relative sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("ads.searchPlaceholder")}
              className="pl-9"
            />
          </div>
        </div>

        {/* Rows */}
        {loading ? (
          <div className="px-6 py-12 text-center text-muted-foreground">
            {t("ads.loadingList")}
          </div>
        ) : visibleAds.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
              <Search className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold text-foreground">{t("ads.emptyTitle")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("ads.emptyDescription")}</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {visibleAds.map((ad) => (
              <li
                key={ad.id}
                className="flex flex-col gap-3 p-4 transition-colors hover:bg-secondary/40 sm:flex-row sm:items-center"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <LetterTile name={ad.name} className="h-10 w-10 rounded-md text-sm" />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{ad.name}</p>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="truncate">{placementLabel(ad)}</span>
                      <span aria-hidden className="opacity-50">
                        ·
                      </span>
                      <span className="shrink-0">
                        {t("ads.viewsClicks", {
                          views: format.number(ad.impressionsCount ?? 0),
                          clicks: format.number(ad.clicksCount ?? 0),
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <Badge variant={ad.enabled ? "success" : "secondary"}>
                    {ad.enabled ? t("ads.statusActive") : t("ads.statusInactive")}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-8 w-8 ${
                        ad.enabled
                          ? "text-success hover:text-success"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      onClick={() => handleToggle(ad)}
                      title={ad.enabled ? t("ads.rowActions.disable") : t("ads.rowActions.enable")}
                    >
                      <Power className="h-4 w-4" />
                    </Button>
                    <Button
                      asChild
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-accent"
                      title={t("ads.rowActions.statistics")}
                    >
                      <Link href={`/admin/advertisements/${ad.id}/stats`}>
                        <BarChart3 className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      asChild
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-accent"
                      title={t("ads.rowActions.edit")}
                    >
                      <Link href={`/admin/advertisements/${ad.id}/edit`}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(ad.id)}
                      title={t("ads.rowActions.delete")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminAdvertisementsPage;
