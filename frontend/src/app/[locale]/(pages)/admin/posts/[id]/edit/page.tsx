"use client";

import { AdminBackLink } from "@/components/admin/admin-back-link";
import { AdminLoadingState, AdminMessageState } from "@/components/admin/admin-states";
import { LocaleFields, PostForm, PostFormValues } from "@/components/admin/post-form";
import { useAuth } from "@/contexts/auth";
import { getAdminPost, updatePost } from "@/http/post";
import { emptyPostFormValues, hasPrimaryContent, postFormValuesFromAdmin, slugify, toUpdateInput } from "@/lib/post-form";
import { AdminPost, PostLocale } from "@/types/post";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

const EditPostPage = () => {
  const { user, getToken } = useAuth();
  const t = useTranslations("Admin");
  const token = getToken();
  const router = useRouter();
  const params = useParams();
  const idParam = Array.isArray(params.id) ? params.id[0] : params.id;
  const postId = Number.parseInt(idParam ?? "");

  const [post, setPost] = useState<AdminPost | null>(null);
  const [values, setValues] = useState<PostFormValues>(() => emptyPostFormValues("en"));
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!token) return;

    const fetchPost = async () => {
      try {
        setFetching(true);
        const found = await getAdminPost(postId, token);
        setPost(found);
        setValues(postFormValuesFromAdmin(found));
      } catch (error) {
        console.error("Failed to fetch post:", error);
      } finally {
        setFetching(false);
      }
    };

    fetchPost();
  }, [token, postId]);

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

  if (fetching) {
    return <AdminLoadingState label={t("posts.loadingOne")} />;
  }

  if (!post) {
    return (
      <AdminMessageState title={t("posts.notFoundTitle")} description={t("posts.notFoundDescription")}>
        <AdminBackLink href="/admin/posts" label={t("posts.backToArticles")} />
      </AdminMessageState>
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
      await updatePost(postId, toUpdateInput(values), token);
      router.push("/admin/posts");
    } catch (error) {
      console.error("Failed to update post:", error);
      alert(t("posts.updateError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl animate-in fade-in slide-in-from-bottom-2 py-8 duration-300">
      <AdminBackLink href="/admin/posts" label={t("posts.backToList")} />

      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("posts.editEyebrow")}</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-foreground">{post.title}</h1>
      </div>

      <PostForm
        values={values}
        onLocaleField={onLocaleField}
        onSharedField={onSharedField}
        onTitleBlur={onTitleBlur}
        onSubmit={handleSubmit}
        submitting={loading}
        submitLabel={loading ? t("posts.updating") : t("posts.updateSubmit")}
      />
    </div>
  );
};

export default EditPostPage;
