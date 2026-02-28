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

async function parseBody(res: Response) {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
    credentials: 'include',
  })

  const body = await parseBody(res)
  if (!res.ok) throw new ApiError(res.status, body)
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
