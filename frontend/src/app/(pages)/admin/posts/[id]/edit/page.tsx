"use client";

import { TiptapEditor } from "@/components/blog/tiptap-editor";
import { useAuth } from "@/contexts/auth";
import { getAdminPosts, updatePost } from "@/http/post";
import { Post } from "@/types/post";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const EditPostPage = () => {
  const { user, getToken } = useAuth();
  const token = getToken();
  const router = useRouter();
  const params = useParams();
  const postId = Number.parseInt(params.id as string);

  const [post, setPost] = useState<Post | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!token) return;

    const fetchPost = async () => {
      try {
        setFetching(true);
        const response = await getAdminPosts(token, 1, 100);
        const foundPost = response.data.find((p) => p.id === postId);
        if (foundPost) {
          setPost(foundPost);
          setTitle(foundPost.title);
          setSlug(foundPost.slug);
          setContent(foundPost.content);
          setExcerpt(foundPost.excerpt || "");
          setCoverImage(foundPost.coverImage || "");
        }
      } catch (error) {
        console.error("Failed to fetch post:", error);
      } finally {
        setFetching(false);
      }
    };

    fetchPost();
  }, [token, postId]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-900 dark:text-white">Loading...</div>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="min-h-screenflex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-2">Access Denied</h1>
          <p className="text-gray-600 dark:text-slate-400">You must be an administrator to access this page.</p>
        </div>
      </div>
    );
  }

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-900 dark:text-white">Loading article...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Article Not Found</h1>
          <p className="text-gray-600 dark:text-slate-400 mb-6">The article you are looking for does not exist.</p>
          <Link
            href="/admin/posts"
            className="inline-flex items-center gap-2 text-stats-blue-600 hover:text-stats-blue-700 dark:text-stats-blue-400 dark:hover:text-stats-blue-300"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Articles
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      setLoading(true);
      await updatePost(
        postId,
        {
          title,
          slug,
          content,
          excerpt: excerpt || undefined,
          coverImage: coverImage || undefined,
        },
        token
      );
      router.push("/admin/posts");
    } catch (error) {
      console.error("Failed to update post:", error);
      alert("Failed to update article");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-4xl animate-in fade-in slide-in-from-bottom-2 duration-300">
        <Link
          href="/admin/posts"
          className="flex items-center gap-2 text-stats-blue-600 hover:text-stats-blue-500 dark:text-stats-blue-400 dark:hover:text-stats-blue-300 transition-colors mb-6 font-medium"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to List
        </Link>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Edit Article</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Server Update v2.0"
              className="w-full bg-white dark:bg-stats-blue-900 border border-gray-300 dark:border-stats-blue-700 rounded-md px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-stats-blue-500 focus:border-transparent transition-all"
              required
            />
          </div>

          {/* Slug Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Slug</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full bg-white dark:bg-stats-blue-900 border border-gray-300 dark:border-stats-blue-700 rounded-md px-4 py-2 text-gray-700 dark:text-slate-300 font-mono text-sm placeholder-gray-500 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-stats-blue-500/50 focus:border-transparent"
            />
          </div>

          {/* Summary Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Summary (optional)</label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={2}
              className="w-full bg-white dark:bg-stats-blue-900 border border-gray-300 dark:border-stats-blue-700 rounded-md px-4 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-stats-blue-500/50 focus:border-transparent resize-none"
              placeholder="A short description for the article card..."
            />
          </div>

          {/* Cover Image Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
              Cover Image URL (optional)
            </label>
            <input
              type="text"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full bg-white dark:bg-stats-blue-900 border border-gray-300 dark:border-stats-blue-700 rounded-md px-4 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-stats-blue-500/50 focus:border-transparent"
            />
          </div>

          {/* Content Editor */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
              Content <span className="text-red-500">*</span>
            </label>
            <TiptapEditor content={content} onChange={setContent} />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 pt-4 border-t border-gray-200 dark:border-stats-blue-800">
            <button
              type="submit"
              className="bg-stats-blue-600 hover:bg-stats-blue-500 text-white px-6 py-2.5 rounded-md font-medium transition-all shadow-lg shadow-stats-blue-900/20"
            >
              {loading ? "Updating..." : "Update Article"}
            </button>
            <Link
              href="/admin/posts"
              className="bg-gray-200 hover:bg-gray-300 dark:bg-stats-blue-900 dark:hover:bg-stats-blue-800 text-gray-800 dark:text-slate-300 px-6 py-2.5 rounded-md font-medium border border-gray-300 dark:border-stats-blue-700 transition-all"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPostPage;
