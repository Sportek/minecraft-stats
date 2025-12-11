"use client";

import { TiptapEditor } from "@/components/blog/tiptap-editor";
import { useAuth } from "@/contexts/auth";
import { createPost } from "@/http/post";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const NewPostPage = () => {
  const { user, getToken } = useAuth();
  const token = getToken();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [loading, setLoading] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-900 dark:text-white">Loading...</div>
      </div>
    );
  }

  if (user.role !== "admin" && user.role !== "writer") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-2">Access Denied</h1>
          <p className="text-gray-600 dark:text-slate-400">You must be a writer or administrator to access this page.</p>
        </div>
      </div>
    );
  }

  const generateSlug = () => {
    if (title) {
      const newSlug = title
        .toLowerCase()
        .replaceAll(/[^a-z0-9]+/g, "-")
        .replaceAll(/(^-|-$)+/g, "");
      setSlug(newSlug);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      setLoading(true);
      await createPost(
        {
          title,
          slug: slug || undefined,
          content,
          excerpt: excerpt || undefined,
          coverImage: coverImage || undefined,
        },
        token
      );
      router.push("/admin/posts");
    } catch (error) {
      console.error("Failed to create post:", error);
      alert("Failed to create article");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen ">
      <div className="container mx-auto px-4 py-8 max-w-4xl animate-in fade-in slide-in-from-bottom-2 duration-300">
        <Link
          href="/admin/posts"
          className="flex items-center gap-2 text-stats-blue-600 hover:text-stats-blue-500 dark:text-stats-blue-400 dark:hover:text-stats-blue-300 transition-colors mb-6 font-medium"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to List
        </Link>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create Article</h1>
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
              onBlur={generateSlug}
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
              {loading ? "Publishing..." : "Publish Article"}
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

export default NewPostPage;
