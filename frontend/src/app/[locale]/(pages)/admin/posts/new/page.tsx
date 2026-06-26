"use client";

import { AdminBackLink } from "@/components/admin/admin-back-link";
import { AdminLoadingState, AdminMessageState } from "@/components/admin/admin-states";
import { PostForm, PostFormValues } from "@/components/admin/post-form";
import { useAuth } from "@/contexts/auth";
import { createPost } from "@/http/post";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

const NewPostPage = () => {
  const { user, getToken } = useAuth();
  const t = useTranslations("Admin");
  const token = getToken();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [loading, setLoading] = useState(false);

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
      alert(t("posts.createError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl animate-in fade-in slide-in-from-bottom-2 py-8 duration-300">
      <AdminBackLink href="/admin/posts" label={t("posts.backToList")} />

      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("posts.newEyebrow")}</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-foreground">{t("posts.newPageTitle")}</h1>
      </div>

      <PostForm
        values={{ title, slug, excerpt, coverImage, content }}
        onField={handleField}
        onTitleBlur={generateSlug}
        onSubmit={handleSubmit}
        submitting={loading}
        submitLabel={loading ? t("posts.publishing") : t("posts.publishSubmit")}
      />
    </div>
  );
};

export default NewPostPage;
