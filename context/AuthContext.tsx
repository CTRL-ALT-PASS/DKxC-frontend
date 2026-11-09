import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  getCurrentEmployee,
  login as loginRequest,
  logout as logoutRequest,
  type AuthUser,
} from "../services/authApi";

import {
  clearAuthToken,
  getAuthToken,
  saveAuthToken,
} from "../services/authStorage";

type AuthContextType = {
  user: AuthUser | null;
  isLoading: boolean;
  signIn: (employeeId: string, pinCode: string) => Promise<AuthUser>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const restoreSession = useCallback(async () => {
    setIsLoading(true);

    try {
      const token = await getAuthToken();

      if (!token) {
        setUser(null);
        return;
      }

      const employee = await getCurrentEmployee(token);
      setUser(employee);
    } catch (error) {
      // Any failure restoring the session: discard it and start over.
      console.warn("Session restoration failed, clearing session:", error);

      try {
        await clearAuthToken();
      } catch (storageError) {
        console.error("Failed to clear saved token:", storageError);
      }

      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  const signIn = useCallback(async (employeeId: string, pinCode: string) => {
    const result = await loginRequest(employeeId, pinCode);

    await saveAuthToken(result.token);
    setUser(result.employee);

    return result.employee;
  }, []);

  const signOut = useCallback(async () => {
    let token: string | null = null;

    try {
      token = await getAuthToken();
    } catch (error) {
      console.error("Failed to retrieve auth token:", error);
    }

    // Always clear the local session, even if the server is unreachable.
    try {
      await clearAuthToken();
    } finally {
      setUser(null);
    }

    // Best-effort server-side revocation; local logout must not depend on it.
    if (token) {
      void logoutRequest(token).catch((error) => {
        console.warn(
          "Local logout succeeded, but server token revocation could not be confirmed:",
          error,
        );
      });
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider.");
  }

  return context;
}