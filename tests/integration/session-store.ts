let token: string | undefined;

export function getSessionToken(): string | undefined {
  return token;
}

export function setSessionToken(t: string | undefined): void {
  token = t;
}
