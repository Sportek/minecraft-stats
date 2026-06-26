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
import { useEffect, useState } from "react";

const formatNumber = (value: number) => new Intl.NumberFormat("en-US").format(value);
const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

const StatCard = ({ label, value, hint }: { label: string; value: string; hint?: string }) => (
  <div className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-xs">
    <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
    <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">{value}</p>
    {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
  </div>
);

const AdminPostStatsPage = () => {
  const { user, getToken } = useAuth();
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
        setError(err instanceof Error ? err.message : "Failed to load statistics.");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [token, postId]);

  if (!user) {
    return <AdminLoadingState label="Loading…" />;
  }

  if (user.role !== "admin" && user.role !== "writer") {
    return (
      <AdminMessageState
        tone="destructive"
        title="Access denied"
        description="You must be a writer or administrator to access this page."
      />
    );
  }

  const feedbackTotal = stats ? stats.feedback.helpful + stats.feedback.notHelpful : 0;
  const helpfulRate =
    feedbackTotal > 0 ? Math.round((stats!.feedback.helpful / feedbackTotal) * 100) : null;

  return (
    <div className="min-h-screen">
      <div className="container mx-auto max-w-5xl animate-in fade-in px-4 py-8 duration-300">
        <AdminBackLink href="/admin/posts" label="Back to articles" />

        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Statistics{stats ? ` — ${stats.post.title}` : ""}
          </h1>
          <p className="text-muted-foreground">Views, reach and reader feedback for this article.</p>
        </div>

        {error ? (
          <AdminMessageState
            tone="destructive"
            title="Could not load statistics"
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
            title="Not found"
            description="This article does not exist."
          />
        ) : (
          <>
            {/* Views */}
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Views
            </h2>
            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Total views"
                value={formatNumber(stats.views.total)}
                hint="Everyone, consent or not"
              />
              <StatCard
                label="Consented views"
                value={formatNumber(stats.views.consented)}
                hint="Tracked via analytics"
              />
              <StatCard
                label="Logged-in views"
                value={formatNumber(stats.views.loggedIn)}
                hint="Attributed to an account"
              />
              <StatCard
                label="Unique visitors"
                value={formatNumber(stats.views.uniqueVisitors)}
                hint="Distinct consented devices"
              />
            </div>

            {/* Feedback */}
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Feedback
            </h2>
            <div className="mb-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-xs">
                <p className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                  <ThumbsUp className="h-3.5 w-3.5 text-success" />
                  Helpful
                </p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                  {formatNumber(stats.feedback.helpful)}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-xs">
                <p className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                  <ThumbsDown className="h-3.5 w-3.5 text-destructive" />
                  Not helpful
                </p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                  {formatNumber(stats.feedback.notHelpful)}
                </p>
              </div>
              <StatCard
                label="Helpful rate"
                value={helpfulRate === null ? "—" : `${helpfulRate} %`}
                hint={`${formatNumber(feedbackTotal)} ${feedbackTotal === 1 ? "vote" : "votes"}`}
              />
            </div>

            {/* Recent logged-in viewers */}
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Recent logged-in viewers
            </h2>
            <div className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
              {stats.recentViewers.length === 0 ? (
                <div className="px-6 py-12 text-center text-sm text-muted-foreground">
                  No logged-in readers yet. Anonymous and non-consenting views still count toward
                  the totals above.
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
