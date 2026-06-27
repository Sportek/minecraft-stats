"use client";

import { AdminBackLink } from "@/components/admin/admin-back-link";
import { AdminLoadingState, AdminMessageState } from "@/components/admin/admin-states";
import { LocaleFields, PostForm, PostFormValues } from "@/components/admin/post-form";
import { useAuth } from "@/contexts/auth";
import { createPost } from "@/http/post";
import { useRouter } from "@/i18n/navigation";
import { emptyPostFormValues, hasPrimaryContent, slugify, toCreateInput } from "@/lib/post-form";
import { PostLocale } from "@/types/post";
import { useTranslations } from "next-intl";
import { useState } from "react";

const NewPostPage = () => {
  const { user, getToken } = useAuth();
  const t = useTranslations("Admin");
  const token = getToken();
  const router = useRouter();
  const [values, setValues] = useState<PostFormValues>(() => emptyPostFormValues("en"));
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

  const onLocaleField = <K extends keyof LocaleFields>(locale: PostLocale, field: K, value: LocaleFields[K]) => {
    setValues((prev) => ({
      ...prev,
      translations: { ...prev.translations, [locale]: { ...prev.translations[locale], [field]: value } },
    }));
  };

  const onSharedField = (field: "defaultLocale" | "coverImage", value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  // Auto-fill the slug from the title, but never clobber a manually edited one.
  const onTitleBlur = (locale: PostLocale) => {
    setValues((prev) => {
      const fields = prev.translations[locale];
      if (!fields.title || fields.slug) return prev;
      return {
        ...prev,
        translations: { ...prev.translations, [locale]: { ...fields, slug: slugify(fields.title) } },
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!hasPrimaryContent(values)) {
      alert(t("postForm.primaryRequired"));
      return;
    }

    try {
      setLoading(true);
      await createPost(toCreateInput(values), token);
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
        values={values}
        onLocaleField={onLocaleField}
        onSharedField={onSharedField}
        onTitleBlur={onTitleBlur}
        onSubmit={handleSubmit}
        submitting={loading}
        submitLabel={loading ? t("posts.publishing") : t("posts.publishSubmit")}
      />
    </div>
  );
};

export default NewPostPage;
