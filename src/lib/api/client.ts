import axios, { AxiosHeaders } from 'axios';
import type { TokenPayload } from '@/lib/types/api';

// Prefer same-origin requests by default (works with Vite dev proxy and typical deployments).
// If your API is hosted on a different origin, set `VITE_API_URL`.
const API_ORIGIN = import.meta.env.VITE_API_URL ?? '';
const API_PREFIX = '/api/v1';
export const API_URL = API_ORIGIN ? `${API_ORIGIN}${API_PREFIX}` : API_PREFIX;

let accessToken: string | null = null;
let refreshPromise: Promise<string> | null = null;

function readAccessToken(data: unknown) {
  if (!data || typeof data !== 'object') return null;
  const token = (data as TokenPayload).accessToken;
  return typeof token === 'string' ? token : null;
}

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(next: string | null) {
  accessToken = next;
}

export function clearAccessToken() {
  accessToken = null;
}

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, body: unknown) {
    super(`API error ${status}`);
    this.status = status;
    this.body = body;
  }
}

function parseTextBody(text: string | undefined | null) {
  if (text == null || text === '') return null;
  try {
    return JSON.parse(text as string);
  } catch {
    return text;
  }
}

function normalizeAxiosData(data: unknown) {
  if (data == null || data === '') return null;
  if (typeof data === 'string') return parseTextBody(data);
  return data;
}

function isFormData(value: unknown): value is FormData {
  return typeof FormData !== 'undefined' && value instanceof FormData;
}

export const http = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  validateStatus: () => true,
});

export async function refreshAccessToken(): Promise<string> {
  const res = await axios.post<TokenPayload>(
    `${API_URL}/auth/refresh`,
    null,
    { withCredentials: true, validateStatus: () => true },
  );
  const body = normalizeAxiosData(res.data);
  const token = readAccessToken(body);
  if (res.status >= 200 && res.status < 300 && typeof token === 'string') {
    setAccessToken(token);
    return token;
  }
  throw new ApiError(res.status, body);
}

export async function getOrStartRefresh(): Promise<string> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = refreshAccessToken().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

http.interceptors.request.use((config) => {
  const authMode = import.meta.env.VITE_AUTH_MODE ?? 'session';
  const headers = config.headers ?? new AxiosHeaders();
  if (authMode === 'jwt') {
    const token = getAccessToken();
    if (token) {
      if (headers instanceof AxiosHeaders) headers.set('Authorization', `Bearer ${token}`);
      else (headers as any).Authorization = `Bearer ${token}`;
    }
  }

  config.headers = headers as any;
  if (isFormData(config.data)) return config;

  const currentContentType =
    headers instanceof AxiosHeaders
      ? headers.get('Content-Type')
      : ((headers as any)['Content-Type'] ?? (headers as any)['content-type']);

  if (currentContentType == null) {
    if (headers instanceof AxiosHeaders) {
      headers.set('Content-Type', 'application/json');
    } else {
      (headers as any)['Content-Type'] = 'application/json';
    }
  }

  config.headers = headers as any;
  return config;
});

http.interceptors.response.use(async (res) => {
  const body = normalizeAxiosData(res.data);

  if (res.status === 401 && typeof window !== 'undefined') {
    const authMode = import.meta.env.VITE_AUTH_MODE ?? 'session';
    if (authMode === 'jwt') {
      const cfg = (res.config ?? {}) as typeof res.config & { _retry?: boolean };
      const url = String(cfg.url ?? '');
      const isRefresh = url.includes('/auth/refresh');
      if (!isRefresh && !cfg._retry) {
        try {
          await getOrStartRefresh();
          cfg._retry = true;
          return http.request(cfg);
        } catch {
          window.dispatchEvent(new Event('auth:unauthorized'));
        }
      } else {
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
    } else {
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
  }
  if (res.status < 200 || res.status >= 300)
    throw new ApiError(res.status, body);
  res.data = body;
  return res;
});
