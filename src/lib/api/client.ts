import axios, {
  AxiosHeaders,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';

// Prefer same-origin requests by default (works with Vite dev proxy and typical deployments).
// If your API is hosted on a different origin, set `VITE_API_URL`.
const API_ORIGIN = import.meta.env.VITE_API_URL ?? '';
const API_PREFIX = '/api/v1';
const API_URL = API_ORIGIN ? `${API_ORIGIN}${API_PREFIX}` : API_PREFIX;

export class ApiError extends Error {
  status: number;
  body: any;
  constructor(status: number, body: any) {
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

function normalizeAxiosData(data: any) {
  if (data == null || data === '') return null;
  if (typeof data === 'string') return parseTextBody(data);
  return data;
}

function isFormData(value: any): value is FormData {
  return typeof FormData !== 'undefined' && value instanceof FormData;
}

function shouldSkipAuthRefresh(url?: string) {
  if (!url) return false;
  const path = url.split('?')[0];
  return (
    path === '/auth/refresh' ||
    path === '/auth/login' ||
    path === '/auth/register' ||
    path === '/auth/logout'
  );
}

export const http = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  validateStatus: () => true,
});

const refreshHttp = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  validateStatus: () => true,
});

let refreshInFlight: Promise<void> | null = null;

http.interceptors.request.use((config) => {
  if (isFormData(config.data)) return config;

  const headers = config.headers ?? new AxiosHeaders();
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

  if (res.status === 401) {
    const config = res.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };
    if (!config._retry && !shouldSkipAuthRefresh(config.url)) {
      config._retry = true;

      if (!refreshInFlight) {
        refreshInFlight = (async () => {
          const refreshRes = await refreshHttp.request({
            url: '/auth/refresh',
            method: 'POST',
          });
          if (refreshRes.status < 200 || refreshRes.status >= 300) {
            throw new ApiError(
              refreshRes.status,
              normalizeAxiosData(refreshRes.data),
            );
          }
        })().finally(() => {
          refreshInFlight = null;
        });
      }

      await refreshInFlight;
      return await http.request(config as unknown as AxiosRequestConfig);
    }
  }

  if (res.status < 200 || res.status >= 300)
    throw new ApiError(res.status, body);
  res.data = body;
  return res;
});
