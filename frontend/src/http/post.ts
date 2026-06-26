import { getBaseUrl } from '@/app/_cheatcode'
import { CreatePostInput, Post, PostStats, PostsListResponse, UpdatePostInput } from '@/types/post'
import { getErrorMessage } from './auth'

// Public endpoints

export const getPosts = async (page: number = 1, limit: number = 10) => {
  const response = await fetch(`${getBaseUrl()}/posts?page=${page}&limit=${limit}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    const errorMessage = await getErrorMessage(response)
    throw new Error(errorMessage)
  }

  return response.json() as Promise<PostsListResponse>
}

export const resolvePlaceholders = async (placeholders: string[]) => {
  const response = await fetch(`${getBaseUrl()}/posts/placeholders/resolve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ placeholders }),
  })

  if (!response.ok) {
    const errorMessage = await getErrorMessage(response)
    throw new Error(errorMessage)
  }

  return response.json() as Promise<Record<string, string>>
}

export const getPostBySlug = async (slug: string) => {
  const response = await fetch(`${getBaseUrl()}/posts/${slug}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    const errorMessage = await getErrorMessage(response)
    throw new Error(errorMessage)
  }

  return response.json() as Promise<Post>
}

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
  const response = await fetch(`${getBaseUrl()}/posts/${slug}/feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ helpful, visitorId }),
  })

  if (!response.ok) {
    const errorMessage = await getErrorMessage(response)
    throw new Error(errorMessage)
  }

  return true
}

// Admin endpoints

export const getAdminPosts = async (
  token: string,
  page: number = 1,
  limit: number = 20,
  status: 'all' | 'published' | 'draft' = 'all'
) => {
  const response = await fetch(
    `${getBaseUrl()}/admin/posts?page=${page}&limit=${limit}&status=${status}`,
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }
  )

  if (!response.ok) {
    const errorMessage = await getErrorMessage(response)
    throw new Error(errorMessage)
  }

  return response.json() as Promise<PostsListResponse>
}

export const getAdminPostStats = async (postId: number, token: string) => {
  const response = await fetch(`${getBaseUrl()}/admin/posts/${postId}/stats`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const errorMessage = await getErrorMessage(response)
    throw new Error(errorMessage)
  }

  return response.json() as Promise<PostStats>
}

export const createPost = async (data: CreatePostInput, token: string) => {
  const response = await fetch(`${getBaseUrl()}/admin/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const errorMessage = await getErrorMessage(response)
    throw new Error(errorMessage)
  }

  return response.json() as Promise<Post>
}

export const updatePost = async (postId: number, data: UpdatePostInput, token: string) => {
  const response = await fetch(`${getBaseUrl()}/admin/posts/${postId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const errorMessage = await getErrorMessage(response)
    throw new Error(errorMessage)
  }

  return response.json() as Promise<Post>
}

export const deletePost = async (postId: number, token: string) => {
  const response = await fetch(`${getBaseUrl()}/admin/posts/${postId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const errorMessage = await getErrorMessage(response)
    throw new Error(errorMessage)
  }

  return true
}

export const publishPost = async (postId: number, token: string) => {
  const response = await fetch(`${getBaseUrl()}/admin/posts/${postId}/publish`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const errorMessage = await getErrorMessage(response)
    throw new Error(errorMessage)
  }

  return response.json() as Promise<Post>
}

export const unpublishPost = async (postId: number, token: string) => {
  const response = await fetch(`${getBaseUrl()}/admin/posts/${postId}/unpublish`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const errorMessage = await getErrorMessage(response)
    throw new Error(errorMessage)
  }

  return response.json() as Promise<Post>
}

export const uploadImage = async (file: File, token: string) => {
  const formData = new FormData()
  formData.append('image', file)

  const response = await fetch(`${getBaseUrl()}/uploads/image`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const errorMessage = await getErrorMessage(response)
    throw new Error(errorMessage)
  }

  return response.json() as Promise<{ url: string }>
}

// Placeholders

export const getPlaceholders = async () => {
  const response = await fetch(`${getBaseUrl()}/posts/placeholders/list`, {
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    const errorMessage = await getErrorMessage(response)
    throw new Error(errorMessage)
  }

  return response.json() as Promise<PlaceholderInfo[]>
}

export const previewPlaceholder = async (
  placeholderName: string,
  serverId: number,
  token: string
) => {
  const response = await fetch(`${getBaseUrl()}/admin/posts/placeholders/preview`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ placeholderName, serverId }),
  })

  if (!response.ok) {
    const errorMessage = await getErrorMessage(response)
    throw new Error(errorMessage)
  }

  return response.json() as Promise<{
    placeholder: string
    value: string
    serverId: number
    placeholderName: string
  }>
}

export interface PlaceholderInfo {
  name: string
  description: string
  example: string
}
