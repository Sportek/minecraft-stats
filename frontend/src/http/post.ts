import { getBaseUrl } from '@/app/_cheatcode'
import {
  AdminPost,
  AdminPostsListResponse,
  CreatePostInput,
  Post,
  PostLocale,
  PostStats,
  PostsListResponse,
  UpdatePostInput,
} from '@/types/post'
import { apiFetch } from './client'

// Public endpoints

export const getPosts = (page: number = 1, limit: number = 10, locale: PostLocale = 'en') =>
  apiFetch<PostsListResponse>(`/posts?page=${page}&limit=${limit}&locale=${locale}`, {
    cache: 'no-store',
  })

export const resolvePlaceholders = (placeholders: string[]) =>
  apiFetch<Record<string, string>>('/posts/placeholders/resolve', {
    method: 'POST',
    body: { placeholders },
  })

export const getPostBySlug = (slug: string, locale: PostLocale = 'en') =>
  apiFetch<Post>(`/posts/${slug}?locale=${locale}`, { cache: 'no-store' })

/**
 * Records a view for the article. Consent-exempt and best-effort: it only bumps
 * an aggregate counter (no identifier), so failures are swallowed and never
 * surface to the reader. `keepalive` lets it complete even if the page unloads.
 */
export const recordPostView = async (slug: string) => {
  try {
    await fetch(`${getBaseUrl()}/posts/${slug}/view`, {
      method: 'POST',
      keepalive: true,
    })
  } catch {
    // Best-effort: a missed view must never break the page.
  }
}

/**
 * Submits "was this article helpful?" feedback. Deduplicated server-side by the
 * anonymous visitor id; passing a token additionally attributes it to the account.
 */
export const submitPostFeedback = async (
  slug: string,
  helpful: boolean,
  visitorId: string,
  token?: string | null
) => {
  await apiFetch<void>(`/posts/${slug}/feedback`, {
    method: 'POST',
    token: token ?? undefined,
    body: { helpful, visitorId },
  })
  return true
}

// Admin endpoints

export const getAdminPosts = (
  token: string,
  page: number = 1,
  limit: number = 20,
  status: 'all' | 'published' | 'draft' = 'all'
) =>
  apiFetch<AdminPostsListResponse>(
    `/admin/posts?page=${page}&limit=${limit}&status=${status}`,
    { token }
  )

/** Single post with all its translations, for the edit screen. */
export const getAdminPost = (postId: number, token: string) =>
  apiFetch<AdminPost>(`/admin/posts/${postId}`, { token })

export const getAdminPostStats = (postId: number, token: string) =>
  apiFetch<PostStats>(`/admin/posts/${postId}/stats`, { token })

export const createPost = (data: CreatePostInput, token: string) =>
  apiFetch<AdminPost>('/admin/posts', { method: 'POST', token, body: data })

export const updatePost = (postId: number, data: UpdatePostInput, token: string) =>
  apiFetch<AdminPost>(`/admin/posts/${postId}`, { method: 'PUT', token, body: data })

export const deletePost = async (postId: number, token: string) => {
  await apiFetch<void>(`/admin/posts/${postId}`, { method: 'DELETE', token })
  return true
}

export const publishPost = (postId: number, token: string) =>
  apiFetch<Post>(`/admin/posts/${postId}/publish`, { method: 'POST', token })

export const unpublishPost = (postId: number, token: string) =>
  apiFetch<Post>(`/admin/posts/${postId}/unpublish`, { method: 'POST', token })

export const uploadImage = (file: File, token: string) => {
  const formData = new FormData()
  formData.append('image', file)
  return apiFetch<{ url: string }>('/uploads/image', { method: 'POST', token, body: formData })
}

// Placeholders

export const getPlaceholders = () =>
  apiFetch<PlaceholderInfo[]>('/posts/placeholders/list', { cache: 'no-store' })

export const previewPlaceholder = (placeholderName: string, serverId: number, token: string) =>
  apiFetch<{
    placeholder: string
    value: string
    serverId: number
    placeholderName: string
  }>('/admin/posts/placeholders/preview', {
    method: 'POST',
    token,
    body: { placeholderName, serverId },
  })

export interface PlaceholderInfo {
  name: string
  description: string
  example: string
}
