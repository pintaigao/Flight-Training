import axios, { AxiosHeaders } from 'axios';
import { ApiError, getOrStartRefresh } from './client';
import { getAccessToken } from '@/lib/auth/accessToken';

const API_ORIGIN = import.meta.env.VITE_API_URL ?? '';
const GRAPHQL_URL = API_ORIGIN ? `${API_ORIGIN}/graphql` : '/graphql';

type GraphqlResponse<T> = { data?: T; errors?: Array<{ message?: string; extensions?: any }> };

function buildAuthHeaders() {
  const authMode = import.meta.env.VITE_AUTH_MODE ?? 'session';
  const headers = new AxiosHeaders();
  if (authMode === 'jwt') {
    const token = getAccessToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }
  return headers;
}

function isUnauthorized(errors: GraphqlResponse<any>['errors']) {
  return (errors ?? []).some((e) => (e?.message ?? '').toLowerCase() === 'unauthorized');
}

export async function graphql<TData>(
  query: string,
  variables?: Record<string, any>,
): Promise<TData> {
  async function runOnce() {
    const res = await axios.post<GraphqlResponse<TData>>(
      GRAPHQL_URL,
      { query, variables },
      { headers: buildAuthHeaders(), withCredentials: true, validateStatus: () => true },
    );

    const body = res.data ?? {};
    if (body.errors?.length) {
      if (isUnauthorized(body.errors)) throw new ApiError(401, body);
      throw new ApiError(400, body);
    }
    if (!body.data) throw new ApiError(500, body);
    return body.data;
  }

  try {
    return await runOnce();
  } catch (e: any) {
    const authMode = import.meta.env.VITE_AUTH_MODE ?? 'session';
    if (authMode === 'jwt' && e instanceof ApiError && e.status === 401) {
      await getOrStartRefresh();
      return runOnce();
    }
    throw e;
  }
}
