import { getBaseUrl } from '@/app/_cheatcode'
import { CreatePostInput, Post, PostsListResponse, UpdatePostInput } from '@/types/post'
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
