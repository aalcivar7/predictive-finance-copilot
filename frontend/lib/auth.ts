import Cookies from 'js-cookie';

const TOKEN_KEY = 'finance_token';

export function setToken(token: string): void {
  Cookies.set(TOKEN_KEY, token, { expires: 1, secure: true, sameSite: 'Strict' });
}

export function getToken(): string | undefined {
  return Cookies.get(TOKEN_KEY);
}

export function removeToken(): void {
  Cookies.remove(TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return !!getToken();
}
