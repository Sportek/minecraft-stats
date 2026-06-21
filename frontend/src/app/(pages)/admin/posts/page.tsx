"use client";

import { AdminFilterTabs } from "@/components/admin/admin-filter-tabs";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminLoadingState, AdminMessageState } from "@/components/admin/admin-states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth";
import { deletePost, getAdminPosts, publishPost, unpublishPost } from "@/http/post";
import { Post } from "@/types/post";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const AdminPostsPage = () => {
  const { user, getToken } = useAuth();
  const token = getToken();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "published" | "draft">("all");

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

  const handleDelete = async (postId: number) => {
    if (!token) return;
    if (!confirm("Are you sure you want to delete this article?")) return;

    try {
      await deletePost(postId, token);
      setPosts(posts.filter((p) => p.id !== postId));
    } catch (error) {
      console.error("Failed to delete post:", error);
      alert("Failed to delete article");
    }
  };

  const handlePublish = async (postId: number) => {
    if (!token) return;

    try {
      const updatedPost = await publishPost(postId, token);
      setPosts(posts.map((p) => (p.id === postId ? updatedPost : p)));
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
    } catch (error) {
      console.error("Failed to unpublish post:", error);
      alert("Failed to unpublish article");
    }
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto animate-in fade-in px-4 py-8 duration-300">
        <AdminPageHeader
          title="Manage Articles"
          description="Create, edit and manage your blog posts."
          action={
            <Button asChild variant="accent">
              <Link href="/admin/posts/new">
                <Plus className="h-5 w-5" />
                <span>New Article</span>
              </Link>
            </Button>
          }
        />

        <AdminFilterTabs
          className="mb-6"
          value={filter}
          onChange={setFilter}
          tabs={[
            { value: "all", label: `All (${posts.length})` },
            { value: "published", label: "Published" },
            { value: "draft", label: "Drafts" },
          ]}
        />

        {/* Table */}
        <div className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border bg-secondary text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-4">Title</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Created Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                      Loading articles...
                    </td>
                  </tr>
                ) : posts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                      No articles found. Click &quot;New Article&quot; to create one.
                    </td>
                  </tr>
                ) : (
                  posts.map((post) => (
                    <tr key={post.id} className="group transition-colors hover:bg-secondary/50">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground transition-colors group-hover:text-accent">
                            {post.title}
                          </span>
                          <span className="mt-0.5 font-mono text-xs text-muted-foreground">
                            {post.slug}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={post.published ? "success" : "secondary"}>
                          {post.published ? "Published" : "Draft"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {new Date(post.createdAt).toISOString().split("T")[0]}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
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
                            onClick={() => handleDelete(post.id)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPostsPage;
