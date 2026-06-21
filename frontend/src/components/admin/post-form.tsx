"use client";

import { TiptapEditor } from "@/components/blog/tiptap-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

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
  <form onSubmit={onSubmit} className="space-y-6">
    <div className="space-y-2">
      <Label>
        Title <span className="text-destructive">*</span>
      </Label>
      <Input
        type="text"
        value={values.title}
        onChange={(e) => onField("title", e.target.value)}
        onBlur={onTitleBlur}
        placeholder="e.g. Server Update v2.0"
        required
      />
    </div>

    <div className="space-y-2">
      <Label>Slug</Label>
      <Input
        type="text"
        value={values.slug}
        onChange={(e) => onField("slug", e.target.value)}
        className="font-mono text-sm"
      />
    </div>

    <div className="space-y-2">
      <Label>Summary (optional)</Label>
      <textarea
        value={values.excerpt}
        onChange={(e) => onField("excerpt", e.target.value)}
        rows={2}
        className="flex w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        placeholder="A short description for the article card..."
      />
    </div>

    <div className="space-y-2">
      <Label>Cover Image URL (optional)</Label>
      <Input
        type="text"
        value={values.coverImage}
        onChange={(e) => onField("coverImage", e.target.value)}
        placeholder="https://example.com/image.jpg"
      />
    </div>

    <div className="space-y-2">
      <Label>
        Content <span className="text-destructive">*</span>
      </Label>
      <TiptapEditor content={values.content} onChange={(content) => onField("content", content)} />
    </div>

    <div className="flex items-center gap-4 border-t border-border pt-4">
      <Button type="submit" variant="accent" disabled={submitting}>
        {submitLabel}
      </Button>
      <Button asChild variant="secondary">
        <Link href="/admin/posts">Cancel</Link>
      </Button>
    </div>
  </form>
);
