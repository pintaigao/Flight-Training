import { http } from './client';
import type { AuthUser } from '@/store/types';

export type LoginDto = { email: string; password: string };
export type RegisterDto = { email: string; password: string };

function coerceAuthUser(data: any): AuthUser {
  if (data && typeof data.id === 'string' && typeof data.email === 'string')
    return data;

  const message =
    typeof data?.error === 'string'
      ? data.error
      : 'Authentication failed.';
  const err: any = new Error(message);
  err.body = { message };
  throw err;
}

export async function register(dto: RegisterDto): Promise<AuthUser> {
  const res = await http.post<AuthUser>('/auth/register', dto);
  return coerceAuthUser(res.data);
}

export async function login(dto: LoginDto): Promise<AuthUser> {
  const res = await http.post<AuthUser>('/auth/login', dto);
  return coerceAuthUser(res.data);
}

export async function logout(): Promise<void> {
  await http.post('/auth/logout');
}

export async function getMe(): Promise<AuthUser> {
  const res = await http.get<AuthUser>('/auth/me');
  return coerceAuthUser(res.data);
}
