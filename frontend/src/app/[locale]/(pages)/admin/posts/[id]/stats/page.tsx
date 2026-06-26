"use client";

import { AdminBackLink } from "@/components/admin/admin-back-link";
import { AdminLoadingState, AdminMessageState } from "@/components/admin/admin-states";
import { AvatarTile } from "@/components/ui/avatar-tile";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/auth";
import { getAdminPostStats } from "@/http/post";
import { PostStats } from "@/types/post";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { useParams } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useState } from "react";

const StatCard = ({ label, value, hint }: { label: string; value: string; hint?: string }) => (
  <div className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-xs">
    <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
    <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">{value}</p>
    {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
  </div>
);

const AdminPostStatsPage = () => {
  const { user, getToken } = useAuth();
  const t = useTranslations("Admin");
  const formatter = useFormatter();
  const formatNumber = (value: number) => formatter.number(value);
  const formatDate = (value: string) =>
    formatter.dateTime(new Date(value), { year: "numeric", month: "short", day: "numeric" });
  const token = getToken();
  const params = useParams();
  const postId = Number(params.id);

  const [stats, setStats] = useState<PostStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !Number.isFinite(postId)) return;

    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        setStats(await getAdminPostStats(postId, token));
      } catch (err) {
        setError(err instanceof Error ? err.message : t("posts.stats.loadError"));
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [token, postId, t]);

  if (!user) {
    return <AdminLoadingState label={t("states.loading")} />;
  }

  if (user.role !== "admin" && user.role !== "writer") {
    return (
      <AdminMessageState
        tone="destructive"
        title={t("states.accessDenied")}
        description={t("states.writerOrAdmin")}
      />
    );
  }

  const feedbackTotal = stats ? stats.feedback.helpful + stats.feedback.notHelpful : 0;
  const helpfulRate =
    feedbackTotal > 0 ? Math.round((stats!.feedback.helpful / feedbackTotal) * 100) : null;

  return (
    <div className="min-h-screen">
      <div className="container mx-auto max-w-5xl animate-in fade-in px-4 py-8 duration-300">
        <AdminBackLink href="/admin/posts" label={t("posts.backToArticles")} />

        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {t("posts.stats.title")}
            {stats ? ` — ${stats.post.title}` : ""}
          </h1>
          <p className="text-muted-foreground">{t("posts.stats.subtitle")}</p>
        </div>

        {error ? (
          <AdminMessageState
            tone="destructive"
            title={t("posts.stats.couldNotLoad")}
            description={error}
          />
        ) : loading ? (
          <div className="space-y-4">
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        ) : !stats ? (
          <AdminMessageState
            tone="destructive"
            title={t("posts.stats.notFoundTitle")}
            description={t("posts.stats.notFoundDescription")}
          />
        ) : (
          <>
            {/* Views */}
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {t("posts.stats.viewsSection")}
            </h2>
            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label={t("posts.stats.totalViews")}
                value={formatNumber(stats.views.total)}
                hint={t("posts.stats.totalViewsHint")}
              />
              <StatCard
                label={t("posts.stats.consentedViews")}
                value={formatNumber(stats.views.consented)}
                hint={t("posts.stats.consentedViewsHint")}
              />
              <StatCard
                label={t("posts.stats.loggedInViews")}
                value={formatNumber(stats.views.loggedIn)}
                hint={t("posts.stats.loggedInViewsHint")}
              />
              <StatCard
                label={t("posts.stats.uniqueVisitors")}
                value={formatNumber(stats.views.uniqueVisitors)}
                hint={t("posts.stats.uniqueVisitorsHint")}
              />
            </div>

            {/* Feedback */}
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {t("posts.stats.feedbackSection")}
            </h2>
            <div className="mb-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-xs">
                <p className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                  <ThumbsUp className="h-3.5 w-3.5 text-success" />
                  {t("posts.stats.helpful")}
                </p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                  {formatNumber(stats.feedback.helpful)}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-xs">
                <p className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                  <ThumbsDown className="h-3.5 w-3.5 text-destructive" />
                  {t("posts.stats.notHelpful")}
                </p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                  {formatNumber(stats.feedback.notHelpful)}
                </p>
              </div>
              <StatCard
                label={t("posts.stats.helpfulRate")}
                value={helpfulRate === null ? "—" : `${helpfulRate} %`}
                hint={t("posts.stats.votes", { count: feedbackTotal })}
              />
            </div>

            {/* Recent logged-in viewers */}
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {t("posts.stats.recentViewers")}
            </h2>
            <div className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
              {stats.recentViewers.length === 0 ? (
                <div className="px-6 py-12 text-center text-sm text-muted-foreground">
                  {t("posts.stats.noViewers")}
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {stats.recentViewers.map((viewer) => (
                    <li key={viewer.id} className="flex items-center gap-3 p-4">
                      <AvatarTile
                        name={viewer.username}
                        src={viewer.avatarUrl}
                        className="h-9 w-9 rounded-md text-sm"
                      />
                      <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                        {viewer.username}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatDate(viewer.lastViewedAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminPostStatsPage;
