import { AdminUserProfile, User } from '@/types/auth'
import { AdminUserServer } from '@/types/server'
import { apiFetch } from './client'

export interface UsersListResponse {
  data: User[]
  meta: {
    total: number
    perPage: number
    currentPage: number
    lastPage: number
  }
}

export interface DuplicateAccount {
  id: number
  username: string
  email: string
  role: 'admin' | 'writer' | 'user'
  createdAt: string
  signals: {
    sameDevice: boolean
    sameIp: boolean
  }
}

export interface AdminUserDetailResponse {
  user: AdminUserProfile
  servers: AdminUserServer[]
  duplicates: DuplicateAccount[]
  stats: {
    serverCount: number
    duplicateCount: number
  }
}

export const getAdminUsers = (
  token: string,
  page: number = 1,
  limit: number = 20,
  search: string = '',
  role: 'all' | 'admin' | 'writer' | 'user' = 'all'
) => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  })

  if (search) {
    params.append('search', search)
  }

  if (role !== 'all') {
    params.append('role', role)
  }

  return apiFetch<UsersListResponse>(`/admin/users?${params.toString()}`, { token })
}

export const getAdminUserDetail = (userId: number, token: string) =>
  apiFetch<AdminUserDetailResponse>(`/admin/users/${userId}`, { token })

export const updateUserRole = (
  userId: number,
  role: 'admin' | 'writer' | 'user',
  token: string
) => apiFetch<User>(`/admin/users/${userId}/role`, { method: 'PATCH', token, body: { role } })
