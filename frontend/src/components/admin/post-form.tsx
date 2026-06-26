"use client";

import { CoverImageField } from "@/components/admin/cover-image-field";
import { TiptapEditor } from "@/components/blog/tiptap-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/navigation";

export interface PostFormValues {
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  content: string;
}

interface PostFormProps {
  values: PostFormValues;
  onField: <K extends keyof PostFormValues>(field: K, value: PostFormValues[K]) => void;
  onTitleBlur?: () => void;
  onSubmit: (e: React.FormEvent) => void;
  submitLabel: string;
  submitting: boolean;
}

/** Shared blog post create/edit form (title, slug, excerpt, cover, content editor). */
export const PostForm = ({
  values,
  onField,
  onTitleBlur,
  onSubmit,
  submitLabel,
  submitting,
}: PostFormProps) => (
  <form onSubmit={onSubmit} className="flex flex-col gap-5">
    {/* Editor card: title, slug preview, Tiptap toolbar + body */}
    <div className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
      <div className="space-y-2 border-b border-border p-5">
        <Input
          type="text"
          value={values.title}
          onChange={(e) => onField("title", e.target.value)}
          onBlur={onTitleBlur}
          placeholder="Article title"
          required
          aria-label="Article title"
          className="h-auto border-0 bg-transparent px-0 py-0 text-2xl font-extrabold tracking-tight focus-visible:ring-0 focus-visible:ring-offset-0 sm:text-3xl"
        />
        <div className="flex min-w-0 items-center gap-1 text-sm text-muted-foreground">
          <span className="shrink-0">/blog/</span>
          <span className="truncate font-mono text-accent">{values.slug || "your-article-slug"}</span>
        </div>
      </div>

      <TiptapEditor content={values.content} onChange={(content) => onField("content", content)} />
    </div>

    {/* Settings card: article details */}
    <div className="rounded-xl border border-border bg-card text-card-foreground shadow-xs">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-base font-bold text-foreground">Article details</h2>
      </div>
      <div className="grid grid-cols-1 gap-5 p-5">
        <div className="space-y-2">
          <Label>Slug</Label>
          <Input
            type="text"
            value={values.slug}
            onChange={(e) => onField("slug", e.target.value)}
            placeholder="auto-from-title"
            className="font-mono text-sm"
          />
        </div>

        <CoverImageField
          value={values.coverImage}
          onChange={(value) => onField("coverImage", value)}
        />

        <div className="space-y-2">
          <Label>Summary (optional)</Label>
          <textarea
            value={values.excerpt}
            onChange={(e) => onField("excerpt", e.target.value)}
            rows={3}
            className="flex w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder="A short description for the article card..."
          />
        </div>
      </div>
    </div>

    <div className="flex items-center gap-3">
      <Button type="submit" variant="accent" disabled={submitting}>
        {submitLabel}
      </Button>
      <Button asChild variant="secondary">
        <Link href="/admin/posts">Cancel</Link>
      </Button>
    </div>
  </form>
);
