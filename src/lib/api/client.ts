import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export class ApiError extends Error {
  status: number
  body: any
  constructor(status: number, body: any) {
    super(`API error ${status}`)
    this.status = status
    this.body = body
  }
}

function headersInitToObject(headers?: HeadersInit): Record<string, string> {
  if (!headers) return {}
  if (headers instanceof Headers) {
    const obj: Record<string, string> = {}
    headers.forEach((value, key) => {
      obj[key] = value
    })
    return obj
  }
  if (Array.isArray(headers)) {
    return Object.fromEntries(headers)
  }
  return { ...headers }
}

function parseTextBody(text: string | undefined | null) {
  if (text == null || text === '') return null
  try {
    return JSON.parse(text as string)
  } catch {
    return text
  }
}

const http = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  validateStatus: () => true,
})

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await http.request<string>({
    url: path,
    method: init.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...headersInitToObject(init.headers),
    },
    data: init.body,
    signal: init.signal ?? undefined,
    responseType: 'text',
  })

  const body = parseTextBody(res.data)
  if (res.status < 200 || res.status >= 300) throw new ApiError(res.status, body)
  return body as T
}

// Auto-refresh flow (optional): if 401, try /auth/refresh then retry once.
export async function apiFetchWithRefresh<T>(path: string, init: RequestInit = {}): Promise<T> {
  try {
    return await apiFetch<T>(path, init)
  } catch (e: any) {
    if (e?.status !== 401) throw e
    try {
      await apiFetch('/auth/refresh', { method: 'POST' })
    } catch {
      throw e
    }
    return await apiFetch<T>(path, init)
  }
}

export async function apiFetchFormData<T>(path: string, formData: FormData, init: RequestInit = {}): Promise<T> {
  const res = await http.request<string>({
    url: path,
    method: init.method ?? 'POST',
    // NOTE: do not set Content-Type; the browser will set multipart boundary.
    headers: {
      ...headersInitToObject(init.headers),
    },
    data: formData,
    signal: init.signal ?? undefined,
    responseType: 'text',
  })

  const body = parseTextBody(res.data)
  if (res.status < 200 || res.status >= 300) throw new ApiError(res.status, body)
  return body as T
}

export async function apiFetchFormDataWithRefresh<T>(path: string, formData: FormData, init: RequestInit = {}): Promise<T> {
  try {
    return await apiFetchFormData<T>(path, formData, init)
  } catch (e: any) {
    if (e?.status !== 401) throw e
    try {
      await apiFetch('/auth/refresh', { method: 'POST' })
    } catch {
      throw e
    }
    return await apiFetchFormData<T>(path, formData, init)
  }
}
