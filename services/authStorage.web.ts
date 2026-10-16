const TOKEN_KEY = "auth_token";

export async function getAuthToken(): Promise<string | null> {
  return localStorage.getItem(TOKEN_KEY);
}

export async function saveAuthToken(token: string): Promise<void> {
  localStorage.setItem(TOKEN_KEY, token);
}

export async function clearAuthToken(): Promise<void> {
  localStorage.removeItem(TOKEN_KEY);
}
