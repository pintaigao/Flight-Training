export type TokenPayload = { accessToken?: unknown };

export type GraphqlResponse<T> = {
  data?: T;
  errors?: Array<{ message?: string; extensions?: unknown }>;
};
