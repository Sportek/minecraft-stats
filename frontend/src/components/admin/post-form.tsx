"use client";

import { CoverImageField } from "@/components/admin/cover-image-field";
import { TiptapEditor } from "@/components/blog/tiptap-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { PostLocale } from "@/types/post";
import { useTranslations } from "next-intl";
import { useState } from "react";

export interface LocaleFields {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
}

export interface PostFormValues {
  defaultLocale: PostLocale;
  /** Shared across every translation. */
  coverImage: string;
  translations: Record<PostLocale, LocaleFields>;
}

const LOCALES: PostLocale[] = ["en", "fr"];

interface PostFormProps {
  values: PostFormValues;
  onLocaleField: <K extends keyof LocaleFields>(locale: PostLocale, field: K, value: LocaleFields[K]) => void;
  onSharedField: (field: "defaultLocale" | "coverImage", value: string) => void;
  onTitleBlur?: (locale: PostLocale) => void;
  onSubmit: (e: React.FormEvent) => void;
  submitLabel: string;
  submitting: boolean;
}

/**
 * Blog post create/edit form. Title/slug/excerpt/content are edited per locale
 * via tabs; the cover image and primary language are shared. Only the primary
 * language is required — secondary translations are optional.
 */
export const PostForm = ({
  values,
  onLocaleField,
  onSharedField,
  onTitleBlur,
  onSubmit,
  submitLabel,
  submitting,
}: PostFormProps) => {
  const t = useTranslations("Admin");
  const tCommon = useTranslations("Common");
  const [active, setActive] = useState<PostLocale>(values.defaultLocale);

  const fields = values.translations[active];
  const isPrimary = active === values.defaultLocale;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      {/* Locale tabs (★ marks the primary/fallback language) */}
      <div className="flex w-fit items-center gap-1 rounded-lg border border-border bg-card p-1">
        {LOCALES.map((loc) => (
          <button
            key={loc}
            type="button"
            onClick={() => setActive(loc)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              active === loc
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tCommon(`languageName.${loc}`)}
            {loc === values.defaultLocale && <span className="ml-1 text-xs opacity-70">★</span>}
          </button>
        ))}
      </div>

      {/* Editor card: title, slug preview, content — for the active locale */}
      <div className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
        <div className="space-y-2 border-b border-border p-5">
          <Input
            type="text"
            value={fields.title}
            onChange={(e) => onLocaleField(active, "title", e.target.value)}
            onBlur={() => onTitleBlur?.(active)}
            placeholder={t("postForm.titlePlaceholder")}
            required={isPrimary}
            aria-label={t("postForm.titlePlaceholder")}
            className="h-auto border-0 bg-transparent px-0 py-0 text-2xl font-extrabold tracking-tight focus-visible:ring-0 focus-visible:ring-offset-0 sm:text-3xl"
          />
          <div className="flex min-w-0 items-center gap-1 text-sm text-muted-foreground">
            <span className="shrink-0">/blog/</span>
            <span className="truncate font-mono text-accent">
              {fields.slug || t("postForm.slugPlaceholder")}
            </span>
          </div>
        </div>

        <TiptapEditor content={fields.content} onChange={(content) => onLocaleField(active, "content", content)} />
      </div>

      {/* Settings card: primary language, slug, cover, excerpt */}
      <div className="rounded-xl border border-border bg-card text-card-foreground shadow-xs">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-base font-bold text-foreground">{t("postForm.details")}</h2>
        </div>
        <div className="grid grid-cols-1 gap-5 p-5">
          <div className="space-y-2">
            <Label>{t("postForm.primaryLanguage")}</Label>
            <select
              value={values.defaultLocale}
              onChange={(e) => onSharedField("defaultLocale", e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {LOCALES.map((loc) => (
                <option key={loc} value={loc}>
                  {tCommon(`languageName.${loc}`)}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">{t("postForm.primaryLanguageHint")}</p>
          </div>

          <div className="space-y-2">
            <Label>{t("postForm.slug")}</Label>
            <Input
              type="text"
              value={fields.slug}
              onChange={(e) => onLocaleField(active, "slug", e.target.value)}
              placeholder={t("postForm.slugInputPlaceholder")}
              className="font-mono text-sm"
            />
          </div>

          <CoverImageField
            value={values.coverImage}
            onChange={(value) => onSharedField("coverImage", value)}
          />

          <div className="space-y-2">
            <Label>{t("postForm.summary")}</Label>
            <textarea
              value={fields.excerpt}
              onChange={(e) => onLocaleField(active, "excerpt", e.target.value)}
              rows={3}
              className="flex w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder={t("postForm.summaryPlaceholder")}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" variant="accent" disabled={submitting}>
          {submitLabel}
        </Button>
        <Button asChild variant="secondary">
          <Link href="/admin/posts">{t("postForm.cancel")}</Link>
        </Button>
      </div>
    </form>
  );
};
