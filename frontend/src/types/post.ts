import { User } from './auth'

export interface Post {
  id: number
  title: string
  slug: string
  content: string
  excerpt: string | null
  coverImage: string | null
  published: boolean
  publishedAt: Date | null
  userId: number
  author: User
  createdAt: Date
  updatedAt: Date
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
