"use client";

import { AdminBackLink } from "@/components/admin/admin-back-link";
import { AdminLoadingState, AdminMessageState } from "@/components/admin/admin-states";
import { PostForm, PostFormValues } from "@/components/admin/post-form";
import { useAuth } from "@/contexts/auth";
import { createPost } from "@/http/post";
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

  const generateSlug = () => {
    if (title) {
      const newSlug = title
        .toLowerCase()
        .replaceAll(/[^a-z0-9]+/g, "-")
        .replaceAll(/(^-|-$)+/g, "");
      setSlug(newSlug);
    }
  };

  const handleField = <K extends keyof PostFormValues>(field: K, value: PostFormValues[K]) => {
    const setters: Record<keyof PostFormValues, (v: string) => void> = {
      title: setTitle,
      slug: setSlug,
      excerpt: setExcerpt,
      coverImage: setCoverImage,
      content: setContent,
    };
    setters[field](value);
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
    <div className="min-h-screen">
      <div className="container mx-auto max-w-4xl animate-in fade-in slide-in-from-bottom-2 px-4 py-8 duration-300">
        <AdminBackLink href="/admin/posts" label="Back to List" />

        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Create Article</h1>
        </div>

        <PostForm
          values={{ title, slug, excerpt, coverImage, content }}
          onField={handleField}
          onTitleBlur={generateSlug}
          onSubmit={handleSubmit}
          submitting={loading}
          submitLabel={loading ? "Publishing..." : "Publish Article"}
        />
      </div>
    </div>
  );
};

export default NewPostPage;
