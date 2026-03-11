import { http } from './client';
import type { AuthUser } from '@/store/types';
import { clearAccessToken, setAccessToken } from '@/lib/auth/accessToken';
import { graphql } from './graphql.client';

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
  const authMode = import.meta.env.VITE_AUTH_MODE ?? 'session';
  const res = await http.post<any>('/auth/register', dto);
  if (authMode === 'jwt') {
    if (typeof res.data?.accessToken !== 'string')
      throw new Error('Missing accessToken');
    setAccessToken(res.data.accessToken);
  }
  return coerceAuthUser(res.data);
}

export async function login(dto: LoginDto): Promise<AuthUser> {
  const authMode = import.meta.env.VITE_AUTH_MODE ?? 'session';
  const res = await http.post<any>('/auth/login', dto);
  if (authMode === 'jwt') {
    if (typeof res.data?.accessToken !== 'string')
      throw new Error('Missing accessToken');
    setAccessToken(res.data.accessToken);
  }
  return coerceAuthUser(res.data);
}

export async function logout(): Promise<void> {
  await http.post('/auth/logout');
  clearAccessToken();
}

export async function getProfile(): Promise<AuthUser> {
  const transport = import.meta.env.VITE_API_TRANSPORT ?? 'rest';
  if (transport === 'graphql') {
    const data = await graphql<{ profile: AuthUser }>(
      'query { profile { id email } }',
    );
    return coerceAuthUser(data.profile);
  }

  const res = await http.get<AuthUser>('/auth/profile', { timeout: 5000 });
  return coerceAuthUser(res.data);
}
