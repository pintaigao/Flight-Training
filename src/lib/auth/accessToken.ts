let accessToken: string | null = null;

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(next: string | null) {
  accessToken = next;
}

export function clearAccessToken() {
  accessToken = null;
}

