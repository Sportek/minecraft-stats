import type { LocaleFields, PostFormValues } from "@/components/admin/post-form";
import type { AdminPost, CreatePostInput, PostLocale, PostTranslationInput } from "@/types/post";

export const POST_LOCALES: PostLocale[] = ["en", "fr", "es"];

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function emptyLocaleFields(): LocaleFields {
  return { title: "", slug: "", excerpt: "", content: "" };
}

/** A blank field set for every supported locale, so the form always has a tab per locale. */
function emptyTranslations(): Record<PostLocale, LocaleFields> {
  return Object.fromEntries(POST_LOCALES.map((locale) => [locale, emptyLocaleFields()])) as Record<
    PostLocale,
    LocaleFields
  >;
}

export function emptyPostFormValues(defaultLocale: PostLocale = "en"): PostFormValues {
  return {
    defaultLocale,
    coverImage: "",
    translations: emptyTranslations(),
  };
}

/** Hydrate the form from an admin post (edit screen). */
export function postFormValuesFromAdmin(post: AdminPost): PostFormValues {
  const translations = emptyTranslations();
  for (const translation of post.translations) {
    translations[translation.locale] = {
      title: translation.title,
      slug: translation.slug,
      excerpt: translation.excerpt ?? "",
      content: translation.content,
    };
  }
  return { defaultLocale: post.defaultLocale, coverImage: post.coverImage ?? "", translations };
}

/**
 * Builds the translation payload, keeping the primary language plus any secondary
 * locale the editor actually filled in (title + content). Empty secondary tabs are
 * dropped so we don't create blank translations.
 */
function buildTranslations(values: PostFormValues): PostTranslationInput[] {
  return POST_LOCALES.flatMap((locale) => {
    const fields = values.translations[locale];
    const isPrimary = locale === values.defaultLocale;
    if (!isPrimary && !(fields.title.trim() && fields.content.trim())) {
      return [];
    }
    return [
      {
        locale,
        title: fields.title,
        slug: fields.slug || undefined,
        content: fields.content,
        excerpt: fields.excerpt || undefined,
      },
    ];
  });
}

export function toCreateInput(values: PostFormValues): CreatePostInput {
  return {
    defaultLocale: values.defaultLocale,
    coverImage: values.coverImage || undefined,
    translations: buildTranslations(values),
  };
}

/** The update payload mirrors create (translations are upserted server-side). */
export function toUpdateInput(values: PostFormValues): CreatePostInput {
  return toCreateInput(values);
}

/** Whether the primary-language translation has the required title + content. */
export function hasPrimaryContent(values: PostFormValues): boolean {
  const primary = values.translations[values.defaultLocale];
  return Boolean(primary.title.trim() && primary.content.trim());
}
