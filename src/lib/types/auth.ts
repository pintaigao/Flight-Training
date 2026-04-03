export type AuthUser = {
  id: string;
  email: string;
};

export type LoginDto = { email: string; password: string };
export type RegisterDto = { email: string; password: string; inviteCode: string };

export type AuthPayload = {
  id?: unknown;
  email?: unknown;
  error?: unknown;
  accessToken?: unknown;
};
