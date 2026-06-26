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

/** Rough read-time estimate (~200 words / minute) from raw markdown content. */
const estimateReadTime = (content: string) => {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 200))} min read`;
};

const AdminPostsPage = () => {
  const { user, getToken } = useAuth();
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
    return <AdminLoadingState label="Loading..." />;
  }

  if (user.role !== "admin" && user.role !== "writer") {
    return (
      <AdminMessageState
        tone="destructive"
        title="Access Denied"
        description="You must be a writer or administrator to access this page."
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
      alert("Failed to delete article");
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
      alert("Failed to publish article");
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
      alert("Failed to unpublish article");
    }
  };

  return (
    <DashboardLayout>
      <DashboardHero
        title="Articles"
        subtitle="Create, edit and manage your blog posts."
        action={
          <Button asChild variant="accent">
            <Link href="/admin/posts/new">
              <Plus className="h-5 w-5" />
              <span>New Article</span>
            </Link>
          </Button>
        }
      />

      {/* Stat tiles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <DashboardStatTile label="Total Articles" value={String(allPosts.length)} />
        <DashboardStatTile label="Published" value={String(publishedCount)} dot="success" />
        <DashboardStatTile label="Drafts" value={String(draftCount)} dot="muted" />
      </div>

      {/* Articles card */}
      <div className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <AdminFilterTabs
            value={filter}
            onChange={setFilter}
            tabs={[
              { value: "all", label: `All (${allPosts.length})` },
              { value: "published", label: `Published (${publishedCount})` },
              { value: "draft", label: `Drafts (${draftCount})` },
            ]}
          />
          <div className="relative sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search articles..."
              className="pl-9"
            />
          </div>
        </div>

        {/* Rows */}
        {loading ? (
          <div className="px-6 py-12 text-center text-muted-foreground">Loading articles...</div>
        ) : visiblePosts.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
              <Search className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold text-foreground">No articles found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Nothing matches this filter or search. Try another tab.
            </p>
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
                      <span className="shrink-0">{estimateReadTime(post.content)}</span>
                      <span aria-hidden className="opacity-50">
                        ·
                      </span>
                      <PostViews count={post.viewCount} className="shrink-0" />
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 sm:flex-nowrap sm:justify-end">
                  <Badge variant={post.published ? "success" : "secondary"}>
                    {post.published ? "Published" : "Draft"}
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
                      title="View"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      asChild
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-accent"
                      title="Statistics"
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
                      title="Edit"
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
                      title="Delete"
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
            <DialogTitle>Delete this article?</DialogTitle>
            <DialogDescription>
              {pendingDelete ? (
                <>
                  <span className="font-medium text-foreground">{pendingDelete.title}</span> will be
                  permanently deleted. This action cannot be undone.
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting…" : "Delete article"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminPostsPage;
