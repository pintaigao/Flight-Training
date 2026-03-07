import { http } from './client';
import type { AuthUser } from '@/store/types';

export type LoginDto = { email: string; password: string };
export type RegisterDto = { email: string; password: string };

export async function register(dto: RegisterDto): Promise<AuthUser> {
  const res = await http.post<AuthUser>('/auth/register', dto);
  return res.data;
}

export async function login(dto: LoginDto): Promise<AuthUser> {
  const res = await http.post<AuthUser>('/auth/login', dto);
  return res.data;
}

export async function logout(): Promise<void> {
  await http.post('/auth/logout');
}

export async function getMe(): Promise<AuthUser> {
  const res = await http.get<AuthUser>('/auth/me');
  return res.data;
}
