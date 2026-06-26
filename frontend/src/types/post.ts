import { User } from './auth'

export interface Post {
  id: number
  title: string
  slug: string
  content: string
  excerpt: string | null
  coverImage: string | null
  published: boolean
  viewCount: number
  publishedAt: Date | null
  userId: number
  author: User
  createdAt: Date
  updatedAt: Date
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
    slug: string
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

export interface CreatePostInput {
  title: string
  slug?: string
  content: string
  excerpt?: string
  coverImage?: string
}

export interface UpdatePostInput {
  title?: string
  slug?: string
  content?: string
  excerpt?: string
  coverImage?: string
}

export interface PostsListResponse {
  meta: {
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
  data: Post[]
}
