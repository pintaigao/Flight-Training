import { clearAccessToken, http, setAccessToken } from './client';
import type { AuthPayload, AuthUser, LoginDto, RegisterDto } from '@/lib/types/auth';

function coerceAuthUser(data: AuthPayload | null | undefined): AuthUser {
  if (data && typeof data.id === 'string' && typeof data.email === 'string')
    return {id: data.id, email: data.email};
  
  const message = typeof data?.error === 'string' ? data.error : 'Authentication failed.';
  const err = new Error(message) as Error & { body?: { message: string } };
  err.body = {message};
  throw err;
}

function persistJwtAccessToken(data: { accessToken?: unknown }) {
  const authMode = import.meta.env.VITE_AUTH_MODE ?? 'session';
  if (authMode !== 'jwt') return;
  if (typeof data.accessToken !== 'string') throw new Error('Missing accessToken');
  setAccessToken(data.accessToken);
}

export async function register(payload: RegisterDto): Promise<AuthUser> {
  const res = await http.post<AuthPayload>('/auth/register', payload);
  persistJwtAccessToken(res.data);
  return coerceAuthUser(res.data);
}

export async function login(dto: LoginDto): Promise<AuthUser> {
  const res = await http.post<AuthPayload>('/auth/login', dto);
  persistJwtAccessToken(res.data);
  return coerceAuthUser(res.data);
}

export async function loginWithGoogle(credential: string): Promise<AuthUser> {
  const res = await http.post<AuthPayload>('/auth/google', { credential });
  persistJwtAccessToken(res.data);
  return coerceAuthUser(res.data);
}

export async function logout(): Promise<void> {
  await http.post('/auth/logout');
  clearAccessToken();
}

export async function getProfile(): Promise<AuthUser> {
  const res = await http.get<AuthUser>('/auth/profile', {timeout: 5000});
  return coerceAuthUser(res.data);
}
