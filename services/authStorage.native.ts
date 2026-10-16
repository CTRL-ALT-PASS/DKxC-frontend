import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "auth_token";

export function getAuthToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export function saveAuthToken(token: string): Promise<void> {
  return SecureStore.setItemAsync(TOKEN_KEY, token);
}

export function clearAuthToken(): Promise<void> {
  return SecureStore.deleteItemAsync(TOKEN_KEY);
}
