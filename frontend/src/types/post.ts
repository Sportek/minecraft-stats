import { User } from './auth'

export type PostLocale = 'fr' | 'en'

export interface Post {
  id: number
  /** Resolved for the requested locale (falls back to the post's primary language). */
  title: string
  slug: string
  content: string
  excerpt: string | null
  coverImage: string | null
  published: boolean
  viewCount: number
  publishedAt: Date | null
  /** Primary language of the post, used as fallback. */
  defaultLocale: PostLocale
  /** Language actually rendered after fallback resolution. */
  localeUsed: PostLocale
  /** Slug of each existing translation, keyed by locale (for hreflang/canonical). */
  slugs: Partial<Record<PostLocale, string>>
  userId: number
  author: User
  createdAt: Date
  updatedAt: Date
}

/** Raw per-locale content, as edited in the admin form. */
export interface PostTranslationContent {
  locale: PostLocale
  title: string
  slug: string
  content: string
  excerpt: string | null
}

/** Admin view of a post: every translation + the locales it exists in. */
export interface AdminPost extends Post {
  availableLocales: PostLocale[]
  translations: PostTranslationContent[]
}

/** A logged-in reader of an article, surfaced in the admin post-stats view. */
export interface PostViewer {
  id: number
  username: string
  avatarUrl: string | null
  lastViewedAt: string
}

/** Engagement statistics for a single post (admin/writer only). */
export interface PostStats {
  post: {
    id: number
    title: string
    slugs: Partial<Record<PostLocale, string>>
    viewCount: number
  }
  views: {
    /** Raw counter — every reader, consent or not. */
    total: number
    /** Consent-aware views recorded by the analytics page-view pipeline. */
    consented: number
    /** Subset of consented views attributed to a logged-in account. */
    loggedIn: number
    uniqueVisitors: number
  }
  feedback: {
    helpful: number
    notHelpful: number
  }
  recentViewers: PostViewer[]
}

export interface PostTranslationInput {
  locale: PostLocale
  title: string
  slug?: string
  content: string
  excerpt?: string
}

export interface CreatePostInput {
  defaultLocale: PostLocale
  coverImage?: string
  translations: PostTranslationInput[]
}

export interface UpdatePostInput {
  defaultLocale?: PostLocale
  coverImage?: string
  translations?: PostTranslationInput[]
}

interface PaginationMeta {
  total: number
  perPage: number
  currentPage: number
  lastPage: number
  firstPage: number
  firstPageUrl: string
  lastPageUrl: string
  nextPageUrl: string | null
  previousPageUrl: string | null
}

export interface PostsListResponse {
  meta: PaginationMeta
  data: Post[]
}

export interface AdminPostsListResponse {
  meta: PaginationMeta
  data: AdminPost[]
}
