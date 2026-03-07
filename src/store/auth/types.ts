export type AuthUser = {
  id: string;
  email: string;
};

export type AuthState = {
  user: AuthUser | null;
  status: 'unknown' | 'authed' | 'anon' | 'checking';
};

export type AuthAction =
  | { type: 'SET_AUTH_USER'; user: AuthUser | null }
  | { type: 'SET_AUTH_STATUS'; status: AuthState['status'] };

