"use client";

import DashboardHero from "@/components/account/dashboard-hero";
import DashboardLayout from "@/components/account/dashboard-layout";
import DashboardStatTile from "@/components/account/dashboard-stat-tile";
import { AdminFilterTabs } from "@/components/admin/admin-filter-tabs";
import { AdminLoadingState, AdminMessageState } from "@/components/admin/admin-states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AvatarTile } from "@/components/ui/avatar-tile";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/auth";
import { deletePost, getAdminPosts, publishPost, unpublishPost } from "@/http/post";
import { Post } from "@/types/post";
import { PostViews } from "@/components/blog/post-meta";
import { BarChart3, Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

/** Rough read-time estimate (~200 words / minute) from raw markdown content. */
const estimateReadMinutes = (content: string) => {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
};

const AdminPostsPage = () => {
  const { user, getToken } = useAuth();
  const t = useTranslations("Admin");
  const locale = useLocale();
  const token = getToken();
  const [posts, setPosts] = useState<Post[]>([]);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "published" | "draft">("all");
  const [query, setQuery] = useState("");
  const [pendingDelete, setPendingDelete] = useState<Post | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!token) return;

    const fetchPosts = async () => {
      try {
        setLoading(true);
        const response = await getAdminPosts(token, 1, 50, filter);
        setPosts(response.data);
      } catch (error) {
        console.error("Failed to fetch posts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [token, filter]);

  // Separate unfiltered fetch so the stat tiles and tab counts always reflect
  // the full set of posts, independent of the active filter tab.
  useEffect(() => {
    if (!token) return;

    const fetchAllPosts = async () => {
      try {
        const response = await getAdminPosts(token, 1, 50, "all");
        setAllPosts(response.data);
      } catch (error) {
        console.error("Failed to fetch posts:", error);
      }
    };

    fetchAllPosts();
  }, [token]);

  const publishedCount = useMemo(() => allPosts.filter((p) => p.published).length, [allPosts]);
  const draftCount = allPosts.length - publishedCount;

  const visiblePosts = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return posts;
    return posts.filter(
      (p) => p.title.toLowerCase().includes(term) || p.slug.toLowerCase().includes(term)
    );
  }, [posts, query]);

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

  const confirmDelete = async () => {
    if (!token || !pendingDelete) return;
    const postId = pendingDelete.id;
    setIsDeleting(true);
    try {
      await deletePost(postId, token);
      setPosts((current) => current.filter((p) => p.id !== postId));
      setAllPosts((current) => current.filter((p) => p.id !== postId));
      setPendingDelete(null);
    } catch (error) {
      console.error("Failed to delete post:", error);
      alert(t("posts.deleteError"));
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePublish = async (postId: number) => {
    if (!token) return;

    try {
      const updatedPost = await publishPost(postId, token);
      setPosts(posts.map((p) => (p.id === postId ? updatedPost : p)));
      setAllPosts(allPosts.map((p) => (p.id === postId ? updatedPost : p)));
    } catch (error) {
      console.error("Failed to publish post:", error);
      alert(t("posts.publishError"));
    }
  };

  const handleUnpublish = async (postId: number) => {
    if (!token) return;

    try {
      const updatedPost = await unpublishPost(postId, token);
      setPosts(posts.map((p) => (p.id === postId ? updatedPost : p)));
      setAllPosts(allPosts.map((p) => (p.id === postId ? updatedPost : p)));
    } catch (error) {
      console.error("Failed to unpublish post:", error);
      alert(t("posts.unpublishError"));
    }
  };

  return (
    <DashboardLayout>
      <DashboardHero
        title={t("posts.title")}
        subtitle={t("posts.subtitle")}
        action={
          <Button asChild variant="accent">
            <Link href="/admin/posts/new">
              <Plus className="h-5 w-5" />
              <span>{t("posts.new")}</span>
            </Link>
          </Button>
        }
      />

      {/* Stat tiles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <DashboardStatTile label={t("posts.tiles.total")} value={String(allPosts.length)} />
        <DashboardStatTile label={t("posts.tiles.published")} value={String(publishedCount)} dot="success" />
        <DashboardStatTile label={t("posts.tiles.drafts")} value={String(draftCount)} dot="muted" />
      </div>

      {/* Articles card */}
      <div className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <AdminFilterTabs
            value={filter}
            onChange={setFilter}
            tabs={[
              { value: "all", label: t("posts.tabs.all", { count: allPosts.length }) },
              { value: "published", label: t("posts.tabs.published", { count: publishedCount }) },
              { value: "draft", label: t("posts.tabs.drafts", { count: draftCount }) },
            ]}
          />
          <div className="relative sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("posts.searchPlaceholder")}
              className="pl-9"
            />
          </div>
        </div>

        {/* Rows */}
        {loading ? (
          <div className="px-6 py-12 text-center text-muted-foreground">{t("posts.loadingList")}</div>
        ) : visiblePosts.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
              <Search className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold text-foreground">{t("posts.emptyTitle")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("posts.emptyDescription")}</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {visiblePosts.map((post) => (
              <li
                key={post.id}
                className="flex flex-col gap-3 p-4 transition-colors hover:bg-secondary/40 sm:flex-row sm:items-center"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <AvatarTile
                    name={post.title}
                    src={post.coverImage}
                    className="h-12 w-12 shrink-0 rounded-lg text-lg"
                  />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{post.title}</p>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="truncate">{post.author.username}</span>
                      <span aria-hidden className="opacity-50">
                        ·
                      </span>
                      <span className="shrink-0">
                        {t("posts.readTime", { count: estimateReadMinutes(post.content) })}
                      </span>
                      <span aria-hidden className="opacity-50">
                        ·
                      </span>
                      <PostViews count={post.viewCount} locale={locale} className="shrink-0" />
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 sm:flex-nowrap sm:justify-end">
                  <Badge variant={post.published ? "success" : "secondary"}>
                    {post.published ? t("posts.statusPublished") : t("posts.statusDraft")}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {new Date(post.createdAt).toISOString().split("T")[0]}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-accent"
                      onClick={() => (post.published ? handleUnpublish(post.id) : handlePublish(post.id))}
                      title={t("posts.rowActions.view")}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      asChild
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-accent"
                      title={t("posts.rowActions.statistics")}
                    >
                      <Link href={`/admin/posts/${post.id}/stats`}>
                        <BarChart3 className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      asChild
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-accent"
                      title={t("posts.rowActions.edit")}
                    >
                      <Link href={`/admin/posts/${post.id}/edit`}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => setPendingDelete(post)}
                      title={t("posts.rowActions.delete")}
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

      <Dialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("posts.deleteTitle")}</DialogTitle>
            <DialogDescription>
              {pendingDelete
                ? t.rich("posts.deleteDescription", {
                    name: pendingDelete.title,
                    strong: (chunks) => <span className="font-medium text-foreground">{chunks}</span>,
                  })
                : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)} disabled={isDeleting}>
              {t("actions.cancel")}
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? t("posts.deleting") : t("posts.deleteConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminPostsPage;
