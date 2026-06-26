import { getBaseUrl } from '@/app/_cheatcode'
import { AdminUserProfile, User } from '@/types/auth'
import { AdminUserServer } from '@/types/server'
import { getErrorMessage } from './auth'

export interface UsersListResponse {
  data: User[]
  meta: {
    total: number
    perPage: number
    currentPage: number
    lastPage: number
  }
}

export interface AdminUserDetailResponse {
  user: AdminUserProfile
  servers: AdminUserServer[]
  stats: {
    serverCount: number
  }
}

export const getAdminUsers = async (
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

  const response = await fetch(`${getBaseUrl()}/admin/users?${params.toString()}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const errorMessage = await getErrorMessage(response)
    throw new Error(errorMessage)
  }

  return response.json() as Promise<UsersListResponse>
}

export const getAdminUserDetail = async (userId: number, token: string) => {
  const response = await fetch(`${getBaseUrl()}/admin/users/${userId}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const errorMessage = await getErrorMessage(response)
    throw new Error(errorMessage)
  }

  return response.json() as Promise<AdminUserDetailResponse>
}

export const updateUserRole = async (
  userId: number,
  role: 'admin' | 'writer' | 'user',
  token: string
) => {
  const response = await fetch(`${getBaseUrl()}/admin/users/${userId}/role`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ role }),
  })

  if (!response.ok) {
    const errorMessage = await getErrorMessage(response)
    throw new Error(errorMessage)
  }

  return response.json() as Promise<User>
}
