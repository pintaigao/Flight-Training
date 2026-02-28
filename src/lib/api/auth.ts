import { apiFetch } from './client'
import type { AuthUser } from '@/store/types'

export type LoginDto = { email: string; password: string }
export type RegisterDto = { email: string; password: string }

export async function register(dto: RegisterDto): Promise<AuthUser> {
  return apiFetch<AuthUser>('/auth/register', { method: 'POST', body: JSON.stringify(dto) })
}

export async function login(dto: LoginDto): Promise<AuthUser> {
  return apiFetch<AuthUser>('/auth/login', { method: 'POST', body: JSON.stringify(dto) })
}

export async function logout(): Promise<void> {
  await apiFetch('/auth/logout', { method: 'POST' })
}

export async function getMe(): Promise<AuthUser> {
  return apiFetch<AuthUser>('/auth/me', { method: 'GET' })
}
